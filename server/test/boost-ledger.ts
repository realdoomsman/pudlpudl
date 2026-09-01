// Boost ledger proof — runs the real model.accrueBoosts / claimableBoostSol /
// markBoostClaimedUpTo against seeded state and asserts the redirect→accrue→claim
// accounting. No chain, no funds: this is the math behind "fees redirect into a
// boost, LPs accrue by stake, then claim pays out exactly what they're owed."
//
//   run:  cd server && npx tsx test/boost-ledger.ts

import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

// point the model at a throwaway data dir BEFORE importing it
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pudl-ledger-'))
process.env.NODE_ENV = 'test'

main().catch((e) => { console.error(e); process.exit(1) })

async function main() {
const m = await import('../src/model')

let failures = 0
const approx = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps
function ok(cond: boolean, msg: string) {
  if (cond) console.log('  ✓', msg)
  else { console.error('  ✗ FAIL:', msg); failures++ }
}

const t0 = 1_000_000_000_000
const day = 86_400_000

// two live LPs on pool P: stakes 1 and 3 SOL (shares 1/4 and 3/4)
const netA: any = { id: 'a', sub: 'u1', homeId: 'h', poolId: 'P', poolName: 'P', positionMint: 'pa', amountSol: 1, status: 'live', openSig: null, castAt: t0, closedAt: null, feesClaimedSol: 0, boostClaimedSol: 0, boostAccruedSol: 0 }
const netB: any = { id: 'b', sub: 'u2', homeId: 'h', poolId: 'P', poolName: 'P', positionMint: 'pb', amountSol: 3, status: 'live', openSig: null, castAt: t0, closedAt: null, feesClaimedSol: 0, boostClaimedSol: 0, boostAccruedSol: 0 }
m.nets.push(netA, netB)

// a 10 SOL boost on P streamed over 10 days (this is the "redirected fees" pot)
const boost: any = { id: 'bo', poolId: 'P', poolName: 'P', sponsorSub: 's', sponsorLabel: 's', source: 'creator', totalSol: 10, paidSol: 0, startAt: t0, endAt: t0 + 10 * day, lastAccrualAt: t0 }
m.boosts.push(boost)

console.log('› day 1: stream 1 SOL, split by stake')
m.accrueBoosts(t0 + 1 * day)
ok(approx(boost.paidSol, 1), 'streamed 1 SOL after day 1')
ok(approx(netA.boostAccruedSol, 0.25), 'netA accrued 0.25 (1/4 share)')
ok(approx(netB.boostAccruedSol, 0.75), 'netB accrued 0.75 (3/4 share)')
ok(approx(m.claimableBoostSol('u1'), 0.25), 'u1 claimable = 0.25')

console.log('› u1 claims')
const cleared = m.markBoostClaimedUpTo('u1', m.claimableBoostSol('u1'))
ok(approx(cleared, 0.25), 'u1 cleared exactly 0.25')
ok(approx(netA.boostAccruedSol, 0), 'netA accrued back to 0 after claim')
ok(approx(netA.boostClaimedSol, 0.25), 'netA claimed ledger = 0.25')
ok(approx(m.claimableBoostSol('u1'), 0), 'u1 claimable now 0')

console.log('› stream to end of window')
m.accrueBoosts(t0 + 10 * day)
ok(approx(boost.paidSol, 10), 'streamed the full 10 SOL by end')
ok(approx(netA.boostClaimedSol + netA.boostAccruedSol, 2.5), 'netA lifetime boost = 2.5 (1/4 of 10)')
ok(approx(netB.boostAccruedSol, 7.5), 'netB lifetime boost = 7.5 (3/4 of 10)')

console.log('› never over-streams past the pot')
m.accrueBoosts(t0 + 20 * day)
ok(approx(boost.paidSol, 10), 'paidSol capped at totalSol (no over-stream)')

console.log('› partial claim is capped')
const before = netB.boostAccruedSol
const partial = m.markBoostClaimedUpTo('u2', 2)
ok(approx(partial, 2), 'u2 partial claim capped at 2')
ok(approx(netB.boostAccruedSol, before - 2), 'u2 remainder is exact')
ok(approx(netB.boostClaimedSol, 2), 'u2 claimed ledger = 2')

console.log('› a boost with no live LPs pays nobody')
const boost2: any = { id: 'bo2', poolId: 'Q', poolName: 'Q', sponsorSub: 's', sponsorLabel: 's', source: 'sponsor', totalSol: 5, paidSol: 0, startAt: t0, endAt: t0 + 5 * day, lastAccrualAt: t0 }
m.boosts.push(boost2)
m.accrueBoosts(t0 + 5 * day)
ok(approx(boost2.paidSol, 0), 'pool Q boost streams to nobody (0 paid, no LPs)')

console.log('› only LIVE nets earn (a closed net gets nothing)')
const netC: any = { id: 'c', sub: 'u3', homeId: 'h', poolId: 'R', poolName: 'R', positionMint: 'pc', amountSol: 5, status: 'closed', openSig: null, castAt: t0, closedAt: t0, feesClaimedSol: 0, boostClaimedSol: 0, boostAccruedSol: 0 }
m.nets.push(netC)
const boost3: any = { id: 'bo3', poolId: 'R', poolName: 'R', sponsorSub: 's', sponsorLabel: 's', source: 'sponsor', totalSol: 4, paidSol: 0, startAt: t0, endAt: t0 + 4 * day, lastAccrualAt: t0 }
m.boosts.push(boost3)
m.accrueBoosts(t0 + 4 * day)
ok(approx(netC.boostAccruedSol, 0) && approx(boost3.paidSol, 0), 'closed net earns nothing from its pool boost')

console.log(failures === 0 ? '\n✅ ALL LEDGER ASSERTIONS PASSED' : `\n❌ ${failures} ASSERTION(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
}
