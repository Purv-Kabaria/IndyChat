import { NextResponse } from 'next/server';

/**
 * Health check endpoint for the Chrome extension
 * GET /api/health
 */
export async function GET() {
  try {
    // Basic server information
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'IndyChat',
      version: '1.0.0', // You can read this from your package.json
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

