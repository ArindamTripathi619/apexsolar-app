import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Extract token from various possible sources (same as middleware)
    let token: string | undefined;
    
    // Try to get token from cookies first
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
    
    // If no cookie token, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    // If still no token, try query parameter (for testing)
    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get('token') || undefined;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    )
  }
}
