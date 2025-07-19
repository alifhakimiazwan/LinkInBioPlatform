import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function IncomePage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <p className="text-gray-600">Track your earnings and revenue.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Income Dashboard</h2>
          <p className="text-gray-600">
            Income tracking features will be implemented here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}