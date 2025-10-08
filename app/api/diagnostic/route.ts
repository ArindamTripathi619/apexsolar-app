import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    console.log('=== DATABASE DIAGNOSTIC ===')
    
    // Test basic database connection
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test a simple query that we know works
    console.log('Testing basic database query...')
    try {
      const users = await prisma.user.findMany({ take: 1 })
      console.log('✅ Basic query successful, user count:', users.length)
    } catch (queryError) {
      console.log('❌ Basic query error:', queryError)
      return NextResponse.json({
        success: false,
        error: 'Basic database query failed',
        details: queryError instanceof Error ? queryError.message : 'Unknown error'
      })
    }
    
    // Test raw query to CompanySettings
    console.log('Testing raw CompanySettings query...')
    try {
      const result = await prisma.$queryRaw`SELECT * FROM company_settings LIMIT 1`
      console.log('✅ Raw CompanySettings query successful:', result)
      
      return NextResponse.json({
        success: true,
        message: 'Database diagnostic completed successfully',
        databaseConnected: true,
        companySettingsTable: 'accessible via raw query',
        data: result
      })
    } catch (rawError) {
      console.log('❌ Raw CompanySettings query error:', rawError)
      return NextResponse.json({
        success: false,
        error: 'CompanySettings table not accessible',
        details: rawError instanceof Error ? rawError.message : 'Unknown error'
      })
    }
    
  } catch (error) {
    console.error('❌ Database diagnostic failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
