import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Google tokens
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('googleAccessToken, googleRefreshToken, googleTokenExpiry')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('Error checking Google status:', dbError);
      return NextResponse.json(
        { error: 'Failed to check Google connection status' },
        { status: 500 }
      );
    }

    const isConnected = !!(userData?.googleAccessToken && userData?.googleRefreshToken);
    const tokenExpiry = userData?.googleTokenExpiry ? new Date(userData.googleTokenExpiry) : null;
    const isExpired = tokenExpiry ? tokenExpiry <= new Date() : false;

    return NextResponse.json({
      isConnected,
      isExpired,
      tokenExpiry: tokenExpiry?.toISOString()
    });
  } catch (error) {
    console.error('Error in Google status check:', error);
    return NextResponse.json(
      { error: 'Failed to check Google connection status' },
      { status: 500 }
    );
  }
}