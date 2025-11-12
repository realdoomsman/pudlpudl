import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'

export const metadata: Metadata = {
  title: 'PudlPudl - Jump into the Pudl',
  description: 'Permissionless DLMM liquidity on Solana',
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
