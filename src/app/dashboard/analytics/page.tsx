import { PageHeader } from '@/components/ui/PageHeader'
import { requireAuth } from '@/lib/auth'

export default async function AnalyticsPage() {
  const user = await requireAuth()
  
  return (
      <div className="max-w-7xl p-6">
        <PageHeader 
          title="Analytics" 
          description="View detailed analytics about your bio page."
          username={user.dbUser?.username || ''}
        />

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Analytics features will be implemented here.
          </p>
        </div>
      </div>
  )
}