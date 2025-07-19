import { NextRequest, NextResponse } from 'next/server';
import { validateUsername } from '@/lib/username-validation';

export async function POST(request: NextRequest) {
  try {
    const { username, excludeUserId } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const result = await validateUsername(username, excludeUserId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}