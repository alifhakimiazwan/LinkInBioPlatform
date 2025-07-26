import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// This webhook handler can be called by payment processors (Stripe, PayPal, etc.)
// to trigger webinar confirmation emails and calendar invitations

interface WebhookPayload {
  type: 'payment.completed';
  data: {
    paymentId: string;
    productId: string;
    customerEmail: string;
    customerName: string;
    amount: string;
    currency: string;
    metadata?: Record<string, string>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement based on your payment processor)
    const headersList = await headers();
    const signature = headersList.get('webhook-signature');
    
    // TODO: Implement signature verification for security
    // Example for Stripe:
    // const isValidSignature = verifyStripeSignature(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    // if (!isValidSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const payload: WebhookPayload = await request.json();

    // Only handle payment completion events
    if (payload.type !== 'payment.completed') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    const { data } = payload;

    // Check if this is a webinar purchase
    // You can add metadata to identify webinar purchases or check the product type
    const isWebinarPurchase = data.metadata?.productType === 'WEBINAR' || 
                              data.productId; // Assuming productId indicates a webinar

    if (!isWebinarPurchase) {
      return NextResponse.json({ message: 'Not a webinar purchase' });
    }

    // Call the purchase confirmation API
    const confirmationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/webinar/purchase-confirmation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: data.productId,
          buyerName: data.customerName,
          buyerEmail: data.customerEmail,
          amount: data.amount,
          currency: data.currency,
          paymentId: data.paymentId,
        }),
      }
    );

    if (!confirmationResponse.ok) {
      console.error('Failed to process webinar purchase confirmation');
      return NextResponse.json(
        { error: 'Failed to process confirmation' },
        { status: 500 }
      );
    }

    const confirmationResult = await confirmationResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Webinar purchase processed successfully',
      details: confirmationResult.details,
    });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Example function to verify Stripe webhook signature
function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // This is a simplified example - use the actual Stripe library in production
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return true;
  } catch (error) {
    console.error('Stripe signature verification failed:', error);
    return false;
  }
}

// Example webhook payload for testing:
// POST /api/webhooks/payment
// {
//   "type": "payment.completed",
//   "data": {
//     "paymentId": "pi_1234567890",
//     "productId": "webinar-id-123",
//     "customerEmail": "customer@example.com",
//     "customerName": "John Doe",
//     "amount": "99.00",
//     "currency": "USD",
//     "metadata": {
//       "productType": "WEBINAR"
//     }
//   }
// }