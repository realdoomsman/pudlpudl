# PudlPudl Architecture

## System Overview

PudlPudl is a permissionless DLMM (Dynamic Liquidity Market Maker) protocol on Solana with native $PUDL token integration. The system consists of 6 smart contracts, a backend indexer, and a frontend application.

## Core Components

### 1. Smart Contracts (Solana/Anchor)

#### P1: Factory Contract (`pudl-factory`)
**Purpose**: Pool creation and $PUDL bonding enforcement

**Key Features**:
- Enforces $PUDL bond requirement for pool creation
- Validates fee parameters within bounds
- Prevents duplicate pools
- Manages pool lifecycle (create/close)

**State**:
```rust
Factory {
    admin: Pubkey,
    treasury: Pubkey,
    router: Pubkey,
    bond_mint: Pubkey,        // $PUDL
    bond_amount: u64,         // e.g., 1000 PUDL
    max_base_fee_bps: u16,    // 100 = 1%
    min_base_fee_bps: u16,    // 5 = 0.05%
    total_pools: u64,
}

PoolMeta {
    base_mint: Pubkey,
    quote_mint: Pubkey,
    creator: Pubkey,
    base_fee_bps: u16,
    bin_step: u16,
    initial_price_x64: u128,
    bond_vault: Pubkey,
    created_at: i64,
    flags: u32,
}
```

#### P2: DLMM Pool Contract (`pudl-dlmm`)
**Purpose**: Concentrated liquidity pools with bin-based pricing

**Key Features**:
- Bin-based liquidity distribution
- Concentrated liquidity positions
- Protocol fee extraction
- Tier-based fee discounts
- Emergency pause mechanism

**State**:
```rust
Pool {
    factory: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    base_vault: Pubkey,
    quote_vault: Pubkey,
    base_fee_bps: u16,
    bin_step: u16,
    active_bin_id: i32,
    protocol_fee_bps: u16,
    total_volume: u64,
    total_fees: u64,
    paused: bool,
}

Position {
    owner: Pubkey,
    pool: Pubkey,
    lower_bin_id: i32,
    upper_bin_id: i32,
    base_amount: u64,
    quote_amount: u64,
    fee_debt_base: u64,
    fee_debt_quote: u64,
}
```

**Bin Math**:
- Price at bin i: `price = base_price * (1 + bin_step)^i`
- Swaps traverse bins until order filled
- Each bin acts as constant-product within range

#### P3: Treasury Contract (`pudl-treasury`)
**Purpose**: Fee collection, buyback automation, and distribution

**Key Features**:
- Collects protocol fees from all pools
- Executes Jupiter swaps to convert fees → $PUDL
- Splits $PUDL: burn / stakers / ops
- Syncs rewards to staking contract

**State**:
```rust
Treasury {
    authority: Pubkey,
    pudl_mint: Pubkey,
    buyback_bps: u16,      // 10000 = 100%
    burn_bps: u16,         // 3000 = 30%
    staker_bps: u16,       // 5000 = 50%
    ops_bps: u16,          // 2000 = 20%
    last_harvest_at: i64,
    total_fees_collected: u64,
    total_pudl_burned: u64,
}
```

**Fee Flow**:
1. Pool swap → protocol fee extracted
2. Fee sent to Treasury FeeVault[mint]
3. Keeper calls harvest_and_convert()
4. Jupiter CPI: fees → $PUDL
5. Split: burn / stakers / ops
6. Sync rewards to Staking

#### P4: Staking Contract (`pudl-staking`)
**Purpose**: Stake $PUDL for rewards and tier benefits

**Key Features**:
- Stake $PUDL to earn protocol revenue
- Tier system based on staked amount
- Reward index for fair distribution
- Fee discounts for higher tiers

