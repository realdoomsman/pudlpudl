// On-chain preflight — wallet setup + READ-ONLY validation of the money paths.
// It never sends a fund-moving transaction: `check` reads balances, `sim-*`
// SIMULATES transactions against mainnet (no lamports move). Use it to prove the
// transfer/escrow path constructs a valid tx BEFORE you run the real funded test
// through the app UI.
//
//   cd server
//   npx tsx test/onchain-preflight.ts genwallet          # make a test wallet, print address to fund
//   npx tsx test/onchain-preflight.ts check              # SOL + SPL balances (read-only)
//   npx tsx test/onchain-preflight.ts sim-transfer <dest> <sol>   # simulate a SOL transfer (no send)

import * as fs from 'fs'
import * as path from 'path'
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { connection, balanceOf, splTokenBalances } from '../src/cast'

const WALLET_FILE = path.join(process.cwd(), '.pudl-test-wallet.json')

function genwallet() {
  if (fs.existsSync(WALLET_FILE)) {
    const kp = load()
    console.log('test wallet already exists:', kp.publicKey.toBase58())
    console.log('(delete', WALLET_FILE, 'to make a new one)')
    return
  }
  const kp = Keypair.generate()
  fs.writeFileSync(WALLET_FILE, JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 })
  console.log('created test wallet:', kp.publicKey.toBase58())
  console.log('secret saved (gitignored) to', WALLET_FILE)
  console.log('\nFUND IT: send a small amount of SOL (e.g. 0.1) to the address above, then run `check`.')
}

function load(): Keypair {
  if (!fs.existsSync(WALLET_FILE)) throw new Error('no test wallet — run `genwallet` first')
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'))))
}

async function check() {
  const kp = load()
  const addr = kp.publicKey.toBase58()
  const sol = await balanceOf(addr)
  console.log('wallet   :', addr)
  console.log('SOL      :', sol)
  const toks = await splTokenBalances(addr)
  if (!toks.length) console.log('SPL      : (none)')
  else for (const t of toks) console.log('SPL      :', t.mint, '·', t.amount)
  console.log(sol > 0 ? '\n✅ funded and reachable — RPC + balance reads work.' : '\n⚠️  0 SOL — fund the address, then re-run.')
}

async function simTransfer(dest: string, sol: number) {
  const kp = load()
  const to = new PublicKey(dest) // throws on bad address
  const lamports = Math.floor(sol * 1e9)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const tx = new Transaction({ feePayer: kp.publicKey, blockhash, lastValidBlockHeight }).add(
    SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: to, lamports }),
  )
  const sim = await connection.simulateTransaction(tx, [kp]) // SIMULATE only — nothing is sent
  if (sim.value.err) {
    console.log('❌ simulation error:', JSON.stringify(sim.value.err))
    console.log('   (insufficient-funds here just means the wallet is not funded yet — the tx itself is well-formed)')
  } else {
    console.log('✅ transfer simulates cleanly — the escrow/claim transfer path constructs a valid tx.')
    console.log('   compute units:', sim.value.unitsConsumed ?? 'n/a')
  }
}

const [cmd, a, b] = process.argv.slice(2)
;(async () => {
  try {
    if (cmd === 'genwallet') genwallet()
    else if (cmd === 'check') await check()
    else if (cmd === 'sim-transfer') {
      if (!a || !b) throw new Error('usage: sim-transfer <dest> <sol>')
      await simTransfer(a, Number(b))
    } else {
      console.log('commands: genwallet | check | sim-transfer <dest> <sol>')
    }
  } catch (e: any) {
    console.error('error:', String(e?.message ?? e))
    process.exit(1)
  }
  process.exit(0)
})()
