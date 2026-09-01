'use client'

import { useEffect, useState } from 'react'
import type { RiversSnapshot } from '@/lib/rivers'

const POLL_MS = 30_000

export function useRivers() {
  const [snapshot, setSnapshot] = useState<RiversSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch('/api/rivers')
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as RiversSnapshot
        if (alive) {
          setSnapshot(data)
          setError(null)
        }
      } catch {
        if (alive) setError('Live feed unavailable — retrying')
      }
    }
    load()
    const t = setInterval(load, POLL_MS)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  return { snapshot, error, loading: !snapshot && !error }
}
