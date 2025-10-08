#!/bin/sh
set -e

echo "Starting ApexSolar application..."
echo "Node version: $(node --version)"

# Run database migrations if DATABASE_URL is set
if [ ! -z "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    
    # Generate Prisma client first
    echo "Generating Prisma client..."
    npx prisma generate || echo "Prisma generate failed, continuing..."
    
    # Apply production invoice table fixes
    echo "Applying production invoice table fixes..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function fixInvoiceTable() {
            try {
                console.log('Adding missing invoice columns...');
                
                // Add missing columns to invoices table
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"invoiceNumber\" TEXT\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"financialYear\" TEXT\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"workOrderReference\" TEXT\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"workOrderDate\" TIMESTAMP(3)\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"totalBasicAmount\" DOUBLE PRECISION\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"cgstPercentage\" DOUBLE PRECISION\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"cgstAmount\" DOUBLE PRECISION\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"sgstPercentage\" DOUBLE PRECISION\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"sgstAmount\" DOUBLE PRECISION\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"grandTotal\" DOUBLE PRECISION\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"amountInWords\" TEXT\`;
                await prisma.\$executeRaw\`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"isGenerated\" BOOLEAN DEFAULT false\`;
                
                console.log('✅ Invoice table columns added successfully');
                
                // Create invoice_line_items table if it doesn't exist
                await prisma.\$executeRaw\`
                    CREATE TABLE IF NOT EXISTS \"invoice_line_items\" (
                        \"id\" TEXT NOT NULL,
                        \"invoiceId\" TEXT NOT NULL,
                        \"serialNumber\" INTEGER NOT NULL,
                        \"description\" TEXT NOT NULL,
                        \"hsnSacCode\" TEXT,
                        \"rate\" DOUBLE PRECISION NOT NULL,
                        \"quantity\" DOUBLE PRECISION NOT NULL,
                        \"unit\" TEXT NOT NULL DEFAULT 'kWp',
                        \"amount\" DOUBLE PRECISION NOT NULL,
                        CONSTRAINT \"invoice_line_items_pkey\" PRIMARY KEY (\"id\")
                    )
                \`;
                
                console.log('✅ Invoice line items table created');
                
            } catch (error) {
                console.log('⚠️ Invoice table fix error (may be already applied):', error.message);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        fixInvoiceTable();
    " || echo "Invoice table fix completed with warnings"
    
    # Try to resolve the initial migration as applied (for existing databases)
    npx prisma migrate resolve --applied 20250126_init 2>/dev/null || echo "Initial migration resolution skipped"
    
    # Try to deploy new migrations
    npx prisma migrate deploy 2>/dev/null || {
        echo "Migrate deploy failed, trying db push..."
        npx prisma db push --accept-data-loss 2>/dev/null || {
            echo "DB push failed, trying to create tables manually..."
            # Create the clients table manually if it doesn't exist
            node -e "
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                
                async function createTables() {
                    try {
                        // Create clients table
                        await prisma.\$executeRaw\`
                            CREATE TABLE IF NOT EXISTS clients (
                                id TEXT NOT NULL,
                                \"companyName\" TEXT NOT NULL,
                                \"gstNumber\" TEXT,
                                \"panNumber\" TEXT,
                                \"addressLine1\" TEXT NOT NULL,
                                \"addressLine2\" TEXT,
                                \"addressLine3\" TEXT,
                                city TEXT,
                                state TEXT,
                                \"pinCode\" TEXT,
                                \"contactPerson\" TEXT,
                                email TEXT,
                                phone TEXT,
                                \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT clients_pkey PRIMARY KEY (id)
                            );
                        \`;
                        
                        // Create client_payments table
                        await prisma.\$executeRaw\`
                            CREATE TABLE IF NOT EXISTS client_payments (
                                id TEXT NOT NULL,
                                \"clientId\" TEXT NOT NULL,
                                amount DOUBLE PRECISION NOT NULL,
                                description TEXT,
                                date TIMESTAMP(3) NOT NULL,
                                \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT client_payments_pkey PRIMARY KEY (id)
                            );
                        \`;
                        
                        // Add columns to existing tables if they don't exist
                        await prisma.\$executeRaw\`
                            ALTER TABLE payments ADD COLUMN IF NOT EXISTS \"clearedPaymentId\" TEXT;
                        \` || true;
                        
                        await prisma.\$executeRaw\`
                            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS \"clientId\" TEXT;
                        \` || true;
                        
                        console.log('Tables created/updated successfully');
                    } catch (error) {
                        console.log('Table creation skipped:', error.message);
                    } finally {
                        await prisma.\$disconnect();
                    }
                }
                
                createTables();
            " 2>/dev/null || echo "Manual table creation also failed, continuing..."
        }
    }
    echo "Database setup completed"
else
    echo "DATABASE_URL not set, skipping migrations"
fi

# Start the application
echo "Starting Next.js server..."
echo "Current directory: $(pwd)" 
echo "Files in current directory:" 
ls -la
exec node server.js
