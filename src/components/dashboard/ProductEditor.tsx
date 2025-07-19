'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createProductAction } from '@/app/dashboard/store/add-product/actions'
import { uploadFile, validateImageFile, validateProductFile } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'

interface ProductEditorProps {
  preselectedType?: string
}

export function ProductEditor({ preselectedType }: ProductEditorProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [productFile, setProductFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setMessage('')
  }

  const handleProductFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateProductFile(file)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setProductFile(file)
    setMessage('')
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setMessage('')
    
    try {
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Upload image if provided
      if (imageFile) {
        setUploadingImage(true)
        try {
          const imageResult = await uploadFile(imageFile, 'products', 'images', userId)
          formData.append('imageUrl', imageResult.url)
          formData.append('imagePath', imageResult.path)
        } catch (error) {
          throw new Error('Failed to upload product image')
        } finally {
          setUploadingImage(false)
        }
      }

      // Upload product file if provided
      if (productFile) {
        setUploadingFile(true)
        try {
          const fileResult = await uploadFile(productFile, 'products', 'files', userId)
          formData.append('fileUrl', fileResult.url)
          formData.append('filePath', fileResult.path)
        } catch (error) {
          throw new Error('Failed to upload product file')
        } finally {
          setUploadingFile(false)
        }
      }

      await createProductAction(formData)
      setMessage('Product created successfully!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error creating product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
      </div>
      
      <form action={handleSubmit} className="p-6 space-y-6">
        {/* Product Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-400">📷</span>
              )}
            </div>
            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button 
                type="button" 
                variant="outline" 
                className="mb-2"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageFile && (
                <p className="text-xs text-green-600 mb-1">
                  Selected: {imageFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                JPG, PNG or GIF. Max size 5MB. Recommended: 400x400px
              </p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Product Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter product title"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Product Type *
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={preselectedType || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select product type</option>
            <option value="EBOOK">E-book</option>
            <option value="COURSE">Online Course</option>
            <option value="TEMPLATE">Template</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="WEBINAR">Webinar</option>
            <option value="SUBSCRIPTION">Subscription</option>
            <option value="PHYSICAL">Physical Product</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe your product..."
          />
        </div>

        {/* Digital Product File */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product File (for digital products)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="mb-4">
              <span className="text-4xl text-gray-400">📄</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {productFile ? `Selected: ${productFile.name}` : 'Upload your digital product file'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.zip,.doc,.docx,.txt"
              className="hidden"
              onChange={handleProductFileUpload}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
            >
              {uploadingFile ? 'Uploading...' : productFile ? 'Change File' : 'Choose File'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              PDF, ZIP, DOC, DOCX, or TXT. Max size 50MB
            </p>
          </div>
        </div>

        {message && (
          <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button type="submit" disabled={loading || uploadingImage || uploadingFile}>
            {loading ? 'Creating...' : 
             uploadingImage ? 'Uploading Image...' :
             uploadingFile ? 'Uploading File...' :
             'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}