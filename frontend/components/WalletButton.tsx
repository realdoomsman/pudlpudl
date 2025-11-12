'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEffect, useState } from 'react'

export default function WalletButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-pudl-green text-black rounded-lg font-semibold text-sm px-4 py-2">
        Connect Wallet
      </div>
    )
  }

  return (
    <WalletMultiButton className="!bg-pudl-green !text-black !rounded-lg !font-semibold !text-sm !px-4 !py-2" />
  )
}
