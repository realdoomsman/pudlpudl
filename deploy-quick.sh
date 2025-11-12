#!/bin/bash

set -e

echo "🚀 PUDL Protocol - Quick Deploy Script"
echo "======================================="
echo ""

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Installing..."
    brew install solana
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor not found. Please install manually:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "   avm install latest"
    echo "   avm use latest"
    exit 1
fi

echo "✅ Tools installed"
echo ""

# Setup wallet if doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "📝 Creating new wallet..."
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
fi

WALLET_ADDRESS=$(solana-keygen pubkey ~/.config/solana/id.json)
echo "💼 Wallet: $WALLET_ADDRESS"
echo ""

# Configure for devnet
echo "🌐 Configuring for devnet..."
solana config set --url https://api.devnet.solana.com

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "💰 Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "💸 Requesting airdrop..."
    solana airdrop 2 || echo "⚠️  Airdrop failed, you may need to wait or use a faucet"
    sleep 2
fi

# Build programs
echo ""
echo "🔨 Building programs..."
anchor build

# Deploy programs
echo ""
echo "🚀 Deploying programs to devnet..."
anchor deploy

# Get program IDs
echo ""
echo "📋 Program IDs:"
echo "==============="

FACTORY_ID=$(solana address -k target/deploy/pudl_factory-keypair.json 2>/dev/null || echo "Not found")
POOL_ID=$(solana address -k target/deploy/pudl_pool-keypair.json 2>/dev/null || echo "Not found")
STAKING_ID=$(solana address -k target/deploy/pudl_staking-keypair.json 2>/dev/null || echo "Not found")
TREASURY_ID=$(solana address -k target/deploy/pudl_treasury-keypair.json 2>/dev/null || echo "Not found")
ROUTER_ID=$(solana address -k target/deploy/pudl_router-keypair.json 2>/dev/null || echo "Not found")
GOVERNANCE_ID=$(solana address -k target/deploy/pudl_governance-keypair.json 2>/dev/null || echo "Not found")

echo "Factory:    $FACTORY_ID"
echo "Pool:       $POOL_ID"
echo "Staking:    $STAKING_ID"
echo "Treasury:   $TREASURY_ID"
echo "Router:     $ROUTER_ID"
echo "Governance: $GOVERNANCE_ID"

# Update frontend SDK
echo ""
echo "📝 Updating frontend SDK..."

cat > frontend/lib/program-ids.ts << EOF
// Auto-generated program IDs from deployment
import { PublicKey } from '@solana/web3.js';

export const PROGRAM_IDS = {
  factory: new PublicKey('$FACTORY_ID'),
  pool: new PublicKey('$POOL_ID'),
  staking: new PublicKey('$STAKING_ID'),
  treasury: new PublicKey('$TREASURY_ID'),
  router: new PublicKey('$ROUTER_ID'),
  governance: new PublicKey('$GOVERNANCE_ID'),
};
EOF

echo "✅ Updated frontend/lib/program-ids.ts"

# Update Anchor.toml
echo ""
echo "📝 Updating Anchor.toml..."

cat >> Anchor.toml << EOF

[programs.devnet]
pudl_factory = "$FACTORY_ID"
pudl_pool = "$POOL_ID"
pudl_staking = "$STAKING_ID"
pudl_treasury = "$TREASURY_ID"
pudl_router = "$ROUTER_ID"
pudl_governance = "$GOVERNANCE_ID"
EOF

echo "✅ Updated Anchor.toml"

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Next steps:"
echo "1. Test pool creation on devnet"
echo "2. Test staking on devnet"
echo "3. Deploy frontend: git push"
echo ""
echo "View your programs:"
echo "https://explorer.solana.com/address/$FACTORY_ID?cluster=devnet"
