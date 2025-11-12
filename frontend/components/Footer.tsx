export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          2024 PUDL Protocol. Built on Solana.
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
            Documentation
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
            Twitter
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
            Discord
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
