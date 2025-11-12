# PudlPudl Deployment Guide

## Prerequisites

- Solana CLI installed and configured
- Anchor 0.29.0 installed
- Node.js 18+ and npm
- PostgreSQL 14+
- Sufficient SOL for deployment (devnet: use faucet, mainnet: ~10 SOL)

## Step 1: Build Programs

```bash
# Build all Anchor programs
anchor build

# Verify builds
ls -la target/deploy/
```

## Step 2: Configure Deployment

```bash
# Set Solana cluster
solana config set --url devnet  # or mainnet-beta

# Check your wallet
solana address
solana balance

# If on devnet, airdrop SOL
solana airdrop 2
```

## Step 3: Deploy Programs

```bash
# Deploy all programs
anchor deploy

# Note the program IDs from output
# Update Anchor.toml with actual program IDs if needed
```

## Step 4: Initialize Protocol

```bash
# Run deployment script
ts-node scripts/deploy.ts

# This will:
# - Create $PUDL token mint
# - Initialize Factory with bonding parameters
# - Initialize Treasury for fee collection
# - Initialize Staking with reward vaults
# - Initialize Router for swap routing
# - Initialize Governance with voting parameters
```

## Step 5: Set Up Database

```bash
cd backend

# Create database
createdb pudlpudl

# Run schema
npm run db:setup

# Or manually:
psql -U postgres -d pudlpudl -f src/db/schema.sql
```

## Step 6: Configure Environment

```bash
# Copy example env files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit .env files with:
# - RPC URLs
# - Program addresses from deployment
# - Database credentials
# - API endpoints
```

## Step 7: Start Backend

```bash
cd backend

# Install dependencies
npm install

# Start API server
npm run dev

# In another terminal, start event listener
npm run listener
```

## Step 8: Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Step 9: Verify Deployment

### Check Programs

```bash
# Verify program accounts exist
solana account <FACTORY_ADDRESS>
solana account <TREASURY_ADDRESS>
solana account <STAKING_ADDRESS>
```

### Check API

```bash
# Health check
curl http://localhost:3001/health

# Get pools
curl http://localhost:3001/api/pools

# Get staking stats
curl http://localhost:3001/api/staking/stats
```

### Check Frontend

1. Open http://localhost:3000
2. Connect wallet
3. Try creating a test pool
4. Verify pool appears in /pools

## Step 10: Create Test Pool

```bash
# Using the frontend:
1. Go to /create
2. Enter test token mints
3. Set fee and bin step
4. Ensure you have 1000 $PUDL for bond
5. Click "Create Pool"

# Or using CLI:
ts-node scripts/create-test-pool.ts
```

## Production Deployment Checklist

### Pre-Deployment

- [ ] Complete security audit
- [ ] Run full test suite
- [ ] Test on devnet for 1+ week
- [ ] Set up monitoring and alerts
- [ ] Prepare incident response plan
- [ ] Set up multisig for admin keys
- [ ] Configure timelock for upgrades

### Mainnet Deployment

- [ ] Deploy programs to mainnet
- [ ] Initialize with production parameters
- [ ] Deploy $PUDL token with proper supply
- [ ] Set up production database (RDS/managed)
- [ ] Configure production RPC (Helius/QuickNode)
- [ ] Set up CDN for frontend (Vercel/Cloudflare)
- [ ] Enable monitoring (Datadog/Sentry)
- [ ] Set up keeper automation
- [ ] Test all flows with small amounts
- [ ] Gradual rollout with limits

### Post-Deployment

- [ ] Monitor for 24h with limits
- [ ] Gradually increase limits
- [ ] Announce to community
- [ ] Provide liquidity to initial pools
- [ ] Set up governance proposals
- [ ] Begin marketing campaign

## Monitoring

### Key Metrics

- Total TVL across pools
- Daily volume
- Protocol fees collected
- $PUDL burned
- Staking participation
- Transaction success rate
- API latency

### Alerts

- Failed transactions > 5%
- API downtime
- Database connection issues
- Low keeper balance
- Unusual volume spikes
- Large price movements

## Troubleshooting

### Program Deployment Fails

```bash
# Check SOL balance
solana balance

# Increase compute units
anchor deploy --provider.cluster devnet -- --max-sign-attempts 100

# Check program size
ls -lh target/deploy/*.so
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
psql $DATABASE_URL

# Reset database
dropdb pudlpudl && createdb pudlpudl
npm run db:setup
```

### Frontend Build Errors

```bash
# Clear cache
rm -rf frontend/.next
rm -rf frontend/node_modules

# Reinstall
cd frontend && npm install

# Check Node version
node --version  # Should be 18+
```

## Upgrade Process

### Program Upgrades

```bash
# Build new version
anchor build

# Test on devnet first
anchor upgrade target/deploy/pudl_factory.so --program-id <PROGRAM_ID>

# For mainnet, use governance proposal
# Submit upgrade proposal with timelock
```

### Database Migrations

```bash
# Create migration
cat > backend/src/db/migrations/001_add_column.sql

# Run migration
psql $DATABASE_URL -f backend/src/db/migrations/001_add_column.sql
```

## Security Notes

- Never commit private keys
- Use hardware wallet for mainnet admin
- Enable 2FA on all services
- Regularly rotate API keys
- Monitor for suspicious activity
- Keep dependencies updated
- Regular security audits

## Support

- Documentation: https://docs.pudlpudl.com
- Discord: https://discord.gg/pudlpudl
- Twitter: @pudlpudl
- Email: security@pudlpudl.com
