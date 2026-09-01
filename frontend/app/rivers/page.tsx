'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Nav } from '@/components/Nav'
import { CastModal } from '@/components/CastModal'
import { MixModal } from '@/components/MixModal'
import { WorldPanels } from '@/components/WorldPanels'
import { SearchBar } from '@/components/SearchBar'
import { useAuth } from '@/lib/auth'
import { pudl, type MyNet } from '@/lib/pudl'
import { fmtUsd, type River, type RiversSnapshot } from '@/lib/rivers'

const World3D = dynamic(() => import('@/components/World3D').then((m) => m.World3D), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-gray-600 animate-pulse">
      lowering the nets…
    </div>
  ),
})

export default function RiversPage() {
  const { me } = useAuth()
  const [snap, setSnap] = useState<RiversSnapshot | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [cast, setCast] = useState<River | null>(null)
  const [mixOpen, setMixOpen] = useState(false)
  const [nets, setNets] = useState<MyNet[]>([])

  useEffect(() => {
    let alive = true
    const load = () => pudl.rivers(showAll).then((s) => alive && setSnap(s)).catch(() => {})
    load()
    const t = setInterval(load, 30_000)
    return () => { alive = false; clearInterval(t) }
  }, [showAll])

  const reloadNets = () => pudl.myNets().then((r) => setNets(r.nets)).catch(() => {})
  useEffect(() => {
    if (!me) return setNets([])
    reloadNets()
    const t = setInterval(reloadNets, 12_000)
    return () => clearInterval(t)
  }, [me])

  const rivers = snap?.rivers ?? []

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden">
      <Nav />

      <div className="relative flex-1 overflow-hidden">
        {/* the world */}
        {rivers.length > 0 ? (
          <World3D rivers={rivers} nets={nets} onCast={setCast} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 animate-pulse">
            reading the river…
          </div>
        )}

        {/* faint film grain — kills banding on the washes */}
        <div
          className="pointer-events-none absolute inset-0 z-[6] opacity-[0.04] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* top-left: title */}
        <div className="pointer-events-none absolute top-4 left-4 md:top-5 md:left-5 z-10 max-w-[230px]">
          <h1 className="display text-xl md:text-2xl">The World.</h1>
          <p className="text-[10.5px] text-white/45 mt-1 leading-relaxed">
            Every river is a live pool, running from the uplands to the sea. Homes on the banks are where fees pool.
          </p>
        </div>

        {/* CA search + mix — top center */}
        <div className="pointer-events-none absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
          <div className="pointer-events-auto">
            <SearchBar onCast={setCast} />
          </div>
          <button
            onClick={() => setMixOpen(true)}
            className="pointer-events-auto eyebrow px-3 py-1.5 border border-acid/35 bg-acid/[0.08] text-acid hover:bg-acid/[0.14] transition-colors"
          >
            ⋔ Mix rivers
          </button>
        </div>

        {/* top-right: live stats grid (Elegans #stats) */}
        <div className="pointer-events-auto absolute top-4 right-4 md:top-5 md:right-5 z-10 w-[300px]">
          <div className="grid grid-cols-3 gap-px bg-line border border-line">
            <div className="col-span-3 bg-surface px-3 py-2 flex items-center justify-between">
              <span className="eyebrow text-white/35">The rivers</span>
              <span className="eyebrow text-acid flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-acid inline-block" />{snap ? 'Live' : '…'}
              </span>
            </div>
            <StatCell k="Fees · 24h" v={snap ? fmtUsd(snap.totalFees24h) : '—'} accent />
            <StatCell k="Volume · 24h" v={snap ? fmtUsd(snap.totalVol24h) : '—'} />
            <StatCell k="Rivers" v={snap ? String(rivers.length) : '—'} />
          </div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className={`mt-1.5 w-full eyebrow px-3 py-2 border transition-colors ${
              showAll ? 'text-acid border-acid/35 bg-acid/[0.09]' : 'text-white/55 border-hair bg-surface hover:text-acid hover:border-acid/35'
            }`}
          >
            {showAll ? 'Showing all pools' : 'Memes only'}
          </button>
        </div>

        {/* bottom-left: legend + how-to — explains the world and how to start */}
        <div className="pointer-events-auto absolute bottom-4 left-4 md:bottom-5 md:left-5 z-10 w-[260px] border border-line bg-surface/95 backdrop-blur-md">
          <div className="px-3 py-2 border-b border-line">
            <span className="eyebrow text-white/35">How to play</span>
          </div>
          <div className="px-3 py-2.5 space-y-1.5">
            <Legend c="#2c4553" t="Rivers — live pools (width = volume)" />
            <Legend c="#e8ff1e" t="Acid home — your home / active river" />
            <Legend c="#5f6f4d" t="Meadow — where homes cluster" />
            <p className="text-[10.5px] text-white/45 leading-relaxed pt-1.5 border-t border-line mt-2">
              {me
                ? 'Click any river to cast a net into that pool with your SOL. Fees pool at your home on the bank — reap them in My Nets. Drag to fly over the world.'
                : 'Sign in with Google (top-right) to get a wallet, deposit SOL, then click a river to cast a net and start collecting fees.'}
            </p>
          </div>
        </div>

        {/* floating market / nets / activity panels + dock */}
        {rivers.length > 0 && (
          <WorldPanels
            rivers={rivers}
            nets={nets}
            signedIn={!!me}
            onCast={setCast}
            onNetsChanged={reloadNets}
          />
        )}
      </div>

      {cast && <CastModal river={cast} onClose={() => setCast(null)} />}
      {mixOpen && <MixModal rivers={rivers} onClose={() => setMixOpen(false)} onDone={reloadNets} />}
    </div>
  )
}

function StatCell({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-surface px-3 py-2.5 min-w-0">
      <div className="eyebrow text-white/35 mb-1">{k}</div>
      <div className={`text-[13px] font-bold mono tnum truncate ${accent ? 'text-acid' : 'text-white'}`}>{v}</div>
    </div>
  )
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 shrink-0" style={{ background: c }} />
      <span className="text-[10.5px] text-white/60">{t}</span>
    </div>
  )
}
