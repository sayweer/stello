#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::{
        Address as _, AuthorizedFunction, AuthorizedInvocation, Events as _, MockAuth,
        MockAuthInvoke,
    },
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, BytesN, Env, Event as _, IntoVal, String, Symbol,
};

use crate::{Dispatched, Error, Router, RouterClient, Ticket};

/// Minimal `DepositTarget` used to observe what the router forwards.
/// The first byte of `arg` steers the behaviour: `0xFF` panics, `0x00` rejects,
/// anything else accepts.
mod mock_target {
    use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env};

    #[contracttype]
    #[derive(Clone)]
    pub enum Key {
        Last,
    }

    #[contracttype]
    #[derive(Clone, Debug, Eq, PartialEq)]
    pub struct LastCall {
        pub user: Address,
        pub amount: i128,
        pub arg: Bytes,
    }

    #[contract]
    pub struct MockTarget;

    #[contractimpl]
    impl MockTarget {
        pub fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool {
            let first = arg.get(0).unwrap_or(1);
            if first == 0xFF {
                panic!("target refuses this deposit");
            }
            env.storage()
                .instance()
                .set(&Key::Last, &LastCall { user, amount, arg });
            first != 0x00
        }

        pub fn last(env: Env) -> Option<LastCall> {
            env.storage().instance().get(&Key::Last)
        }
    }
}

use mock_target::{MockTarget, MockTargetClient};

const RELAYER_FUNDING: i128 = 1_000_000_000;

struct Ctx {
    env: Env,
    router_id: Address,
    usdc: Address,
    relayer: Address,
    target_id: Address,
    route: u32,
    user: Address,
}

impl Ctx {
    fn router(&self) -> RouterClient<'_> {
        RouterClient::new(&self.env, &self.router_id)
    }

    fn token(&self) -> TokenClient<'_> {
        TokenClient::new(&self.env, &self.usdc)
    }

    fn target(&self) -> MockTargetClient<'_> {
        MockTargetClient::new(&self.env, &self.target_id)
    }

    /// `[kind][campaign id]`-shaped payload; the first byte drives the mock.
    fn arg(&self, first: u8) -> Bytes {
        Bytes::from_array(&self.env, &[first, 0, 0, 0, 0, 0, 0, 0, 1])
    }

    fn payment_ref(&self, n: u8) -> BytesN<32> {
        let mut raw = [0u8; 32];
        raw[31] = n;
        BytesN::from_array(&self.env, &raw)
    }
}

fn setup() -> Ctx {
    let env = Env::default();
    env.mock_all_auths();

    let issuer = Address::generate(&env);
    let usdc = env.register_stellar_asset_contract_v2(issuer).address();

    let relayer = Address::generate(&env);
    let user = Address::generate(&env);
    let owner = Address::generate(&env);

    let router_id = env.register(Router, (relayer.clone(), usdc.clone()));
    let target_id = env.register(MockTarget, ());

    let route = RouterClient::new(&env, &router_id).register_route(
        &owner,
        &target_id,
        &String::from_str(&env, "campaign"),
    );
    StellarAssetClient::new(&env, &usdc).mint(&relayer, &RELAYER_FUNDING);

    Ctx {
        env,
        router_id,
        usdc,
        relayer,
        target_id,
        route,
        user,
    }
}

#[test]
fn routes_get_sequential_ids_and_are_readable() {
    let ctx = setup();
    let router = ctx.router();
    let owner = Address::generate(&ctx.env);

    let second = router.register_route(&owner, &ctx.target_id, &String::from_str(&ctx.env, "votes"));
    assert_eq!(ctx.route, 1);
    assert_eq!(second, 2);

    let stored = router.get_route(&second).unwrap();
    assert_eq!(stored.owner, owner);
    assert_eq!(stored.target, ctx.target_id);
    assert_eq!(stored.name, String::from_str(&ctx.env, "votes"));
    assert_eq!(router.get_route(&99), None);
}

#[test]
fn route_name_is_bounded() {
    let ctx = setup();
    let owner = Address::generate(&ctx.env);
    let long = String::from_str(
        &ctx.env,
        "0123456789012345678901234567890123456789012345678901234567890123456789",
    );

    assert_eq!(
        ctx.router()
            .try_register_route(&owner, &ctx.target_id, &long),
        Err(Ok(Error::TooLong))
    );
}

#[test]
fn tickets_get_sequential_ids_and_store_their_payload() {
    let ctx = setup();
    let router = ctx.router();
    let arg = ctx.arg(1);

    let first = router.open_ticket(&ctx.user, &ctx.route, &arg);
    let second = router.open_ticket(&ctx.user, &ctx.route, &arg);
    assert_eq!((first, second), (1, 2));

    assert_eq!(
        router.get_ticket(&first),
        Some(Ticket {
            route: ctx.route,
            user: ctx.user.clone(),
            arg,
        })
    );
    assert_eq!(router.get_ticket(&99), None);
}

#[test]
fn opening_a_ticket_validates_route_and_payload() {
    let ctx = setup();
    let router = ctx.router();

    assert_eq!(
        router.try_open_ticket(&ctx.user, &404, &ctx.arg(1)),
        Err(Ok(Error::NotFound))
    );
    assert_eq!(
        router.try_open_ticket(
            &ctx.user,
            &ctx.route,
            &Bytes::from_array(&ctx.env, &[7u8; 65])
        ),
        Err(Ok(Error::TooLong))
    );
}

