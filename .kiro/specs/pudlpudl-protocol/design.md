# Design Document

## Overview

PudlPudl is a Solana-based DLMM liquidity protocol with six core smart contracts (Anchor programs), an off-chain indexer service, and a Next.js frontend. The protocol enforces $PUDL token utility through pool creation bonding, implements automated fee buyback via Jupiter integration, and distributes protocol revenue to stakers through a reward index mechanism.

The architecture follows a modular design where each program has a single responsibility: Factory manages pool lifecycle, DLMM handles liquidity and swaps, Treasury manages fee collection and buyback, Staking handles token locking and rewards, Router optimizes swap paths, and Governance enables parameter updates.

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  - Wallet Adapter  - Pool UI  - Staking  - Governance       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Indexer API (Node.js)                     │
│  - Event Listener  - PostgreSQL  - REST Endpoints           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Solana Programs                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Factory    │  │     DLMM     │  │   Treasury   │     │
│  │   (P1)       │──│     (P4)     │──│    (P3)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Router     │  │   Staking    │  │  Governance  │     │
│  │   (P2)       │  │    (P5)      │  │    (P6)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              External Integrations                           │
│  - Jupiter (Swap CPI)  - Pyth (Price Oracle)                │
└─────────────────────────────────────────────────────────────┘
```

### Program Interaction Flow


**Pool Creation Flow:**
1. User → Factory::create_pool() with $PUDL bond
2. Factory → DLMM::initialize_pool() via CPI
3. Factory → Emits PoolCreated event
4. Indexer → Captures event, stores in DB

**Swap Flow:**
1. User → Router::swap_exact_in() or directly to DLMM
2. Router → Finds optimal path (may include multiple pools)
3. DLMM → Executes swap, calculates fees
4. DLMM → Treasury::record_fee() via CPI for protocol cut
5. DLMM → Emits SwapExecuted event

**Fee Buyback Flow:**
1. Keeper → Treasury::harvest_and_convert()
2. Treasury → Jupiter CPI to swap fees → $PUDL
3. Treasury → Splits $PUDL: burn / stakers / ops
4. Treasury → Staking::sync_rewards() to update reward index
5. Treasury → Emits Harvested event

**Staking & Rewards Flow:**
1. User → Staking::stake_pudl()
2. Staking → Updates UserStake, calculates tier
3. User → Staking::claim_rewards() (anytime)
4. Staking → Calculates pending = (amount * index - debt) / 2^64
5. Staking → Transfers rewards from vault

## Components and Interfaces

### P1: Factory Contract (pudl_factory)

**Purpose:** Manages pool creation, enforces $PUDL bonding, and maintains pool registry.

**PDAs:**
- `Factory` - seeds: `[b"factory"]`
- `Pool` - seeds: `[b"pool", base_mint, quote_mint, bin_step]`
- `PoolBondVault` - seeds: `[b"bond", pool]`

**State Structures:**

```rust
pub struct Factory {
    pub admin: Pubkey,              // Governance multisig
    pub treasury: Pubkey,            // P3 Treasury program
    pub router: Pubkey,              // P2 Router program
    pub bond_mint: Pubkey,           // $PUDL mint address
    pub bond_amount: u64,            // Required bond (e.g., 1000 * 10^6)
    pub max_base_fee_bps: u16,       // Max 100 = 1.00%
    pub min_base_fee_bps: u16,       // Min 5 = 0.05%
    pub fee_scheduler_enabled: bool,
    pub total_pools: u64,
    pub bump: u8,
}

