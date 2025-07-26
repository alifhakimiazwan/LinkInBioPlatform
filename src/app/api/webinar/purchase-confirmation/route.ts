import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWebinarConfirmationEmail } from '@/lib/email';
import { addAttendeeToWebinarEvent, refreshGoogleToken } from '@/lib/google-calendar';

interface PurchaseData {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  amount: string;
  currency: string;
  paymentId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const purchaseData: PurchaseData = await request.json();

    const supabase = await createClient();

    // Get webinar details from database
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', purchaseData.productId)
      .eq('type', 'WEBINAR')
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Get host details
    const { data: host, error: hostError } = await supabase
      .from('users')
      .select('fullName, email, googleAccessToken, googleRefreshToken, googleTokenExpiry')
      .eq('id', product.userId)
      .single();

    if (hostError || !host) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      );
    }

    // Parse webinar data from product formFields
    let webinarFormData: Record<string, unknown> = {};
    try {
      if (product.formFields) {
        webinarFormData = typeof product.formFields === 'string' 
          ? JSON.parse(product.formFields) 
          : product.formFields;
      }
    } catch (error) {
      console.error('Error parsing webinar formFields:', error);
    }

    // Prepare webinar details for email
    const webinarDetails = {
      title: product.title,
      description: product.description || '',
      date: (webinarFormData.webinarDate as string) || '',
      time: (webinarFormData.webinarTime as string) || '',
      timeZone: (webinarFormData.timeZone as string) || 'UTC',
      duration: (webinarFormData.duration as string) || '60',
      meetLink: product.googleMeetLink || '',
      calendarLink: product.googleCalendarLink || '',
      hostName: host.fullName || 'Host',
      hostEmail: host.email || '',
    };

    // Prepare purchase details for email
    const purchaseDetails = {
      buyerName: purchaseData.buyerName,
      buyerEmail: purchaseData.buyerEmail,
      purchaseDate: new Date().toLocaleDateString(),
      amount: purchaseData.amount,
      currency: purchaseData.currency,
    };

    let attendeeAddResult = null;
    let emailResult = null;

    // Add attendee to Google Calendar event if host has Google integration
    if (host.googleAccessToken && host.googleRefreshToken && product.googleEventId) {
      try {
        let accessToken = host.googleAccessToken;
        const refreshToken = host.googleRefreshToken;

        // Check if token is expired and refresh if needed
        if (host.googleTokenExpiry && new Date(host.googleTokenExpiry) <= new Date()) {
          const refreshResult = await refreshGoogleToken(refreshToken);
          
          if (refreshResult.success && refreshResult.tokens.access_token) {
            accessToken = refreshResult.tokens.access_token;

            // Update the new token in database
            await supabase
              .from('users')
              .update({
                googleAccessToken: accessToken,
                googleTokenExpiry: refreshResult.tokens.expiry_date ? new Date(refreshResult.tokens.expiry_date) : null,
              })
              .eq('id', host.id);
          }
        }

        // Add attendee to calendar event
        attendeeAddResult = await addAttendeeToWebinarEvent(
          accessToken,
          refreshToken,
          product.googleEventId,
          purchaseData.buyerEmail,
          purchaseData.buyerName
        );

        if (!attendeeAddResult.success) {
          console.error('Failed to add attendee to calendar:', attendeeAddResult.error);
        }
      } catch (error) {
        console.error('Error adding attendee to calendar:', error);
      }
    }

    // Send confirmation email
    try {
      emailResult = await sendWebinarConfirmationEmail(webinarDetails, purchaseDetails);
      
      if (!emailResult.success) {
        console.error('Failed to send confirmation email:', emailResult.error);
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }

    // Create order record in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        userId: product.userId,
        customerEmail: purchaseData.buyerEmail,
        customerName: purchaseData.buyerName,
        totalAmount: parseFloat(purchaseData.amount),
        currency: purchaseData.currency,
        status: 'COMPLETED',
        stripePaymentIntentId: purchaseData.paymentId,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order record:', orderError);
    } else {
      // Create order item
      await supabase
        .from('order_items')
        .insert({
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: parseFloat(purchaseData.amount),
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase confirmation processed',
      details: {
        emailSent: emailResult?.success || false,
        attendeeAdded: attendeeAddResult?.success || false,
        orderCreated: !orderError,
      }
    });
  } catch (error) {
    console.error('Error processing purchase confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase confirmation' },
      { status: 500 }
    );
  }
}