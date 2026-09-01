'use client'

// Floating, draggable windows over the 3D world — HOME, MARKET, MY NETS,
// ACTIVITY — plus a dock. Sharp black / mono / hairline, fraction.skin language.

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { pudl, type MyNet } from '@/lib/pudl'
import { fmtUsd, fmtSol, type River } from '@/lib/rivers'
import { HomePanel } from '@/components/HomePanel'

type PanelId = 'home' | 'market' | 'nets' | 'activity'
interface Pos { x: number; y: number }

function useDrag(initial: Pos) {
  const [pos, setPos] = useState(initial)
  const dragging = useRef<{ dx: number; dy: number } | null>(null)
  const onDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button,a,input')) return
    dragging.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [pos])
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return
      setPos({
        x: Math.max(6, Math.min(window.innerWidth - 80, e.clientX - dragging.current.dx)),
        y: Math.max(58, Math.min(window.innerHeight - 60, e.clientY - dragging.current.dy)),
      })
    }
    const up = () => (dragging.current = null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])
  return { pos, onDown }
}

function Win({ title, accent, initial, width, onClose, children, z, onFocus }: {
  title: string; accent?: string; initial: Pos; width: number; onClose: () => void; children: ReactNode; z: number; onFocus: () => void
}) {
  const { pos, onDown } = useDrag(initial)
  return (
    <div className="absolute border border-hair bg-surface/90 backdrop-blur-md" style={{ left: pos.x, top: pos.y, width, zIndex: z }} onPointerDown={onFocus}>
      <div onPointerDown={onDown} className="flex items-center justify-between px-3 py-2 border-b border-hair cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5" style={{ background: accent || '#e8ff1e' }} />
          <span className="eyebrow text-white/60">{title}</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-sm leading-none px-1">×</button>
      </div>
      <div className="max-h-[64vh] overflow-y-auto">{children}</div>
    </div>
  )
}

