# PudlPudl Quick Start Guide

Get PudlPudl running locally in 10 minutes.

## Prerequisites

- Node.js 18+
- Rust 1.70+
- Solana CLI 1.16+
- Anchor 0.29.0
- PostgreSQL 14+

## Installation

### 1. Install Solana & Anchor

```bash
# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
```

### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/pudlpudl
cd pudlpudl

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configure Solana

```bash
# Set to devnet
solana config set --url devnet

# Create wallet (if needed)
solana-keygen new

# Airdrop SOL
solana airdrop 2
```

## Build & Deploy

### 1. Build Smart Contracts

```bash
# Build all programs
anchor build

# This creates:
# - target/deploy/*.so (program binaries)
# - target/idl/*.json (IDL files)
```

### 2. Deploy to Devnet

```bash
# Deploy all programs
anchor deploy

# Note the program IDs from output
```

### 3. Initialize Protocol

```bash
# Run deployment script
npx ts-node scripts/deploy.ts

# This will:
# ✅ Create $PUDL token
# ✅ Initialize Factory
# ✅ Initialize Treasury
# ✅ Initialize Staking
# ✅ Initialize Router
# ✅ Initialize Governance
```

## Setup Database

```bash
# Create database
createdb pudlpudl

# Run schema
cd backend
npm run db:setup

# Verify
psql pudlpudl -c "\dt"
```

## Configure Environment

```bash
# Copy example files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit .env with your values:
# - RPC_URL (use devnet)
# - Program addresses from deployment
# - Database credentials
```

## Run Services

### Terminal 1: Backend API

```bash
cd backend
npm run dev

# Should see:
# 🌊 PudlPudl API running on port 3001
```

### Terminal 2: Event Listener

```bash
cd backend
npm run listener

# Should see:
# 🎧 Starting event listener...
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev

# Should see:
# ▲ Next.js 14.0.4
# - Local: http://localhost:3000
```

## Test the System

### 1. Open Frontend

```bash
open http://localhost:3000
```

### 2. Connect Wallet

- Click "Connect Wallet"
- Select Phantom (or your wallet)
- Approve connection

### 3. Get Test $PUDL

```bash
# Mint test PUDL to your wallet
spl-token mint <PUDL_MINT> 10000 <YOUR_WALLET>
```

### 4. Create Test Pool

1. Go to `/create`
2. Enter test token mints
3. Set fee: 0.20%
4. Set bin step: 10
5. Set initial price
6. Click "Create Pool"
7. Approve transaction

### 5. Verify Pool Created

1. Go to `/pools`
2. See your new pool listed
3. Click to view details

### 6. Add Liquidity

1. On pool page, click "Add Liquidity"
2. Enter amounts
3. Select bin range
4. Approve transaction

### 7. Execute Swap

1. Go to `/swap`
2. Select tokens
3. Enter amount
4. Click "Swap"
5. Approve transaction

### 8. Stake $PUDL

1. Go to `/stake`
2. Enter amount to stake
3. Click "Stake"
4. See your tier update

## Verify Everything Works

### Check API

```bash
# Health check
curl http://localhost:3001/health

# Get pools
curl http://localhost:3001/api/pools

# Get staking stats
curl http://localhost:3001/api/staking/stats
```

### Check Database

```bash
psql pudlpudl

# Check pools
SELECT * FROM pools;

# Check swaps
SELECT * FROM swaps ORDER BY timestamp DESC LIMIT 5;

# Check stakes
SELECT * FROM stakes;
```

### Check On-Chain

```bash
# Get factory account
solana account <FACTORY_ADDRESS>

# Get pool account
solana account <POOL_ADDRESS>

# Get staking account
solana account <STAKING_ADDRESS>
```

## Common Issues

### "Insufficient SOL"

```bash
# Airdrop more SOL
solana airdrop 2
```

### "Program not deployed"

```bash
# Redeploy
anchor deploy

# Update .env with new program IDs
```

### "Database connection failed"

```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL
brew services restart postgresql
```

### "Port already in use"

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

### "Transaction simulation failed"

```bash
# Check compute units
# Increase in program if needed

# Check account balances
solana balance

# Check token balances
spl-token accounts
```

## Next Steps

### Development

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [TESTING.md](./TESTING.md) for testing guide
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

### Customization

- Modify pool parameters in Factory
- Adjust fee splits in Treasury
- Change tier thresholds in Staking
- Update UI styling in frontend

### Testing

```bash
# Run contract tests
anchor test

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

## Development Workflow

### Making Changes

```bash
# 1. Edit contract
vim programs/pudl-factory/src/lib.rs

# 2. Build
anchor build

# 3. Test
anchor test

# 4. Deploy
anchor deploy

# 5. Update frontend if needed
cd frontend && npm run dev
```

### Hot Reload

- Backend: Auto-reloads with `tsx watch`
- Frontend: Auto-reloads with Next.js
- Contracts: Rebuild and redeploy

## Useful Commands

```bash
# View Solana logs
solana logs --url devnet

# View program logs
solana logs <PROGRAM_ID>

# Get account info
solana account <ADDRESS>

# Get token balance
spl-token balance <MINT>

# Transfer tokens
spl-token transfer <MINT> <AMOUNT> <RECIPIENT>

# View database
psql pudlpudl

# Tail backend logs
cd backend && npm run dev | grep ERROR

# Build for production
npm run build
```

## Resources

- [Solana Docs](https://docs.solana.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Support

- GitHub Issues: https://github.com/your-org/pudlpudl/issues
- Discord: https://discord.gg/pudlpudl
- Twitter: @pudlpudl

## Success! 🎉

You now have PudlPudl running locally. Start building!

**What's Next?**
- Create your first pool
- Add liquidity
- Execute swaps
- Stake $PUDL
- Explore the codebase
- Build new features

Happy coding! 🌊
