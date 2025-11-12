#!/bin/bash

# PUDL Protocol - Solana Setup Script
# This script installs Solana CLI with build tools

set -e

echo "🚀 PUDL Protocol - Solana Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Solana is already installed
if command -v solana &> /dev/null; then
    CURRENT_VERSION=$(solana --version | awk '{print $2}')
    echo -e "${YELLOW}⚠️  Solana CLI already installed: $CURRENT_VERSION${NC}"
    echo ""
    read -p "Do you want to reinstall? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping Solana installation..."
    else
        echo "Reinstalling Solana..."
        sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    fi
else
    echo "📦 Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
fi

# Add to PATH
echo ""
echo "📝 Setting up PATH..."
SOLANA_PATH='export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"'

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.profile"
fi

# Add to shell config if not already there
if ! grep -q "solana/install/active_release/bin" "$SHELL_RC" 2>/dev/null; then
    echo "$SOLANA_PATH" >> "$SHELL_RC"
    echo -e "${GREEN}✅ Added Solana to PATH in $SHELL_RC${NC}"
else
    echo -e "${GREEN}✅ Solana already in PATH${NC}"
fi

# Source the PATH for current session
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
echo ""
echo "🔍 Verifying installation..."
if command -v solana &> /dev/null; then
    SOLANA_VERSION=$(solana --version)
    echo -e "${GREEN}✅ Solana CLI: $SOLANA_VERSION${NC}"
else
    echo -e "${RED}❌ Solana CLI not found. Please restart your terminal and try again.${NC}"
    exit 1
fi

# Check for build tools
if command -v cargo-build-sbf &> /dev/null; then
    echo -e "${GREEN}✅ Build tools: cargo-build-sbf installed${NC}"
else
    echo -e "${YELLOW}⚠️  Build tools not found. They should be in:${NC}"
    echo "   $HOME/.local/share/solana/install/active_release/bin/"
fi

# Setup Solana config
echo ""
echo "⚙️  Configuring Solana..."

# Check if config exists
if [ ! -f "$HOME/.config/solana/id.json" ]; then
    echo "No wallet found. Creating new keypair..."
    mkdir -p "$HOME/.config/solana"
    solana-keygen new --outfile "$HOME/.config/solana/id.json" --no-bip39-passphrase
    echo -e "${GREEN}✅ New wallet created${NC}"
else
    echo -e "${GREEN}✅ Wallet already exists${NC}"
fi

# Set to devnet by default
echo "Setting cluster to devnet..."
solana config set --url https://api.devnet.solana.com

# Display config
echo ""
echo "📋 Current Solana Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
solana config get
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get wallet address
WALLET_ADDRESS=$(solana address)
echo ""
echo "💼 Your Wallet Address:"
echo "   $WALLET_ADDRESS"

# Check balance
BALANCE=$(solana balance)
echo ""
echo "💰 Current Balance: $BALANCE"

# Offer to airdrop
if [[ $BALANCE == "0 SOL" ]]; then
    echo ""
    read -p "Would you like to airdrop 2 SOL for testing? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Requesting airdrop..."
        solana airdrop 2
        echo -e "${GREEN}✅ Airdrop complete!${NC}"
        echo "New balance: $(solana balance)"
    fi
fi

# Check Anchor
echo ""
echo "🔍 Checking Anchor CLI..."
if command -v anchor &> /dev/null; then
    ANCHOR_VERSION=$(anchor --version)
    echo -e "${GREEN}✅ Anchor CLI: $ANCHOR_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Anchor CLI not found${NC}"
    echo ""
    read -p "Would you like to install Anchor CLI? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Anchor CLI..."
        cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
        avm install latest
        avm use latest
        echo -e "${GREEN}✅ Anchor CLI installed${NC}"
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Next steps:"
echo "   1. Restart your terminal (or run: source $SHELL_RC)"
echo "   2. Run: anchor build"
echo "   3. Run: anchor deploy"
echo "   4. Run: ts-node scripts/initialize-programs.ts"
echo ""
echo "📚 Documentation:"
echo "   - DEPLOYMENT_GUIDE.md - Detailed deployment instructions"
echo "   - NEXT_STEPS.md - What to do next"
echo "   - PROJECT_STATUS.md - Current project status"
echo ""
echo "💡 Quick commands:"
echo "   solana balance          - Check your balance"
echo "   solana airdrop 2        - Get more SOL (devnet only)"
echo "   anchor build            - Build programs"
echo "   anchor deploy           - Deploy programs"
echo "   anchor test             - Run tests"
echo ""
echo -e "${GREEN}Happy building! 🚀${NC}"
