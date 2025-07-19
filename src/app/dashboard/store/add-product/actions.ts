'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProductAction(formData: FormData) {
  const user = await requireAuth()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const type = formData.get('type') as string
  const imageUrl = formData.get('imageUrl') as string || null
  const imagePath = formData.get('imagePath') as string || null
  const fileUrl = formData.get('fileUrl') as string || null
  const filePath = formData.get('filePath') as string || null

  // Basic validation
  if (!title || !price || !type) {
    throw new Error('Please fill in all required fields')
  }

  if (price < 0) {
    throw new Error('Price must be a positive number')
  }

  // Create product
  await prisma.product.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      price,
      type: type as 'EBOOK' | 'COURSE' | 'TEMPLATE' | 'CONSULTATION' | 'WEBINAR' | 'SUBSCRIPTION' | 'PHYSICAL',
      currency: 'USD',
      isActive: true,
      imageUrl,
      imagePath,
      fileUrl,
      filePath,
    }
  })

  revalidatePath('/dashboard/store')
  redirect('/dashboard/store')
}