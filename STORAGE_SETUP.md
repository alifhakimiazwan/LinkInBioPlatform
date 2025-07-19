# Storage Setup for Link-in-Bio Platform

This document explains how to set up Supabase Storage for file uploads.

## Manual Setup (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project at [https://app.supabase.com](https://app.supabase.com)

2. **Create Storage Bucket**
   - Go to Storage > Buckets
   - Click "New bucket"
   - Name: `products`
   - Make it **Public**
   - Click "Create bucket"

3. **Set up Storage Policies**
   - Go to Storage > Policies
   - Click "New policy" for the `products` bucket
   - Choose "Custom policy"
   - Policy name: `Users can upload their own files`
   - Allowed operation: `INSERT` and `UPDATE`
   - Target roles: `authenticated`
   - USING expression:
   ```sql
   auth.uid()::text = (storage.foldername(name))[1]
   ```
   - Click "Save policy"

4. **Add another policy for reading**
   - Click "New policy" for the `products` bucket
   - Choose "Custom policy" 
   - Policy name: `Public read access`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - USING expression: `true`
   - Click "Save policy"

## File Structure

The application will organize files in the following structure:

```
products/
├── [user-id-1]/
│   ├── images/
│   │   └── [timestamp]-[random].jpg
│   └── files/
│       └── [timestamp]-[random].pdf
└── [user-id-2]/
    ├── images/
    │   └── [timestamp]-[random].jpg
    └── files/
        └── [timestamp]-[random].pdf
```

## Supported File Types

### Product Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)  
- WebP (.webp)
- Max size: 5MB

### Product Files
- PDF (.pdf)
- ZIP (.zip)
- Word Documents (.doc, .docx)
- Text files (.txt)
- Max size: 50MB

## Verification

After setup, you should be able to:
1. Upload product images when creating products
2. Upload digital files for downloadable products
3. See uploaded files in the Supabase Storage dashboard
4. Access uploaded files via public URLs

## Troubleshooting

**Error: "Row Level Security policy violation"**
- Check that your storage policies are set up correctly
- Ensure the authenticated user has permission to upload to their folder

**Error: "Bucket not found"**
- Make sure you created the `products` bucket
- Check the bucket name matches exactly

**Error: "File too large"**
- Images must be under 5MB
- Product files must be under 50MB