import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get return URL from query params
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/dashboard/store';

    // Generate Google OAuth URL with user ID and return URL
    const authUrl = getGoogleAuthUrl(`${user.id}|${returnUrl}`);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}