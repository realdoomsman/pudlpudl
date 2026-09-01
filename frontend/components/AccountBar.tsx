'use client'

import { useState } from 'react'
import { useAuth, GoogleButton } from '@/lib/auth'
import { pudl } from '@/lib/pudl'

export function AccountBar() {
  const { me, loading, promptSignIn, signOut, ready, refresh } = useAuth()
  const [open, setOpen] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wto, setWto] = useState('')
  const [wamt, setWamt] = useState('')
  const [wbusy, setWbusy] = useState(false)
  const [wmsg, setWmsg] = useState<{ ok: boolean; text: string } | null>(null)

  const doWithdraw = async () => {
    setWbusy(true)
    setWmsg(null)
    try {
      const r = await pudl.withdraw(wto.trim(), parseFloat(wamt) || 0)
      setWmsg({ ok: true, text: 'Sent · ' + r.sig.slice(0, 8) + '…' })
      setWamt('')
      refresh()
    } catch (e: any) {
      setWmsg({ ok: false, text: String(e?.message || 'withdraw failed') })
    }
    setWbusy(false)
  }

  if (loading) {
    return <div className="w-24 h-9 rounded-full bg-white/5 animate-pulse" />
  }

  if (!me) {
    return (
      <div className="flex items-center">
        {ready ? (
          <GoogleButton />
        ) : (
          <button
            onClick={promptSignIn}
            className="px-4 py-2 text-sm font-semibold text-black"
            style={{ backgroundColor: '#e8ff1e' }}
          >
            Sign in
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 border border-hair bg-deep/70 pl-2.5 pr-3 py-1.5 hover:border-white/25 transition-colors"
      >
        {me.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.picture} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-flood/30" />
        )}
        <span className="text-sm font-mono font-semibold">{me.sol.toFixed(3)} SOL</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 border border-hair bg-deep shadow-2xl z-50 p-4">
            <div className="flex items-center gap-3 mb-4">
              {me.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.picture} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-flood/30" />
              )}
              <div className="min-w-0">
                <div className="font-semibold truncate">{me.name}</div>
                <div className="text-xs text-gray-500 truncate">{me.email}</div>
              </div>
            </div>

            <div className="rounded-xl bg-abyss/60 border border-white/5 p-3 mb-3">
              <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
                Your balance
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: '#e8ff1e' }}>
                {me.sol.toFixed(4)} <span className="text-sm text-gray-500">SOL</span>
              </div>
            </div>

            <button
              onClick={() => setShowDeposit((v) => !v)}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-black mb-2"
              style={{ backgroundColor: '#e8ff1e' }}
            >
              Deposit SOL
            </button>

            {showDeposit && (
              <div className="rounded-xl bg-abyss/60 border border-white/5 p-3 mb-2">
                <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
                  Send SOL to your PUDL address
                </div>
                <div className="font-mono text-xs break-all text-gray-300 mb-2">
                  {me.depositAddress}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(me.depositAddress).catch(() => {})
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className="w-full rounded-lg border border-white/15 py-2 text-xs font-semibold hover:border-white/30"
                >
                  {copied ? 'Copied ✓' : 'Copy address'}
                </button>
                <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                  Solana only. Your balance updates a few seconds after it lands.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowWithdraw((v) => !v)}
              className="w-full border border-acid/40 text-acid py-2.5 text-sm font-semibold mb-2 hover:bg-acid/[0.08] transition-colors"
            >
              Withdraw SOL
            </button>

            {showWithdraw && (
              <div className="bg-abyss/60 border border-white/5 p-3 mb-2 space-y-2">
                <div className="text-[11px] uppercase tracking-widest text-gray-500">Send to a Solana address</div>
                <input
                  value={wto}
                  onChange={(e) => setWto(e.target.value)}
                  placeholder="destination address"
                  spellCheck={false}
                  className="w-full bg-black/40 border border-white/10 px-2 py-2 text-xs font-mono outline-none placeholder:text-white/25"
                />
                <div className="flex gap-2">
                  <input
                    value={wamt}
                    onChange={(e) => setWamt(e.target.value)}
                    type="number"
                    placeholder="0.0"
                    className="flex-1 bg-black/40 border border-white/10 px-2 py-2 text-sm font-mono outline-none"
                  />
                  <button
                    onClick={() => setWamt(Math.max(me.sol - 0.001, 0).toFixed(4))}
                    className="text-[10px] font-semibold tracking-wider text-acid px-2 border border-white/10 hover:border-acid/40"
                  >
                    MAX
                  </button>
                </div>
                <button
                  onClick={doWithdraw}
                  disabled={wbusy || !wto.trim() || !(parseFloat(wamt) > 0)}
                  className="w-full py-2 text-sm font-semibold text-black disabled:opacity-50"
                  style={{ backgroundColor: '#e8ff1e' }}
                >
                  {wbusy ? 'Sending…' : 'Withdraw'}
                </button>
                {wmsg && (
                  <div className="text-[11px] break-all" style={{ color: wmsg.ok ? '#e8ff1e' : '#ff5a7a' }}>{wmsg.text}</div>
                )}
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Sends SOL from your PUDL wallet on Solana. Double-check the address — transfers can&rsquo;t be undone.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                signOut()
                setOpen(false)
              }}
              className="w-full text-sm text-gray-500 hover:text-white py-2 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