pub struct PoolMeta {
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub creator: Pubkey,
    pub base_fee_bps: u16,
    pub bin_step: u16,               // DLMM granularity
    pub initial_price_x64: u128,     // Q64.64 fixed-point
    pub pool_authority: Pubkey,      // PDA for DLMM pool
    pub bond_vault: Pubkey,
    pub created_at: i64,
    pub flags: u32,                  // Bitflags: active, boostable, etc.
    pub bump: u8,
}
```

**Instructions:**


1. `initialize_factory(admin, treasury, router, bond_mint, params)`
   - Creates Factory PDA
   - Sets protocol parameters
   - Admin-only, one-time initialization

2. `create_pool(base_mint, quote_mint, base_fee_bps, bin_step, initial_price_x64)`
   - Validates fee within bounds
   - Checks uniqueness (base, quote, bin_step)
   - Transfers bond_amount $PUDL to PoolBondVault
   - Creates PoolMeta PDA
   - CPI to DLMM::initialize_pool()
   - Emits PoolCreated event

3. `close_pool(pool)`
   - Checks TVL < threshold and cooldown elapsed
   - Returns bonded $PUDL to creator (or slashes if flagged)
   - Marks pool inactive
   - Emits PoolClosed event

4. `set_params(bond_amount, fee_bounds, etc.)`
   - Governance-gated parameter updates
   - Validates new values
   - Emits ParamsUpdated event

**Events:**
- `FactoryInitialized { admin, bond_mint, bond_amount }`
- `PoolCreated { pool, creator, base_mint, quote_mint, fee_bps, bin_step }`
- `PoolClosed { pool, returned_bond }`
- `ParamsUpdated { field, old_value, new_value }`

### P2: Router Contract (pudl_router)

**Purpose:** Finds optimal swap paths across pools, with preference for $PUDL pairs.

**State:**
- Pool registry (read-only cache from Factory)
- $PUDL pair weight multiplier (configurable)

**Instructions:**

1. `swap_exact_in(amount_in, min_out, path[])`
   - Validates path (max 3 hops)
   - Executes swaps via CPI to DLMM pools
   - Verifies final output >= min_out
   - Emits SwapRouted event

2. `swap_exact_out(amount_out, max_in, path[])`
   - Reverse calculation from output
   - Similar validation and execution

3. `register_pool(pool)` / `deregister_pool(pool)`
   - Factory-only calls
   - Updates internal pool registry

**Path Scoring Algorithm:**
```
score = base_score - price_impact - (hop_count * hop_penalty)
if pool contains $PUDL:
    score += pudl_weight_bonus
return score
```

**Events:**
- `SwapRouted { user, path, amount_in, amount_out, hops }`

### P3: Treasury Contract (pudl_treasury)

**Purpose:** Collects protocol fees, executes Jupiter buybacks, distributes $PUDL.

**PDAs:**
- `Treasury` - seeds: `[b"treasury"]`
- `FeeVault[mint]` - seeds: `[b"fee_vault", mint]`
- `RewardsVault` - seeds: `[b"rewards"]`

**State:**

```rust
pub struct Treasury {
    pub authority: Pubkey,          // Governance
    pub pudl_mint: Pubkey,
    pub buyback_bps: u16,           // 10000 = 100% of fees
    pub burn_bps: u16,              // Of converted $PUDL
    pub staker_bps: u16,
    pub ops_bps: u16,
    pub last_harvest_at: i64,
    pub total_fees_collected: u64,
    pub total_pudl_burned: u64,
    pub bump: u8,
}
```

**Instructions:**


1. `record_fee(pool, mint, amount)`
   - Called by DLMM pools after swaps
   - Transfers fee tokens to FeeVault[mint]
   - Updates accounting
   - Emits FeeRecorded event

2. `harvest_and_convert()`
   - Keeper-triggered (permissionless or gated)
   - Iterates FeeVault accounts
   - For each non-$PUDL vault:
     - CPI to Jupiter for swap → $PUDL
   - Calculates splits: burn / stakers / ops
   - Executes burn (transfer to burn address or close account)
   - Transfers to RewardsVault and ops wallet
   - CPI to Staking::sync_rewards()
   - Emits Harvested event

3. `set_split(burn_bps, staker_bps, ops_bps)`
   - Governance-gated
   - Validates sum = 10000
   - Updates split parameters

**Jupiter Integration:**
- Use Jupiter CPI for swaps
- Maintain allowlist of route programs
- Set slippage tolerance (e.g., 1%)
- Handle swap failures gracefully (retry or skip)

**Events:**
- `FeeRecorded { pool, mint, amount, timestamp }`
- `Harvested { total_in, pudl_out, burned, to_stakers, to_ops }`

### P4: DLMM Pool Contract (pudl_dlmm)

**Purpose:** Concentrated liquidity pools with bin-based pricing, adapted from Meteora.

**Key Additions to Standard DLMM:**
- Protocol fee hook → calls Treasury::record_fee()
- Fee discount check → reads user tier from Staking contract
- Pause mechanism for emergency stops

**State:**

```rust
pub struct Pool {
    pub factory: Pubkey,
    pub creator: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub base_vault: Pubkey,
    pub quote_vault: Pubkey,
    pub base_fee_bps: u16,
    pub bin_step: u16,
    pub active_bin_id: i32,         // Current price bin
    pub protocol_fee_bps: u16,      // e.g., 50 = 0.50%
    pub total_volume: u64,
    pub total_fees: u64,
    pub paused: bool,
    pub bump: u8,
}

