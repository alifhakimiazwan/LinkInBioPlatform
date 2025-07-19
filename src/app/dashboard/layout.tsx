import { requireAuth } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Handle auth once at the layout level
  const user = await requireAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}