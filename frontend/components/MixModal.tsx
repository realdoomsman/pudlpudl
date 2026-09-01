'use client'

// Mix a confluence: split your SOL across 2–4 rivers as one bundle. Higher
// variance — if any leg's price leaves its range you end up holding that coin —
// aggregated real fees. Only Raydium rivers are castable today.

import { useState } from 'react'
import { pudl } from '@/lib/pudl'
import { useAuth } from '@/lib/auth'
import { fmtUsd, type River } from '@/lib/rivers'

const BANDS = [
  { label: 'Wide', pct: 0.4 },
  { label: 'Balanced', pct: 0.15 },
  { label: 'Tight', pct: 0.06 },
]

export function MixModal({ rivers, onClose, onDone }: { rivers: River[]; onClose: () => void; onDone: () => void }) {
  const { me, promptSignIn, refresh } = useAuth()
  const castable = rivers.filter((r) => !r.venue || r.venue === 'raydium').slice(0, 40)
  const [sel, setSel] = useState<string[]>([])
  const [amount, setAmount] = useState('0.5')
  const [band, setBand] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const amt = parseFloat(amount) || 0
  const per = sel.length ? amt / sel.length : 0

  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s))

  const cast = async () => {
    setErr(null)
    if (!me) return promptSignIn()
    if (sel.length < 2) return setErr('Pick at least 2 rivers to mix')
    if (amt <= 0) return setErr('Enter an amount')
    if (amt > me.sol) return setErr('Not enough SOL — deposit first')
    setBusy(true)
    try {
      await pudl.mix(amt, sel.map((poolId) => ({ poolId, weight: 1, bandPct: BANDS[band].pct })))
      setDone(true)
      refresh()
      onDone()
    } catch (e: any) {
      setErr(e.message || 'mix failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md border border-hair bg-deep p-6 animate-rise">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow text-white/40">Mix a confluence</div>
            <div className="display text-2xl">{sel.length || '0'} rivers</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none px-1">×</button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🌊</div>
            <div className="display text-xl mb-1">Mix cast.</div>
            <p className="text-sm text-gray-400 mb-6">Your SOL is opening across {sel.length} pools. They&rsquo;ll show as one bundle in My Nets.</p>
            <button onClick={onClose} className="px-6 py-3 text-black font-semibold" style={{ backgroundColor: '#e8ff1e' }}>Watch it collect</button>
          </div>
        ) : (
          <>
            <div className="eyebrow text-white/40 mb-2">Pick 2–4 rivers</div>
            <div className="border border-hair max-h-[34vh] overflow-y-auto mb-4">
              {castable.map((r) => {
                const on = sel.includes(r.id)
                return (
                  <button
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left border-b border-hair last:border-0 transition-colors ${on ? 'bg-acid/[0.1]' : 'hover:bg-white/[0.04]'}`}
                  >
                    <span className={`w-3.5 h-3.5 border shrink-0 ${on ? 'bg-acid border-acid' : 'border-white/25'}`} />
                    <div className="flex -space-x-1.5 shrink-0">
                      {[r.logoA, r.logoB].map((s, k) =>
                        s ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={k} src={s} alt="" className="w-4 h-4 rounded-full border border-black object-cover bg-pudl-gray-800" />
                        ) : (
                          <div key={k} className="w-4 h-4 rounded-full border border-black bg-pudl-gray-800" />
                        ),
                      )}
                    </div>
                    <span className="text-xs font-semibold truncate flex-1">{r.name}</span>
                    <span className="mono text-[11px] font-bold tnum text-acid">{fmtUsd(r.totalPer1k)}<span className="text-white/30">/1k</span></span>
                  </button>
                )
              })}
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500">Total (SOL)</label>
              <div className="mt-1.5 flex items-center gap-2 border border-hair bg-black/40 px-4 py-3">
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="flex-1 bg-transparent outline-none text-xl font-mono" placeholder="0.0" />
                {me && <button onClick={() => setAmount(Math.max(me.sol - 0.02, 0).toFixed(3))} className="text-xs text-acid font-semibold">MAX</button>}
              </div>
              <div className="text-[11px] text-gray-600 mt-1">
                {me && <>Balance {me.sol.toFixed(3)} SOL · </>}split ≈ {per.toFixed(3)} SOL per river
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500">How tight (all legs)?</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {BANDS.map((b, i) => (
                  <button key={b.label} onClick={() => setBand(i)} className={`border px-2 py-2 text-center transition-colors ${band === i ? 'border-acid bg-acid/10' : 'border-hair hover:border-white/25'}`}>
                    <div className="text-xs font-semibold">{b.label}</div>
                    <div className="text-[10px] text-gray-500">±{Math.round(b.pct * 100)}%</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-danger/25 bg-danger/[0.06] p-3 mb-4">
              <p className="text-[11px] text-danger/90 leading-relaxed">
                <b>Riskier by design.</b> Your SOL spreads across every pool you pick. Any leg whose price leaves its
                range leaves you holding that coin — more pools, more ways to be caught. More lines in the water, too.
              </p>
            </div>

            {err && <div className="text-sm text-danger mb-3">{err}</div>}

            <button onClick={cast} disabled={busy || sel.length < 2} className="w-full py-3.5 font-semibold text-black disabled:opacity-50" style={{ backgroundColor: '#e8ff1e' }}>
              {busy ? 'Casting…' : me ? `Cast mix (${sel.length || 0})` : 'Sign in to mix'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
