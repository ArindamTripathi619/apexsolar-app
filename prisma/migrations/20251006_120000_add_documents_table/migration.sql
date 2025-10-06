-- CreateEnum for DocumentCategory
CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'FINANCIAL', 'LEGAL', 'HR', 'COMPLIANCE', 'CONTRACTS', 'INVOICES', 'REPORTS', 'POLICIES', 'CERTIFICATES');

-- CreateTable
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

-- Add foreign key constraint for documents
DO $$ BEGIN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey" 
    FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
