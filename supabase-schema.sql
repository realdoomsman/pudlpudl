-- PUDL Protocol Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  twitter TEXT,
  discord TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows Table
CREATE TABLE IF NOT EXISTS follows (
  follower_address TEXT NOT NULL,
  following_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_address, following_address),
  FOREIGN KEY (follower_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE,
  FOREIGN KEY (following_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE
);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  from_token TEXT NOT NULL,
  to_token TEXT NOT NULL,
  from_amount NUMERIC NOT NULL,
  to_amount NUMERIC NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price_impact NUMERIC DEFAULT 0,
  slippage NUMERIC DEFAULT 0,
  FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE
);

-- Pool Activities Table
CREATE TABLE IF NOT EXISTS pool_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('add_liquidity', 'remove_liquidity', 'swap')),
  token_a TEXT NOT NULL,
  token_b TEXT NOT NULL,
  amount_a NUMERIC NOT NULL,
  amount_b NUMERIC NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_address);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_address);
CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_tx ON trades(tx_signature);
CREATE INDEX IF NOT EXISTS idx_pool_activities_pool ON pool_activities(pool_address);
CREATE INDEX IF NOT EXISTS idx_pool_activities_wallet ON pool_activities(wallet_address);
CREATE INDEX IF NOT EXISTS idx_pool_activities_timestamp ON pool_activities(timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read, authenticated write

-- User Profiles: Anyone can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (true);

-- Follows: Anyone can read, users can manage their own follows
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  USING (true);

-- Trades: Anyone can read, authenticated users can insert
CREATE POLICY "Trades are viewable by everyone"
  ON trades FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can record trades"
  ON trades FOR INSERT
  WITH CHECK (true);

-- Pool Activities: Anyone can read, authenticated users can insert
CREATE POLICY "Pool activities are viewable by everyone"
  ON pool_activities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can record pool activities"
  ON pool_activities FOR INSERT
  WITH CHECK (true);

-- Create a view for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  wallet_address,
  COUNT(*) as trade_count,
  SUM(from_amount) as total_volume,
  AVG(price_impact) as avg_price_impact
FROM trades
GROUP BY wallet_address
ORDER BY total_volume DESC;

-- Grant access to the view
GRANT SELECT ON leaderboard TO anon, authenticated;

-- Insert some sample data (optional - remove in production)
-- INSERT INTO user_profiles (wallet_address, display_name) VALUES
--   ('DemoWallet1...', 'Demo User 1'),
--   ('DemoWallet2...', 'Demo User 2');
