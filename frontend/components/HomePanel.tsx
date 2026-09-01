'use client'

import { useEffect, useState } from 'react'
import { pudl, type HomeMine } from '@/lib/pudl'
import { useAuth } from '@/lib/auth'
import { fmtSol } from '@/lib/rivers'

export function HomePanel() {
  const { me } = useAuth()
  const [data, setData] = useState<HomeMine | null>(null)
  const [joinId, setJoinId] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const load = () => pudl.homeMine().then(setData).catch(() => {})
  useEffect(() => {
    if (!me) return setData(null)
    load()
    const t = setInterval(load, 12_000)
    return () => clearInterval(t)
  }, [me])

  if (!me) return <div className="p-4 text-xs text-white/45 text-center">Sign in to claim a home.</div>
  if (!data) return <div className="p-4 text-xs text-white/45 text-center animate-pulse">reading your home…</div>

  const { home, members, stats } = data
  const isOwner = home.ownerSub === me.sub
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/rivers?join=${home.id}` : ''

  return (
    <div className="p-3 space-y-3">
      {/* name + kind */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5" style={{ background: home.color, boxShadow: `0 0 10px ${home.color}` }} />
        {renaming ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={async () => { if (nameDraft.trim()) { try { await pudl.homeRename(nameDraft.trim()) } catch (e: any) { setErr(String(e?.message || 'could not rename')) }; load() } setRenaming(false) }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="flex-1 bg-transparent border-b border-hair text-sm font-bold outline-none"
          />
        ) : (
          <button
            onClick={() => { if (isOwner) { setNameDraft(home.name); setRenaming(true) } }}
            className="text-sm font-bold text-left flex-1 truncate"
          >
            {home.name}
          </button>
        )}
        <span className="eyebrow text-white/40">{home.kind}</span>
      </div>

      {/* the take */}
      <div className="border border-hair bg-sunk p-3">
        <div className="eyebrow text-white/40 mb-1">Collected</div>
        <div className="display text-2xl text-acid tnum">{fmtSol(stats.collected)}</div>
        <div className="rule my-2.5" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="eyebrow text-white/40">Staked</div>
            <div className="mono tnum">{stats.staked.toFixed(2)} SOL</div>
          </div>
          <div>
            <div className="eyebrow text-white/40">Live nets</div>
            <div className="mono tnum">{stats.live}</div>
          </div>
        </div>
      </div>

      {/* crew */}
      <div>
        <div className="eyebrow text-white/40 mb-2">Crew · {members.length}</div>
        <div className="space-y-1">
          {members.map((m) => {
            const contrib = stats.contributions.find((c) => c.sub === m.sub)?.amt || 0
            const share = stats.staked > 0 ? (contrib / stats.staked) * 100 : 0
            return (
              <div key={m.sub} className="flex items-center gap-2">
                {m.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.picture} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                )}
                <span className="text-xs flex-1 truncate">{m.name}{m.sub === home.ownerSub ? ' ·' : ''}</span>
                {stats.staked > 0 && <span className="mono text-[10px] text-white/50 tnum">{share.toFixed(0)}%</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* controls */}
      <div className="rule pt-3 space-y-2">
        {home.kind === 'solo' && isOwner && (
          <button
            disabled={busy}
            onClick={async () => { setBusy(true); try { await pudl.homeOpen() } catch {}; setBusy(false); load() }}
            className="w-full bg-acid text-acidink text-xs font-semibold py-2 disabled:opacity-60"
          >
            Open to a crew (co-op)
          </button>
        )}
        {home.kind === 'coop' && (
          <button
            onClick={() => { navigator.clipboard?.writeText(inviteLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            className="w-full border border-acid/40 text-acid text-xs font-semibold py-2"
          >
            {copied ? 'Invite link copied ✓' : 'Copy crew invite link'}
          </button>
        )}
        <div className="flex gap-2">
          <input
            value={joinId}
            onChange={(e) => { setJoinId(e.target.value); setErr(null) }}
            placeholder="join a crew (id or invite link)"
            className="flex-1 bg-sunk border border-hair px-2 py-1.5 text-xs outline-none placeholder:text-white/25"
          />
          <button
            disabled={busy || !joinId.trim()}
            onClick={async () => {
              setBusy(true); setErr(null)
              // accept a bare home id OR a pasted invite URL (…/rivers?join=<id>)
              const raw = joinId.trim()
              const m = raw.match(/[?&]join=([^&\s]+)/)
              const id = m ? decodeURIComponent(m[1]) : raw
              try { await pudl.homeJoin(id); setJoinId('') } catch (e: any) { setErr(String(e?.message || 'could not join')) }
              setBusy(false); load()
            }}
            className="border border-hair text-xs px-3 py-1.5 hover:border-white/30 disabled:opacity-40"
          >
            Join
          </button>
        </div>
        {err && <div className="text-[11px] text-danger">{err}</div>}
        {home.members.length > 1 && (
          <button
            onClick={async () => { setErr(null); try { await pudl.homeLeave() } catch (e: any) { setErr(String(e?.message || 'could not leave')) }; load() }}
            className="w-full text-[11px] text-white/40 hover:text-danger py-1"
          >
            Leave this home
          </button>
        )}
      </div>
    </div>
  )
}
