# PudlPudl Testing Guide

## Overview

This guide covers testing strategies for all components of the PudlPudl protocol.

## Smart Contract Tests

### Setup

```bash
# Install dependencies
npm install

# Build programs
anchor build
```

### Running Tests

```bash
# Run all tests
anchor test

# Run specific test file
anchor test --skip-build tests/factory.ts

# Run with logs
anchor test -- --features "test-bpf"
```

### Test Structure

```
tests/
├── factory.test.ts       # Pool creation, bonding
├── dlmm.test.ts          # Liquidity, swaps
├── treasury.test.ts      # Fee collection, buyback
├── staking.test.ts       # Stake, rewards, tiers
├── router.test.ts        # Swap routing
├── governance.test.ts    # Proposals, voting
└── integration.test.ts   # End-to-end flows
```

### Example Test Cases

#### Factory Tests

```typescript
describe('Factory', () => {
  it('initializes factory with correct parameters', async () => {
    // Test factory initialization
  });

  it('creates pool with valid bond', async () => {
    // Test pool creation
  });

  it('rejects pool creation with insufficient bond', async () => {
    // Test bond validation
  });

  it('enforces fee bounds', async () => {
    // Test fee validation
  });

  it('prevents duplicate pools', async () => {
    // Test uniqueness check
  });
});
```

#### DLMM Tests

```typescript
describe('DLMM Pool', () => {
  it('adds liquidity to bins', async () => {
    // Test liquidity addition
  });

  it('removes liquidity correctly', async () => {
    // Test liquidity removal
  });

  it('executes swaps with correct output', async () => {
    // Test swap calculation
  });

  it('applies protocol fee', async () => {
    // Test fee split
  });

  it('applies tier discount', async () => {
    // Test staking tier discount
  });

  it('pauses and unpauses', async () => {
    // Test pause mechanism
  });
});
```

#### Treasury Tests

```typescript
describe('Treasury', () => {
  it('records fees from pools', async () => {
    // Test fee recording
  });

  it('harvests and converts fees', async () => {
    // Test buyback mechanism
  });

  it('splits PUDL correctly', async () => {
    // Test burn/stakers/ops split
  });

  it('syncs rewards to staking', async () => {
    // Test reward distribution
  });
});
```

#### Staking Tests

```typescript
describe('Staking', () => {
  it('stakes PUDL and assigns tier', async () => {
    // Test staking
  });

  it('calculates rewards correctly', async () => {
    // Test reward math
  });

  it('claims rewards', async () => {
    // Test reward claiming
  });

  it('unstakes PUDL', async () => {
    // Test unstaking
  });

  it('updates tier on balance change', async () => {
    // Test tier transitions
  });
});
```

### Integration Tests

```typescript
describe('End-to-End', () => {
  it('complete pool lifecycle', async () => {
    // 1. Create pool
    // 2. Add liquidity
    // 3. Execute swaps
    // 4. Verify fees recorded
    // 5. Harvest fees
    // 6. Verify rewards distributed
    // 7. Claim rewards
  });

  it('governance flow', async () => {
    // 1. Stake PUDL
    // 2. Create proposal
    // 3. Vote
    // 4. Execute after timelock
    // 5. Verify parameter changed
  });
});
```

## Backend Tests

### Setup

```bash
cd backend
npm install
npm run test
```

### Test Structure

```
backend/tests/
├── api.test.ts           # API endpoints
├── listener.test.ts      # Event processing
└── db.test.ts            # Database queries
```

### Example Tests

```typescript
describe('API', () => {
  it('GET /api/pools returns pools', async () => {
    const response = await request(app).get('/api/pools');
    expect(response.status).toBe(200);
    expect(response.body.pools).toBeInstanceOf(Array);
  });

  it('GET /api/staking/stats returns stats', async () => {
    const response = await request(app).get('/api/staking/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalStaked');
    expect(response.body).toHaveProperty('apr');
  });
});
```

## Frontend Tests

### Setup

```bash
cd frontend
npm install
npm run test
```

### Test Structure

```
frontend/__tests__/
├── components/
│   ├── WalletProvider.test.tsx
│   └── PoolCard.test.tsx
├── pages/
│   ├── swap.test.tsx
│   ├── create.test.tsx
│   └── stake.test.tsx
└── e2e/
    └── user-flows.test.ts
```

