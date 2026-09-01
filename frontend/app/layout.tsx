import type { Metadata, Viewport } from 'next'
import { Archivo, Archivo_Black, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/app/providers'

const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans' })
const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL('https://pudl-web-production.up.railway.app'),
  title: 'PUDL — Be the house',
  description:
    'Every trade on Solana pays a fee, and somebody collects it. PUDL maps the rivers of memecoin volume live so you can cast liquidity where they flood — and be the one collecting.',
  openGraph: {
    title: 'PUDL — Be the house',
    description: 'Stop being exit liquidity. Cast nets where the volume floods and collect the fees.',
    type: 'website',
  },
  // no social image asset yet — use the plain summary card rather than a broken
  // large-image card that renders empty.
  twitter: { card: 'summary', title: 'PUDL — Be the house' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#000000' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${archivoBlack.variable} ${mono.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
