# PudlPudl

> Permissionless DLMM liquidity protocol on Solana

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-14F195?style=flat&logo=solana&logoColor=white)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.29.0-blue)](https://www.anchor-lang.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

**Deep liquidity, meme speed.** A permissionless DLMM (Dynamic Liquidity Market Maker) protocol on Solana with native $PUDL token integration.

## Features

- **Create Pools**: Bond $PUDL to deploy custom DLMM pools
- **Provide Liquidity**: Earn from trading fees with concentrated liquidity
- **Swap**: Trade tokens with minimal slippage through optimal routing
- **Stake $PUDL**: Share in protocol revenue and unlock fee discounts
- **Governance**: Vote on protocol parameters with staked $PUDL

## Tech Stack

- **Smart Contracts**: Solana + Anchor (6 programs)
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: Next.js 14 + Tailwind CSS + Solana Wallet Adapter
- **Routing**: Jupiter API integration
- **Indexer**: Event-driven with Helius webhooks

## Architecture

### Smart Contracts (programs/)
- `pudl-factory` - Pool creation & $PUDL bonding enforcement
- `pudl-dlmm` - DLMM pool logic with bins and concentrated liquidity
- `pudl-treasury` - Fee collection, buyback automation, and distribution
- `pudl-staking` - Stake $PUDL for rewards and tier benefits
- `pudl-router` - Optimal swap routing with $PUDL pair preference
- `pudl-governance` - Token-weighted voting on protocol parameters

### Backend (backend/)
- Event listener for on-chain events
- REST API for pool stats, staking data, and analytics
- PostgreSQL database for historical data

### Frontend (frontend/)
- `/` - Landing page and dashboard
- `/pools` - Browse all pools
- `/create` - Create new pool wizard
- `/swap` - Token swap interface
- `/stake` - Staking and rewards

## Getting Started

### Prerequisites
- Node.js 18+
- Rust and Solana CLI
- Anchor 0.29.0
- PostgreSQL

### Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Build Smart Contracts

```bash
# Build all programs
anchor build

# Run tests
anchor test
```

### Run Backend

```bash
cd backend

# Set up database
psql -U postgres -f src/db/schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your RPC URL and database credentials

# Start API server
npm run dev
```

### Run Frontend

```bash
cd frontend

# Start development server
npm run dev

# Open http://localhost:3000
```

## Key Protocol Mechanics

### Pool Creation
1. User bonds 1,000 $PUDL (configurable)
2. Factory creates DLMM pool with specified parameters
3. Bond returned when pool is closed (if conditions met)

### Fee Flow
1. Swaps generate fees (e.g., 0.20%)
2. Protocol takes small cut (e.g., 0.05%)
3. Treasury collects fees in various tokens
4. Keeper triggers harvest → Jupiter swap to $PUDL
5. Split: 30% burn, 50% stakers, 20% ops

### Staking Tiers
- **Tier 0**: < 1k $PUDL → 0 bps discount
- **Tier 1**: 1k-10k → -5 bps fee discount
- **Tier 2**: 10k-100k → -10 bps
- **Tier 3**: >100k → -15 bps

### Governance
- Propose parameter changes
- Vote with staked $PUDL weight
- Timelock before execution
- Targets: fees, splits, pool params

## Development Roadmap

- [x] Core smart contracts
- [x] Factory with bonding
- [x] DLMM pools
- [x] Treasury & buyback
- [x] Staking with tiers
- [x] Router
- [x] Governance
- [x] Backend indexer
- [x] Frontend UI
- [ ] Jupiter CPI integration
- [ ] Helius webhook integration
- [ ] Keeper automation
- [ ] Testing suite
- [ ] Security audit
- [ ] Devnet deployment
- [ ] Mainnet launch

## Configuration

### Default Parameters
- Bond amount: 1,000 $PUDL
- Min fee: 0.05% (5 bps)
- Max fee: 1.00% (100 bps)
- Protocol fee: 0.50% of swap fee
- Buyback split: 30% burn / 50% stakers / 20% ops

## Contributing

Contributions welcome! Please open an issue or PR.

## Security

This is experimental software. Use at your own risk. Audit pending.

## License

MIT
