# Frontend Integration TODO

I've created the foundation for connecting your frontend to the real Solana programs. Here's what's been set up and what still needs to be done:

## ✅ What's Done

1. **Configuration** (`lib/config.ts`)
   - Program IDs from Anchor.toml
   - RPC endpoint configuration
   - Constants (POOL_BOND_AMOUNT, etc.)

2. **Anchor Setup** (`lib/anchor.ts`)
   - Provider initialization
   - Program getters for all contracts

3. **React Hooks** (`lib/hooks/`)
   - `usePools.ts` - Fetch and display pools
   - `useCreatePool.ts` - Create new pools
   - `useSwap.ts` - Execute swaps and get quotes
   - `useStaking.ts` - Stake, unstake, claim rewards

4. **Wallet Provider** (`components/WalletProvider.tsx`)
   - Updated to use configurable RPC endpoint
   - Defaults to localnet for development

## 🚧 What Needs to Be Done

### 1. Generate and Import IDLs

After building your Anchor programs, you need to import the IDLs:

```bash
# Build programs
anchor build

# Copy IDLs to frontend
cp target/idl/*.json frontend/lib/idl/
```

Then import them in your hooks:

```typescript
import FactoryIDL from '../idl/pudl_factory.json'
import { Program } from '@coral-xyz/anchor'

const program = new Program(FactoryIDL as any, PROGRAM_IDS.factory, provider)
```

### 2. Implement Account Deserialization

In each hook, replace the TODO comments with actual account parsing:

```typescript
// Example in usePools.ts
const poolData = accounts.map((account) => {
  const data = program.coder.accounts.decode('Pool', account.account.data)
  return {
    address: account.pubkey.toString(),
    baseMint: data.baseMint.toString(),
    quoteMint: data.quoteMint.toString(),
    feeBps: data.feeBps,
    // ... other fields
  }
})
```

### 3. Build Transactions

Complete the transaction building in:

- **useCreatePool.ts**: Add `createPool` instruction
- **useSwap.ts**: Add `swap` instruction with token account handling
- **useStaking.ts**: Add `stake`, `unstake`, `claimRewards` instructions

Example:

```typescript
const tx = await program.methods
  .createPool(feeBps, binStep)
  .accounts({
    pool: poolPda,
    baseMint,
    quoteMint,
    creator: publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### 4. Update UI Components

Replace mock data with real hooks:

**pools/page.tsx**:
```typescript
import { usePools } from '@/lib/hooks/usePools'

export default function Pools() {
  const { pools, loading, error } = usePools()
  // Use real data instead of mockPools
}
```

**swap/page.tsx**:
```typescript
import { useSwap } from '@/lib/hooks/useSwap'

export default function Swap() {
  const { executeSwap, getQuote, loading } = useSwap()
  // Wire up to UI
}
```

**stake/page.tsx**:
```typescript
import { useStaking } from '@/lib/hooks/useStaking'

export default function Stake() {
  const { stakingInfo, stake, unstake, claimRewards } = useStaking()
  // Wire up to UI
}
```

### 5. Deploy Programs

Before the frontend can work, you need to deploy your programs:

```bash
# Start local validator
solana-test-validator

# Deploy programs
anchor deploy

# Initialize protocol (run your deployment script)
ts-node scripts/deploy.ts
```

### 6. Set Environment Variables

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_RPC_URL=http://localhost:8899
NEXT_PUBLIC_PUDL_MINT=<your_pudl_mint_address>
```

For production:
```bash
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PUDL_MINT=<your_pudl_mint_address>
```

### 7. Handle Token Accounts

You'll need to:
- Get or create Associated Token Accounts (ATAs)
- Handle token approvals
- Check balances before transactions

Use `@solana/spl-token`:

```typescript
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

const ata = await getAssociatedTokenAddress(mint, owner)
const accountInfo = await connection.getAccountInfo(ata)

if (!accountInfo) {
  // Create ATA
  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer,
      ata,
      owner,
      mint
    )
  )
}
```

### 8. Error Handling

Add proper error handling and user feedback:
- Transaction confirmation
- Error messages
- Loading states
- Success notifications

### 9. Testing

Test each feature:
1. Connect wallet
2. Create a pool (requires 1000 PUDL)
3. Add liquidity
4. Execute swaps
5. Stake PUDL
6. Claim rewards

## Next Steps

1. **Deploy your programs locally** - Run `anchor deploy`
2. **Copy IDLs to frontend** - Import them in your hooks
3. **Complete one feature at a time** - Start with pools, then swaps, then staking
4. **Test thoroughly** - Use devnet before mainnet

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token](https://spl.solana.com/token)
- [Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
