import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    console.log('🩺 Production diagnostic started')
    
    // 1. Environment check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'NOT SET',
      timestamp: new Date().toISOString()
    }
    
    console.log('🌍 Environment:', envCheck)
    
    // 2. Basic database test
    console.log('🔌 Testing basic database connection...')
    const basicTest = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`
    console.log('✅ Basic database test successful:', basicTest)
    
    // 3. Check if clients table exists
    console.log('📊 Checking clients table...')
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clients'
    `
    console.log('📋 Clients table check:', tableCheck)
    
    // 4. Count clients
    console.log('🔢 Counting clients...')
    const clientCount = await prisma.client.count()
    console.log(`📊 Total clients: ${clientCount}`)
    
    // 5. Try to fetch one client
    console.log('👤 Fetching one client...')
    const oneClient = await prisma.client.findFirst()
    console.log('👤 First client:', oneClient ? 'Found' : 'None found')
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connected: true,
        basicTest: basicTest,
        clientsTableExists: Array.isArray(tableCheck) && tableCheck.length > 0,
        clientCount: clientCount,
        hasClients: !!oneClient
      }
    })
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code,
      errno: (error as any)?.errno
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
