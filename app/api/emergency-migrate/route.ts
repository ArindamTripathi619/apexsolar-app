import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow this in emergency situations
    const authHeader = request.headers.get('x-migration-key')
    if (authHeader !== 'emergency-documents-fix-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Starting emergency documents table migration...')

    // Execute the raw SQL to create the missing table and enum
    await prisma.$executeRaw`
      DO $$ BEGIN
          CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'FINANCIAL', 'LEGAL', 'HR', 'COMPLIANCE', 'CONTRACTS', 'INVOICES', 'REPORTS', 'POLICIES', 'CERTIFICATES');
      EXCEPTION
          WHEN duplicate_object THEN 
              RAISE NOTICE 'DocumentCategory enum already exists';
      END $$;
    `

    await prisma.$executeRaw`
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

    await prisma.$executeRaw`
      DO $$ BEGIN
          ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey" 
          FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
          WHEN duplicate_object THEN 
              RAISE NOTICE 'Foreign key constraint already exists';
      END $$;
    `

    // Test that the table works by trying to count documents
    const testQuery = await prisma.$queryRaw`SELECT COUNT(*) as count FROM documents`
    
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
