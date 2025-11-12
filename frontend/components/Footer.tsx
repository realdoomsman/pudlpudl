export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-2xl font-black pudl-gradient-text mb-2">PUDL</p>
            <p className="text-gray-500 text-sm">Permissionless liquidity on Solana</p>
          </div>
          <div className="flex gap-6">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-pudl-aqua transition-colors font-semibold"
            >
              Twitter
            </a>
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-pudl-aqua transition-colors font-semibold"
            >
              Discord
            </a>
            <a 
              href="https://docs.pudl.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-pudl-aqua transition-colors font-semibold"
            >
              Docs
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-pudl-aqua transition-colors font-semibold"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
