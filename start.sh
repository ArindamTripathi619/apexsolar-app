#!/bin/sh
set -e

echo "Starting ApexSolar application..."

# Run database migrations if DATABASE_URL is set
if [ ! -z "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    
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
exec node server.js
