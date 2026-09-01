'use client'

// Paste a token contract address → find every pool it trades in, ranked by real
// yield per $1k, and cast a net right there. Pools are folded into the live set
// server-side, so a searched pool is immediately castable.

import { useState } from 'react'
import { pudl, type SearchResult } from '@/lib/pudl'
import { fmtUsd, shortMint, type River } from '@/lib/rivers'

export function SearchBar({ onCast }: { onCast: (r: River) => void }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [res, setRes] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)

  const run = async () => {
    const mint = q.trim()
    if (!mint) return
    setBusy(true)
    setErr(null)
    setRes(null)
    try {
      const r = await pudl.search(mint)
      setRes(r)
      setOpen(true)
      if (r.rivers.length === 0) setErr('No Raydium pools found for this token yet.')
    } catch (e: any) {
      setErr(String(e?.message || 'search failed'))
      setOpen(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative w-[300px] max-w-[70vw]">
      <div className="flex items-center border border-hair bg-black/70 backdrop-blur-md">
        <span className="pl-2.5 pr-1 text-white/35 text-sm">⌕</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setErr(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          onFocus={() => res && setOpen(true)}
          placeholder="paste token address to find pools"
          spellCheck={false}
          className="flex-1 bg-transparent py-1.5 text-[11px] mono outline-none placeholder:text-white/25 text-white"
        />
        <button
          onClick={run}
          disabled={busy || !q.trim()}
          className="eyebrow px-2.5 py-1.5 text-acid hover:bg-white/[0.05] disabled:opacity-40 border-l border-hair"
        >
          {busy ? '…' : 'Find'}
        </button>
      </div>

      {open && (res || err) && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-hair bg-surface/95 backdrop-blur-md max-h-[52vh] overflow-y-auto z-40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-hair">
            <div className="flex items-center gap-2 min-w-0">
              {res?.token?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={res.token.logo} alt="" className="w-5 h-5 rounded-full" />
              )}
              <span className="text-xs font-bold truncate">
                {res?.token?.symbol || 'Token'}
              </span>
              {res && <span className="mono text-[10px] text-white/35">{shortMint(res.mint)}</span>}
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-sm leading-none px-1">×</button>
          </div>

          {err ? (
            <div className="px-3 py-4 text-[11px] text-white/45">{err}</div>
          ) : (
            <div className="p-1.5">
              {res!.rivers.map((r) => {
                const boosted = r.boostPer1k > 0
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      onCast(r)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/[0.05] text-left border-b border-hair last:border-0"
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      {[r.logoA, r.logoB].map((s, k) =>
                        s ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={k} src={s} alt="" className="w-5 h-5 rounded-full border border-black object-cover bg-pudl-gray-800" />
                        ) : (
                          <div key={k} className="w-5 h-5 rounded-full border border-black bg-pudl-gray-800" />
                        ),
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{r.name}</div>
                      <div className="text-[10px] text-white/40 mono">
                        tvl {fmtUsd(r.tvl)} · {r.feeRatePct.toFixed(2)}% fee
                      </div>
                    </div>
                    {r.venue === 'meteora' && <span className="text-[7px] font-bold px-1 mono" style={{ color: '#5ad1ff', border: '1px solid rgba(90,209,255,.4)' }}>MET</span>}
                    {r.venue === 'pumpswap' && <span className="text-[7px] font-bold px-1 mono" style={{ color: '#ffb347', border: '1px solid rgba(255,179,71,.4)' }}>PUMP</span>}
                    {boosted && (
                      <span className="text-[7px] font-bold px-1 text-black" style={{ background: '#ffb347' }}>B</span>
                    )}
                    <span
                      className="mono text-[11px] font-bold tnum"
                      style={{ color: boosted ? '#ffb347' : '#e8ff1e' }}
                    >
                      {fmtUsd(r.totalPer1k)}/1k
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
