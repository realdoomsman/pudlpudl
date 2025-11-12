import express from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Solana connection
const connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com');

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Get all pools
app.get('/api/pools', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             ps.tvl_usd, 
             ps.volume_24h, 
             ps.fee_apr_24h
      FROM pools p
      LEFT JOIN LATERAL (
        SELECT tvl_usd, volume_24h, fee_apr_24h
        FROM pool_stats
        WHERE pool_id = p.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) ps ON true
      WHERE p.is_active = true
      ORDER BY ps.tvl_usd DESC NULLS LAST
      LIMIT 50
    `);
    
    res.json({ pools: result.rows });
  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({ error: 'Failed to fetch pools' });
  }
});

// Get pool details
app.get('/api/pools/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const poolResult = await pool.query(
      'SELECT * FROM pools WHERE address = $1',
      [address]
    );
    
    if (poolResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    const poolData = poolResult.rows[0];
    
    // Get latest stats
    const statsResult = await pool.query(
      `SELECT * FROM pool_stats 
       WHERE pool_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [poolData.id]
    );
    
    // Get recent swaps
    const swapsResult = await pool.query(
      `SELECT * FROM swaps 
       WHERE pool_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 20`,
      [poolData.id]
    );
    
    res.json({
      pool: poolData,
      stats: statsResult.rows[0] || null,
      recentSwaps: swapsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching pool:', error);
    res.status(500).json({ error: 'Failed to fetch pool' });
  }
});

// Get staking stats
app.get('/api/staking/stats', async (req, res) => {
  try {
    const stakesResult = await pool.query(
      'SELECT SUM(amount) as total_staked, COUNT(*) as staker_count FROM stakes'
    );
    
    const buybacksResult = await pool.query(
      `SELECT SUM(to_stakers) as total_rewards 
       FROM buybacks 
       WHERE timestamp > NOW() - INTERVAL '7 days'`
    );
    
    const totalStaked = stakesResult.rows[0]?.total_staked || 0;
    const weeklyRewards = buybacksResult.rows[0]?.total_rewards || 0;
    
    // Calculate APR: (weekly rewards * 52 / total staked) * 100
    const apr = totalStaked > 0 
      ? (weeklyRewards * 52 / totalStaked) * 100 
      : 0;
    
    res.json({
      totalStaked,
      stakerCount: stakesResult.rows[0]?.staker_count || 0,
      apr: apr.toFixed(2),
      weeklyRewards,
    });
  } catch (error) {
    console.error('Error fetching staking stats:', error);
    res.status(500).json({ error: 'Failed to fetch staking stats' });
  }
});

// Get user stakes
app.get('/api/staking/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM stakes WHERE user_address = $1',
      [address]
    );
    
    res.json({ stake: result.rows[0] || null });
  } catch (error) {
    console.error('Error fetching user stake:', error);
    res.status(500).json({ error: 'Failed to fetch user stake' });
  }
});

// Get governance proposals
app.get('/api/governance/proposals', async (req, res) => {
  try {
    // In production, query from database
    res.json({ proposals: [] });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌊 PudlPudl API running on port ${PORT}`);
});
