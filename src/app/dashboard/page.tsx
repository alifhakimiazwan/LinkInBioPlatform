import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()
  
  return (
    <div className="max-w-7xl mx-auto p-6">
        <PageHeader 
          title="Dashboard" 
          description="Welcome back! Here's what's happening with your bio page."
          username={user.dbUser?.username || ''}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Manage Links
            </h3>
            <p className="text-gray-600 mb-4">
              Add, edit, and organize your links
            </p>
            <Link href="/dashboard/store">
              <Button>Manage Links</Button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Digital Products
            </h3>
            <p className="text-gray-600 mb-4">
              Sell ebooks, courses, and more
            </p>
            <Link href="/dashboard/store">
              <Button>Add Product</Button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              View Analytics
            </h3>
            <p className="text-gray-600 mb-4">
              Track clicks and performance
            </p>
            <Link href="/dashboard/analytics">
              <Button variant="outline">View Stats</Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Your Bio Page
          </h3>
          <p className="text-blue-700 mb-4">
            Your link-in-bio page will be available at:
          </p>
          <code className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
            {process.env.NODE_ENV === 'development' 
              ? `http://localhost:3000/[username]`
              : `https://yoursite.com/[username]`
            }
          </code>
        </div>
      </div>
  )
}