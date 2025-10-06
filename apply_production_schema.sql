-- Add missing enum values
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ACCOUNTANT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentType" AS ENUM ('PROFILE_PHOTO', 'AADHAR_CARD', 'MEDICAL_CERTIFICATE', 'PF_DETAILS', 'ESI_DETAILS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM ('DUE', 'ADVANCE', 'DUE_CLEARED', 'ADVANCE_REPAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ChallanType" AS ENUM ('PF', 'ESI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create clients table if not exists
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "addressLine3" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- Create client_payments table if not exists
CREATE TABLE IF NOT EXISTS "client_payments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_payments_pkey" PRIMARY KEY ("id")
);

-- Add columns to existing tables if they don't exist
DO $$ BEGIN
    ALTER TABLE "payments" ADD COLUMN "clearedPaymentId" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoices" ADD COLUMN "clientId" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "client_payments" ADD CONSTRAINT "client_payments_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_clearedPaymentId_fkey" 
    FOREIGN KEY ("clearedPaymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
