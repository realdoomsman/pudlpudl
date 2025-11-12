'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Nav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b border-white/5 backdrop-blur-xl bg-pudl-dark/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-white">
          PUDL
        </Link>
        <div className="flex items-center gap-8">
          <NavLink href="/pools" active={isActive('/pools')}>Pools</NavLink>
          <NavLink href="/swap" active={isActive('/swap')}>Swap</NavLink>
          <NavLink href="/stake" active={isActive('/stake')}>Stake</NavLink>
          <NavLink href="/create" active={isActive('/create')}>Create</NavLink>
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`text-sm transition-colors ${
        active 
          ? 'text-white' 
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}
