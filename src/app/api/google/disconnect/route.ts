import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove Google tokens from database
    const { error: dbError } = await supabase
      .from('users')
      .update({
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        updatedAt: new Date(),
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('Error disconnecting Google account:', dbError);
      return NextResponse.json(
        { error: 'Failed to disconnect Google account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Google disconnect:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google account' },
      { status: 500 }
    );
  }
}