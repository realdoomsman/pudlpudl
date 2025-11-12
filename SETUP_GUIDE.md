# Quick Setup Guide - Get PUDL Running in 30 Minutes

## Step 1: Get API Keys (10 minutes)

### Helius (Required - Free)
1. Go to https://helius.dev
2. Sign up with GitHub
3. Create new project "PUDL Protocol"
4. Copy API key
5. Add to `.env.local`:
```
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY
```

### Supabase (Required - Free)
1. Go to https://supabase.com
2. Create new project "pudl-protocol"
3. Go to Settings → API
4. Copy URL and anon key
5. Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Step 2: Install Dependencies (2 minutes)

```bash
cd frontend
npm install @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets
npm install @supabase/supabase-js
npm install @upstash/redis (optional)
```

## Step 3: Configure Environment (3 minutes)

Create `frontend/.env.local`:
```bash
# Solana RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_HELIUS_KEY
NEXT_PUBLIC_SOLANA_WSS_URL=wss://rpc.helius.xyz/?api-key=YOUR_HELIUS_KEY

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Set Up Database (5 minutes)

Go to Supabase SQL Editor and run:

```sql
-- User profiles
CREATE TABLE user_profiles (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social follows
CREATE TABLE follows (
  follower_address TEXT,
  following_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_address, following_address)
);

-- Trade history
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  from_token TEXT NOT NULL,
  to_token TEXT NOT NULL,
  from_amount NUMERIC NOT NULL,
  to_amount NUMERIC NOT NULL,
  tx_signature TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Referrals
CREATE TABLE referrals (
  referrer_address TEXT NOT NULL,
  referred_address TEXT NOT NULL,
  tx_signature TEXT NOT NULL,
  fee_earned NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies (allow read for all, write for authenticated)
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');
```

## Step 5: Run Development Server (1 minute)

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000

## Step 6: Test Functionality (5 minutes)

1. Connect wallet (Phantom/Solflare)
2. Try swap interface
3. Check balance display
4. Test slippage settings
5. Generate referral link

## Step 7: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → Add all from .env.local
```

## Done! 🎉

Your PUDL protocol is now live!

## Optional Enhancements

### Add Birdeye for Charts ($99/mo)
```bash
BIRDEYE_API_KEY=your_key
```

### Add Redis Caching (Free tier)
1. Go to https://upstash.com
2. Create Redis database
3. Add to `.env.local`:
```
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=your_token
```

### Add Error Tracking (Free tier)
1. Go to https://sentry.io
2. Create project
3. Add to `.env.local`:
```
SENTRY_DSN=your_dsn
```

## Troubleshooting

### "Cannot connect to RPC"
- Check Helius API key is correct
- Verify `.env.local` is in `frontend/` directory
- Restart dev server

### "Wallet not connecting"
- Install Phantom or Solflare wallet
- Check browser console for errors
- Try different wallet

### "Database error"
- Verify Supabase URL and key
- Check SQL tables were created
- Review Supabase logs

## Need Help?

- Check API_REQUIREMENTS.md for detailed docs
- Review frontend/lib/* for implementation examples
- Open GitHub issue for bugs
