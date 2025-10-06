#!/bin/bash

# Alternative approach: Use the application's own database connection to run the migration

echo "🔧 Executing production database fix via application API..."

# First, let's create a special migration API endpoint that can be called
cat > /tmp/migration.sql << 'EOF'
-- Create DocumentCategory enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'FINANCIAL', 'LEGAL', 'HR', 'COMPLIANCE', 'CONTRACTS', 'INVOICES', 'REPORTS', 'POLICIES', 'CERTIFICATES');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'DocumentCategory enum already exists';
END $$;

-- Create documents table if it doesn't exist
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

-- Add foreign key constraint for documents if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey" 
    FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Foreign key constraint already exists';
END $$;
EOF

echo "📄 Migration SQL created. Now we need to create a temporary API endpoint to execute this..."
