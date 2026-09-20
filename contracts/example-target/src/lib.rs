#![no_std]
//! The smallest contract that can be funded by bank transfer: a piggy bank.
//!
//! This is the whole integration, contract side. Everything Stello asks of an
//! app is the `on_deposit` function below — the router calls it in the same
//! transaction that moved the money here.

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, token::TokenClient, Address, Bytes, Env,
};

const DAY_IN_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 7 * DAY_IN_LEDGERS;
const BUMP_TO: u32 = 30 * DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Router,
    Token,
    Balance(Address),
}

#[contractevent]
pub struct Saved {
    #[topic]
    pub user: Address,
    pub amount: i128,
    pub balance: i128,
}

#[contract]
pub struct PiggyBank;

#[contractimpl]
impl PiggyBank {
    pub fn __constructor(env: Env, router: Address, token: Address) {
        env.storage().instance().set(&DataKey::Router, &router);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// Called by the Stello router once a bank transfer has landed. The money
    /// is already in this contract when this runs.
    ///
    /// Returning `false` means "I did not take this" — and then the contract
    /// must have sent the money back itself, as the refusal branch does.
    pub fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool {
        // Only the router may say that money arrived. Without this line anyone
        // could call on_deposit and be credited for a transfer that never was.
        let router: Address = env.storage().instance().get(&DataKey::Router).unwrap();
        router.require_auth();

        // `arg` is whatever the app's frontend attached to the ticket. This one
        // reads a single flag: a zero first byte means "refuse", to show the
        // refund path.
        if arg.get(0) == Some(0) {
            token(&env).transfer(&env.current_contract_address(), &user, &amount);
            return false;
        }

        let key = DataKey::Balance(user.clone());
        let balance: i128 = env.storage().persistent().get(&key).unwrap_or(0) + amount;
        env.storage().persistent().set(&key, &balance);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);

        Saved {
            user,
            amount,
            balance,
        }
        .publish(&env);
        true
    }

    /// Breaks the piggy bank: everything goes back to the user's own account,
    /// from where the SDK can cash it out to their IBAN.
    pub fn withdraw(env: Env, user: Address) -> i128 {
        user.require_auth();
        let key = DataKey::Balance(user.clone());
        let balance: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if balance > 0 {
            env.storage().persistent().remove(&key);
            token(&env).transfer(&env.current_contract_address(), &user, &balance);
        }
        balance
    }

    pub fn balance(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(user))
            .unwrap_or(0)
    }
}

fn token(env: &Env) -> TokenClient<'_> {
    let address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
    TokenClient::new(env, &address)
}

mod test;
