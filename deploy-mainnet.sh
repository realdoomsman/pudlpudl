#!/bin/bash

set -e

echo "🚀 PUDL Protocol - MAINNET Deployment"
echo "======================================"
echo ""
echo "⚠️  WARNING: This will deploy to MAINNET and cost REAL SOL!"
echo ""
echo "Estimated costs:"
echo "  - Factory program: ~1-2 SOL"
echo "  - Pool program: ~1-2 SOL"
echo "  - Staking program: ~1-2 SOL"
echo "  - Total: ~3-6 SOL (~\$500-1000)"
echo ""

# Check wallet balance
WALLET_ADDRESS=$(solana-keygen pubkey ~/.config/solana/id.json)
echo "💼 Wallet: $WALLET_ADDRESS"

# Configure for mainnet
solana config set --url https://api.mainnet-beta.solana.com

BALANCE=$(solana balance | awk '{print $1}')
echo "💰 Current balance: $BALANCE SOL"
echo ""

if (( $(echo "$BALANCE < 6" | bc -l) )); then
    echo "❌ Insufficient balance!"
    echo "   You need at least 6 SOL for deployment"
    echo "   Current balance: $BALANCE SOL"
    echo ""
    echo "Please send SOL to: $WALLET_ADDRESS"
    exit 1
fi

read -p "Continue with mainnet deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "🔨 Building programs..."
anchor build

echo ""
echo "🚀 Deploying to MAINNET..."
echo "This will take a few minutes and cost real SOL..."
echo ""

# Deploy programs
anchor deploy --provider.cluster mainnet

# Get program IDs
echo ""
echo "📋 Mainnet Program IDs:"
echo "======================="

FACTORY_ID=$(solana address -k target/deploy/pudl_factory-keypair.json)
POOL_ID=$(solana address -k target/deploy/pudl_pool-keypair.json)
STAKING_ID=$(solana address -k target/deploy/pudl_staking-keypair.json)
TREASURY_ID=$(solana address -k target/deploy/pudl_treasury-keypair.json 2>/dev/null || echo "")
ROUTER_ID=$(solana address -k target/deploy/pudl_router-keypair.json 2>/dev/null || echo "")
GOVERNANCE_ID=$(solana address -k target/deploy/pudl_governance-keypair.json 2>/dev/null || echo "")

echo "Factory:    $FACTORY_ID"
echo "Pool:       $POOL_ID"
echo "Staking:    $STAKING_ID"
[ ! -z "$TREASURY_ID" ] && echo "Treasury:   $TREASURY_ID"
[ ! -z "$ROUTER_ID" ] && echo "Router:     $ROUTER_ID"
[ ! -z "$GOVERNANCE_ID" ] && echo "Governance: $GOVERNANCE_ID"

# Update frontend for mainnet
echo ""
echo "📝 Updating frontend for MAINNET..."

cat > frontend/lib/program-ids.ts << EOF
// MAINNET Program IDs
import { PublicKey } from '@solana/web3.js';

export const PROGRAM_IDS = {
  factory: new PublicKey('$FACTORY_ID'),
  pool: new PublicKey('$POOL_ID'),
  staking: new PublicKey('$STAKING_ID'),
  treasury: new PublicKey('${TREASURY_ID:-Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnV}'),
  router: new PublicKey('${ROUTER_ID:-Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnW}'),
  governance: new PublicKey('${GOVERNANCE_ID:-Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnX}'),
};

export const CLUSTER = 'mainnet-beta';
EOF

# Update Anchor.toml
echo ""
echo "📝 Updating Anchor.toml..."

cat >> Anchor.toml << EOF

[programs.mainnet]
pudl_factory = "$FACTORY_ID"
pudl_pool = "$POOL_ID"
pudl_staking = "$STAKING_ID"
EOF

[ ! -z "$TREASURY_ID" ] && echo "pudl_treasury = \"$TREASURY_ID\"" >> Anchor.toml
[ ! -z "$ROUTER_ID" ] && echo "pudl_router = \"$ROUTER_ID\"" >> Anchor.toml
[ ! -z "$GOVERNANCE_ID" ] && echo "pudl_governance = \"$GOVERNANCE_ID\"" >> Anchor.toml

# Check final balance
FINAL_BALANCE=$(solana balance | awk '{print $1}')
COST=$(echo "$BALANCE - $FINAL_BALANCE" | bc)

echo ""
echo "✅ MAINNET Deployment Complete!"
echo "================================"
echo ""
echo "💸 Deployment cost: $COST SOL (~\$$(echo "$COST * 165" | bc) USD)"
echo "💰 Remaining balance: $FINAL_BALANCE SOL"
echo ""
echo "🔗 View your programs:"
echo "   Factory: https://explorer.solana.com/address/$FACTORY_ID"
echo "   Pool: https://explorer.solana.com/address/$POOL_ID"
echo "   Staking: https://explorer.solana.com/address/$STAKING_ID"
echo ""
echo "📝 Next steps:"
echo "1. Commit and push changes: git add -A && git commit -m 'Deploy to mainnet' && git push"
echo "2. Test pool creation on mainnet"
echo "3. Announce launch! 🎉"