pub struct Position {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub lower_bin_id: i32,
    pub upper_bin_id: i32,
    pub liquidity_shares: Vec<u64>,  // Per bin
    pub fee_debt_base: u64,
    pub fee_debt_quote: u64,
}

pub struct Bin {
    pub liquidity: u128,
    pub reserve_base: u64,
    pub reserve_quote: u64,
    pub fee_base_per_share: u128,
    pub fee_quote_per_share: u128,
}
```

**Instructions:**


1. `initialize_pool(params)`
   - Called by Factory via CPI
   - Sets up pool state and vaults
   - Initializes active bin

2. `add_liquidity(bin_ranges[], amounts[])`
   - Validates bin ranges
   - Transfers tokens to vaults
   - Updates Position and Bin states
   - Mints LP shares (internal accounting)
   - Emits LiquidityAdded event

3. `remove_liquidity(position_id, bps)`
   - Calculates share to remove (basis points)
   - Claims accrued fees
   - Transfers tokens back to user
   - Updates Position and Bin states
   - Emits LiquidityRemoved event

4. `swap_exact_in(amount_in, min_out)`
   - Reads user tier from Staking (optional CPI)
   - Calculates effective fee with discount
   - Traverses bins to fill order
   - Splits fee: LP portion + protocol portion
   - CPI to Treasury::record_fee() for protocol cut
   - Transfers tokens
   - Emits Swap event

5. `swap_exact_out(amount_out, max_in)`
   - Similar to swap_exact_in but reverse calculation

6. `pause()` / `unpause()`
   - Admin-only
   - Sets paused flag
   - Blocks swaps and add_liquidity when paused
   - Allows remove_liquidity for fund recovery

**Bin Math (Simplified):**
- Price at bin i: `price = base_price * (1 + bin_step)^i`
- Swap traverses bins until amount filled
- Each bin acts as constant-product within range

**Events:**
- `LiquidityAdded { pool, user, bins, amounts }`
- `LiquidityRemoved { pool, user, bins, amounts }`
- `Swap { pool, user, in_mint, in_amt, out_mint, out_amt, fee_bps, protocol_fee }`

### P5: Staking Contract (pudl_staking)

**Purpose:** Stake $PUDL to earn protocol revenue and unlock fee discounts.

**PDAs:**
- `Staking` - seeds: `[b"staking"]`
- `UserStake` - seeds: `[b"stake", user]`

**State:**

```rust
pub struct Staking {
    pub authority: Pubkey,
    pub pudl_mint: Pubkey,
    pub staking_vault: Pubkey,
    pub rewards_vault: Pubkey,
    pub total_staked: u64,
    pub reward_index_x64: u128,     // Accumulated rewards per token
    pub last_update: i64,
    pub bump: u8,
}

