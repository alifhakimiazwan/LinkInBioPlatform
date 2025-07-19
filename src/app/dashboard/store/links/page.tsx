import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LinksPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/store">
              <Button variant="outline" size="sm">
                ← Back to Store
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Links</h1>
              <p className="text-gray-600">Add and organize the links that appear on your bio page.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Links management coming soon</h3>
            <p className="text-gray-600 mb-4">
              This feature will allow you to add and organize custom links on your bio page.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}