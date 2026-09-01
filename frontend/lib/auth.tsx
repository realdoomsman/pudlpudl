'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { pudl, getToken, setToken, type Me } from '@/lib/pudl'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

interface AuthCtx {
  me: Me | null
  loading: boolean
  ready: boolean // google script loaded
  refresh: () => Promise<void>
  signOut: () => void
  promptSignIn: () => void
}
const Ctx = createContext<AuthCtx>({
  me: null,
  loading: true,
  ready: false,
  refresh: async () => {},
  signOut: () => {},
  promptSignIn: () => {},
})

export const useAuth = () => useContext(Ctx)

declare global {
  interface Window {
    google?: any
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setMe(null)
      setLoading(false)
      return
    }
    try {
      setMe(await pudl.me())
    } catch {
      setToken(null)
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCredential = useCallback(
    async (credential: string) => {
      setLoading(true)
      try {
        const res = await pudl.loginGoogle(credential)
        setToken(res.token)
        await refresh()
      } catch (e) {
        console.error('sign-in failed', e)
        setLoading(false)
      }
    },
    [refresh],
  )

  // load Google Identity Services once
  useEffect(() => {
    refresh()
    if (!GOOGLE_CLIENT_ID) {
      setReady(false)
      return
    }
    const existing = document.getElementById('gsi-script')
    const init = () => {
      if (!window.google) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (r: any) => handleCredential(r.credential),
        auto_select: false,
      })
      setReady(true)
    }
    if (existing) {
      init()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.id = 'gsi-script'
    s.onload = init
    document.head.appendChild(s)
  }, [refresh, handleCredential])

  const promptSignIn = useCallback(() => {
    if (window.google && ready) {
      window.google.accounts.id.prompt()
    }
  }, [ready])

  const signOut = useCallback(() => {
    pudl.logout().catch(() => {}) // revoke the bearer token server-side
    setToken(null)
    setMe(null)
    window.google?.accounts.id.disableAutoSelect?.()
  }, [])

  // poll balance/nets lightly while signed in
  useEffect(() => {
    if (!me) return
    const t = setInterval(refresh, 20_000)
    return () => clearInterval(t)
  }, [me, refresh])

  return (
    <Ctx.Provider value={{ me, loading, ready, refresh, signOut, promptSignIn }}>
      {children}
    </Ctx.Provider>
  )
}

/** Renders Google's official button into a div (falls back to a prompt). */
export function GoogleButton() {
  const { ready } = useAuth()
  useEffect(() => {
    if (!ready || !window.google) return
    const el = document.getElementById('gbtn')
    if (el) {
      el.innerHTML = ''
      window.google.accounts.id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
      })
    }
  }, [ready])
  return <div id="gbtn" />
}
