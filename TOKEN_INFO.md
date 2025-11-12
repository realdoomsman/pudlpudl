# PUDL Token Information

## Contract Address (CA)
```
So11111111111111111111111111111111111111112
```
*Currently using SOL mint as placeholder. Replace with your actual PUDL token mint address.*

## Token Details
- **Symbol**: PUDL
- **Name**: PUDL Token
- **Decimals**: 9
- **Total Supply**: 1,000,000,000 (1 billion)
- **Network**: Solana

## How to Deploy Your Token

### Option 1: Using Solana CLI
```bash
# Create a new token
spl-token create-token --decimals 9

# Create token account
spl-token create-account <TOKEN_MINT_ADDRESS>

# Mint initial supply
spl-token mint <TOKEN_MINT_ADDRESS> 1000000000
```

### Option 2: Using Token Extensions
```bash
# With metadata extension
spl-token create-token \
  --decimals 9 \
  --enable-metadata

# Add metadata
spl-token initialize-metadata \
  <TOKEN_MINT_ADDRESS> \
  "PUDL Token" \
  "PUDL" \
  "https://pudlpudl.vercel.app/pudl-logo.png"
```

### Option 3: Using pump.fun or other token launchers
1. Visit pump.fun or similar platform
2. Create token with PUDL details
3. Copy the contract address
4. Update `frontend/lib/pudlToken.ts` with the CA

## After Deployment

1. **Update the mint address** in `frontend/lib/pudlToken.ts`:
   ```typescript
   mintAddress: 'YOUR_ACTUAL_TOKEN_MINT_ADDRESS',
   ```

2. **Add token logo** to `frontend/public/pudl-logo.png`

3. **Update social links** in `frontend/lib/pudlToken.ts` if needed

4. **Test on devnet first** before mainnet deployment

5. **Commit and push** changes to deploy to Vercel

## Token Distribution (Example)
- 40% - Liquidity Pools
- 20% - Staking Rewards
- 15% - Team (vested)
- 15% - Treasury
- 10% - Community Airdrop

## Important Addresses
- **Token Mint**: `YOUR_PUDL_TOKEN_MINT_ADDRESS_HERE`
- **Treasury**: `YOUR_TREASURY_ADDRESS_HERE`
- **Staking Program**: `YOUR_STAKING_PROGRAM_ID_HERE`
- **Factory Program**: `YOUR_FACTORY_PROGRAM_ID_HERE`
