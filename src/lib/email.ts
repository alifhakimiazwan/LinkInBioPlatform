// Email utility with SendGrid integration
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface WebinarDetails {
  title: string;
  description: string;
  date: string;
  time: string;
  timeZone: string;
  duration: string;
  meetLink?: string;
  calendarLink?: string;
  hostName: string;
  hostEmail: string;
}

interface PurchaseDetails {
  buyerName: string;
  buyerEmail: string;
  purchaseDate: string;
  amount: string;
  currency: string;
}

// Email templates
export function generateWebinarConfirmationEmail(
  webinar: WebinarDetails,
  purchase: PurchaseDetails
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webinar Registration Confirmed</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #db4c2a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .webinar-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #db4c2a; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #db4c2a; }
    .button { display: inline-block; padding: 12px 24px; background: #db4c2a; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
    .important { background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Registration Confirmed!</h1>
    <p>You're all set for the webinar</p>
  </div>
  
  <div class="content">
    <p>Hi ${purchase.buyerName},</p>
    
    <p>Thank you for registering! Your payment has been processed and you're confirmed for the upcoming webinar.</p>
    
    <div class="webinar-details">
      <h2>${webinar.title}</h2>
      <div class="detail-row">
        <span class="label">Date:</span> ${webinar.date}
      </div>
      <div class="detail-row">
        <span class="label">Time:</span> ${webinar.time} (${webinar.timeZone})
      </div>
      <div class="detail-row">
        <span class="label">Duration:</span> ${webinar.duration} minutes
      </div>
      <div class="detail-row">
        <span class="label">Host:</span> ${webinar.hostName}
      </div>
    </div>
    
    <div class="important">
      <strong>📅 Important:</strong> Add this webinar to your calendar so you don't miss it!
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${webinar.meetLink ? `<a href="${webinar.meetLink}" class="button">Join Google Meet</a>` : ''}
      ${webinar.calendarLink ? `<a href="${webinar.calendarLink}" class="button">Add to Calendar</a>` : ''}
    </div>
    
    <h3>What to expect:</h3>
    <p>${webinar.description}</p>
    
    <h3>Before the webinar:</h3>
    <ul>
      <li>Test your internet connection and audio/video setup</li>
      <li>Join the meeting 5-10 minutes early</li>
      <li>Prepare any questions you'd like to ask</li>
      <li>Find a quiet space for the session</li>
    </ul>
    
    <div class="important">
      <strong>📝 Note:</strong> You'll receive a reminder email 24 hours before the webinar with the meeting details.
    </div>
    
    <h3>Purchase Details:</h3>
    <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
      <div class="detail-row"><span class="label">Amount Paid:</span> ${purchase.amount} ${purchase.currency}</div>
      <div class="detail-row"><span class="label">Purchase Date:</span> ${purchase.purchaseDate}</div>
      <div class="detail-row"><span class="label">Buyer Email:</span> ${purchase.buyerEmail}</div>
    </div>
    
    <p>If you have any questions before the webinar, feel free to contact the host at <a href="mailto:${webinar.hostEmail}">${webinar.hostEmail}</a>.</p>
    
    <p>Looking forward to seeing you there!</p>
    
    <p>Best regards,<br>${webinar.hostName}</p>
  </div>
  
  <div class="footer">
    <p>This is an automated confirmation email for your webinar registration.</p>
    <p>Please save this email for your records.</p>
  </div>
</body>
</html>
  `;
}

export function generateWebinarReminderEmail(
  webinar: WebinarDetails,
  purchase: PurchaseDetails
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webinar Starting Tomorrow</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #db4c2a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .webinar-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #db4c2a; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #db4c2a; }
    .button { display: inline-block; padding: 12px 24px; background: #db4c2a; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .urgent { background: #d4edda; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #28a745; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Webinar Reminder</h1>
    <p>Your webinar is starting soon!</p>
  </div>
  
  <div class="content">
    <p>Hi ${purchase.buyerName},</p>
    
    <div class="urgent">
      <strong>🕐 Reminder:</strong> Your webinar "${webinar.title}" is starting tomorrow at ${webinar.time} (${webinar.timeZone}).
    </div>
    
    <div class="webinar-details">
      <h2>${webinar.title}</h2>
      <div class="detail-row">
        <span class="label">Date:</span> ${webinar.date}
      </div>
      <div class="detail-row">
        <span class="label">Time:</span> ${webinar.time} (${webinar.timeZone})
      </div>
      <div class="detail-row">
        <span class="label">Duration:</span> ${webinar.duration} minutes
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${webinar.meetLink ? `<a href="${webinar.meetLink}" class="button">Join Google Meet</a>` : ''}
    </div>
    
    <h3>Pre-webinar checklist:</h3>
    <ul>
      <li>✅ Test your camera and microphone</li>
      <li>✅ Ensure stable internet connection</li>
      <li>✅ Join 5-10 minutes early</li>
      <li>✅ Have pen and paper ready for notes</li>
      <li>✅ Find a quiet, well-lit space</li>
    </ul>
    
    <p>See you tomorrow!</p>
    
    <p>Best regards,<br>${webinar.hostName}</p>
  </div>
</body>
</html>
  `;
}

// Email sending function using SendGrid
export async function sendEmail(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SendGrid API key not found. Email would be sent to:', config.to);
      console.log('📧 Subject:', config.subject);
      console.log('📧 Content preview:', config.html.substring(0, 200) + '...');
      return { 
        success: false, 
        error: 'SendGrid API key not configured' 
      };
    }

    // Prepare SendGrid message
    const fromEmail = config.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@pintas.store';
    const msg = {
      to: config.to,
      from: fromEmail,
      subject: config.subject,
      html: config.html,
    };

    console.log('📧 SendGrid message config:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      apiKeySet: !!process.env.SENDGRID_API_KEY
    });

    // Send email via SendGrid
    await sgMail.send(msg);
    
    console.log('✅ Email sent successfully to:', config.to);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // Handle SendGrid specific errors
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      return { 
        success: false, 
        error: `SendGrid error: ${sgError.response?.body?.errors?.[0]?.message || sgError.message}` 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

// Helper function to send webinar confirmation
export async function sendWebinarConfirmationEmail(
  webinar: WebinarDetails,
  purchase: PurchaseDetails
): Promise<{ success: boolean; error?: string }> {
  const emailHtml = generateWebinarConfirmationEmail(webinar, purchase);
  
  return await sendEmail({
    to: purchase.buyerEmail,
    subject: `✅ Registration Confirmed: ${webinar.title}`,
    html: emailHtml,
    from: webinar.hostEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@pintas.store'
  });
}

// Helper function to send webinar reminder
export async function sendWebinarReminderEmail(
  webinar: WebinarDetails,
  purchase: PurchaseDetails
): Promise<{ success: boolean; error?: string }> {
  const emailHtml = generateWebinarReminderEmail(webinar, purchase);
  
  return await sendEmail({
    to: purchase.buyerEmail,
    subject: `⏰ Tomorrow: ${webinar.title}`,
    html: emailHtml,
    from: webinar.hostEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@pintas.store'
  });
}

// Helper function to send lead magnet delivery email
export async function sendLeadMagnetEmail(data: {
  recipientEmail: string;
  recipientName: string;
  productTitle: string;
  productDescription: string;
  fileUrl?: string;
  fileName?: string;
  redirectUrl?: string;
  hostName: string;
  hostEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  
  const isFileDelivery = Boolean(data.fileUrl);
  
  const emailContent = generateLeadMagnetEmailTemplate({
    recipientName: data.recipientName,
    productTitle: data.productTitle,
    productDescription: data.productDescription,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    redirectUrl: data.redirectUrl,
    hostName: data.hostName,
    isFileDelivery
  });
  
  return await sendEmail({
    to: data.recipientEmail,
    subject: isFileDelivery 
      ? `🎉 Your Free Download: ${data.productTitle}`
      : `✅ Thank you for your interest: ${data.productTitle}`,
    html: emailContent,
    from: data.hostEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@pintas.store'
  });
}

// Email template for lead magnets
function generateLeadMagnetEmailTemplate(data: {
  recipientName: string;
  productTitle: string;
  productDescription: string;
  fileUrl?: string;
  fileName?: string;
  redirectUrl?: string;
  hostName: string;
  isFileDelivery: boolean;
}): string {
  if (data.isFileDelivery && data.fileUrl) {
    // File delivery email
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free Download - ${data.productTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #ea580c, #dc2626); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .download-section { background: #f8fafc; padding: 25px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ea580c; text-align: center; }
    .download-button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #ea580c, #dc2626); color: white; text-decoration: none; border-radius: 8px; margin: 15px 0; font-weight: 600; font-size: 16px; transition: transform 0.2s; }
    .download-button:hover { transform: translateY(-1px); }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .link-fallback { font-size: 12px; color: #6b7280; margin-top: 10px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Download is Ready!</h1>
      <p>Thanks for subscribing - here's your free resource</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p>Thank you for your interest in "<strong>${data.productTitle}</strong>"!</p>
      
      ${data.productDescription ? `<p>${data.productDescription}</p>` : ''}
      
      <div class="download-section">
        <h3 style="margin-top: 0; color: #ea580c;">📥 Download Your Free Resource</h3>
        <p>Click the button below to access your secure download:</p>
        <a href="${data.fileUrl}" class="download-button">Download ${data.fileName || 'Resource'}</a>
        <div style="margin-top: 15px; padding: 12px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px; color: #856404;"><strong>🔒 Secure Download:</strong> This link is valid for 24 hours and can only be used with your email address.</p>
        </div>
      </div>
      
      <p>I hope you find this resource valuable! If you have any questions, feel free to reach out.</p>
      
      <p>Best regards,<br><strong>${data.hostName}</strong></p>
    </div>
    
    <div class="footer">
      <p>This email was sent because you requested a free download from ${data.hostName}.</p>
      <p>You're receiving this because you subscribed at pintas.store</p>
    </div>
  </div>
</body>
</html>`;
  } else {
    // Confirmation email (no file)
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you - ${data.productTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #ea580c, #dc2626); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .highlight-box { background: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #22c55e; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Thank You!</h1>
      <p>We've received your information</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p>Thank you for your interest in "<strong>${data.productTitle}</strong>"!</p>
      
      ${data.productDescription ? `<p>${data.productDescription}</p>` : ''}
      
      <div class="highlight-box">
        <p><strong>✨ What happens next?</strong></p>
        <p>We've received your information and will be in touch soon with more details and exclusive content.</p>
      </div>
      
      <p>Keep an eye on your inbox for updates and valuable resources from us.</p>
      
      <p>Best regards,<br><strong>${data.hostName}</strong></p>
    </div>
    
    <div class="footer">
      <p>This email was sent because you requested information from ${data.hostName}.</p>
      <p>You're receiving this because you subscribed at pintas.store</p>
    </div>
  </div>
</body>
</html>`;
  }
}