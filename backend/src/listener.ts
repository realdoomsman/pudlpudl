import { Connection, PublicKey } from '@solana/web3.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const FACTORY_PROGRAM_ID = new PublicKey(process.env.FACTORY_ADDRESS || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const DLMM_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT');
const TREASURY_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnV');

async function handlePoolCreated(event: any) {
  try {
    await pool.query(
      `INSERT INTO pools (address, base_mint, quote_mint, creator, fee_bps, bin_step, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (address) DO NOTHING`,
      [
        event.pool.toString(),
        event.baseMint.toString(),
        event.quoteMint.toString(),
        event.creator.toString(),
        event.feeBps,
        event.binStep,
      ]
    );
    console.log(`✅ Pool created: ${event.pool.toString()}`);
  } catch (error) {
    console.error('Error handling PoolCreated:', error);
  }
}

async function handleSwapExecuted(event: any) {
  try {
    const poolResult = await pool.query(
      'SELECT id FROM pools WHERE address = $1',
      [event.pool.toString()]
    );
    
    if (poolResult.rows.length === 0) return;
    
    const poolId = poolResult.rows[0].id;
    
    await pool.query(
      `INSERT INTO swaps (pool_id, timestamp, trader, in_mint, in_amount, out_mint, out_amount, fee_paid)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)`,
      [
        poolId,
        event.user.toString(),
        event.inMint.toString(),
        event.inAmount.toString(),
        event.outMint.toString(),
        event.outAmount.toString(),
        event.protocolFee.toString(),
      ]
    );
    
    console.log(`💱 Swap executed on pool ${event.pool.toString()}`);
  } catch (error) {
    console.error('Error handling SwapExecuted:', error);
  }
}

async function handleFeeRecorded(event: any) {
  try {
    const poolResult = await pool.query(
      'SELECT id FROM pools WHERE address = $1',
      [event.pool.toString()]
    );
    
    if (poolResult.rows.length === 0) return;
    
    const poolId = poolResult.rows[0].id;
    
    await pool.query(
      `INSERT INTO fees (pool_id, timestamp, mint, amount)
       VALUES ($1, NOW(), $2, $3)`,
      [poolId, event.mint.toString(), event.amount.toString()]
    );
    
    console.log(`💰 Fee recorded: ${event.amount} from pool ${event.pool.toString()}`);
  } catch (error) {
    console.error('Error handling FeeRecorded:', error);
  }
}

async function handleHarvested(event: any) {
  try {
    await pool.query(
      `INSERT INTO buybacks (timestamp, in_mint, in_amount, pudl_out, burned, to_stakers, to_ops)
       VALUES (NOW(), $1, $2, $3, $4, $5, $6)`,
      [
        'SOL', // Simplified
        event.totalIn.toString(),
        event.pudlOut.toString(),
        event.burned.toString(),
        event.toStakers.toString(),
        event.toOps.toString(),
      ]
    );
    
    console.log(`🔥 Harvested: ${event.pudlOut} PUDL (${event.burned} burned)`);
  } catch (error) {
    console.error('Error handling Harvested:', error);
  }
}

async function startListener() {
  console.log('🎧 Starting event listener...');
  
  // In production, use Helius webhooks or WebSocket subscriptions
  // This is a simplified polling approach
  
  setInterval(async () => {
    try {
      // Poll for new events
      console.log('Polling for events...');
    } catch (error) {
      console.error('Error polling events:', error);
    }
  }, 15000); // Every 15 seconds
}

startListener();
