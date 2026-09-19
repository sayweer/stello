#![no_std]
//! Stello router — "a bank transfer is a contract call".
//!
//! An anchor can only pay out to a classic `G...`/`M...` account, and a token
//! transfer never triggers a function on a contract. This contract closes that
//! gap: a user opens a *ticket*, receives the muxed address of the landing
//! account for it, and pays by bank transfer. Once the anchor settles, the
//! relayer calls `dispatch`, which forwards the USDC to the route's target and
//! calls `on_deposit` on it in the same transaction.

use soroban_sdk::{
    contract, contractclient, contracterror, contractevent, contractimpl, contracttype,
    token::TokenClient, Address, Bytes, BytesN, Env, String,
};

const DAY_IN_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 7 * DAY_IN_LEDGERS;
const BUMP_TO: u32 = 30 * DAY_IN_LEDGERS;

/// Ticket payloads and route names are bounded so that a caller cannot inflate
/// the ledger entries everyone else pays to read.
const MAX_ARG_LEN: u32 = 64;
const MAX_NAME_LEN: u32 = 64;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Relayer,
    Usdc,
    NextTicket,
    NextRoute,
    Route(u32),
    Ticket(u64),
    Paid(BytesN<32>),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Route {
    pub owner: Address,
    pub target: Address,
    pub name: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Ticket {
    pub route: u32,
    pub user: Address,
    pub arg: Bytes,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    AlreadyPaid = 2,
    InvalidAmount = 3,
    TooLong = 4,
}

#[contractevent]
pub struct RouteRegistered {
    #[topic]
    pub route: u32,
    pub owner: Address,
    pub target: Address,
    pub name: String,
}

#[contractevent]
pub struct TicketOpened {
    #[topic]
    pub ticket: u64,
    pub user: Address,
    pub route: u32,
}

#[contractevent]
pub struct Dispatched {
    #[topic]
    pub ticket: u64,
    pub payment_ref: BytesN<32>,
    pub amount: i128,
    pub accepted: bool,
}

/// Implemented by any contract that wants to be funded by bank transfer.
///
/// Returning `false` means "not accepted" — the target is expected to have
/// refunded the user itself. Panicking reverts the whole dispatch, which leaves
/// the payment unmarked so the relayer retries it later.
#[contractclient(name = "DepositTargetClient")]
pub trait DepositTarget {
    fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool;
}

#[contract]
pub struct Router;

#[contractimpl]
impl Router {
    pub fn __constructor(env: Env, relayer: Address, usdc: Address) {
        let storage = env.storage().instance();
        storage.set(&DataKey::Relayer, &relayer);
        storage.set(&DataKey::Usdc, &usdc);
        storage.set(&DataKey::NextTicket, &1u64);
        storage.set(&DataKey::NextRoute, &1u32);
    }

    /// Register a target contract. Permissionless by design: the primitive is
    /// meant to be shared, and it is the ticket opener who picks a route.
    pub fn register_route(
        env: Env,
        owner: Address,
        target: Address,
        name: String,
    ) -> Result<u32, Error> {
        owner.require_auth();
        if name.len() > MAX_NAME_LEN {
            return Err(Error::TooLong);
        }

        let id: u32 = env.storage().instance().get(&DataKey::NextRoute).unwrap_or(1);
        env.storage().instance().set(&DataKey::NextRoute, &(id + 1));

        let route = Route {
            owner: owner.clone(),
            target: target.clone(),
            name: name.clone(),
        };
        let key = DataKey::Route(id);
        env.storage().persistent().set(&key, &route);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        bump_instance(&env);

        RouteRegistered {
            route: id,
            owner,
            target,
            name,
        }
        .publish(&env);
        Ok(id)
    }

    /// Claim a ticket id. The client turns it into the muxed address the anchor
    /// deposits to, which is what ties an off-chain bank transfer to this user,
    /// this route and this argument.
    pub fn open_ticket(env: Env, user: Address, route: u32, arg: Bytes) -> Result<u64, Error> {
        user.require_auth();
        if arg.len() > MAX_ARG_LEN {
            return Err(Error::TooLong);
        }
        if !env.storage().persistent().has(&DataKey::Route(route)) {
            return Err(Error::NotFound);
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextTicket)
            .unwrap_or(1);
        env.storage().instance().set(&DataKey::NextTicket, &(id + 1));

        let key = DataKey::Ticket(id);
        env.storage().persistent().set(
            &key,
            &Ticket {
                route,
                user: user.clone(),
                arg,
            },
        );
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        bump_instance(&env);

        TicketOpened {
            ticket: id,
            user,
            route,
        }
        .publish(&env);
        Ok(id)
    }

    /// Forward a settled bank transfer to the ticket's target contract.
    ///
    /// `payment_ref` is the off-chain payment's identity (the Horizon operation
    /// id, zero-padded). Marking it paid *before* the external calls makes the
    /// relayer safe to run twice, and a ticket stays reusable because every
    /// payment carries its own reference.
    pub fn dispatch(
        env: Env,
        ticket: u64,
        amount: i128,
        payment_ref: BytesN<32>,
    ) -> Result<bool, Error> {
        let relayer: Address = env
            .storage()
            .instance()
            .get(&DataKey::Relayer)
            .ok_or(Error::NotFound)?;
        relayer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let paid_key = DataKey::Paid(payment_ref.clone());
        if env.storage().persistent().has(&paid_key) {
            return Err(Error::AlreadyPaid);
        }

        let ticket_data: Ticket = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket))
            .ok_or(Error::NotFound)?;
        let route: Route = env
            .storage()
            .persistent()
            .get(&DataKey::Route(ticket_data.route))
            .ok_or(Error::NotFound)?;

        env.storage().persistent().set(&paid_key, &true);
        env.storage()
            .persistent()
            .extend_ttl(&paid_key, BUMP_THRESHOLD, BUMP_TO);

        let usdc: Address = env
            .storage()
            .instance()
            .get(&DataKey::Usdc)
            .ok_or(Error::NotFound)?;
        TokenClient::new(&env, &usdc).transfer(&relayer, &route.target, &amount);

        let accepted = DepositTargetClient::new(&env, &route.target).on_deposit(
            &ticket_data.user,
            &amount,
            &ticket_data.arg,
        );

        bump_instance(&env);
        Dispatched {
            ticket,
            payment_ref,
            amount,
            accepted,
        }
        .publish(&env);
        Ok(accepted)
    }

    pub fn get_ticket(env: Env, ticket: u64) -> Option<Ticket> {
        env.storage().persistent().get(&DataKey::Ticket(ticket))
    }

    pub fn get_route(env: Env, route: u32) -> Option<Route> {
        env.storage().persistent().get(&DataKey::Route(route))
    }

    pub fn is_paid(env: Env, payment_ref: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Paid(payment_ref))
    }

    pub fn relayer(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Relayer)
    }

    pub fn usdc(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Usdc)
    }
}

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

mod test;
