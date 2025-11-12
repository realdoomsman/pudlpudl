# Requirements Document

## Introduction

PudlPudl is a permissionless DLMM (Dynamic Liquidity Market Maker) liquidity protocol on Solana with native $PUDL token integration. The protocol enables users to create custom liquidity pools by bonding $PUDL tokens, provide liquidity to earn fees, stake $PUDL for protocol revenue sharing, and participate in governance. The system implements a fee buyback mechanism that converts protocol fees to $PUDL for burning and distribution to stakers.

## Glossary

- **DLMM**: Dynamic Liquidity Market Maker - a concentrated liquidity AMM pattern with price bins
- **Factory Contract**: Smart contract that creates and manages liquidity pools
- **Pool**: A DLMM liquidity pool for a specific token pair
- **$PUDL**: The native SPL token that powers the protocol
- **Bonding**: Locking $PUDL tokens as collateral to create a pool
- **Protocol Fee**: A percentage of swap fees collected by the protocol treasury
- **Treasury**: Smart contract that collects fees and executes buybacks
- **Staking Contract**: Smart contract where users stake $PUDL to earn protocol revenue
- **Router**: Smart contract that finds optimal swap paths across pools
- **Governance Contract**: Smart contract for token-weighted voting on protocol parameters
- **Bin**: A discrete price range in a DLMM pool
- **Bin Step**: The granularity of price bins in a pool
- **Jupiter**: Solana DEX aggregator used for token swaps
- **Keeper**: Automated service that triggers periodic protocol operations

## Requirements

### Requirement 1

**User Story:** As a token creator, I want to create a custom DLMM liquidity pool by bonding $PUDL tokens, so that I can provide liquidity infrastructure for my token

#### Acceptance Criteria

1. WHEN a user initiates pool creation with valid parameters (base mint, quote mint, fee bps, bin step, initial price), THE Factory Contract SHALL verify the user has sufficient $PUDL balance for bonding
2. WHEN the Factory Contract verifies sufficient balance, THE Factory Contract SHALL transfer the bond amount of $PUDL from the user to the PoolBondVault
3. WHEN the bond transfer completes, THE Factory Contract SHALL create a unique Pool PDA with seeds [b"pool", base_mint, quote_mint, bin_step]
4. WHEN the Pool PDA is created, THE Factory Contract SHALL initialize the DLMM pool instance with the specified parameters
5. WHEN pool initialization completes, THE Factory Contract SHALL emit a PoolCreated event containing pool address, creator, base mint, and quote mint

### Requirement 2

**User Story:** As a liquidity provider, I want to add liquidity to specific price bins in a pool, so that I can earn trading fees from swaps in my chosen price ranges

#### Acceptance Criteria

1. WHEN a user adds liquidity with valid bin ranges and token amounts, THE DLMM Pool Contract SHALL transfer the specified base tokens from the user to the pool base vault
2. WHEN base tokens are transferred, THE DLMM Pool Contract SHALL transfer the specified quote tokens from the user to the pool quote vault
3. WHEN both token transfers complete, THE DLMM Pool Contract SHALL create or update the user's Position PDA with the bin allocations and amounts
4. WHEN the position is updated, THE DLMM Pool Contract SHALL emit a LiquidityAdded event containing pool address, user address, amounts, and bin identifiers

### Requirement 3

**User Story:** As a trader, I want to swap tokens through pools with minimal slippage, so that I can exchange tokens efficiently

#### Acceptance Criteria

1. WHEN a user initiates a swap with amount in and minimum amount out, THE DLMM Pool Contract SHALL calculate the swap output using bin-based pricing
2. WHEN the output is calculated, THE DLMM Pool Contract SHALL verify the output meets or exceeds the minimum amount out specified
3. WHEN slippage check passes, THE DLMM Pool Contract SHALL calculate the protocol fee portion from the swap fee
4. WHEN fees are calculated, THE DLMM Pool Contract SHALL transfer input tokens from user to pool vault and output tokens from pool vault to user
5. WHEN the swap completes, THE DLMM Pool Contract SHALL call Treasury record_fee instruction with the protocol fee amount
6. WHEN all transfers complete, THE DLMM Pool Contract SHALL emit a SwapExecuted event containing amounts, fees, and user address

### Requirement 4

**User Story:** As the protocol, I want to automatically convert collected fees to $PUDL and distribute them, so that the token accrues value and stakers earn rewards

#### Acceptance Criteria

1. WHEN a keeper calls harvest_and_convert on the Treasury Contract, THE Treasury Contract SHALL iterate through all FeeVault accounts with non-zero balances
2. WHEN processing each vault, THE Treasury Contract SHALL execute a Jupiter CPI swap to convert the fee tokens to $PUDL
3. WHEN the swap completes, THE Treasury Contract SHALL calculate the split amounts based on burn_bps, staker_bps, and ops_bps parameters
4. WHEN splits are calculated, THE Treasury Contract SHALL transfer the burn portion to the burn mechanism
5. WHEN burn completes, THE Treasury Contract SHALL transfer the staker portion to the RewardsVault
6. WHEN staker transfer completes, THE Treasury Contract SHALL transfer the ops portion to the operations wallet
7. WHEN all distributions complete, THE Treasury Contract SHALL emit a Harvested event containing total fees processed and distribution amounts

### Requirement 5

**User Story:** As a $PUDL holder, I want to stake my tokens to earn a share of protocol fees, so that I can generate passive income

#### Acceptance Criteria

1. WHEN a user stakes $PUDL tokens, THE Staking Contract SHALL transfer the specified amount from the user's token account to the staking vault
2. WHEN the transfer completes, THE Staking Contract SHALL create or update the user's UserStake PDA with the new staked amount
3. WHEN the stake is updated, THE Staking Contract SHALL calculate and assign the user's tier based on total staked amount
4. WHEN tier is assigned, THE Staking Contract SHALL update the reward_debt_x64 field based on current reward_index_x64
5. WHEN all updates complete, THE Staking Contract SHALL emit a Staked event containing user address and amount

