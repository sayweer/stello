#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, Env,
};

use crate::{PiggyBank, PiggyBankClient};

struct Ctx {
    env: Env,
    bank_id: Address,
    token: Address,
}

impl Ctx {
    fn bank(&self) -> PiggyBankClient<'_> {
        PiggyBankClient::new(&self.env, &self.bank_id)
    }

    /// Replays the router: the money is already here when on_deposit runs.
    fn deposit(&self, user: &Address, amount: i128, first_byte: u8) -> bool {
        StellarAssetClient::new(&self.env, &self.token).mint(&self.bank_id, &amount);
        self.bank()
            .on_deposit(user, &amount, &Bytes::from_array(&self.env, &[first_byte]))
    }
}

fn setup() -> Ctx {
    let env = Env::default();
    env.mock_all_auths();
    let issuer = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(issuer).address();
    let router = Address::generate(&env);
    let bank_id = env.register(PiggyBank, (router, token.clone()));
    Ctx { env, bank_id, token }
}

#[test]
fn deposits_accumulate_per_user() {
    let ctx = setup();
    let user = Address::generate(&ctx.env);

    assert!(ctx.deposit(&user, 300, 1));
    assert!(ctx.deposit(&user, 200, 1));

    assert_eq!(ctx.bank().balance(&user), 500);
}

#[test]
fn a_refused_deposit_is_sent_straight_back() {
    let ctx = setup();
    let user = Address::generate(&ctx.env);

    assert!(!ctx.deposit(&user, 300, 0));

    assert_eq!(ctx.bank().balance(&user), 0);
    assert_eq!(TokenClient::new(&ctx.env, &ctx.token).balance(&user), 300);
}

#[test]
fn withdrawing_pays_the_user_and_empties_the_bank() {
    let ctx = setup();
    let user = Address::generate(&ctx.env);
    ctx.deposit(&user, 500, 1);

    assert_eq!(ctx.bank().withdraw(&user), 500);
    assert_eq!(ctx.bank().balance(&user), 0);
    assert_eq!(TokenClient::new(&ctx.env, &ctx.token).balance(&user), 500);
}

#[test]
fn only_the_router_may_report_a_deposit() {
    let ctx = setup();
    let user = Address::generate(&ctx.env);

    ctx.env.mock_auths(&[]);
    assert!(ctx
        .bank()
        .try_on_deposit(&user, &300, &Bytes::from_array(&ctx.env, &[1u8]))
        .is_err());
}
