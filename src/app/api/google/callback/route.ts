import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokens } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This contains "userId|returnUrl"
  const error = searchParams.get('error');

  // Parse state to get user ID and return URL
  const [userId, returnUrl = '/dashboard/store'] = state ? state.split('|') : ['', ''];

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?google_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state || !userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?google_error=missing_code_or_state`
    );
  }

  try {
    // Exchange code for tokens
    const tokenResult = await getGoogleTokens(code);
    
    if (!tokenResult.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?google_error=${encodeURIComponent(tokenResult.error || 'token_exchange_failed')}`
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || user.id !== userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?google_error=unauthorized`
      );
    }

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('users')
      .update({
        googleAccessToken: tokenResult.tokens.access_token,
        googleRefreshToken: tokenResult.tokens.refresh_token,
        googleTokenExpiry: tokenResult.tokens.expiry_date ? new Date(tokenResult.tokens.expiry_date) : null,
        updatedAt: new Date(),
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('Error storing Google tokens:', dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?google_error=storage_failed`
      );
    }

    // Redirect back to the original page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?google_connected=true`
    );
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?google_error=callback_failed`
    );
  }
}