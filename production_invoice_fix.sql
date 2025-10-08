-- Add missing columns to invoices table in production
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "financialYear" TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "workOrderReference" TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "workOrderDate" TIMESTAMP(3);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "totalBasicAmount" DOUBLE PRECISION;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "cgstPercentage" DOUBLE PRECISION;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "cgstAmount" DOUBLE PRECISION;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "sgstPercentage" DOUBLE PRECISION;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "sgstAmount" DOUBLE PRECISION;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "grandTotal" DOUBLE PRECISION;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "amountInWords" TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "isGenerated" BOOLEAN DEFAULT false;

-- Create invoice_line_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hsnSacCode" TEXT,
    "rate" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kWp',
    "amount" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoice_line_items_invoiceId_fkey'
    ) THEN
        ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
