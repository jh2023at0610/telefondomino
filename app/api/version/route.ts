import { NextResponse } from 'next/server';

// Update this version number whenever you make code changes
// Format: MAJOR.MINOR.PATCH (e.g., 1.0.0, 1.0.1, 1.1.0, 2.0.0)
const APP_VERSION = '2.2.1';

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    timestamp: Date.now(),
  });
}

