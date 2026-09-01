'use client'

import { useState } from 'react'
import { useAuth, GoogleButton } from '@/lib/auth'

export function AccountBar() {
  const { me, loading, promptSignIn, signOut, ready } = useAuth()
  const [open, setOpen] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [copied, setCopied] = useState(false)

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
