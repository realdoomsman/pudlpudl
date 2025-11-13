import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          <div>
            <div className="text-base font-bold text-white mb-3">PUDL</div>
            <p className="text-xs text-gray-500 mb-4">Concentrated liquidity AMM on Solana</p>
            <div className="flex gap-3">
              <a 
                href="https://x.com/PUDLfun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://github.com/realdoomsman/pudlpudl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">Protocol</div>
            <div className="space-y-2">
              <Link href="/pools" className="block text-xs text-gray-500 hover:text-white transition-colors">Pools</Link>
              <Link href="/swap" className="block text-xs text-gray-500 hover:text-white transition-colors">Swap</Link>
              <Link href="/stake" className="block text-xs text-gray-500 hover:text-white transition-colors">Stake</Link>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">Developers</div>
            <div className="space-y-2">
              <a href="https://github.com/realdoomsman/pudlpudl" target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-500 hover:text-white transition-colors">GitHub</a>
              <Link href="/create" className="block text-xs text-gray-500 hover:text-white transition-colors">Create Pool</Link>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">Community</div>
            <div className="space-y-2">
              <a href="https://x.com/PUDLfun" target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-500 hover:text-white transition-colors">Twitter</a>
              <Link href="/referrals" className="block text-xs text-gray-500 hover:text-white transition-colors">Referrals</Link>
              <Link href="/portfolio" className="block text-xs text-gray-500 hover:text-white transition-colors">Portfolio</Link>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-500">© 2024 PUDL Protocol. All rights reserved.</div>
          <div className="flex gap-4 text-xs">
            <a href="https://x.com/PUDLfun" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Follow us on X</a>
            <a href="https://github.com/realdoomsman/pudlpudl" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">View on GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
