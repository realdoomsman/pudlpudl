'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AccountBar } from '@/components/AccountBar'

export function Nav() {
  const pathname = usePathname()
  const active = (p: string) => pathname === p

  return (
    <nav className="border-b border-dash bg-black/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1760px] mx-auto pl-3.5 pr-3 md:pl-5 md:pr-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="display text-[13px] leading-none bg-acid text-acidink px-2 pt-[5px] pb-1">PUDL</span>
        </Link>
        <div className="flex items-center gap-2.5 md:gap-3">
          <NavLink href="/rivers" active={active('/rivers')}>Rivers</NavLink>
          <NavLink href="/board" active={active('/board')}>Board</NavLink>
          <AccountBar />
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`eyebrow border px-2.5 py-[7px] transition-colors ${
        active
          ? 'text-acid border-acid/35 bg-acid/[0.09]'
          : 'text-white/55 border-hair bg-surface hover:text-acid hover:border-acid/35'
      }`}
    >
      {children}
    </Link>
  )
}
