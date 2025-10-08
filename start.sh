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
    
    # Try to deploy migrations
    echo "Deploying database migrations..."
    npx prisma migrate deploy 2>/dev/null || {
        echo "Migrate deploy failed, trying db push..."
        npx prisma db push --accept-data-loss 2>/dev/null || {
            echo "⚠️ Database migration failed, but continuing startup..."
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
