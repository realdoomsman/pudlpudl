import { NextResponse } from 'next/server'

export const revalidate = 15

// Thin proxy to the PUDL backend (which applies the meme lens + boost merge).
const BACKEND =
  process.env.PUDL_API_URL ||
  process.env.NEXT_PUBLIC_PUDL_API_URL ||
  'https://pudl-production.up.railway.app'

export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get('all') === '1'
  try {
    const res = await fetch(`${BACKEND.replace(/\/$/, '')}/rivers${all ? '?all=1' : ''}`, {
      next: { revalidate: 15 },
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=45' },
    })
  } catch {
    return NextResponse.json({ error: 'rivers unavailable' }, { status: 502 })
  }
}
