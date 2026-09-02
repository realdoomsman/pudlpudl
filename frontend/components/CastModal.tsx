'use client'

import { useState } from 'react'
import { pudl } from '@/lib/pudl'
import { useAuth } from '@/lib/auth'
import { fmtUsd, fmtSol, type River } from '@/lib/rivers'

const BANDS = [
  { label: 'Wide net', pct: 0.4, note: 'safer — catches less, survives big moves' },
  { label: 'Balanced', pct: 0.15, note: 'the standard cast' },
  { label: 'Tight net', pct: 0.06, note: 'catches the most — shredded if price rips out' },
]

export function CastModal({ river, onClose }: { river: River; onClose: () => void }) {
  const { me, promptSignIn, refresh } = useAuth()
  const [amount, setAmount] = useState('0.5')
  const [band, setBand] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const amt = parseFloat(amount) || 0
  const isRaydium = !river.venue || river.venue === 'raydium'
  const noSolSide = river.hasSol === false
  const castable = isRaydium && !noSolSide

  async function cast() {
    setErr(null)
    if (!me) return promptSignIn()
    if (amt <= 0) return setErr('Enter an amount')
    if (amt > me.sol) return setErr('Not enough SOL — deposit first')
    setBusy(true)
    try {
      await pudl.cast(river.id, amt, BANDS[band].pct)
      setDone(true)
      refresh()
    } catch (e: any) {
      setErr(e.message || 'cast failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-abyss/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md rounded-t-3xl md:rounded-3xl border border-white/10 bg-deep p-6 animate-rise">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-white/40">Cast a net</div>
            <div className="font-display text-2xl font-bold">{river.name}</div>
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 border ${
              river.flow === 'FLASH FLOOD'
                ? 'text-flood border-flood/40 animate-shimmer'
                : 'text-white/55 border-white/10'
            }`}
          >
            {river.flow}
          </span>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎣</div>
            <div className="font-display text-xl font-bold mb-1">Net cast.</div>
            <p className="text-sm text-white/55 mb-6">
              Your position is opening on-chain. It&rsquo;ll show up in{' '}
              <span className="text-white">My Nets</span> in a few seconds and start collecting.
            </p>
            <button
              onClick={onClose}
              className="rounded-xl px-6 py-3 text-black font-semibold"
              style={{ backgroundColor: '#e8ff1e' }}
            >
              Watch it collect
            </button>
          </div>
        ) : !castable ? (
          <div className="py-6 text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <div className="font-display text-lg mb-1 uppercase tracking-tight">{noSolSide ? 'No SOL side.' : 'Indexed, not castable yet.'}</div>
            <p className="text-sm text-white/55 mb-5 leading-relaxed">
              {noSolSide ? (
                <>This pool has no <span className="text-white">SOL</span> side. PUDL funds nets with SOL only (no swap yet), so pick a <span className="text-white">TOKEN/SOL</span> pool.</>
              ) : (
                <><span className="uppercase text-acid">{river.venue}</span> pools are on the map and searchable, but casting there is coming. For now, cast into <span className="text-white">Raydium</span> rivers.</>
              )}
            </p>
            <button onClick={onClose} className="px-6 py-3 text-black font-semibold" style={{ backgroundColor: '#e8ff1e' }}>
              Got it
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-xs text-white/40">Amount (SOL)</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-xl font-mono"
                  placeholder="0.0"
                />
                {me && (
                  <button
                    onClick={() => setAmount(Math.max(me.sol - 0.02, 0).toFixed(3))}
                    className="text-xs text-acid font-semibold"
                  >
                    MAX
                  </button>
                )}
              </div>
              {me && <div className="text-[11px] text-white/30 mt-1">Balance {me.sol.toFixed(3)} SOL</div>}
            </div>

            <div className="mb-5">
              <label className="text-xs text-white/40">How tight?</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {BANDS.map((b, i) => (
                  <button
                    key={b.label}
                    onClick={() => setBand(i)}
                    className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                      band === i ? 'border-acid bg-acid/10' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-semibold">{b.label}</div>
                    <div className="text-[10px] text-white/40">±{Math.round(b.pct * 100)}%</div>
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-white/30 mt-1.5">{BANDS[band].note}</div>
            </div>

            <div className="rounded-xl bg-black/40 border border-white/5 p-3 mb-4 text-sm">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] uppercase tracking-widest text-white/40">
                  this pool paid, last 24h
                </span>
                <span className="font-mono font-bold" style={{ color: '#e8ff1e' }}>
                  {fmtUsd(river.feesPer1k)}
                  <span className="text-white/30 font-sans font-normal text-xs"> / $1k of pool · 24h</span>
                </span>
              </div>
              {river.boostPerDay > 0 && (
                <div className="flex justify-between items-baseline mt-1.5">
                  <span className="text-[11px] uppercase tracking-widest text-gold">
                    + live boost
                  </span>
                  <span className="font-mono font-bold text-gold">
                    {fmtSol(river.boostPerDay)}
                    <span className="text-white/30 font-sans font-normal text-xs"> / day to LPs</span>
                  </span>
                </div>
              )}
              <p className="text-[10px] text-white/30 mt-2.5 leading-relaxed">
                A real backward-looking rate, not a promise. You earn fees only while price stays in
                your net&rsquo;s range. Your actual take shows up live in <span className="text-white/55">My Nets</span>.
              </p>
            </div>

            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 mb-4">
              <p className="text-[11px] text-danger/90 leading-relaxed">
                Risk: if price leaves your range you stop earning and end up holding 100% of the
                weaker asset. If a memecoin dumps out of range, you&rsquo;re all-in on the coin that
                just crashed. Tighter nets earn more but get shredded faster.
              </p>
            </div>

            {err && <div className="text-sm text-danger mb-3">{err}</div>}

            <button
              onClick={cast}
              disabled={busy}
              className="w-full rounded-xl py-3.5 font-semibold text-black disabled:opacity-60"
              style={{ backgroundColor: '#e8ff1e' }}
            >
              {busy ? 'Casting…' : me ? 'Cast net' : 'Sign in to cast'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
