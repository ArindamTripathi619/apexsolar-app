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
      // Check if table exists first
      console.log('Checking if company_settings table exists...')
      const tableExists = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_settings'
      `
      console.log('Table existence check result:', tableExists)
      
      if (!Array.isArray(tableExists) || tableExists.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'CompanySettings table does not exist',
          details: 'Table company_settings not found in database schema'
        })
      }
      
      // Check table structure
      console.log('Checking table structure...')
      const tableStructure = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'company_settings'
        ORDER BY ordinal_position
      `
      console.log('Table structure:', tableStructure)
      
      // Try to query the table
      console.log('Querying company_settings table...')
      const result = await prisma.$queryRaw`SELECT * FROM company_settings LIMIT 1`
      console.log('✅ Raw CompanySettings query successful:', result)
      
      return NextResponse.json({
        success: true,
        message: 'Database diagnostic completed successfully',
        databaseConnected: true,
        companySettingsTable: 'accessible via raw query',
        tableStructure: tableStructure,
        data: result
      })
    } catch (rawError) {
      console.log('❌ Raw CompanySettings query error:', {
        message: rawError instanceof Error ? rawError.message : 'Unknown error',
        stack: rawError instanceof Error ? rawError.stack : undefined,
        code: (rawError as any)?.code,
        errno: (rawError as any)?.errno,
        sqlMessage: (rawError as any)?.sqlMessage,
      })
      return NextResponse.json({
        success: false,
        error: 'CompanySettings table not accessible',
        details: rawError instanceof Error ? rawError.message : 'Unknown error',
        code: (rawError as any)?.code
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
