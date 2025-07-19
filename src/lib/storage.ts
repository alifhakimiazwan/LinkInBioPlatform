'use client'

import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  url: string
  path: string
}

export async function uploadFile(
  file: File,
  bucket: string,
  folder: string = '',
  userId: string
): Promise<UploadResult> {
  const supabase = createClient()
  
  // Generate unique filename with user ID as first folder for RLS
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = folder ? `${userId}/${folder}/${fileName}` : `${userId}/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file)

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path
  }
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
  }

  if (file.size > maxSize) {
    return 'Image file size must be less than 5MB'
  }

  return null
}

export function validateProductFile(file: File): string | null {
  const allowedTypes = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
  const maxSize = 50 * 1024 * 1024 // 50MB

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid file (PDF, ZIP, DOC, DOCX, or TXT)'
  }

  if (file.size > maxSize) {
    return 'File size must be less than 50MB'
  }

  return null
}