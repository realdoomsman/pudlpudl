'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Nav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="flex justify-between items-center p-6 glass mx-4 mt-4 rounded-2xl border border-white/10 sticky top-4 z-50 backdrop-blur-xl">
      <Link href="/" className="text-3xl font-black pudl-gradient-text glow-text tracking-tight hover:scale-105 transition-transform">
        PUDL
      </Link>
      <div className="flex gap-6 items-center">
        <NavLink href="/pools" active={isActive('/pools')}>Pools</NavLink>
        <NavLink href="/swap" active={isActive('/swap')}>Swap</NavLink>
        <NavLink href="/stake" active={isActive('/stake')}>Stake</NavLink>
        <NavLink href="/create" active={isActive('/create')}>Create</NavLink>
        <WalletMultiButton className="!bg-gradient-to-r !from-pudl-aqua !to-pudl-purple !rounded-xl !font-bold !px-6 hover:scale-105 transition-transform" />
      </div>
    </nav>
  )
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`font-semibold transition-all text-sm ${
        active 
          ? 'text-pudl-aqua scale-110' 
          : 'text-gray-300 hover:text-pudl-aqua'
      }`}
    >
      {children}
    </Link>
  )
}