pub struct UserStake {
    pub owner: Pubkey,
    pub amount: u64,
    pub reward_debt_x64: u128,      // Tracks claimed rewards
    pub tier: u8,                   // 0-3 based on amount
    pub last_update: i64,
    pub bump: u8,
}
```

**Tier Calculation:**
```
Tier 0: < 1,000 $PUDL      → 0 bps discount
Tier 1: 1,000 - 10,000     → -5 bps
Tier 2: 10,000 - 100,000   → -10 bps
Tier 3: > 100,000          → -15 bps
```

**Instructions:**


1. `stake_pudl(amount)`
   - Transfers $PUDL from user to staking_vault
   - Updates UserStake amount
   - Recalculates tier
   - Updates reward_debt_x64 = amount * reward_index_x64
   - Emits Staked event

2. `unstake_pudl(amount)`
   - Optional: enforce cooldown period
   - Claims pending rewards first
   - Transfers $PUDL from vault to user
   - Updates UserStake amount and tier
   - Emits Unstaked event

3. `claim_rewards()`
   - Calculates pending = (amount * index - debt) / 2^64
   - Transfers pending from rewards_vault to user
   - Updates reward_debt_x64
   - Emits RewardClaimed event

4. `sync_rewards(new_rewards)`
   - Called by Treasury after harvest
   - Updates reward_index_x64 += (new_rewards * 2^64) / total_staked
   - Emits RewardsSynced event

**Reward Math:**
- Global index tracks cumulative rewards per staked token
- User debt tracks what they've already claimed
- Pending = (user.amount * global_index - user.debt) / 2^64

**Events:**
- `Staked { user, amount, new_tier }`
- `Unstaked { user, amount }`
- `RewardClaimed { user, amount }`
- `RewardsSynced { new_rewards, new_index }`

### P6: Governance Contract (pudl_governance)

**Purpose:** Token-weighted voting on protocol parameters using staked $PUDL.

**PDAs:**
- `Governance` - seeds: `[b"governance"]`
- `Proposal` - seeds: `[b"proposal", proposal_id]`
- `Vote` - seeds: `[b"vote", proposal, user]`

**State:**

```rust
pub struct Governance {
    pub authority: Pubkey,
    pub staking_program: Pubkey,
    pub min_quorum: u64,            // Minimum votes required
    pub voting_period: i64,         // Seconds
    pub timelock_period: i64,       // Delay before execution
    pub proposal_count: u64,
    pub bump: u8,
}

pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    pub target_program: Pubkey,
    pub action_data: Vec<u8>,       // Serialized instruction
    pub start_time: i64,
    pub end_time: i64,
    pub execute_time: i64,          // end + timelock
    pub votes_for: u64,
    pub votes_against: u64,
    pub executed: bool,
    pub bump: u8,
}

pub struct Vote {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub weight: u64,                // Staked balance at vote time
    pub support: bool,              // true = for, false = against
}
```

**Instructions:**


1. `propose(target_program, action_data)`
   - Requires minimum stake threshold
   - Creates Proposal PDA
   - Sets voting period
   - Emits Proposed event

2. `vote(proposal, support)`
   - Reads voter's staked balance from Staking
   - Creates Vote PDA with weight
   - Updates proposal vote counts
   - Emits Voted event

3. `execute(proposal)`
   - Checks: voting ended, quorum met, timelock elapsed
   - Deserializes action_data
   - CPI to target_program with action
   - Marks proposal as executed
   - Emits Executed event

**Supported Actions:**
- Factory::set_params()
- Treasury::set_split()
- Staking::update_tiers()
- DLMM::pause() / unpause()

**Events:**
- `Proposed { id, proposer, target, description }`
- `Voted { proposal, voter, weight, support }`
- `Executed { proposal, result }`

## Data Models

### Database Schema (PostgreSQL)

**tokens**
```sql
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    mint VARCHAR(44) UNIQUE NOT NULL,
    symbol VARCHAR(10),
    decimals INT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**pools**
```sql
CREATE TABLE pools (
    id SERIAL PRIMARY KEY,
    address VARCHAR(44) UNIQUE NOT NULL,
    base_mint VARCHAR(44) REFERENCES tokens(mint),
    quote_mint VARCHAR(44) REFERENCES tokens(mint),
    creator VARCHAR(44),
    fee_bps INT,
    bin_step INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    INDEX idx_mints (base_mint, quote_mint)
);
```

**pool_stats**
```sql
CREATE TABLE pool_stats (
    pool_id INT REFERENCES pools(id),
    timestamp TIMESTAMP,
    tvl_usd NUMERIC,
    volume_24h NUMERIC,
    fee_apr_24h NUMERIC,
    PRIMARY KEY (pool_id, timestamp)
);
```

