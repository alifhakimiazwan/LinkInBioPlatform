import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the product exists and is a lead magnet
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('type', 'FREE_LEAD')
      .eq('isActive', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      );
    }

    // Verify the lead exists (validates email and token)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('productId', productId)
      .eq('customerEmail', email)
      .eq('id', token) // Using lead ID as token for simplicity
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Invalid download link or email not found' },
        { status: 403 }
      );
    }

    // Check if the lead was created within the last 24 hours for security
    const leadCreatedAt = new Date(lead.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - leadCreatedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return NextResponse.json(
        { error: 'Download link has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    // Get file path - either from filePath field or extract from fileUrl
    let filePath = product.filePath;
    if (!filePath && product.fileUrl) {
      // Extract path from public URL format: https://xxx.supabase.co/storage/v1/object/public/products/path
      const urlParts = product.fileUrl.split('/storage/v1/object/public/products/');
      if (urlParts.length === 2) {
        filePath = urlParts[1];
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { error: 'No file available for download' },
        { status: 404 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('products')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      );
    }

    // Track the download
    await supabase.from('analytics').insert({
      userId: product.userId,
      type: 'FILE_DOWNLOAD',
      metadata: {
        productId: product.id,
        leadId: lead.id,
        downloadedAt: new Date().toISOString()
      }
    });

    // Redirect to the signed URL for download
    return NextResponse.redirect(signedUrlData.signedUrl);

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}