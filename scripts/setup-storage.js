const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function setupStorage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // This requires service role key
  )

  try {
    // Create products bucket for product images and files
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('products', {
      public: true,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      fileSizeLimit: 52428800 // 50MB
    })

    if (bucketError && bucketError.message !== 'Bucket already exists') {
      console.error('Error creating products bucket:', bucketError)
      return
    }

    console.log('✅ Products bucket created successfully (or already exists)')

    // Set up RLS policies for the bucket
    const { error: policyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'products',
      policy_name: 'Users can upload their own product files',
      definition: `
        (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1])
      `
    })

    if (policyError) {
      console.log('Note: RLS policy creation failed - you may need to set this up manually in Supabase dashboard')
    }

    console.log('🎉 Storage setup complete!')
    console.log('📝 Next steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Storage > Policies') 
    console.log('3. Ensure users can upload to the products bucket')
    
  } catch (error) {
    console.error('Error setting up storage:', error)
  }
}

setupStorage()