**swaps**
```sql
CREATE TABLE swaps (
    id SERIAL PRIMARY KEY,
    pool_id INT REFERENCES pools(id),
    timestamp TIMESTAMP,
    trader VARCHAR(44),
    in_mint VARCHAR(44),
    in_amount BIGINT,
    out_mint VARCHAR(44),
    out_amount BIGINT,
    fee_paid BIGINT,
    INDEX idx_pool_time (pool_id, timestamp),
    INDEX idx_trader (trader)
);
```

**fees**
```sql
CREATE TABLE fees (
    id SERIAL PRIMARY KEY,
    pool_id INT REFERENCES pools(id),
    timestamp TIMESTAMP,
    mint VARCHAR(44),
    amount BIGINT
);
```

**buybacks**
```sql
CREATE TABLE buybacks (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP,
    in_mint VARCHAR(44),
    in_amount BIGINT,
    pudl_out BIGINT,
    burned BIGINT,
    to_stakers BIGINT,
    to_ops BIGINT
);
```

**stakes**
```sql
CREATE TABLE stakes (
    user_address VARCHAR(44) PRIMARY KEY,
    amount BIGINT,
    tier INT,
    updated_at TIMESTAMP
);
```

## Error Handling

### Contract Error Codes


**Factory Errors:**
- `InsufficientBond` - User doesn't have enough $PUDL
- `InvalidFeeRange` - Fee outside min/max bounds
- `PoolAlreadyExists` - Duplicate pool key
- `PoolNotInactive` - Cannot close active pool
- `Unauthorized` - Caller not admin

**DLMM Errors:**
- `SlippageExceeded` - Output below min_out
- `InvalidBinRange` - Bin IDs out of bounds
- `InsufficientLiquidity` - Not enough reserves
- `PoolPaused` - Operations blocked
- `InvalidPosition` - Position doesn't exist

**Treasury Errors:**
- `InvalidSplit` - Split bps don't sum to 10000
- `SwapFailed` - Jupiter CPI returned error
- `InsufficientVaultBalance` - Not enough fees to harvest

**Staking Errors:**
- `InsufficientStake` - User trying to unstake more than balance
- `NoRewardsToClaim` - Pending rewards = 0
- `CooldownNotElapsed` - Unstake too soon

**Governance Errors:**
- `ProposalNotActive` - Voting period ended
- `AlreadyVoted` - User already cast vote
- `QuorumNotMet` - Not enough votes
- `TimelockNotElapsed` - Cannot execute yet

### Frontend Error Handling

**Wallet Errors:**
- Detect disconnected wallet → show connect prompt
- Insufficient SOL for tx fees → show warning with faucet link
- Transaction rejected → display user-friendly message

**Transaction Errors:**
- Parse on-chain error codes → map to readable messages
- Show retry button for transient failures
- Log errors to monitoring service (e.g., Sentry)

**API Errors:**
- Implement exponential backoff for retries
- Show cached data with "stale" indicator if API down
- Fallback to on-chain reads if indexer unavailable

## Testing Strategy

### Unit Tests (Anchor)

**Factory:**
- Test pool creation with valid/invalid parameters
- Test bond transfer and vault creation
- Test pool closure with various conditions
- Test parameter updates with governance

**DLMM:**
- Test liquidity addition across multiple bins
- Test swap calculations with different bin configurations
- Test fee splits (LP vs protocol)
- Test tier-based fee discounts
- Test pause/unpause functionality

**Treasury:**
- Test fee recording from multiple pools
- Mock Jupiter CPI, test split calculations
- Test reward sync to Staking contract
- Test edge cases (empty vaults, failed swaps)

**Staking:**
- Test stake/unstake flows
- Test reward calculation accuracy
- Test tier transitions
- Test concurrent claims

**Router:**
- Test single-hop vs multi-hop routing
- Test $PUDL pair preference
- Test slippage protection

**Governance:**
- Test proposal lifecycle
- Test vote weight calculation
- Test timelock enforcement
- Test execution CPI

### Integration Tests


**End-to-End Flows:**
1. Create pool → add liquidity → swap → verify fees recorded
2. Multiple swaps → harvest → verify buyback → verify staker rewards
3. Stake → earn rewards → claim → verify balance
4. Create proposal → vote → execute → verify parameter change
5. Multi-hop swap through router → verify optimal path