**State**:
```rust
Staking {
    authority: Pubkey,
    pudl_mint: Pubkey,
    staking_vault: Pubkey,
    rewards_vault: Pubkey,
    total_staked: u64,
    reward_index_x64: u128,  // Q64.64 fixed-point
    last_update: i64,
}

UserStake {
    owner: Pubkey,
    amount: u64,
    reward_debt_x64: u128,
    tier: u8,              // 0-3
    last_update: i64,
}
```

**Tier System**:
- Tier 0: < 1k $PUDL → 0 bps discount
- Tier 1: 1k-10k → -5 bps
- Tier 2: 10k-100k → -10 bps
- Tier 3: >100k → -15 bps

**Reward Math**:
```
pending = (user.amount * reward_index - user.reward_debt) / 2^64
```

#### P5: Router Contract (`pudl-router`)
**Purpose**: Optimal swap routing with $PUDL pair preference

**Key Features**:
- Single and multi-hop routing (max 3 hops)
- Path scoring algorithm
- $PUDL pair weight bonus
- Slippage protection

**Routing Algorithm**:
```
score = base_score - price_impact - (hop_count * penalty)
if pool contains $PUDL:
    score += pudl_weight_bonus
```

#### P6: Governance Contract (`pudl-governance`)
**Purpose**: Token-weighted voting on protocol parameters

**Key Features**:
- Proposal creation (requires min stake)
- Voting with staked $PUDL weight
- Timelock before execution
- CPI to target programs

**State**:
```rust
Governance {
    authority: Pubkey,
    staking_program: Pubkey,
    min_quorum: u64,
    voting_period: i64,      // e.g., 3 days
    timelock_period: i64,    // e.g., 2 days
    proposal_count: u64,
}

Proposal {
    id: u64,
    proposer: Pubkey,
    target_program: Pubkey,
    action_data: Vec<u8>,
    start_time: i64,
    end_time: i64,
    execute_time: i64,
    votes_for: u64,
    votes_against: u64,
    executed: bool,
}
```

### 2. Backend (Node.js + Express + PostgreSQL)

#### Event Listener
**Purpose**: Subscribe to on-chain events and index data

**Events Tracked**:
- PoolCreated
- LiquidityAdded / LiquidityRemoved
- SwapExecuted
- FeeRecorded
- Harvested
- Staked / Unstaked
- RewardsClaimed
- Proposed / Voted / Executed

**Implementation**:
- Helius webhooks (production)
- WebSocket subscriptions (fallback)
- Polling (development)

#### REST API
**Endpoints**:
```
GET  /api/pools              # List all pools
GET  /api/pools/:address     # Pool details
GET  /api/staking/stats      # Staking statistics
GET  /api/staking/:address   # User stake info
GET  /api/governance/proposals  # List proposals
GET  /health                 # Health check
```

#### Database Schema
```sql
tokens(id, mint, symbol, decimals)
pools(id, address, base_mint, quote_mint, creator, fee_bps, bin_step, is_active)
pool_stats(pool_id, timestamp, tvl_usd, volume_24h, fee_apr_24h)
swaps(id, pool_id, timestamp, trader, in_mint, in_amount, out_mint, out_amount, fee_paid)
fees(id, pool_id, timestamp, mint, amount)
buybacks(id, timestamp, in_mint, in_amount, pudl_out, burned, to_stakers, to_ops)
stakes(user_address, amount, tier, updated_at)
proposals(id, proposal_address, proposer, target_program, description, votes_for, votes_against)
```

### 3. Frontend (Next.js 14 + Tailwind CSS)

#### Pages
- `/` - Landing page and dashboard
- `/pools` - Browse all pools
- `/create` - Create new pool wizard
- `/swap` - Token swap interface
- `/stake` - Staking and rewards
- `/governance` - Proposals and voting

#### Key Components
- `WalletProvider` - Solana wallet integration
- `PoolCard` - Pool display component
- `SwapInterface` - Token swap UI
- `StakingDashboard` - Staking stats and actions
- `ProposalList` - Governance proposals

## Data Flow

