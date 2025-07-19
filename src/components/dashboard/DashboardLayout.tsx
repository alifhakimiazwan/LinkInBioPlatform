import { requireAuth } from '@/lib/auth'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}