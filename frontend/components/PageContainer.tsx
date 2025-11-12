export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-pudl-dark">
      {children}
    </main>
  )
}