**Cross-Program Tests:**
- Factory creates pool → DLMM initialized correctly
- DLMM swap → Treasury receives fee
- Treasury harvest → Staking rewards updated
- Staking tier → DLMM applies discount
- Governance execute → Factory params updated

### Frontend Tests

**Component Tests (Jest + React Testing Library):**
- Pool creation form validation
- Wallet connection flow
- Swap interface calculations
- Staking dashboard display

**E2E Tests (Playwright):**
- Complete pool creation flow
- Add/remove liquidity flow
- Swap execution flow
- Stake/unstake/claim flow
- Governance voting flow

### Load Testing

**Indexer Performance:**
- Simulate 1000 events/second
- Verify API response times < 500ms
- Test database query optimization

**Contract Stress Tests:**
- Multiple concurrent swaps on same pool
- Large liquidity additions/removals
- High-frequency staking operations

## Security Considerations

### Access Control

**Admin Functions:**
- Factory::initialize_factory() - One-time, admin-only
- Factory::set_params() - Governance-gated
- DLMM::pause() - Admin or governance
- Treasury::set_split() - Governance-gated
- All admin keys should be multisig with timelock

**User Functions:**
- All user-facing functions validate signer
- PDA derivations prevent account substitution
- Token transfers verify ownership

### Economic Security

**Pool Creation:**
- Bond requirement prevents spam pools
- Slashing mechanism for malicious pools
- Fee bounds prevent excessive extraction

**Swaps:**
- Slippage protection on all swaps
- Price impact warnings in UI
- MEV protection via private RPC (optional)

**Staking:**
- Cooldown period prevents flash-loan attacks
- Reward calculation uses fixed-point math to prevent rounding exploits

### Technical Security

**Reentrancy:**
- All state updates before external calls
- Use Anchor's CPI context properly
- No recursive calls allowed

**Integer Overflow:**
- Use checked math operations
- Validate all user inputs
- Test boundary conditions

**Account Validation:**
- Verify all account owners
- Check PDA derivations
- Validate token mints match expected

**Upgrade Safety:**
- Programs deployed with upgrade authority = governance
- Timelock on upgrades (e.g., 48 hours)
- Emergency pause mechanism

### Audit Checklist

- [ ] All arithmetic uses checked operations
- [ ] All PDAs properly seeded and verified
- [ ] All CPIs validate target programs
- [ ] No unbounded loops
- [ ] All user inputs validated
- [ ] Access control on all privileged functions
- [ ] Token accounting matches vault balances
- [ ] Reward math tested for precision
- [ ] Governance timelock enforced
- [ ] Emergency pause tested

## Deployment Strategy

### Phase 1: Devnet (Week 1-2)
- Deploy all programs
- Deploy test $PUDL token
- Create test pools
- Run integration tests
- Iterate on bugs

### Phase 2: Testnet (Week 3-4)
- Deploy with production-like parameters
- Public testing campaign
- Bug bounty program
- Load testing
- Security review

### Phase 3: Mainnet (Week 5+)
- Deploy with guarded launch
- Limited pool creation (whitelist)
- Gradual parameter relaxation
- Monitor metrics closely
- Full public launch after 1-2 weeks

### Monitoring

**On-Chain Metrics:**
- Total TVL across all pools
- Daily volume
- Protocol fees collected
- $PUDL burned
- Staking participation rate

**System Health:**
- Transaction success rate
- Average confirmation time
- Indexer lag (blocks behind)
- API uptime and latency

**Alerts:**
- Large price movements
- Unusual volume spikes
- Failed harvests
- Indexer errors
- Low vault balances

## Future Enhancements

**V2 Features:**
- Concentrated liquidity incentives (liquidity mining)
- Cross-chain bridges for $PUDL
- Advanced routing with aggregator integration
- Limit orders on DLMM pools
- Pool boosting marketplace
- NFT-based pool ownership

**Optimizations:**
- Batch harvest operations
- Compressed account storage
- Off-chain order matching
- ZK proofs for privacy swaps
