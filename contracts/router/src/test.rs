#![cfg(test)]
extern crate std;

use soroban_sdk::Env;

use crate::{Router, RouterClient};

#[test]
fn version_is_reported() {
    let env = Env::default();
    let contract_id = env.register(Router, ());
    let client = RouterClient::new(&env, &contract_id);

    assert_eq!(client.version(), 1);
}
