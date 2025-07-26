import { PageHeader } from '@/components/ui/PageHeader'
import { requireAuth } from '@/lib/auth'

export default async function CustomersPage() {
  const user = await requireAuth()
  
  return (
      <div className="max-w-7xl p-6">
        <PageHeader 
          title="Customers" 
          description="Manage your customer relationships."
          username={user.dbUser?.username || ''}
        />

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Management</h2>
          <p className="text-gray-600">
            Customer management features will be implemented here.
          </p>
        </div>
      </div>
  )
}