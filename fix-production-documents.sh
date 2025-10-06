#!/bin/bash

# Production Database Fix Script
# This script creates the missing documents table and enum in production

echo "🔧 Starting production database fix for documents table..."

# Check if we're authenticated with gcloud
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud first"
    exit 1
fi

# Set project
gcloud config set project apexsolar-app

echo "📊 Connecting to production database to create missing documents table..."

# Execute the SQL directly using Cloud SQL Proxy or gcloud sql connect
gcloud sql connect apexsolar-db --user=apexsolar --quiet << 'EOF'
-- Create DocumentCategory enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'FINANCIAL', 'LEGAL', 'HR', 'COMPLIANCE', 'CONTRACTS', 'INVOICES', 'REPORTS', 'POLICIES', 'CERTIFICATES');
EXCEPTION
    WHEN duplicate_object THEN null;
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
    WHEN duplicate_object THEN null;
END $$;

-- Verify the table was created
\d documents;

-- Check if enum was created
\dT+ "DocumentCategory";

\q
EOF

echo "✅ Production database fix completed!"
echo "🧪 Testing document endpoints..."

# Test the document endpoint after the fix
sleep 5
echo "Testing document fetch..."
curl -s -X POST https://apexsolar-302444603160.asia-south1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@apexsolar.net","password":"admin123"}' \
  -c test_cookies.txt > /dev/null

FETCH_RESULT=$(curl -s https://apexsolar-302444603160.asia-south1.run.app/api/documents -b test_cookies.txt)
echo "Document fetch result: $FETCH_RESULT"

if echo "$FETCH_RESULT" | grep -q '"success":true'; then
    echo "✅ Document fetch is now working!"
else
    echo "❌ Document fetch still failing"
fi

rm -f test_cookies.txt

echo "🎉 Fix script completed!"
