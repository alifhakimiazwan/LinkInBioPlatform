import { NextRequest, NextResponse } from 'next/server';

// Payment webhooks temporarily disabled
// Will be re-enabled when payment integration is implemented

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Payment webhooks temporarily disabled' },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json(
    { message: 'Payment webhooks temporarily disabled' },
    { status: 503 }
  );
}