#!/bin/bash

# ApexSolar Debian Deployment Script
# This script automates the deployment process on a Debian/Ubuntu server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    error "Please do not run this script as root. Use a regular user with sudo privileges."
fi

# Configuration
APP_DIR="/opt/apexsolar-app"
APP_USER=$(whoami)
DB_NAME="apexsolar"
DB_USER="apexsolar_user"

log "🚀 Starting ApexSolar deployment on Debian/Ubuntu..."

# Step 1: Update system
log "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js
log "📦 Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    log "Node.js already installed: $(node --version)"
fi

# Step 3: Install PostgreSQL
log "🗄️ Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    log "PostgreSQL already installed"
fi

# Step 4: Create database and user
log "🗄️ Setting up database..."
read -p "Enter database password for user '$DB_USER': " -s DB_PASSWORD
echo

sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

log "Database setup completed!"

# Step 5: Install PM2
log "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup
    warn "Please run the command displayed above to setup PM2 auto-start"
    read -p "Press Enter after running the startup command..."
else
    log "PM2 already installed"
fi

# Step 6: Create application directory
log "📁 Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR
mkdir -p $APP_DIR/uploads/{employees,invoices,challans}

# Step 7: Install application (assuming we're already in the project directory)
log "📦 Installing application..."
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the project root directory."
fi

cp -r . $APP_DIR/
cd $APP_DIR

# Step 8: Install dependencies
log "📦 Installing dependencies..."
npm install --production

# Step 9: Setup environment
log "⚙️ Setting up environment variables..."
cat > .env.production << EOF
# Database configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# JWT configuration
JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
JWT_EXPIRES_IN="7d"

# NextAuth configuration
NEXTAUTH_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
NEXTAUTH_URL="http://localhost:3000"

# File upload configuration
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880

# Initial admin credentials
ADMIN_EMAIL="admin@apexsolar.net"
ADMIN_PASSWORD="admin123"

# Environment
NODE_ENV="production"
PORT=3000
EOF

log "Environment file created. Please update NEXTAUTH_URL with your domain."

# Step 10: Setup database schema
log "🗄️ Setting up database schema..."
npx prisma generate
npx prisma db push
npm run db:seed

# Step 11: Build application
log "🔨 Building application..."
npm run build

# Step 12: Create PM2 ecosystem file
log "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'apexsolar-app',
    script: 'npm',
    args: 'start',
    cwd: '/opt/apexsolar-app',
    env_file: '.env.production',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    error_file: '/var/log/apexsolar/error.log',
    out_file: '/var/log/apexsolar/out.log',
    log_file: '/var/log/apexsolar/combined.log',
    time: true
  }]
}
EOF

# Step 13: Create log directory
sudo mkdir -p /var/log/apexsolar
sudo chown $APP_USER:$APP_USER /var/log/apexsolar

# Step 14: Start application
log "🚀 Starting application..."
pm2 start ecosystem.config.js
pm2 save

# Step 15: Install Nginx (optional)
read -p "Do you want to install and configure Nginx? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "📦 Installing Nginx..."
    sudo apt install -y nginx
    
    read -p "Enter your domain name (or press Enter for localhost): " DOMAIN_NAME
    DOMAIN_NAME=${DOMAIN_NAME:-localhost}
    
    sudo tee /etc/nginx/sites-available/apexsolar << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 10M;
    }
}
EOF
    
    sudo ln -sf /etc/nginx/sites-available/apexsolar /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
    log "Nginx configured for domain: $DOMAIN_NAME"
fi

# Step 16: Setup firewall
log "🔒 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

log "✅ Deployment completed successfully!"
echo
echo "🎉 ApexSolar is now running!"
echo "🌐 Access your application:"
if [ "$DOMAIN_NAME" != "localhost" ] && [ -n "$DOMAIN_NAME" ]; then
    echo "   External: http://$DOMAIN_NAME"
fi
echo "   Local: http://localhost:3000"
echo
echo "👤 Default login credentials:"
echo "   Admin: admin@apexsolar.net / admin123"
echo "   Accountant: accountant@apexsolar.net / accountant123"
echo
echo "📋 Useful commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs            - View application logs"
echo "   pm2 restart all     - Restart application"
echo "   pm2 monit           - Monitor application"
echo
log "🔐 IMPORTANT: Change default passwords after first login!"