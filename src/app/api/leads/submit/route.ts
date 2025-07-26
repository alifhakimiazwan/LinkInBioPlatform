import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendLeadMagnetEmail } from '@/lib/email';

interface LeadSubmission {
  productId: string;
  formData: Record<string, string>;
  userAgent?: string;
  ipAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { productId, formData }: LeadSubmission = await request.json();

    const supabase = await createClient();

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        user:users(fullName, email, username)
      `)
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

    // Validate required form fields
    if (product.formFields) {
      const fields = Array.isArray(product.formFields) 
        ? product.formFields 
        : JSON.parse(product.formFields as string);
      
      for (const field of fields) {
        if (field.required && !formData[field.id]) {
          return NextResponse.json(
            { error: `${field.label} is required` },
            { status: 400 }
          );
        }
      }
    }

    // Create lead record
    const leadData = {
      userId: product.userId,
      productId: product.id,
      customerEmail: formData.email || formData['2'], // Default email field ID is '2'
      customerName: formData.name || formData['1'], // Default name field ID is '1'
      customerPhone: formData.phone || null,
      formData: formData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      source: 'public_page',
    };

    console.log('📋 Lead data created:', {
      email: leadData.customerEmail,
      name: leadData.customerName,
      productTitle: product.title,
      deliveryType: product.deliveryType
    });

    // Validate email exists
    if (!leadData.customerEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Store lead in database (create a leads table)
    const now = new Date().toISOString();
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        id: crypto.randomUUID(), // Explicitly generate UUID
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      // Continue with delivery even if lead storage fails
    }

    // Handle delivery based on product settings
    let deliveryResult = { success: false, message: '' };

    if (product.deliveryType === 'redirect' && product.redirectUrl) {
      // Redirect delivery - return redirect URL
      deliveryResult = {
        success: true,
        message: 'redirect',
        redirectUrl: product.redirectUrl
      };
    } else {
      // Email delivery (with or without file)
      console.log('🔍 Preparing to send lead magnet email...');
      console.log('Recipient:', leadData.customerEmail);
      console.log('Product:', product.title);
      console.log('Has file URL:', !!product.fileUrl);
      
      // Generate secure download URL
      const downloadUrl = lead ? 
        `${process.env.NEXT_PUBLIC_APP_URL}/api/download/${product.id}?email=${encodeURIComponent(leadData.customerEmail)}&token=${lead.id}` :
        null;

      deliveryResult = await sendLeadMagnetEmail({
        recipientEmail: leadData.customerEmail,
        recipientName: leadData.customerName || 'Friend',
        productTitle: product.title,
        productDescription: product.description || product.subtitle || '',
        fileUrl: downloadUrl,
        fileName: product.fileName || `${product.title}.pdf`,
        hostName: product.user?.fullName || product.user?.username || 'Host',
        hostEmail: 'noreply@pintas.store',
      });
      
      console.log('📧 Email delivery result:', deliveryResult);
    }

    // Track analytics
    if (lead) {
      await supabase.from('analytics').insert({
        userId: product.userId,
        type: 'LEAD_CAPTURED',
        metadata: {
          productId: product.id,
          leadId: lead.id,
          source: 'public_page'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: deliveryResult.message || 'Thank you! Check your email for your download.',
      redirectUrl: deliveryResult.redirectUrl,
      leadId: lead?.id
    });

  } catch (error) {
    console.error('Error processing lead submission:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}

