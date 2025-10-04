import { NextRequest, NextResponse } from 'next/server'
import { adminOnly, adminOrAccountant, AuthenticatedRequest } from '@/app/lib/middleware'

// GET /api/test-auth - Test authentication
async function testAuth(request: AuthenticatedRequest) {
  try {
    console.log('Test auth endpoint called');
    console.log('User info:', request.user);
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: request.user
    })
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication test failed' },
      { status: 500 }
    )
  }
}

// Middleware that allows both admin and accountant
export const GET = adminOrAccountant(testAuth)