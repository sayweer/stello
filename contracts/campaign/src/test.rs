#![cfg(test)]
extern crate std;

use soroban_sdk::Env;

use crate::{Campaign, CampaignClient};

#[test]
fn version_is_reported() {
    let env = Env::default();
    let contract_id = env.register(Campaign, ());
    let client = CampaignClient::new(&env, &contract_id);

    assert_eq!(client.version(), 1);
}
