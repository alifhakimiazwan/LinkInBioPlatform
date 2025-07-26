import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Required scopes for calendar and meet integration
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(userId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId, // Pass user ID to identify the user after auth
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for access tokens
 */
export async function getGoogleTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return {
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      }
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tokens'
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshGoogleToken(refreshToken: string) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      success: true,
      tokens: {
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      }
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh token'
    };
  }
}

/**
 * Create a calendar event with Google Meet link
 */
export async function createWebinarCalendarEvent(
  accessToken: string,
  refreshToken: string,
  webinarData: {
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    duration: number;
    timeZone: string;
    attendeeEmails?: string[];
  }
) {
  try {
    // Set up OAuth credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Calculate start and end times
    const startDateTime = new Date(`${webinarData.startDate}T${webinarData.startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (webinarData.duration * 60000));

    // Create event object
    const event = {
      summary: webinarData.title,
      description: webinarData.description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: webinarData.timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: webinarData.timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: `webinar-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      attendees: webinarData.attendeeEmails?.map(email => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send invites to attendees
    });

    return {
      success: true,
      event: {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
        startTime: response.data.start?.dateTime,
        endTime: response.data.end?.dateTime,
      }
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('insufficient authentication scopes')) {
        return {
          success: false,
          error: 'Insufficient permissions. Please reconnect your Google account.',
          needsReauth: true
        };
      }
      if (error.message.includes('invalid_grant')) {
        return {
          success: false,
          error: 'Authentication expired. Please reconnect your Google account.',
          needsReauth: true
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create calendar event'
    };
  }
}

/**
 * Update an existing calendar event
 */
export async function updateWebinarCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  webinarData: {
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    duration: number;
    timeZone: string;
    attendeeEmails?: string[];
  }
) {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const startDateTime = new Date(`${webinarData.startDate}T${webinarData.startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (webinarData.duration * 60000));

    const event = {
      summary: webinarData.title,
      description: webinarData.description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: webinarData.timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: webinarData.timeZone,
      },
      attendees: webinarData.attendeeEmails?.map(email => ({ email })) || [],
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
      sendUpdates: 'all',
    });

    return {
      success: true,
      event: {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
      }
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update calendar event'
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteWebinarCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
) {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete calendar event'
    };
  }
}

/**
 * Add attendee to existing calendar event
 */
export async function addAttendeeToWebinarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  attendeeEmail: string,
  attendeeName?: string
) {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // First, get the existing event
    const eventResponse = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    const event = eventResponse.data;
    if (!event) {
      return {
        success: false,
        error: 'Event not found'
      };
    }

    // Add new attendee to existing attendees list
    const existingAttendees = event.attendees || [];
    
    // Check if attendee already exists
    const attendeeExists = existingAttendees.some(
      attendee => attendee.email?.toLowerCase() === attendeeEmail.toLowerCase()
    );

    if (attendeeExists) {
      return {
        success: true,
        message: 'Attendee already added to event'
      };
    }

    const newAttendee = {
      email: attendeeEmail,
      displayName: attendeeName,
      responseStatus: 'needsAction'
    };

    const updatedAttendees = [...existingAttendees, newAttendee];

    // Update the event with new attendee
    const updateResponse = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: {
        ...event,
        attendees: updatedAttendees,
      },
      sendUpdates: 'all', // Send email invitation to new attendee
    });

    return {
      success: true,
      event: {
        id: updateResponse.data.id,
        htmlLink: updateResponse.data.htmlLink,
        attendees: updatedAttendees.length,
      }
    };
  } catch (error) {
    console.error('Error adding attendee to calendar event:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('insufficient authentication scopes')) {
        return {
          success: false,
          error: 'Insufficient permissions. Please reconnect your Google account.',
          needsReauth: true
        };
      }
      if (error.message.includes('invalid_grant')) {
        return {
          success: false,
          error: 'Authentication expired. Please reconnect your Google account.',
          needsReauth: true
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add attendee to calendar event'
    };
  }
}

/**
 * Get user's calendar information
 */
export async function getGoogleCalendarInfo(accessToken: string, refreshToken: string) {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.calendarList.list({
      minAccessRole: 'writer',
      showHidden: false,
    });

    return {
      success: true,
      calendars: response.data.items?.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary,
        accessRole: cal.accessRole,
      })) || []
    };
  } catch (error) {
    console.error('Error getting calendar info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get calendar info'
    };
  }
}