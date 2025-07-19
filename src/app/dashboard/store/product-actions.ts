'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function deleteProductAction(productId: string) {
  const user = await requireAuth()
  
  try {
    // Verify the product belongs to the user before deleting
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: user.id
      }
    })

    if (!product) {
      return { success: false, error: 'Product not found or unauthorized' }
    }

    // Delete the product
    await prisma.product.delete({
      where: {
        id: productId,
        userId: user.id
      }
    })

    revalidatePath('/dashboard/store')
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: 'Failed to delete product' }
  }
}