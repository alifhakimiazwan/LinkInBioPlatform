import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Check if user exists in our database with optimized query
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      avatar: true,
      bio: true,
      createdAt: true,
    }
  })

  // If user doesn't exist in our database, create them
  if (!dbUser) {
    const metadata = user.user_metadata || {}
    const email = user.email!
    
    // Generate username from email if not provided
    const username = metadata.username || email.split('@')[0] + Math.random().toString(36).substring(2, 7)
    
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email,
        username,
        fullName: metadata.full_name || metadata.name || null,
        avatar: metadata.avatar_url || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        bio: true,
        createdAt: true,
      }
    })
  }

  return {
    ...user,
    dbUser
  }
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}