### Requirement 6

**User Story:** As a staker, I want to claim my accumulated rewards, so that I can realize my earnings from protocol fees

#### Acceptance Criteria

1. WHEN a user claims rewards, THE Staking Contract SHALL calculate pending rewards using the formula: (user.amount * reward_index_x64 - user.reward_debt_x64) / 2^64
2. WHEN pending rewards are calculated and greater than zero, THE Staking Contract SHALL transfer the reward amount from RewardsVault to the user's token account
3. WHEN the transfer completes, THE Staking Contract SHALL update the user's reward_debt_x64 to current accumulated value
4. WHEN debt is updated, THE Staking Contract SHALL emit a RewardClaimed event containing user address and reward amount

### Requirement 7

**User Story:** As a trader, I want the router to find optimal swap paths including multi-hop routes, so that I can get the best execution price

#### Acceptance Criteria

1. WHEN a user requests a swap through the Router Contract, THE Router Contract SHALL query available pools from its registry
2. WHEN pools are retrieved, THE Router Contract SHALL calculate single-hop routes and score them based on price impact and liquidity depth
3. WHEN single-hop routes are insufficient, THE Router Contract SHALL calculate multi-hop routes up to 3 hops maximum
4. WHERE a pool contains $PUDL as base or quote token, THE Router Contract SHALL apply a configurable weight boost to the route score
5. WHEN the optimal route is determined, THE Router Contract SHALL execute the swap through the selected path
6. WHEN the swap completes, THE Router Contract SHALL emit a SwapRouted event containing the path taken and amounts

### Requirement 8

**User Story:** As a pool creator, I want to close an inactive pool and recover my bonded $PUDL, so that I can reclaim my capital

#### Acceptance Criteria

1. WHEN a user requests to close a pool, THE Factory Contract SHALL verify the pool TVL is below the minimum threshold
2. WHEN TVL check passes, THE Factory Contract SHALL verify the cooldown period has elapsed since last activity
3. WHEN cooldown check passes, THE Factory Contract SHALL verify the pool has not been flagged for malicious activity
4. WHEN all checks pass, THE Factory Contract SHALL transfer the bonded $PUDL from PoolBondVault back to the creator
5. WHEN the transfer completes, THE Factory Contract SHALL mark the pool as inactive
6. WHEN pool is marked inactive, THE Factory Contract SHALL emit a PoolClosed event containing pool address and returned bond amount

### Requirement 9

**User Story:** As a governance participant, I want to vote on protocol parameter changes using my staked $PUDL, so that I can influence protocol direction

#### Acceptance Criteria

1. WHEN a user creates a proposal with valid action payload, THE Governance Contract SHALL create a Proposal PDA with the action details and voting period
2. WHEN a proposal is created, THE Governance Contract SHALL emit a Proposed event containing proposal ID and parameters
3. WHEN a user votes on an active proposal, THE Governance Contract SHALL read the user's staked $PUDL balance from the Staking Contract
4. WHEN balance is retrieved, THE Governance Contract SHALL record the vote with weight equal to staked balance
5. WHEN the voting period ends and quorum is reached, THE Governance Contract SHALL execute the proposal via CPI to the target program
6. WHEN execution completes, THE Governance Contract SHALL emit an Executed event containing proposal ID and result

### Requirement 10

**User Story:** As a staker with a higher tier, I want to receive reduced trading fees when swapping, so that I am rewarded for my commitment to the protocol

#### Acceptance Criteria

1. WHEN a user initiates a swap, THE DLMM Pool Contract SHALL query the user's staking tier from the Staking Contract
2. WHEN tier is retrieved and greater than zero, THE DLMM Pool Contract SHALL calculate the fee discount based on tier level
3. WHEN discount is calculated, THE DLMM Pool Contract SHALL verify the discounted fee remains within min_base_fee_bps and max_base_fee_bps bounds
4. WHEN bounds check passes, THE DLMM Pool Contract SHALL apply the discounted fee to the swap calculation
5. WHEN the swap completes, THE DLMM Pool Contract SHALL record the effective fee rate in the SwapExecuted event

### Requirement 11

**User Story:** As a protocol administrator, I want to pause pool operations in case of emergency, so that I can protect user funds from exploits

#### Acceptance Criteria

1. WHEN an authorized admin calls pause on a pool, THE DLMM Pool Contract SHALL set the paused flag to true
2. WHEN the paused flag is set, THE DLMM Pool Contract SHALL reject all swap and add_liquidity instructions with a paused error
3. WHEN the paused flag is set, THE DLMM Pool Contract SHALL continue to allow remove_liquidity instructions for user fund recovery
4. WHEN an authorized admin calls unpause, THE DLMM Pool Contract SHALL set the paused flag to false and resume normal operations

### Requirement 12

**User Story:** As a developer, I want the indexer to track all pool events and statistics, so that the frontend can display accurate real-time data

#### Acceptance Criteria

1. WHEN a PoolCreated event is emitted, THE Indexer Service SHALL insert a new record in the pools table with metadata
2. WHEN a SwapExecuted event is emitted, THE Indexer Service SHALL insert a record in the swaps table and update pool_stats volume
3. WHEN a LiquidityAdded or LiquidityRemoved event is emitted, THE Indexer Service SHALL recalculate and update the pool TVL
4. WHEN a Harvested event is emitted, THE Indexer Service SHALL insert a record in the buybacks table
5. WHEN the API receives a request for pool statistics, THE Indexer Service SHALL return aggregated data from pool_stats table within 500ms
