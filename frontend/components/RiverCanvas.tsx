'use client'

// The water. A live canvas of the top rivers: each band is a real pool, its
// thickness is its share of volume, its speed is how hard it's running
// (volume/TVL), its color is its flow class. Pure visual — the data is the
// same live snapshot the tables use.

import { useEffect, useRef } from 'react'
import type { River } from '@/lib/rivers'

interface Props {
  rivers: River[]
  className?: string
}

const COLORS: Record<River['flow'], [number, number, number]> = {
  'FLASH FLOOD': [56, 232, 255], // flood cyan
  SURGE: [56, 232, 255],
  FLOWING: [20, 241, 149], // current green
  CALM: [110, 140, 160],
}

interface Particle {
  x: number
  band: number
  speed: number
  size: number
  alpha: number
}

export function RiverCanvas({ rivers, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const riversRef = useRef<River[]>([])
  riversRef.current = rivers

  useEffect(() => {
    const cnv = canvasRef.current
    if (!cnv) return
    const context = cnv.getContext('2d')
    if (!context) return
    // re-bind through explicitly non-null locals so TS keeps the narrowing
    // inside the nested closures below
    const canvas: HTMLCanvasElement = cnv
    const ctx: CanvasRenderingContext2D = context

    const reduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let particles: Particle[] = []
    let bands: { y: number; h: number; color: [number, number, number]; speed: number }[] = []
    let w = 0
    let h = 0

    function resize() {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layout()
    }

    function layout() {
      const rs = riversRef.current.slice(0, 7)
      if (!rs.length) {
        bands = []
        particles = []
        return
      }
      const totalVol = rs.reduce((s, r) => s + Math.sqrt(r.vol24h), 0) || 1
      let y = h * 0.06
      const usable = h * 0.88
      bands = rs.map((r) => {
        const bh = Math.max(10, (Math.sqrt(r.vol24h) / totalVol) * usable)
        const band = {
          y,
          h: bh,
          color: COLORS[r.flow],
          speed: Math.min(4.5, 0.35 + Math.log10(1 + r.vol24h / Math.max(r.tvl, 1)) * 2.2),
        }
        y += bh + usable * 0.025
        return band
      })
      particles = []
      bands.forEach((b, i) => {
        const count = Math.round((b.h / 10) * 14)
        for (let k = 0; k < count; k++) {
          particles.push({
            x: Math.random() * w,
            band: i,
            speed: b.speed * (0.6 + Math.random() * 0.8),
            size: 0.6 + Math.random() * 1.6,
            alpha: 0.25 + Math.random() * 0.55,
          })
        }
      })
    }

    function frame() {
      ctx.clearRect(0, 0, w, h)
      for (const b of bands) {
        const [r, g, bl] = b.color
        const grad = ctx.createLinearGradient(0, b.y, 0, b.y + b.h)
        grad.addColorStop(0, `rgba(${r},${g},${bl},0)`)
        grad.addColorStop(0.5, `rgba(${r},${g},${bl},0.045)`)
        grad.addColorStop(1, `rgba(${r},${g},${bl},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(0, b.y, w, b.h)
      }
      for (const p of particles) {
        const b = bands[p.band]
        if (!b) continue
        if (!reduced) p.x += p.speed
        if (p.x > w + 4) p.x = -4
        const [r, g, bl] = b.color
        const yy = b.y + ((p.size * 7919) % b.h)
        ctx.fillStyle = `rgba(${r},${g},${bl},${p.alpha})`
        ctx.fillRect(p.x, yy, p.size * 3.2, p.size * 0.9)
      }
      raf = requestAnimationFrame(frame)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const relayout = setInterval(layout, 15_000) // pick up fresh data
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(relayout)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