### Pool Creation Flow
```
User → Frontend
  ↓
  Check $PUDL balance
  ↓
  Build transaction
  ↓
Factory::create_pool()
  ↓
  Transfer bond to vault
  ↓
  Create PoolMeta PDA
  ↓
  Emit PoolCreated event
  ↓
Indexer captures event
  ↓
  Insert into database
  ↓
Frontend displays new pool
```

### Swap Flow
```
User → Frontend
  ↓
  Select tokens & amount
  ↓
Router (optional) or direct to Pool
  ↓
DLMM::swap_exact_in()
  ↓
  Calculate output & fees
  ↓
  Check tier discount
  ↓
  Execute token transfers
  ↓
  Treasury::record_fee() CPI
  ↓
  Emit SwapExecuted event
  ↓
Indexer updates stats
  ↓
Frontend shows result
```

### Fee Buyback Flow
```
Keeper (cron)
  ↓
Treasury::harvest_and_convert()
  ↓
  Iterate FeeVaults
  ↓
  Jupiter CPI: fees → $PUDL
  ↓
  Calculate splits
  ↓
  Burn portion
  ↓
  Transfer to RewardsVault
  ↓
  Transfer to ops wallet
  ↓
  Staking::sync_rewards() CPI
  ↓
  Update reward_index
  ↓
  Emit Harvested event
  ↓
Indexer records buyback
```

### Staking & Rewards Flow
```
User → Frontend
  ↓
Staking::stake_pudl()
  ↓
  Transfer $PUDL to vault
  ↓
  Update UserStake
  ↓
  Calculate tier
  ↓
  Update reward_debt
  ↓
  Emit Staked event
  ↓
[Time passes, rewards accumulate]
  ↓
User → Staking::claim_rewards()
  ↓
  Calculate pending
  ↓
  Transfer from RewardsVault
  ↓
  Update reward_debt
  ↓
  Emit RewardsClaimed event
```

## Security Model

### Access Control
- **Admin functions**: Governance multisig only
- **User functions**: Signer validation
- **CPI calls**: Program ID verification
- **PDA derivation**: Seed validation

### Economic Security
- **Pool creation**: Bond requirement prevents spam
- **Slashing**: Malicious pools can be flagged
- **Fee bounds**: Min/max limits prevent extraction
- **Cooldowns**: Prevent flash-loan attacks

### Technical Security
- **Checked math**: All arithmetic operations
- **Account validation**: Owner and mint checks
- **Reentrancy**: State updates before external calls
- **Pause mechanism**: Emergency stop capability

## Performance Considerations

### On-Chain
- **Compute units**: Optimized instruction size
- **Account size**: Minimal state storage
- **CPI depth**: Limited to 4 levels
- **Transaction size**: Batching where possible

### Off-Chain
- **Database indexing**: Optimized queries
- **API caching**: Redis for hot data
- **RPC calls**: Rate limiting and retries
- **WebSocket**: Efficient event streaming

## Scalability

### Horizontal Scaling
- **Backend**: Multiple API instances
- **Database**: Read replicas
- **Indexer**: Sharded by program

### Vertical Scaling
- **RPC**: Dedicated nodes
- **Database**: Larger instances
- **Caching**: Increased memory

## Monitoring

### Metrics
- Total TVL across pools
- Daily volume
- Protocol fees collected
- $PUDL burned
- Staking participation
- Transaction success rate
- API latency
- Database query time

### Alerts
- Failed transactions > 5%
- API downtime
- Database connection issues
- Low keeper balance
- Unusual volume spikes
- Large price movements

## Future Enhancements

### V2 Features
- Liquidity mining incentives
- Cross-chain bridges
- Advanced routing with aggregators
- Limit orders on DLMM
- Pool boosting marketplace
- NFT-based pool ownership

### Optimizations
- Batch harvest operations
- Compressed account storage
- Off-chain order matching
- ZK proofs for privacy

## References

- [Meteora DLMM](https://docs.meteora.ag/dlmm)
- [Solana Program Library](https://spl.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Jupiter Aggregator](https://docs.jup.ag/)
