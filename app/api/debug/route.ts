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
      hasClients: false
    }
    
    // Test clients table access
    try {
      const clientCount = await (prisma as any).client.count()
      envCheck.hasClients = true
      envCheck.clientCount = clientCount
    } catch (e) {
      envCheck.clientError = e instanceof Error ? e.message : 'Unknown error'
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

export async function POST(request: NextRequest) {
  try {
    // Security check
    const authHeader = request.headers.get('x-migration-key')
    if (authHeader !== 'emergency-documents-fix-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Starting emergency documents table migration...')

    // Execute the raw SQL to create the missing table and enum
    await (prisma as any).$executeRaw`
      DO $$ BEGIN
          CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'FINANCIAL', 'LEGAL', 'HR', 'COMPLIANCE', 'CONTRACTS', 'INVOICES', 'REPORTS', 'POLICIES', 'CERTIFICATES');
      EXCEPTION
          WHEN duplicate_object THEN 
              RAISE NOTICE 'DocumentCategory enum already exists';
      END $$;
    `

    await (prisma as any).$executeRaw`
      CREATE TABLE IF NOT EXISTS "documents" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "fileName" TEXT NOT NULL,
          "fileUrl" TEXT NOT NULL,
          "fileSize" INTEGER,
          "mimeType" TEXT,
          "category" "DocumentCategory" NOT NULL DEFAULT 'GENERAL',
          "uploadedBy" TEXT NOT NULL,
          "uploadedFor" TEXT,
          "tags" TEXT[],
          "isPublic" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
      );
    `

    await (prisma as any).$executeRaw`
      DO $$ BEGIN
          ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey" 
          FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
          WHEN duplicate_object THEN 
              RAISE NOTICE 'Foreign key constraint already exists';
      END $$;
    `

    // Test that the table works by trying to count documents
    const testQuery = await (prisma as any).$queryRaw`SELECT COUNT(*) as count FROM documents`
    
    console.log('✅ Documents table migration completed successfully')
    console.log('📊 Test query result:', testQuery)

    return NextResponse.json({
      success: true,
      message: 'Documents table created successfully',
      testResult: testQuery
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      details: error
    }, { status: 500 })
  }
}