#[test]
fn dispatch_moves_funds_and_calls_the_target() {
    let ctx = setup();
    let router = ctx.router();
    let arg = ctx.arg(1);
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &arg);
    let reference = ctx.payment_ref(1);

    let accepted = router.dispatch(&ticket, &250, &reference);

    assert!(accepted);
    assert!(router.is_paid(&reference));
    assert_eq!(ctx.token().balance(&ctx.relayer), RELAYER_FUNDING - 250);
    assert_eq!(ctx.token().balance(&ctx.target_id), 250);

    let call = ctx.target().last().unwrap();
    assert_eq!(call.user, ctx.user);
    assert_eq!(call.amount, 250);
    assert_eq!(call.arg, arg);
}

#[test]
fn the_same_payment_is_never_dispatched_twice() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(1));
    let reference = ctx.payment_ref(1);

    router.dispatch(&ticket, &250, &reference);
    assert_eq!(
        router.try_dispatch(&ticket, &250, &reference),
        Err(Ok(Error::AlreadyPaid))
    );
    assert_eq!(ctx.token().balance(&ctx.target_id), 250);
}

#[test]
fn one_ticket_accepts_several_distinct_payments() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(1));

    router.dispatch(&ticket, &100, &ctx.payment_ref(1));
    router.dispatch(&ticket, &150, &ctx.payment_ref(2));

    assert_eq!(ctx.token().balance(&ctx.target_id), 250);
}

#[test]
fn dispatch_validates_amount_and_ticket() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(1));

    assert_eq!(
        router.try_dispatch(&ticket, &0, &ctx.payment_ref(1)),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        router.try_dispatch(&ticket, &-5, &ctx.payment_ref(2)),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        router.try_dispatch(&404, &100, &ctx.payment_ref(3)),
        Err(Ok(Error::NotFound))
    );
    assert!(!router.is_paid(&ctx.payment_ref(3)));
}

#[test]
fn a_rejecting_target_still_consumes_the_payment() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(0x00));
    let reference = ctx.payment_ref(1);

    assert!(!router.dispatch(&ticket, &250, &reference));
    // The target took the funds and is responsible for refunding the user.
    assert!(router.is_paid(&reference));
    assert_eq!(ctx.token().balance(&ctx.target_id), 250);
}

#[test]
fn a_panicking_target_rolls_the_whole_dispatch_back() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(0xFF));
    let reference = ctx.payment_ref(1);

    assert!(router.try_dispatch(&ticket, &250, &reference).is_err());

    // Nothing moved, nothing was marked: the relayer can safely retry later.
    assert!(!router.is_paid(&reference));
    assert_eq!(ctx.token().balance(&ctx.relayer), RELAYER_FUNDING);
    assert_eq!(ctx.token().balance(&ctx.target_id), 0);
}

#[test]
fn dispatch_authorizes_the_relayer_and_its_transfer() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(1));
    let reference = ctx.payment_ref(1);

    router.dispatch(&ticket, &250, &reference);

    let auths = ctx.env.auths();
    let (address, invocation) = auths.first().unwrap();
    assert_eq!(address, &ctx.relayer);
    assert_eq!(
        invocation.function,
        AuthorizedFunction::Contract((
            ctx.router_id.clone(),
            Symbol::new(&ctx.env, "dispatch"),
            (ticket, 250i128, reference).into_val(&ctx.env),
        ))
    );
    // Spending the relayer's USDC is part of the very same signed tree.
    assert_eq!(
        invocation.sub_invocations,
        std::vec![AuthorizedInvocation {
            function: AuthorizedFunction::Contract((
                ctx.usdc.clone(),
                Symbol::new(&ctx.env, "transfer"),
                (ctx.relayer.clone(), ctx.target_id.clone(), 250i128).into_val(&ctx.env),
            )),
            sub_invocations: std::vec![],
        }]
    );
}

#[test]
fn dispatch_refuses_to_run_without_the_relayer() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(1));
    let reference = ctx.payment_ref(1);

    // Everyone but the relayer signs: a stranger cannot push a payment through.
    ctx.env.mock_auths(&[MockAuth {
        address: &ctx.user,
        invoke: &MockAuthInvoke {
            contract: &ctx.router_id,
            fn_name: "dispatch",
            args: (ticket, 250i128, reference.clone()).into_val(&ctx.env),
            sub_invokes: &[],
        },
    }]);

    assert!(router.try_dispatch(&ticket, &250, &reference).is_err());
    assert!(!router.is_paid(&reference));
}

#[test]
fn opening_a_ticket_requires_the_users_signature() {
    let env = Env::default();
    let issuer = Address::generate(&env);
    let usdc = env.register_stellar_asset_contract_v2(issuer).address();
    let relayer = Address::generate(&env);
    let user = Address::generate(&env);
    let router_id = env.register(Router, (relayer, usdc));
    let target_id = env.register(MockTarget, ());
    let router = RouterClient::new(&env, &router_id);

    // No auth mocked at all: both entry points must refuse.
    assert!(router
        .try_register_route(&user, &target_id, &String::from_str(&env, "campaign"))
        .is_err());

    env.mock_all_auths();
    let route = router.register_route(&user, &target_id, &String::from_str(&env, "campaign"));

    env.mock_auths(&[]);
    assert!(router
        .try_open_ticket(&user, &route, &Bytes::from_array(&env, &[1u8]))
        .is_err());
}

#[test]
fn dispatch_emits_its_event() {
    let ctx = setup();
    let router = ctx.router();
    let ticket = router.open_ticket(&ctx.user, &ctx.route, &ctx.arg(1));
    let reference = ctx.payment_ref(1);

    router.dispatch(&ticket, &250, &reference);

    let expected = Dispatched {
        ticket,
        payment_ref: reference,
        amount: 250,
        accepted: true,
    };
    assert_eq!(
        ctx.env.events().all().filter_by_contract(&ctx.router_id),
        std::vec![expected.to_xdr(&ctx.env, &ctx.router_id)]
    );
}
