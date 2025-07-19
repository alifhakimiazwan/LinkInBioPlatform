'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function saveDraftAction(formData: FormData) {
  const user = await requireAuth()
  
  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  const buttonText = formData.get('buttonText') as string
  const deliveryType = formData.get('deliveryType') as string
  const redirectUrl = formData.get('redirectUrl') as string
  const formFields = formData.get('formFields') as string
  const productType = formData.get('productType') as string
  const imageUrl = formData.get('imageUrl') as string
  const fileUrl = formData.get('fileUrl') as string
  const fileName = formData.get('fileName') as string
  const currentStep = formData.get('currentStep') as string

  try {
    // Create or update draft product
    const draftProduct = await prisma.product.create({
      data: {
        userId: user.id,
        title: title || 'Untitled Draft',
        description: subtitle || '',
        price: new Prisma.Decimal(0), // Free for lead magnets
        type: productType === 'FREE_LEAD' ? 'FREE_LEAD' : 'DIGITAL',
        imageUrl: imageUrl || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        subtitle: subtitle || null,
        buttonText: buttonText || 'Get Free Download',
        deliveryType: deliveryType || 'upload',
        redirectUrl: redirectUrl || null,
        formFields: formFields ? JSON.parse(formFields) : null,
        currentStep: currentStep ? parseInt(currentStep) : 1,
        isDraft: true,
        isActive: false, // Drafts are not active
      }
    })

    revalidatePath('/dashboard/store')
    return { success: true, productId: draftProduct.id }
  } catch (error) {
    console.error('Error saving draft:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save draft' 
    }
  }
}

export async function updateDraftAction(formData: FormData) {
  const user = await requireAuth()
  
  const productId = formData.get('productId') as string
  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  const buttonText = formData.get('buttonText') as string
  const deliveryType = formData.get('deliveryType') as string
  const redirectUrl = formData.get('redirectUrl') as string
  const formFields = formData.get('formFields') as string
  const imageUrl = formData.get('imageUrl') as string
  const fileUrl = formData.get('fileUrl') as string
  const fileName = formData.get('fileName') as string
  const currentStep = formData.get('currentStep') as string

  try {
    // First get existing product to preserve imageUrl if new one not provided
    const existingDraft = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: user.id,
        // Remove isDraft requirement to allow editing published products
      }
    })

    if (!existingDraft) {
      return { success: false, error: 'Product not found' }
    }

    // Update existing draft
    await prisma.product.update({
      where: {
        id: productId,
        userId: user.id, // Ensure user owns this product
      },
      data: {
        title: title || 'Untitled Draft',
        description: subtitle || '',
        imageUrl: imageUrl || existingDraft.imageUrl, // Preserve existing if no new image
        fileUrl: fileUrl || existingDraft.fileUrl, // Preserve existing if no new file
        fileName: fileName || existingDraft.fileName, // Preserve existing if no new file
        subtitle: subtitle || null,
        buttonText: buttonText || 'Get Free Download',
        deliveryType: deliveryType || 'upload',
        redirectUrl: redirectUrl || null,
        formFields: formFields ? JSON.parse(formFields) : null,
        currentStep: currentStep ? parseInt(currentStep) : existingDraft.currentStep,
        updatedAt: new Date(),
      }
    })

    revalidatePath('/dashboard/store')
    return { success: true }
  } catch (error) {
    console.error('Error updating draft:', error)
    return { success: false, error: 'Failed to update draft' }
  }
}

export async function finalizeDraftAction(formData: FormData) {
  const user = await requireAuth()
  
  const productId = formData.get('productId') as string
  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  const buttonText = formData.get('buttonText') as string
  const deliveryType = formData.get('deliveryType') as string
  const redirectUrl = formData.get('redirectUrl') as string
  const formFields = formData.get('formFields') as string
  const imageUrl = formData.get('imageUrl') as string
  const fileUrl = formData.get('fileUrl') as string
  const fileName = formData.get('fileName') as string

  try {
    // Get existing product to preserve imageUrl if needed
    const existingDraft = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: user.id,
        // Remove isDraft requirement to allow editing published products
      }
    })

    if (!existingDraft) {
      return { success: false, error: 'Product not found' }
    }

    // Update the product (keep existing draft/active status or finalize if it was a draft)
    await prisma.product.update({
      where: {
        id: productId,
        userId: user.id,
      },
      data: {
        title: title || 'Untitled Lead Magnet',
        description: subtitle || '',
        imageUrl: imageUrl || existingDraft.imageUrl,
        fileUrl: fileUrl || existingDraft.fileUrl,
        fileName: fileName || existingDraft.fileName,
        subtitle: subtitle || null,
        buttonText: buttonText || 'Get Free Download',
        deliveryType: deliveryType || 'upload',
        redirectUrl: redirectUrl || null,
        formFields: formFields ? JSON.parse(formFields) : null,
        isDraft: false,    // Always set to not draft when finalizing
        isActive: true,    // Always set to active when finalizing
        updatedAt: new Date(),
      }
    })

    revalidatePath('/dashboard/store')
    return { success: true }
  } catch (error) {
    console.error('Error finalizing draft:', error)
    return { success: false, error: 'Failed to create lead magnet' }
  }
}

export async function loadDraftAction(draftId: string) {
  const user = await requireAuth()
  
  try {
    const draft = await prisma.product.findFirst({
      where: {
        id: draftId,
        userId: user.id,
        // Remove isDraft requirement to allow editing published products
      }
    })

    if (!draft) {
      return { success: false, error: 'Product not found' }
    }

    return { 
      success: true, 
      draft: {
        id: draft.id,
        title: draft.title,
        subtitle: draft.subtitle,
        buttonText: draft.buttonText,
        imageUrl: draft.imageUrl,
        fileUrl: draft.fileUrl,
        fileName: draft.fileName,
        deliveryType: draft.deliveryType,
        redirectUrl: draft.redirectUrl,
        formFields: draft.formFields,
        currentStep: draft.currentStep
      }
    }
  } catch (error) {
    console.error('Error loading draft:', error)
    return { success: false, error: 'Failed to load draft' }
  }
}