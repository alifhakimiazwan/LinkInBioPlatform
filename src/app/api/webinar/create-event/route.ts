import { NextRequest, NextResponse } from 'next/server';
import { createWebinarCalendarEvent, refreshGoogleToken } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const {
      webinarData,
      attendeeEmails = []
    } = await request.json();

    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Google tokens from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('googleAccessToken, googleRefreshToken, googleTokenExpiry')
      .eq('id', user.id)
      .single();

    if (dbError || !userData?.googleAccessToken || !userData?.googleRefreshToken) {
      return NextResponse.json({
        error: 'Google Calendar not connected. Please connect your Google account first.',
        needsAuth: true
      }, { status: 400 });
    }

    let accessToken = userData.googleAccessToken;
    const refreshToken = userData.googleRefreshToken;

    // Check if token is expired and refresh if needed
    if (userData.googleTokenExpiry && new Date(userData.googleTokenExpiry) <= new Date()) {
      const refreshResult = await refreshGoogleToken(refreshToken);
      
      if (!refreshResult.success) {
        return NextResponse.json({
          error: 'Failed to refresh Google token. Please reconnect your Google account.',
          needsAuth: true
        }, { status: 400 });
      }

      accessToken = refreshResult.tokens.access_token!;

      // Update the new token in database
      await supabase
        .from('users')
        .update({
          googleAccessToken: accessToken,
          googleTokenExpiry: refreshResult.tokens.expiry_date ? new Date(refreshResult.tokens.expiry_date) : null,
        })
        .eq('id', user.id);
    }

    // Create calendar event
    const result = await createWebinarCalendarEvent(
      accessToken,
      refreshToken,
      {
        title: webinarData.title,
        description: webinarData.description,
        startDate: webinarData.webinarDate,
        startTime: webinarData.webinarTime,
        duration: parseInt(webinarData.duration),
        timeZone: webinarData.timeZone,
        attendeeEmails: attendeeEmails,
      }
    );

    if (!result.success) {
      if (result.needsReauth) {
        return NextResponse.json({
          error: result.error,
          needsAuth: true
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: result.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event: result.event
    });
  } catch (error) {
    console.error('Error creating webinar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}