# PUDL Protocol - API & Infrastructure Requirements

## Overview
This document outlines all APIs, services, and infrastructure needed to make the PUDL protocol fully functional.

---

## 1. Solana Blockchain Integration

### RPC Providers (Required)
- **Helius** - https://helius.dev
  - Best for: Transaction history, NFTs, webhooks
  - Cost: Free tier available, $50/mo for production
  - Setup: Get API key, use `https://rpc.helius.xyz/?api-key=YOUR_KEY`

- **QuickNode** - https://quicknode.com
  - Best for: High-performance RPC, WebSockets
  - Cost: $49/mo for Solana mainnet
  - Setup: Create endpoint, get WSS and HTTPS URLs

- **Alchemy** - https://alchemy.com/solana
  - Best for: Enhanced APIs, debugging tools
  - Cost: Free tier, $49/mo for production
  - Setup: Create app, get API key

**Recommended**: Use Helius for primary + QuickNode as backup

### What You Need:
```typescript
// .env.local
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY
NEXT_PUBLIC_SOLANA_WSS_URL=wss://rpc.helius.xyz/?api-key=YOUR_KEY
SOLANA_RPC_BACKUP=https://your-quicknode-url.solana-mainnet.quiknode.pro/
```

---

## 2. Price Feeds & Market Data

### Jupiter API (Free, Required)
- **Purpose**: Token prices, swap quotes, routing
- **Endpoint**: https://quote-api.jup.ag/v6
- **Docs**: https://station.jup.ag/docs/apis/swap-api
- **No API key needed**

```typescript
// Get price quote
GET https://quote-api.jup.ag/v6/quote?inputMint=SOL&outputMint=USDC&amount=1000000

// Get token list
GET https://token.jup.ag/all
```

### Birdeye API (Recommended)
- **Purpose**: Historical prices, charts, analytics
- **Cost**: Free tier (100 req/day), $99/mo for 10k req/day
- **Signup**: https://birdeye.so/api
- **Docs**: https://docs.birdeye.so

```typescript
// .env.local
BIRDEYE_API_KEY=your_key_here

// Get token price history
GET https://public-api.birdeye.so/defi/history_price?address=TOKEN_ADDRESS&type=1H
Headers: X-API-KEY: your_key_here
```

### CoinGecko API (Optional)
- **Purpose**: Backup price data, market cap
- **Cost**: Free tier, $129/mo for Pro
- **Docs**: https://www.coingecko.com/en/api

---

## 3. WebSocket Real-Time Data

### Helius WebSocket (Included with RPC)
```typescript
const ws = new WebSocket('wss://rpc.helius.xyz/?api-key=YOUR_KEY')

// Subscribe to account changes
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'accountSubscribe',
  params: [
    'ACCOUNT_ADDRESS',
    { encoding: 'jsonParsed' }
  ]
}))
```

### Pyth Network (Free, Real-time Prices)
- **Purpose**: On-chain price oracles
- **Docs**: https://pyth.network/developers
- **WebSocket**: wss://xc-mainnet.pyth.network/ws

```typescript
// Subscribe to price updates
ws.send(JSON.stringify({
  type: 'subscribe',
  ids: ['PRICE_FEED_ID']
}))
```

---

## 4. Transaction Simulation & Execution

### Built into Solana RPC
```typescript
import { Connection, Transaction } from '@solana/web3.js'

const connection = new Connection(RPC_URL)

// Simulate transaction
const simulation = await connection.simulateTransaction(transaction)

// Send transaction
const signature = await connection.sendTransaction(transaction, [wallet])
```

### Jito MEV Protection (Optional)
- **Purpose**: Protect against MEV, faster execution
- **Cost**: Free, optional tips
- **Docs**: https://jito-labs.gitbook.io
- **RPC**: https://mainnet.block-engine.jito.wtf/api/v1

---

## 5. Token Metadata & Lists

### Jupiter Token List (Free)
```typescript
// Get all verified tokens
GET https://token.jup.ag/all

// Get strict list (most trusted)
GET https://token.jup.ag/strict
```

### Solana Token List (Free)
- **GitHub**: https://github.com/solana-labs/token-list
- **CDN**: https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json

---

## 6. Analytics & Indexing

### Helius DAS API (Included)
- **Purpose**: Token balances, transaction history
- **Docs**: https://docs.helius.dev/compression-and-das-api

```typescript
// Get token accounts
POST https://rpc.helius.xyz/?api-key=YOUR_KEY
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "getAssetsByOwner",
  "params": { "ownerAddress": "WALLET_ADDRESS" }
}
```

### The Graph (Optional)
- **Purpose**: Custom indexing, historical data
- **Cost**: Free tier, pay per query
- **Docs**: https://thegraph.com/docs

---

## 7. Social Features Backend

