import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AuthUser } from './auth'
import { UserRole } from '@prisma/client'

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async (request: NextRequest) => {
    try {
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('withAuth middleware started')
        console.log('Request URL:', request.url)
        console.log('Request method:', request.method)
      }
      
      // Extract token from various possible sources
      let token: string | undefined;
      
      // Try to get token from cookies first
      const cookieToken = request.cookies.get('auth-token')?.value;
      if (cookieToken) {
        token = cookieToken;
        if (process.env.NODE_ENV !== 'production') {
          console.log('Token found in cookies')
        }
      }
      
      // If no cookie token, try Authorization header
      if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7); // Remove 'Bearer ' prefix
          if (process.env.NODE_ENV !== 'production') {
            console.log('Token found in Authorization header')
          }
        }
      }
      
      // If still no token, try query parameter (for testing)
      if (!token) {
        const url = new URL(request.url);
        token = url.searchParams.get('token') || undefined;
        if (token && process.env.NODE_ENV !== 'production') {
          console.log('Token found in query parameters')
        }
      }

      if (!token) {
        console.log('No authentication token found - URL:', request.url)
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('Verifying token...')
      }
      const user = verifyToken(token)
      if (!user) {
        console.log('Token verification failed - URL:', request.url)
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        )
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('User authenticated:', { id: user.id, email: user.email, role: user.role })
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log('Insufficient permissions for role:', user.role, 'Required:', allowedRoles, 'URL:', request.url)
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      if (process.env.NODE_ENV !== 'production') {
        console.log('Authentication successful, calling handler')
      }
      return handler(authenticatedRequest)
    } catch (error) {
      console.error('Auth middleware error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function adminOnly(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return (request: NextRequest, context?: any) => {
    const authWrapper = withAuth((req: AuthenticatedRequest) => handler(req, context), [UserRole.ADMIN])
    return authWrapper(request)
  }
}

export function accountantOnly(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(handler, [UserRole.ACCOUNTANT])
}

export function adminOrAccountant(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(handler, [UserRole.ADMIN, UserRole.ACCOUNTANT])
}