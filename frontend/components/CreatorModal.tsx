'use client'

// Creator tools: fund a BOOST on a river (real SOL escrowed + streamed to its
// LPs) or CREATE a river (seed a Raydium pool for a token that has none). Both
// move real funds, so both are gated server-side until the launch test — the UI
// surfaces that honestly instead of pretending.

import { useEffect, useState } from 'react'
import { pudl, type TokenBal } from '@/lib/pudl'
import { useAuth } from '@/lib/auth'
import { shortMint, type River } from '@/lib/rivers'

type Tab = 'boost' | 'create'

export function CreatorModal({ rivers, onClose }: { rivers: River[]; onClose: () => void }) {
  const { me, promptSignIn } = useAuth()
  const [tab, setTab] = useState<Tab>('boost')
  const castable = rivers.filter((r) => !r.venue || r.venue === 'raydium')

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md border border-hair bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow text-white/40">Creator tools</div>
            <div className="display text-xl mt-0.5">Feed the rivers.</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white text-lg leading-none px-1">×</button>
        </div>

        <div className="flex gap-px bg-line border border-line mb-4">
          {(['boost', 'create'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 eyebrow py-2 transition-colors ${tab === t ? 'text-acidink bg-acid' : 'bg-surface text-white/50 hover:text-white'}`}
            >
              {t === 'boost' ? 'Boost a river' : 'Create a river'}
            </button>
          ))}
        </div>

        {tab === 'boost' ? (
          <BoostTab rivers={castable} me={me} promptSignIn={promptSignIn} />
        ) : (
          <CreateTab me={me} promptSignIn={promptSignIn} />
        )}
      </div>
    </div>
  )
}

function Notice({ kind, text }: { kind: 'info' | 'error' | 'ok'; text: string }) {
  const color = kind === 'error' ? '#ff5a7a' : kind === 'ok' ? '#e8ff1e' : '#5ad1ff'
  return (
    <div className="mt-3 border px-3 py-2 text-[12px] leading-relaxed break-words" style={{ color, borderColor: color + '44' }}>
      {text}
    </div>
  )
}

// distinguish "gated until launch" (a 503 telling us it opens at launch) from a
// real failure, so we can present it calmly.
const isLaunchGate = (msg: string) => /launch/i.test(msg)

function BoostTab({ rivers, me, promptSignIn }: { rivers: River[]; me: any; promptSignIn: () => void }) {
  const [poolId, setPoolId] = useState(rivers[0]?.id ?? '')
  const [amount, setAmount] = useState('0.25')
  const [days, setDays] = useState('7')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'info' | 'error' | 'ok'; text: string } | null>(null)

  const amt = parseFloat(amount) || 0
  const submit = async () => {
    setMsg(null)
    if (!me) return promptSignIn()
    if (!poolId) return setMsg({ kind: 'error', text: 'Pick a river to boost.' })
    if (amt <= 0) return setMsg({ kind: 'error', text: 'Enter an amount.' })
    setBusy(true)
    try {
      const r = await pudl.boost(poolId, amt, parseInt(days) || 7, label.trim() || (me?.name ?? 'sponsor'))
      setMsg({ kind: 'ok', text: 'Boost funded — escrowed and streaming to this river’s LPs.' + (r.escrowSig ? ' · ' + r.escrowSig.slice(0, 8) + '…' : '') })
    } catch (e: any) {
      const t = String(e?.message || 'failed')
      setMsg(isLaunchGate(t) ? { kind: 'info', text: t } : { kind: 'error', text: t })
    }
    setBusy(false)
  }

  return (
    <>
      <p className="text-[12px] text-white/50 leading-relaxed mb-3">
        Escrow a pot of SOL and stream it to everyone providing liquidity to this river. It’s how a
        token creator buys real, sticky liquidity — <span className="text-white">fees flow downhill</span>.
      </p>
      <Field label="River">
        <select value={poolId} onChange={(e) => setPoolId(e.target.value)} className="w-full bg-black/40 border border-hair px-2 py-2 text-sm outline-none">
          {rivers.length === 0 && <option value="">no castable rivers loaded</option>}
          {rivers.slice(0, 60).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Pot (SOL)">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/40 border border-hair px-2 py-2 text-sm mono outline-none" />
        </Field>
        <Field label="Over (days)">
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="w-full bg-black/40 border border-hair px-2 py-2 text-sm mono outline-none" />
        </Field>
      </div>
      <Field label="Shown as (label)">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={me?.name || 'sponsor'} className="w-full bg-black/40 border border-hair px-2 py-2 text-sm outline-none placeholder:text-white/25" />
      </Field>
      {me && <div className="text-[11px] text-white/30 mt-1">Balance {me.sol.toFixed(3)} SOL</div>}
      {msg && <Notice kind={msg.kind} text={msg.text} />}
      <button onClick={submit} disabled={busy} className="mt-4 w-full py-3 eyebrow text-acidink disabled:opacity-60" style={{ background: '#e8ff1e' }}>
        {busy ? 'Funding…' : me ? 'Fund boost' : 'Sign in to boost'}
      </button>
    </>
  )
}

function CreateTab({ me, promptSignIn }: { me: any; promptSignIn: () => void }) {
  const [tokens, setTokens] = useState<TokenBal[] | null>(null)
  const [mint, setMint] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [solAmount, setSolAmount] = useState('0.5')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'info' | 'error' | 'ok'; text: string } | null>(null)

  useEffect(() => {
    if (!me) return
    pudl.tokens().then((r) => setTokens(r.tokens)).catch(() => setTokens([]))
  }, [me])

  const submit = async () => {
    setMsg(null)
    if (!me) return promptSignIn()
    if (!mint.trim()) return setMsg({ kind: 'error', text: 'Pick or paste the token to pair with SOL.' })
    const t = parseFloat(tokenAmount) || 0
    const s = parseFloat(solAmount) || 0
    if (t <= 0 || s <= 0) return setMsg({ kind: 'error', text: 'Enter how much of each side to seed.' })
    setBusy(true)
    try {
      const r = await pudl.createPool(mint.trim(), t, s)
      setMsg({ kind: 'ok', text: 'River created.' + (r.poolId ? ' Pool ' + shortMint(r.poolId) : '') + (r.txId ? ' · ' + r.txId.slice(0, 8) + '…' : '') })
    } catch (e: any) {
      const msgt = String(e?.message || 'failed')
      setMsg(isLaunchGate(msgt) ? { kind: 'info', text: msgt } : { kind: 'error', text: msgt })
    }
    setBusy(false)
  }

  return (
    <>
      <p className="text-[12px] text-white/50 leading-relaxed mb-3">
        Seed a brand-new river for a token that has no pool. You deposit both sides — the token and
        SOL — and a Raydium pool is born, castable by everyone on the map.
      </p>
      <Field label="Token">
        {tokens && tokens.length > 0 ? (
          <select value={mint} onChange={(e) => setMint(e.target.value)} className="w-full bg-black/40 border border-hair px-2 py-2 text-sm outline-none">
            <option value="">— pick a token you hold —</option>
            {tokens.map((t) => (
              <option key={t.mint} value={t.mint}>{shortMint(t.mint)} · {t.amount}</option>
            ))}
          </select>
        ) : (
          <input value={mint} onChange={(e) => setMint(e.target.value)} placeholder="paste the token address" spellCheck={false} className="w-full bg-black/40 border border-hair px-2 py-2 text-xs mono outline-none placeholder:text-white/25" />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Token amount">
          <input type="number" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} className="w-full bg-black/40 border border-hair px-2 py-2 text-sm mono outline-none" />
        </Field>
        <Field label="SOL amount">
          <input type="number" value={solAmount} onChange={(e) => setSolAmount(e.target.value)} className="w-full bg-black/40 border border-hair px-2 py-2 text-sm mono outline-none" />
        </Field>
      </div>
      <p className="text-[10.5px] text-white/30 mt-1 leading-relaxed">
        The starting price is set by your ratio of token to SOL. Creating a pool also costs a small
        Raydium fee (~0.15 SOL). This is irreversible.
      </p>
      {me && <div className="text-[11px] text-white/30 mt-1">Balance {me.sol.toFixed(3)} SOL</div>}
      {msg && <Notice kind={msg.kind} text={msg.text} />}
      <button onClick={submit} disabled={busy} className="mt-4 w-full py-3 eyebrow text-acidink disabled:opacity-60" style={{ background: '#e8ff1e' }}>
        {busy ? 'Creating…' : me ? 'Create river' : 'Sign in to create'}
      </button>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5">
      <label className="eyebrow text-white/40">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
