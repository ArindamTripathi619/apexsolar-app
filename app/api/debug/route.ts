import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const testQuery = await (prisma as any).$queryRaw`SELECT 1 as test`
    
    // Test environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      hasClients: false
    }
    
    // Test clients table access
    try {
      const clientCount = await (prisma as any).client.count()
      envCheck.hasClients = true
      envCheck.clientCount = clientCount
    } catch (e) {
      envCheck.clientError = e.message
    }
    
    return NextResponse.json({
      success: true,
      dbConnection: testQuery,
      environment: envCheck,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Debug check failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