### Supabase (Recommended)
- **Purpose**: User profiles, follows, leaderboard
- **Cost**: Free tier, $25/mo for production
- **Setup**: https://supabase.com

```sql
-- Database schema
CREATE TABLE user_profiles (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE follows (
  follower_address TEXT,
  following_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_address, following_address)
);

CREATE TABLE trades (
  id UUID PRIMARY KEY,
  wallet_address TEXT,
  from_token TEXT,
  to_token TEXT,
  amount NUMERIC,
  tx_signature TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Alternative: Firebase
- **Cost**: Free tier, pay as you go
- **Docs**: https://firebase.google.com/docs

---

## 8. Notifications & Webhooks

### Helius Webhooks (Included)
- **Purpose**: Transaction notifications, balance changes
- **Setup**: Dashboard → Webhooks → Create

```typescript
// Webhook payload example
{
  "type": "TRANSFER",
  "source": "WALLET_ADDRESS",
  "amount": 1000000,
  "timestamp": 1234567890
}
```

### Push Notifications: OneSignal
- **Cost**: Free for up to 10k subscribers
- **Docs**: https://onesignal.com

---

## 9. File Storage (for avatars, etc.)

### Cloudflare R2 (Recommended)
- **Cost**: $0.015/GB/month, free egress
- **Docs**: https://developers.cloudflare.com/r2

### Alternative: AWS S3
- **Cost**: $0.023/GB/month
- **Docs**: https://aws.amazon.com/s3

---

## 10. Backend API (Your Own)

### Recommended Stack: Next.js API Routes
```typescript
// pages/api/social/follow.ts
export default async function handler(req, res) {
  const { followerAddress, followingAddress } = req.body
  
  // Save to database
  await supabase.from('follows').insert({
    follower_address: followerAddress,
    following_address: followingAddress
  })
  
  res.json({ success: true })
}
```

### Alternative: Separate Backend
- **Node.js + Express**
- **Python + FastAPI**
- **Rust + Actix**

---

## 11. Caching Layer

### Redis (Recommended)
- **Purpose**: Cache prices, balances, reduce API calls
- **Provider**: Upstash (serverless Redis)
- **Cost**: Free tier, $0.20/100k requests
- **Docs**: https://upstash.com

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
})

// Cache price for 30 seconds
await redis.setex(`price:${token}`, 30, price)
```

---

## 12. Monitoring & Analytics

### Sentry (Error Tracking)
- **Cost**: Free tier, $26/mo for team
- **Docs**: https://sentry.io

### Vercel Analytics (If using Vercel)
- **Cost**: Free with Vercel deployment
- **Auto-enabled**

### PostHog (Product Analytics)
- **Cost**: Free tier, $0.00031/event after
- **Docs**: https://posthog.com

---

## Total Monthly Cost Estimate

### Minimal Setup (Free Tier):
- Helius RPC: Free tier
- Jupiter API: Free
- Supabase: Free tier
- Vercel hosting: Free
- **Total: $0/month** (with limitations)

### Production Setup:
- Helius RPC: $50/mo
- Birdeye API: $99/mo
- Supabase: $25/mo
- Vercel Pro: $20/mo
- Upstash Redis: $10/mo
- Sentry: $26/mo
- **Total: ~$230/month**

### Enterprise Setup:
- QuickNode: $299/mo
- Birdeye Pro: $299/mo
- Supabase Pro: $99/mo
- Vercel Enterprise: $150/mo
- **Total: ~$850/month**

---

## Implementation Priority

### Phase 1 (Week 1): Core Functionality
1. ✅ Helius RPC setup
2. ✅ Jupiter API integration
3. ✅ Wallet connection
4. ✅ Basic swap functionality

### Phase 2 (Week 2): Real-time Features
1. ✅ WebSocket price feeds
2. ✅ Balance auto-refresh
3. ✅ Transaction simulation

### Phase 3 (Week 3): Social & Backend
1. ✅ Supabase setup
2. ✅ User profiles
3. ✅ Follow system
4. ✅ Leaderboard

### Phase 4 (Week 4): Polish
1. ✅ Caching layer
2. ✅ Error tracking
3. ✅ Analytics
4. ✅ Performance optimization

---

## Environment Variables Needed

```bash
# .env.local
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY
NEXT_PUBLIC_SOLANA_WSS_URL=wss://rpc.helius.xyz/?api-key=YOUR_KEY

BIRDEYE_API_KEY=your_birdeye_key
HELIUS_API_KEY=your_helius_key

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your_token

SENTRY_DSN=your_sentry_dsn

NEXT_PUBLIC_APP_URL=https://pudl.fi
```

---

## Next Steps

1. **Sign up for Helius** - Get RPC access
2. **Create Supabase project** - Set up database
3. **Integrate Jupiter API** - Real swap quotes
4. **Deploy to Vercel** - Go live
5. **Add monitoring** - Track errors and usage

Want me to implement any specific integration first?
