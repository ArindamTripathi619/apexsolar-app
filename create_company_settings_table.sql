-- Create company_settings table for production
-- Run this SQL script directly on your production database

CREATE TABLE IF NOT EXISTS "company_settings" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL DEFAULT 'APEX SOLAR',
    "bankName" TEXT NOT NULL DEFAULT 'STATE BANK OF INDIA',
    "ifscCode" TEXT NOT NULL DEFAULT 'SBIN0007679',
    "accountNumber" TEXT NOT NULL DEFAULT '40423372674',
    "gstNumber" TEXT NOT NULL DEFAULT '19AFZPT2526E1ZV',
    "stampSignatureUrl" TEXT,
    "companyLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default company settings if the table is empty
INSERT INTO "company_settings" ("id", "accountName", "bankName", "ifscCode", "accountNumber", "gstNumber", "createdAt", "updatedAt")
SELECT 
    'default_company_settings',
    'APEX SOLAR',
    'STATE BANK OF INDIA', 
    'SBIN0007679',
    '40423372674',
    '19AFZPT2526E1ZV',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "company_settings" LIMIT 1);