export function WorldPanels({ rivers, nets, signedIn, onCast, onNetsChanged }: {
  rivers: River[]; nets: MyNet[]; signedIn: boolean; onCast: (r: River) => void; onNetsChanged: () => void
}) {
  const [open, setOpen] = useState<Record<PanelId, boolean>>({ home: true, market: true, nets: false, activity: false })
  const [order, setOrder] = useState<PanelId[]>(['activity', 'nets', 'market', 'home'])
  const focus = (id: PanelId) => setOrder((o) => [...o.filter((x) => x !== id), id])
  const zOf = (id: PanelId) => 20 + order.indexOf(id)
  const toggle = (id: PanelId) => { setOpen((o) => ({ ...o, [id]: !o[id] })); focus(id) }

  // arrive via a crew invite link → auto-join
  useEffect(() => {
    if (!signedIn) return
    const p = new URLSearchParams(window.location.search)
    const j = p.get('join')
    if (j) pudl.homeJoin(j).catch(() => {}).finally(() => {
      window.history.replaceState({}, '', window.location.pathname)
      setOpen((o) => ({ ...o, home: true }))
    })
  }, [signedIn])

  return (
    <>
      {open.home && (
        <Win title="Home" initial={{ x: 16, y: 78 }} width={300} z={zOf('home')} onFocus={() => focus('home')} onClose={() => setOpen((o) => ({ ...o, home: false }))}>
          <HomePanel />
        </Win>
      )}

      {open.market && (
        <Win title="Market" accent="#5ad1ff" initial={{ x: 332, y: 78 }} width={330} z={zOf('market')} onFocus={() => focus('market')} onClose={() => setOpen((o) => ({ ...o, market: false }))}>
          <div className="p-1.5">
            {rivers.slice(0, 40).map((r, i) => {
              const boosted = r.boostPer1k > 0
              return (
                <button key={r.id} onClick={() => onCast(r)} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/[0.04] text-left border-b border-hair last:border-0">
                  <span className="w-4 text-[10px] text-white/30 mono tnum">{i + 1}</span>
                  <div className="flex -space-x-1.5 shrink-0">
                    {[r.logoA, r.logoB].map((s, k) => s ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={k} src={s} alt="" className="w-5 h-5 rounded-full border border-black object-cover bg-pudl-gray-800" />
                    ) : <div key={k} className="w-5 h-5 rounded-full border border-black bg-pudl-gray-800" />)}
                  </div>
                  <span className="text-xs font-semibold truncate flex-1">{r.name}</span>
                  {r.venue === 'meteora' && <span className="text-[7px] font-bold px-1 mono" style={{ color: '#5ad1ff', border: '1px solid rgba(90,209,255,.4)' }}>MET</span>}
                  {boosted && <span className="text-[7px] font-bold px-1 text-acidink" style={{ background: '#ffb347' }}>B</span>}
                  <span className="mono text-[11px] font-bold tnum" style={{ color: boosted ? '#ffb347' : '#e8ff1e' }}>{fmtUsd(r.totalPer1k)}<span className="text-white/30">/1k</span></span>
                </button>
              )
            })}
          </div>
        </Win>
      )}

      {open.nets && (
        <Win title="My Nets" accent="#5ad1ff" initial={{ x: 678, y: 78 }} width={320} z={zOf('nets')} onFocus={() => focus('nets')} onClose={() => setOpen((o) => ({ ...o, nets: false }))}>
          <div className="p-2 space-y-1.5">
            {!signedIn ? <div className="text-xs text-white/45 p-3 text-center">Sign in to see your nets.</div>
              : nets.length === 0 ? <div className="text-xs text-white/45 p-3 text-center">No nets yet. Click a river in the world to cast one.</div>
              : nets.map((n) => <NetRow key={n.id} net={n} onChanged={onNetsChanged} />)}
          </div>
        </Win>
      )}

      {open.activity && (
        <Win title="Activity" accent="#ffb347" initial={{ x: 1006, y: 78 }} width={300} z={zOf('activity')} onFocus={() => focus('activity')} onClose={() => setOpen((o) => ({ ...o, activity: false }))}>
          <ActivityFeed rivers={rivers} />
        </Win>
      )}

      {/* dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center border border-hair bg-surface/90 backdrop-blur-md divide-x divide-hair">
        {(['home', 'market', 'nets', 'activity'] as PanelId[]).map((id) => (
          <button key={id} onClick={() => toggle(id)} className={`eyebrow px-4 py-2.5 transition-colors ${open[id] ? 'text-acid bg-white/[0.04]' : 'text-white/45 hover:text-white'}`}>
            {id === 'nets' ? 'Nets' : id}
          </button>
        ))}
      </div>
    </>
  )
}

function NetRow({ net, onChanged }: { net: MyNet; onChanged: () => void }) {
  const [busy, setBusy] = useState<'harvest' | 'close' | 'dismiss' | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const label = net.status === 'opening' ? 'casting…' : net.status === 'live' ? 'collecting' : net.status === 'closing' ? 'pulling…' : net.status === 'failed' ? 'failed' : net.status
  const earned = net.feesClaimedSol + net.boostClaimedSol

  const run = async (kind: 'harvest' | 'close' | 'dismiss') => {
    setBusy(kind)
    setErr(null)
    try {
      await pudl[kind](net.id)
    } catch (e: any) {
      setErr(String(e?.message || 'failed'))
    }
    setBusy(null)
    onChanged()
  }

  return (
    <div className="border border-hair bg-sunk px-2.5 py-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate">{net.poolName}</div>
          <div className="text-[10px] text-white/45">
            {fmtSol(net.amountSol)} · <span style={{ color: net.status === 'live' ? '#e8ff1e' : net.status === 'failed' ? '#ff5a7a' : undefined }}>{label}</span>
          </div>
        </div>
        {earned > 0 && <div className="mono text-[11px] tnum mr-1" style={{ color: '#e8ff1e' }}>+{fmtSol(earned)}</div>}
        {net.status === 'live' && (
          <>
            <button disabled={!!busy} onClick={() => run('harvest')} className="eyebrow border border-hair px-1.5 py-1 hover:border-white/30 disabled:opacity-50">{busy === 'harvest' ? '…' : 'Reap'}</button>
            <button disabled={!!busy} onClick={() => run('close')} className="eyebrow border border-danger/30 text-danger px-1.5 py-1 hover:bg-danger/10 disabled:opacity-50">{busy === 'close' ? '…' : 'Pull'}</button>
          </>
        )}
        {net.status === 'failed' && (
          <button disabled={!!busy} onClick={() => run('dismiss')} className="eyebrow border border-hair px-1.5 py-1 hover:border-white/30 disabled:opacity-50">{busy === 'dismiss' ? '…' : 'Clear'}</button>
        )}
      </div>
      {net.status === 'failed' && net.openSig && (
        <div className="text-[10px] text-danger/80 mt-1 break-words">{net.openSig}</div>
      )}
      {err && <div className="text-[10px] text-danger mt-1">{err}</div>}
    </div>
  )
}

function ActivityFeed({ rivers }: { rivers: River[] }) {
  const [lines, setLines] = useState<{ id: number; text: string; color: string }[]>([])
  useEffect(() => {
    if (rivers.length === 0) return
    let id = 0
    const tick = () => {
      const r = rivers[Math.floor(Math.random() * Math.min(rivers.length, 12))]
      if (!r) return
      setLines((prev) => [{ id: id++, text: `${r.flow === 'FLASH FLOOD' ? '≋' : '›'} ${r.name} — ${fmtUsd(r.vol24h)} flowing`, color: r.boostPer1k > 0 ? '#ffb347' : '#e8ff1e' }, ...prev].slice(0, 40))
    }
    tick()
    const t = setInterval(tick, 2200)
    return () => clearInterval(t)
  }, [rivers])
  return (
    <div className="p-2 space-y-0.5">
      {lines.map((l) => <div key={l.id} className="mono text-[10px] text-white/40 animate-rise"><span style={{ color: l.color }}>{l.text}</span></div>)}
    </div>
  )
}
