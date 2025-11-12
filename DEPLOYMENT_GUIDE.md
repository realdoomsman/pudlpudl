# PUDL Protocol Deployment Guide

## Prerequisites

### 1. Install Solana CLI (with build tools)

The Homebrew version doesn't include build tools. Install the official version:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH (add this to your ~/.zshrc or ~/.bashrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Reload shell
source ~/.zshrc  # or source ~/.bashrc

# Verify installation
solana --version
cargo build-sbf --version
```

### 2. Install Anchor CLI (if not already installed)

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
anchor --version
```

### 3. Setup Wallet

```bash
# Generate new keypair (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# Check your address
solana address

# Check balance
solana balance
```

## Devnet Deployment

### Step 1: Configure for Devnet

```bash
# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Verify configuration
solana config get

# Airdrop SOL for deployment (repeat if needed)
solana airdrop 2
solana airdrop 2
```

### Step 2: Build Programs

```bash
# Clean previous builds
anchor clean

# Build all programs
anchor build

# This creates:
# - target/deploy/*.so (program binaries)
# - target/idl/*.json (IDL files)
# - target/deploy/*-keypair.json (program keypairs)
```

### Step 3: Deploy Programs

```bash
# Deploy all programs to devnet
anchor deploy

# Or deploy individually:
anchor deploy --program-name pudl_factory
anchor deploy --program-name pudl_pool
anchor deploy --program-name pudl_staking
anchor deploy --program-name pudl_treasury
anchor deploy --program-name pudl_router
anchor deploy --program-name pudl_governance
```

### Step 4: Get Program IDs

```bash
# Display all deployed program IDs
echo "Factory: $(solana address -k target/deploy/pudl_factory-keypair.json)"
echo "Pool: $(solana address -k target/deploy/pudl_pool-keypair.json)"
echo "Staking: $(solana address -k target/deploy/pudl_staking-keypair.json)"
echo "Treasury: $(solana address -k target/deploy/pudl_treasury-keypair.json)"
echo "Router: $(solana address -k target/deploy/pudl_router-keypair.json)"
echo "Governance: $(solana address -k target/deploy/pudl_governance-keypair.json)"
```

### Step 5: Initialize Programs

```bash
# Run initialization script
ts-node scripts/initialize-programs.ts

# This will:
# 1. Create $PUDL token
# 2. Initialize all programs
# 3. Save configuration to deployment-config.json
# 4. Update frontend/.env.local
```

### Step 6: Verify Deployment

```bash
# Check program accounts
solana program show <PROGRAM_ID>

# View program logs
solana logs <PROGRAM_ID>

# Test with Anchor
anchor test --skip-local-validator
```

## Mainnet Deployment

### ⚠️ WARNING: Mainnet deployment costs real SOL!

**Estimated Cost:** 6-10 SOL (~$1,000-1,500)

### Step 1: Prepare Mainnet Wallet

```bash
# Make sure you have enough SOL
solana config set --url https://api.mainnet-beta.solana.com
solana balance

# You need at least 10 SOL for deployment
```

### Step 2: Update Anchor.toml

Add mainnet configuration:

```toml
[programs.mainnet]
pudl_factory = "YOUR_MAINNET_FACTORY_ID"
pudl_pool = "YOUR_MAINNET_POOL_ID"
pudl_staking = "YOUR_MAINNET_STAKING_ID"
pudl_treasury = "YOUR_MAINNET_TREASURY_ID"
pudl_router = "YOUR_MAINNET_ROUTER_ID"
pudl_governance = "YOUR_MAINNET_GOVERNANCE_ID"
```

### Step 3: Deploy to Mainnet

```bash
# Set cluster to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Build programs
anchor build

# Deploy (COSTS REAL SOL!)
anchor deploy

# Initialize programs
ts-node scripts/initialize-programs.ts
```

### Step 4: Update Frontend

```bash
# Update frontend/.env.production
cd frontend
cp .env.local .env.production

# Edit .env.production with mainnet values
# NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
# NEXT_PUBLIC_PUDL_MINT=<YOUR_MAINNET_PUDL_MINT>
# etc...

# Deploy to Vercel
vercel --prod
```

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
anchor clean
rm -rf target
anchor build
```

### Deployment Fails

```bash
# Check balance
solana balance

# Airdrop more SOL (devnet only)
solana airdrop 2

# Check program size
ls -lh target/deploy/*.so

# Increase compute units if needed
# Add to Anchor.toml:
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

### Program Already Deployed

```bash
# Upgrade existing program
anchor upgrade target/deploy/pudl_factory.so --program-id <PROGRAM_ID>
```

### "build-sbf" Command Not Found

This means Solana CLI wasn't installed with build tools. Reinstall:

```bash
# Remove Homebrew version if installed
brew uninstall solana

# Install official version
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

## Post-Deployment Checklist

- [ ] All 6 programs deployed successfully
- [ ] $PUDL token created with metadata
- [ ] All programs initialized
- [ ] Configuration saved to deployment-config.json
- [ ] Frontend .env updated
- [ ] Test pool creation works
- [ ] Test liquidity addition works
- [ ] Test swaps work
- [ ] Test staking works
- [ ] Frontend deployed to Vercel
- [ ] DNS configured (if custom domain)
- [ ] Monitoring set up
- [ ] Documentation published

## Quick Commands Reference

```bash
# Check Solana config
solana config get

# Check balance
solana balance

# Airdrop (devnet only)
solana airdrop 2

# Build programs
anchor build

# Deploy programs
anchor deploy

# Get program ID
solana address -k target/deploy/pudl_factory-keypair.json

# View program
solana program show <PROGRAM_ID>

# View logs
solana logs <PROGRAM_ID>

# Upgrade program
anchor upgrade target/deploy/pudl_factory.so --program-id <PROGRAM_ID>
```

## Support

If you encounter issues:

1. Check Anchor docs: https://www.anchor-lang.com/
2. Check Solana docs: https://docs.solana.com/
3. Join Solana Discord: https://discord.gg/solana
4. Join Anchor Discord: https://discord.gg/anchor

## Security Recommendations

Before mainnet deployment:

1. **Audit**: Get programs audited by a reputable firm
2. **Testing**: Extensive testing on devnet
3. **Multisig**: Use multisig for admin/authority keys
4. **Monitoring**: Set up monitoring and alerts
5. **Gradual Launch**: Start with limited parameters
6. **Bug Bounty**: Consider a bug bounty program

## Next Steps After Deployment

1. Create initial liquidity pools (SOL/USDC, SOL/PUDL)
2. Provide initial liquidity
3. Test all features thoroughly
4. Launch marketing campaign
5. Onboard users
6. Monitor and iterate
