import { PageHeader } from '@/components/ui/PageHeader'
import { requireAuth } from '@/lib/auth'

export default async function IncomePage() {
  const user = await requireAuth()
  
  return (
      <div className="max-w-7xl p-6">
        <PageHeader 
          title="Income" 
          description="Track your earnings and revenue."
          username={user.dbUser?.username || ''}
        />

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Income Dashboard</h2>
          <p className="text-gray-600">
            Income tracking features will be implemented here.
          </p>
        </div>
      </div>
  )
}