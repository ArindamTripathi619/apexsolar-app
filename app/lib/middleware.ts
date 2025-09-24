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
      const token = request.cookies.get('auth-token')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
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

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      return handler(authenticatedRequest)
    } catch (error) {
      console.error('Auth middleware error:', error)
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
