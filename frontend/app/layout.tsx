import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/app/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PUDL Protocol | Deep Liquidity on Solana',
  description: 'Revolutionary DLMM technology meets lightning-fast swaps. Trade, earn, and govern with PUDL Protocol on Solana.',
  keywords: ['Solana', 'DeFi', 'DEX', 'DLMM', 'Liquidity', 'Swap', 'Trading', 'PUDL'],
  authors: [{ name: 'PUDL Protocol' }],
  openGraph: {
    title: 'PUDL Protocol | Deep Liquidity on Solana',
    description: 'Revolutionary DLMM technology meets lightning-fast swaps on Solana',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PUDL Protocol',
    description: 'Deep Liquidity on Solana',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#00E0B8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
