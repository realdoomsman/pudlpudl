export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[#0a0e27]">
        <div className="absolute top-20 left-10 w-[600px] h-[600px] bg-pudl-aqua/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-pudl-purple/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pudl-aqua/5 rounded-full blur-[100px] animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </main>
  )
}
