-- PudlPudl Database Schema

CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    mint VARCHAR(44) UNIQUE NOT NULL,
    symbol VARCHAR(10),
    decimals INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pools (
    id SERIAL PRIMARY KEY,
    address VARCHAR(44) UNIQUE NOT NULL,
    base_mint VARCHAR(44) REFERENCES tokens(mint),
    quote_mint VARCHAR(44) REFERENCES tokens(mint),
    creator VARCHAR(44),
    fee_bps INT,
    bin_step INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    INDEX idx_mints (base_mint, quote_mint)
);

CREATE TABLE IF NOT EXISTS pool_stats (
    pool_id INT REFERENCES pools(id),
    timestamp TIMESTAMP,
    tvl_usd NUMERIC,
    volume_24h NUMERIC,
    fee_apr_24h NUMERIC,
    PRIMARY KEY (pool_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_pool_stats_time ON pool_stats(pool_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS swaps (
    id SERIAL PRIMARY KEY,
    pool_id INT REFERENCES pools(id),
    timestamp TIMESTAMP,
    trader VARCHAR(44),
    in_mint VARCHAR(44),
    in_amount BIGINT,
    out_mint VARCHAR(44),
    out_amount BIGINT,
    fee_paid BIGINT
);

CREATE INDEX IF NOT EXISTS idx_swaps_pool_time ON swaps(pool_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_swaps_trader ON swaps(trader);

CREATE TABLE IF NOT EXISTS fees (
    id SERIAL PRIMARY KEY,
    pool_id INT REFERENCES pools(id),
    timestamp TIMESTAMP,
    mint VARCHAR(44),
    amount BIGINT
);

CREATE TABLE IF NOT EXISTS buybacks (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP,
    in_mint VARCHAR(44),
    in_amount BIGINT,
    pudl_out BIGINT,
    burned BIGINT,
    to_stakers BIGINT,
    to_ops BIGINT
);

CREATE TABLE IF NOT EXISTS stakes (
    user_address VARCHAR(44) PRIMARY KEY,
    amount BIGINT,
    tier INT,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    proposal_address VARCHAR(44) UNIQUE NOT NULL,
    proposer VARCHAR(44),
    target_program VARCHAR(44),
    description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    votes_for BIGINT DEFAULT 0,
    votes_against BIGINT DEFAULT 0,
    executed BOOLEAN DEFAULT false
);
