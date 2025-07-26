import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWebinarReminderEmail } from '@/lib/email';

// This endpoint can be called by a cron job to send reminder emails
// 24 hours before webinars start

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Calculate the date range for webinars happening in 24 hours
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all webinar products with events scheduled for tomorrow
    const { data: webinars, error: webinarsError } = await supabase
      .from('products')
      .select(`
        *,
        user:users(fullName, email)
      `)
      .eq('type', 'WEBINAR')
      .eq('isActive', true)
      .not('googleEventId', 'is', null);

    if (webinarsError) {
      console.error('Error fetching webinars:', webinarsError);
      return NextResponse.json(
        { error: 'Failed to fetch webinars' },
        { status: 500 }
      );
    }

    let remindersSent = 0;
    let errors = 0;

    for (const webinar of webinars) {
      try {
        // Parse webinar date from formFields
        let webinarFormData: Record<string, unknown> = {};
        try {
          if (webinar.formFields) {
            webinarFormData = typeof webinar.formFields === 'string' 
              ? JSON.parse(webinar.formFields) 
              : webinar.formFields;
          }
        } catch (error) {
          console.error('Error parsing webinar formFields:', error);
          continue;
        }

        const webinarDate = webinarFormData.webinarDate as string;
        const webinarTime = webinarFormData.webinarTime as string;

        if (!webinarDate || !webinarTime) {
          console.log(`Skipping webinar ${webinar.id} - missing date/time`);
          continue;
        }

        // Check if webinar is scheduled for tomorrow
        const webinarDateTime = new Date(`${webinarDate}T${webinarTime}`);
        const timeDiff = webinarDateTime.getTime() - now.getTime();
        const hoursUntilWebinar = timeDiff / (1000 * 60 * 60);

        // Send reminder if webinar is between 20-28 hours away (to account for timing variations)
        if (hoursUntilWebinar >= 20 && hoursUntilWebinar <= 28) {
          // Get all customers who purchased this webinar
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
              customerEmail,
              customerName,
              createdAt,
              orderItems:order_items(productId)
            `)
            .eq('status', 'COMPLETED');

          if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            errors++;
            continue;
          }

          // Filter orders for this specific webinar
          const webinarOrders = orders.filter(order => 
            order.orderItems.some(item => item.productId === webinar.id)
          );

          // Send reminder to each customer
          for (const order of webinarOrders) {
            try {
              const webinarDetails = {
                title: webinar.title,
                description: webinar.description || '',
                date: webinarDate,
                time: webinarTime,
                timeZone: (webinarFormData.timeZone as string) || 'UTC',
                duration: (webinarFormData.duration as string) || '60',
                meetLink: webinar.googleMeetLink || '',
                calendarLink: webinar.googleCalendarLink || '',
                hostName: webinar.user?.fullName || 'Host',
                hostEmail: webinar.user?.email || '',
              };

              const purchaseDetails = {
                buyerName: order.customerName || 'Customer',
                buyerEmail: order.customerEmail,
                purchaseDate: new Date(order.createdAt).toLocaleDateString(),
                amount: '0', // We don't need this for reminders
                currency: 'USD',
              };

              const emailResult = await sendWebinarReminderEmail(webinarDetails, purchaseDetails);
              
              if (emailResult.success) {
                remindersSent++;
                console.log(`Reminder sent to ${order.customerEmail} for webinar ${webinar.title}`);
              } else {
                console.error(`Failed to send reminder to ${order.customerEmail}:`, emailResult.error);
                errors++;
              }
            } catch (error) {
              console.error(`Error sending reminder to ${order.customerEmail}:`, error);
              errors++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing webinar ${webinar.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${webinars.length} webinars`,
      details: {
        remindersSent,
        errors,
        webinarsChecked: webinars.length,
      }
    });
  } catch (error) {
    console.error('Error in reminder service:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

// You can call this endpoint manually or set up a cron job to run daily
// Example cron job setup with Vercel Cron Jobs or GitHub Actions:
//
// vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/webinar/send-reminders",
//       "schedule": "0 9 * * *"
//     }
//   ]
// }
//
// Or with a simple curl command in a cron job:
// curl -X POST https://yourdomain.com/api/webinar/send-reminders