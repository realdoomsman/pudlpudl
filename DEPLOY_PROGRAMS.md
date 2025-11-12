# Deploy PUDL Anchor Programs

## Prerequisites

### 1. Install Anchor
```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 2. Install Solana CLI
```bash
# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

### 3. Setup Wallet
```bash
# Generate a new keypair (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# Check your address
solana address

# Get your public key
solana-keygen pubkey ~/.config/solana/id.json
```

## Deploy to Devnet

### 1. Configure for Devnet
```bash
# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Verify configuration
solana config get
```

### 2. Fund Your Wallet
```bash
# Airdrop SOL for deployment (devnet only)
solana airdrop 2

# Check balance
solana balance
```

### 3. Build Programs
```bash
# Build all programs
anchor build

# This will create:
# - target/deploy/*.so (program binaries)
# - target/idl/*.json (IDL files)
```

### 4. Deploy Programs
```bash
# Deploy all programs to devnet
anchor deploy

# Or deploy individually:
anchor deploy --program-name pudl_factory
anchor deploy --program-name pudl_pool
anchor deploy --program-name pudl_staking
```

### 5. Get Program IDs
```bash
# After deployment, get the program IDs
solana address -k target/deploy/pudl_factory-keypair.json
solana address -k target/deploy/pudl_pool-keypair.json
solana address -k target/deploy/pudl_staking-keypair.json
```

### 6. Update Frontend
Update `frontend/lib/pudl-sdk.ts` with your deployed program IDs:

```typescript
export const PROGRAM_IDS = {
  factory: new PublicKey('YOUR_FACTORY_PROGRAM_ID'),
  pool: new PublicKey('YOUR_POOL_PROGRAM_ID'),
  staking: new PublicKey('YOUR_STAKING_PROGRAM_ID'),
  // ... other programs
};
```

## Deploy to Mainnet

### 1. Configure for Mainnet
```bash
# Set cluster to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# IMPORTANT: Make sure you have enough SOL for deployment
# Each program costs ~2-5 SOL to deploy
solana balance
```

### 2. Deploy
```bash
# Deploy to mainnet (COSTS REAL SOL!)
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

### 3. Update Anchor.toml
Update `Anchor.toml` with mainnet program IDs:

```toml
[programs.mainnet]
pudl_factory = "YOUR_MAINNET_FACTORY_ID"
pudl_pool = "YOUR_MAINNET_POOL_ID"
pudl_staking = "YOUR_MAINNET_STAKING_ID"
```

## Verify Deployment

### Check Program Account
```bash
# Verify program is deployed
solana program show <PROGRAM_ID>

# Check program size
solana program show <PROGRAM_ID> --programs
```

### Test Program
```bash
# Run tests against deployed program
anchor test --skip-local-validator
```

## Upgrade Programs

### Build New Version
```bash
# Build updated program
anchor build
```

### Upgrade
```bash
# Upgrade existing program
anchor upgrade target/deploy/pudl_factory.so --program-id <PROGRAM_ID>
```

## Troubleshooting

### Not Enough SOL
```bash
# Check balance
solana balance

# For devnet, airdrop more
solana airdrop 2

# For mainnet, transfer SOL to your wallet
```

### Build Errors
```bash
# Clean and rebuild
anchor clean
anchor build
```

### Deployment Fails
```bash
# Check logs
solana logs

# Increase compute units if needed
# Add to Anchor.toml:
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[programs.devnet]
# ... your programs
```

## Quick Deploy Script

Create `deploy.sh`:
```bash
#!/bin/bash

echo "Building programs..."
anchor build

echo "Deploying to devnet..."
anchor deploy

echo "Getting program IDs..."
echo "Factory: $(solana address -k target/deploy/pudl_factory-keypair.json)"
echo "Pool: $(solana address -k target/deploy/pudl_pool-keypair.json)"
echo "Staking: $(solana address -k target/deploy/pudl_staking-keypair.json)"

echo "Done! Update frontend/lib/pudl-sdk.ts with these IDs"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## After Deployment

1. ✅ Update program IDs in `frontend/lib/pudl-sdk.ts`
2. ✅ Update `Anchor.toml` with deployed IDs
3. ✅ Test pool creation on devnet
4. ✅ Test staking on devnet
5. ✅ Deploy frontend to Vercel
6. ✅ Announce launch!

## Cost Estimate

**Devnet**: FREE (use airdrops)
**Mainnet**: 
- Factory program: ~2-3 SOL
- Pool program: ~2-3 SOL
- Staking program: ~2-3 SOL
- Total: ~6-10 SOL (~$1000 at current prices)

## Support

If you encounter issues:
1. Check Anchor docs: https://www.anchor-lang.com/
2. Solana docs: https://docs.solana.com/
3. Discord: Anchor/Solana communities
