import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and public routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname === '/' ||
    pathname === '/admin/login' ||
    pathname === '/accountant/login' ||
    pathname.startsWith('/employee/')
  ) {
    return NextResponse.next()
  }

  // Protect admin routes
  if (pathname.startsWith('/admin/')) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('🚫 No auth token found, redirecting to login:', pathname)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // Use jose for Edge Runtime compatibility
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const user = payload as { id: string; email: string; role: string }
      
      if (!user || user.role !== 'ADMIN') {
        console.log('🚫 Invalid token or insufficient permissions, redirecting to login:', pathname)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch (error) {
      console.log('🚫 Token verification failed, redirecting to login:', pathname)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Protect accountant routes
  if (pathname.startsWith('/accountant/')) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('🚫 No auth token found, redirecting to login:', pathname)
      return NextResponse.redirect(new URL('/accountant/login', request.url))
    }

    try {
      // Use jose for Edge Runtime compatibility
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const user = payload as { id: string; email: string; role: string }
      
      if (!user || (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT')) {
        console.log('🚫 Invalid token or insufficient permissions, redirecting to login:', pathname)
        return NextResponse.redirect(new URL('/accountant/login', request.url))
      }
    } catch (error) {
      console.log('🚫 Token verification failed, redirecting to login:', pathname)
      return NextResponse.redirect(new URL('/accountant/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
