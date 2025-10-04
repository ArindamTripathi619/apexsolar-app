import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      success: true,
      message: 'POST test endpoint working',
      receivedBody: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request body',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}