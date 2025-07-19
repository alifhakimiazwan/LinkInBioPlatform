import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">View detailed analytics about your bio page.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Analytics features will be implemented here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}