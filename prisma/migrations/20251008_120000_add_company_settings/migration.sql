-- CreateTable
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
