import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const testQuery = await (prisma as any).$queryRaw`SELECT 1 as test`
    
    // Test environment variables
    const envCheck: any = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      hasClients: false,
      hasDocuments: false
    }
    
    // Test clients table access
    try {
      const clientCount = await (prisma as any).client.count()
      envCheck.hasClients = true
      envCheck.clientCount = clientCount
    } catch (e) {
      envCheck.clientError = e instanceof Error ? e.message : 'Unknown error'
    }
    
    // Test documents table access
    try {
      const documentCount = await (prisma as any).document.count()
      envCheck.hasDocuments = true
      envCheck.documentCount = documentCount
    } catch (e) {
      envCheck.documentsError = e instanceof Error ? e.message : 'Unknown error'
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
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
