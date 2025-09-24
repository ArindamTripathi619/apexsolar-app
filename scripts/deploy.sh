#!/bin/bash

# ApexSolar Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting ApexSolar deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🗄️  Starting database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose exec -T postgres psql -U apexsolar -d apexsolar -c "SELECT 1;" || {
    echo "❌ Database is not ready"
    exit 1
}

# Generate Prisma client and run migrations
echo "🏗️  Setting up database schema..."
docker-compose run --rm app npx prisma migrate deploy
docker-compose run --rm app npx prisma db seed

echo "🌐 Starting the application..."
docker-compose up -d app

echo "✅ Deployment completed!"
echo ""
echo "🎉 ApexSolar is now running at:"
echo "   📱 Main Site: http://localhost:3000"
echo "   👨‍💼 Admin Portal: http://localhost:3000/admin/login"
echo "   📊 Attendance Portal: http://localhost:3000/attendance"
echo ""
echo "🔑 Default Login Credentials:"
echo "   Admin: admin@apexsolar.net / admin123"
echo "   Accountant: accountant@apexsolar.net / accountant123"
echo ""
echo "📊 View logs with: docker-compose logs -f"
echo "🛑 Stop services with: docker-compose down"
