import { ProductEditor } from '@/components/dashboard/ProductEditor'
import { LeadMagnetCreator } from '@/components/dashboard/LeadMagnetCreator'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PageProps {
  searchParams: Promise<{ type?: string; draftId?: string }>
}

export default async function AddProductPage({ searchParams }: PageProps) {
  const { type: productType, draftId } = await searchParams

  // Determine page title and description based on product type
  const getPageInfo = () => {
    switch (productType) {
      case 'FREE_LEAD':
        return {
          title: draftId ? 'Edit Lead Magnet' : 'Create Lead Magnet',
          description: draftId 
            ? 'Edit your lead magnet settings and content.'
            : 'Build a free resource to collect customer information and grow your email list.'
        }
      default:
        return {
          title: 'Add Product',
          description: 'Create a new digital product to sell on your bio page.'
        }
    }
  }

  const { title, description } = getPageInfo()

  return (
    <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/store">
              <Button variant="outline" size="sm">
                ← Back to Store
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>
        </div>

        {productType === 'FREE_LEAD' ? (
          <LeadMagnetCreator draftId={draftId} />
        ) : (
          <div className="max-w-4xl">
            <ProductEditor preselectedType={productType} />
          </div>
        )}
      </div>
  )
}