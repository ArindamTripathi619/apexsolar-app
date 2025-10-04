import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/app/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    console.log('Login request received');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    
    // Log the request headers
    console.log('Request headers:', Object.fromEntries(request.headers));
    
    // Check if request body exists
    const rawBody = await request.text();
    console.log('Raw body received:', rawBody);
    console.log('Raw body length:', rawBody.length);
    
    if (!rawBody || rawBody.length === 0) {
      console.log('Empty request body received');
      return NextResponse.json(
        { success: false, error: 'Empty request body' },
        { status: 400 }
      )
    }
    
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Parsed body:', body);
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    // Validate body structure
    if (!body || typeof body !== 'object') {
      console.log('Invalid body structure:', typeof body);
      return NextResponse.json(
        { success: false, error: 'Invalid request body structure' },
        { status: 400 }
      )
    }
    
    if (!body.email || !body.password) {
      console.log('Missing email or password:', { email: body.email, password: body.password ? 'present' : 'missing' });
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    const { email, password } = loginSchema.parse(body)
    console.log('Parsed data:', { email, password: '***' });

    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    const user = await authenticateUser(email, password, clientIp)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken(user)

    const response = NextResponse.json({
      success: true,
      data: { user, token }
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid request data: ' + error.message },
      { status: 400 }
    )
  }
}