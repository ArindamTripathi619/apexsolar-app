import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API routes are working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      success: true,
      message: 'POST request successful',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request body',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}
