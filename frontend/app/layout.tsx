import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'

export const metadata: Metadata = {
  metadataBase: new URL('https://pudlpudl.vercel.app'),
  title: 'PUDL Protocol - Concentrated Liquidity AMM on Solana',
  description: 'Next-generation concentrated liquidity AMM on Solana. Trade tokens, provide liquidity, and earn rewards with PUDL Protocol.',
  keywords: ['Solana', 'DeFi', 'AMM', 'DEX', 'Concentrated Liquidity', 'PUDL', 'Trading', 'Liquidity'],
  authors: [{ name: 'PUDL Protocol' }],
  openGraph: {
    title: 'PUDL Protocol - Concentrated Liquidity AMM on Solana',
    description: 'Next-generation concentrated liquidity AMM on Solana',
    url: 'https://pudlpudl.vercel.app',
    siteName: 'PUDL Protocol',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PUDL Protocol - Concentrated Liquidity AMM on Solana',
    description: 'Next-generation concentrated liquidity AMM on Solana',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-pudl-aqua/10 to-pudl-purple/10">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
