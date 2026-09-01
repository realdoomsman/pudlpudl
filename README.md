# PUDL — be the house

**Every trade on Solana pays a fee. PUDL lets you be the one collecting it.**

PUDL turns the memecoin market into a world you look down on: each **river is a live liquidity pool**, and you cast liquidity into the current to earn a cut of every trade that crosses you — in pumps *and* dumps.

---

## What it does

- **Sign in with Google → a Solana wallet.** No extensions, no seed phrase. Deposit SOL, withdraw any time.
- **Cast a net.** One click opens a real concentrated-liquidity position in a memecoin pool.
- **Collect real fees.** A share of every swap through your range, shown live in SOL.
- **The whole map is live.** Pools are indexed from **Raydium** and **Meteora DLMM**, ranked by real yield per $1k. Paste any token address to find its pools.
- **Homes.** Your fees pool at your home on the riverbank — solo or as a co-op crew.

Every number shown is real, computed from on-chain / venue-API data. Nothing is fabricated.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 · React 18 · TypeScript · Tailwind · three.js / react-three-fiber |
| Backend | Node · Express · TypeScript · `@raydium-io/raydium-sdk-v2` · `@solana/web3.js` |
| Chain | Solana (Helius RPC) |
| Auth | Google Identity Services → custodial keypair, AES-256-GCM at rest |

```
frontend/   Next.js app — the 3D world, panels, and pages
server/     Express API — pools feed, custody, cast/harvest/close, homes
```

---

## Run it

```bash
# backend
cd server && npm install && npm run dev

# frontend
cd frontend && npm install && npm run dev
```

Backend env: `RPC_URL` (Solana RPC), `GOOGLE_CLIENT_ID`, `PUDL_MASTER_KEY` (32-byte hex), `DATA_DIR`.
Frontend env: `NEXT_PUBLIC_PUDL_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

---

## Status

Active development. Casting runs on Raydium today; Meteora and pump.fun venues are being wired in. Not audited — do not use with funds you can't afford to lose.
