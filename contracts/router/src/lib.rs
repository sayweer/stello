#![no_std]

use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct Router;

#[contractimpl]
impl Router {
    pub fn version(_env: Env) -> u32 {
        1
    }
}

mod test;
