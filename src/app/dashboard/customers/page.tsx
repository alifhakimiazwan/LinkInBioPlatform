import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Management</h2>
          <p className="text-gray-600">
            Customer management features will be implemented here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}