### Component Tests

```typescript
describe('Swap Component', () => {
  it('renders swap interface', () => {
    render(<Swap />);
    expect(screen.getByText('Swap')).toBeInTheDocument();
  });

  it('calculates output amount', () => {
    render(<Swap />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '100' } });
    // Verify output calculation
  });

  it('validates slippage', () => {
    // Test slippage validation
  });
});
```

### E2E Tests (Playwright)

```typescript
test('complete swap flow', async ({ page }) => {
  await page.goto('http://localhost:3000/swap');
  
  // Connect wallet
  await page.click('text=Connect Wallet');
  await page.click('text=Phantom');
  
  // Enter amounts
  await page.fill('[placeholder="0.00"]', '1');
  
  // Execute swap
  await page.click('text=Swap');
  
  // Verify success
  await expect(page.locator('text=Swap successful')).toBeVisible();
});
```

## Load Testing

### Backend Load Test

```bash
# Install k6
brew install k6

# Run load test
k6 run tests/load/api-load.js
```

```javascript
// tests/load/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  let response = http.get('http://localhost:3001/api/pools');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Contract Stress Test

```typescript
describe('Stress Tests', () => {
  it('handles 100 concurrent swaps', async () => {
    const swaps = Array(100).fill(null).map(() => 
      executeSwap(pool, amount)
    );
    await Promise.all(swaps);
    // Verify all succeeded
  });

  it('handles large liquidity operations', async () => {
    // Test with max amounts
  });
});
```

## Security Testing

### Fuzzing

```bash
# Install Honggfuzz
cargo install honggfuzz

# Run fuzzer
cd programs/pudl-factory
cargo hfuzz run factory
```

### Static Analysis

```bash
# Run Anchor verify
anchor verify

# Run Clippy
cargo clippy --all-targets --all-features
```

### Manual Security Checks

- [ ] All arithmetic uses checked operations
- [ ] All PDAs properly validated
- [ ] All CPIs check program IDs
- [ ] No unbounded loops
- [ ] All user inputs validated
- [ ] Access control on privileged functions
- [ ] Token accounting matches vaults
- [ ] No reentrancy vulnerabilities

## Test Coverage

### Generate Coverage Report

```bash
# Rust coverage
cargo tarpaulin --out Html

# TypeScript coverage
npm run test:coverage
```

### Coverage Goals

- Smart contracts: >90%
- Backend: >80%
- Frontend: >70%

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions-rs/toolchain@v1
      - run: anchor test

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm test
```

## Test Data

### Mock Accounts

```typescript
const mockPool = {
  address: 'PoolAddress...',
  baseMint: 'BaseMint...',
  quoteMint: 'QuoteMint...',
  feeBps: 20,
  tvl: 1000000,
};

const mockUser = {
  publicKey: 'UserPublicKey...',
  pudlBalance: 10000,
  stakedAmount: 5000,
  tier: 2,
};
```

### Test Tokens

```bash
# Create test tokens on devnet
spl-token create-token
spl-token create-account <TOKEN>
spl-token mint <TOKEN> 1000000
```

## Debugging

### Enable Logs

```bash
# Solana logs
solana logs --url devnet

# Anchor logs
RUST_LOG=debug anchor test

# Backend logs
DEBUG=* npm run dev
```

### Common Issues

**Test fails with "Account not found"**
- Ensure accounts are initialized
- Check PDA derivation
- Verify program deployed

**Transaction simulation failed**
- Check compute units
- Verify account permissions
- Check token balances

**Timeout errors**
- Increase test timeout
- Check RPC connection
- Verify transaction confirmed

## Best Practices

1. **Write tests first** (TDD approach)
2. **Test edge cases** (zero amounts, max values)
3. **Mock external dependencies** (Jupiter, Pyth)
4. **Use descriptive test names**
5. **Keep tests isolated** (no shared state)
6. **Clean up after tests** (close accounts)
7. **Test error conditions** (not just happy path)
8. **Maintain test data** (fixtures, mocks)
9. **Run tests before commits**
10. **Monitor test performance**

## Resources

- [Anchor Testing Guide](https://www.anchor-lang.com/docs/testing)
- [Solana Program Testing](https://docs.solana.com/developing/test-validator)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
