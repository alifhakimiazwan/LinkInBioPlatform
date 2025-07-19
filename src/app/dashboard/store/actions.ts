'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(formData: FormData) {
  const user = await requireAuth()
  
  const fullName = formData.get('fullName') as string
  const username = formData.get('username') as string
  const bio = formData.get('bio') as string
  const avatar = formData.get('avatar') as string || null
  const avatarPath = formData.get('avatarPath') as string || null

  // Basic validation
  if (username && username.length < 3) {
    throw new Error('Username must be at least 3 characters')
  }

  // Check if username is already taken (if different from current)
  if (username && username !== user.dbUser.username) {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUser) {
      throw new Error('Username already taken')
    }
  }

  // Update user profile
  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: fullName || null,
      username: username || user.dbUser.username,
      bio: bio || null,
      avatar: avatar || user.dbUser.avatar,
      avatarPath: avatarPath || user.dbUser.avatarPath,
    }
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/store')
}

export async function updateSocialLinksAction(formData: FormData) {
  const user = await requireAuth()
  
  // All supported platforms
  const supportedPlatforms = [
    'instagram', 'twitter', 'tiktok', 'youtube', 
    'linkedin', 'github', 'facebook', 'twitch'
  ]

  // Delete existing social links
  await prisma.socialLink.deleteMany({
    where: { userId: user.id }
  })

  // Create new social links (only for non-empty URLs)
  const socialLinksToCreate = []
  let position = 1

  for (const platform of supportedPlatforms) {
    const url = formData.get(platform) as string
    if (url && url.trim()) {
      socialLinksToCreate.push({
        userId: user.id,
        platform: platform,
        url: url.trim(),
        position: position++
      })
    }
  }

  // Create social links if any exist
  if (socialLinksToCreate.length > 0) {
    await prisma.socialLink.createMany({
      data: socialLinksToCreate
    })
  }

  revalidatePath('/dashboard/store')
  revalidatePath('/dashboard/profile')
}