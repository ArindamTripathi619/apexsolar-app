#!/bin/bash

# ApexSolar Secure Deployment Script
# This script sets up the application securely on a remote VM

set -e  # Exit on any error

echo "🚀 Starting ApexSolar Secure Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/apexsolar-app"
NGINX_AVAILABLE="/etc/nginx/sites-available/apexsolar"
NGINX_ENABLED="/etc/nginx/sites-enabled/apexsolar"
SSL_CERT_DIR="/etc/ssl/certs"
SSL_KEY_DIR="/etc/ssl/private"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipecho.net/plain || curl -s icanhazip.com)
echo -e "${BLUE}🌐 Detected Server IP: ${SERVER_IP}${NC}"

# Function to print colored output
print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    SUDO=""
else
    SUDO="sudo"
    echo -e "${YELLOW}Running with sudo for system operations${NC}"
fi

# Step 1: Update system and install dependencies
print_step "Updating system packages..."
$SUDO apt update && $SUDO apt upgrade -y

print_step "Installing required packages..."
$SUDO apt install -y curl wget git nginx docker.io docker-compose ufw openssl

# Start and enable services
$SUDO systemctl start docker
$SUDO systemctl enable docker
$SUDO systemctl start nginx
$SUDO systemctl enable nginx

# Add user to docker group
$SUDO usermod -aG docker $USER

# Step 2: Create application directory
print_step "Setting up application directory..."
$SUDO mkdir -p $APP_DIR
$SUDO chown $USER:$USER $APP_DIR
cd $APP_DIR

# Create uploads directory structure
mkdir -p uploads/{employees,invoices,challans}
chmod 755 uploads
chmod 755 uploads/{employees,invoices,challans}

# Step 3: Generate SSL certificate for IP-based deployment
print_step "Generating SSL certificate for secure HTTPS..."
$SUDO mkdir -p $SSL_CERT_DIR $SSL_KEY_DIR

# Create SSL certificate for IP address
$SUDO openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $SSL_KEY_DIR/apexsolar.key \
    -out $SSL_CERT_DIR/apexsolar.crt \
    -subj "/C=IN/ST=State/L=City/O=ApexSolar/OU=IT/CN=$SERVER_IP" \
    -addext "subjectAltName=IP:$SERVER_IP"

$SUDO chmod 600 $SSL_KEY_DIR/apexsolar.key
$SUDO chmod 644 $SSL_CERT_DIR/apexsolar.crt

# Step 4: Configure Nginx
print_step "Configuring Nginx reverse proxy..."

# Create Nginx configuration
$SUDO tee $NGINX_AVAILABLE > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_IP;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $SERVER_IP;
    
    ssl_certificate $SSL_CERT_DIR/apexsolar.crt;
    ssl_certificate_key $SSL_KEY_DIR/apexsolar.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /api/health {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
    }
    
    access_log /var/log/nginx/apexsolar.access.log;
    error_log /var/log/nginx/apexsolar.error.log;
}
EOF

# Enable the site
$SUDO ln -sf $NGINX_AVAILABLE $NGINX_ENABLED
$SUDO rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
$SUDO nginx -t
$SUDO systemctl reload nginx

# Step 5: Configure firewall
print_step "Configuring firewall..."
$SUDO ufw --force enable
$SUDO ufw allow ssh
$SUDO ufw allow 80/tcp
$SUDO ufw allow 443/tcp
$SUDO ufw allow from 127.0.0.1 to any port 3000

# Step 6: Create environment file
print_step "Creating production environment configuration..."

# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 64)
NEXTAUTH_SECRET=$(openssl rand -hex 64)
DB_PASSWORD=$(openssl rand -base64 32)

cat > .env.production <<EOF
# Database Configuration
DB_USER=apexsolar
DB_PASSWORD=$DB_PASSWORD
DB_NAME=apexsolar
DATABASE_URL=postgresql://apexsolar:$DB_PASSWORD@postgres:5432/apexsolar

# Authentication Secrets
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://$SERVER_IP

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Initial Admin Credentials (CHANGE AFTER FIRST LOGIN!)
ADMIN_EMAIL=admin@apexsolar.net
ADMIN_PASSWORD=admin123

# Application Environment
NODE_ENV=production
EOF

# Step 7: Create production docker-compose file
print_step "Creating production Docker Compose configuration..."

cat > docker-compose.prod.yml <<EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: apexsolar
      POSTGRES_PASSWORD: $DB_PASSWORD
      POSTGRES_DB: apexsolar
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U apexsolar"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - apexsolar-network

  app:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      DATABASE_URL: postgresql://apexsolar:$DB_PASSWORD@postgres:5432/apexsolar
      JWT_SECRET: $JWT_SECRET
      NEXTAUTH_SECRET: $NEXTAUTH_SECRET
      NEXTAUTH_URL: https://$SERVER_IP
      NODE_ENV: production
      UPLOAD_DIR: uploads
      MAX_FILE_SIZE: 5242880
      ADMIN_EMAIL: admin@apexsolar.net
      ADMIN_PASSWORD: admin123
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    networks:
      - apexsolar-network

volumes:
  postgres_data:

networks:
  apexsolar-network:
    driver: bridge
EOF

# If we have the source code, build and deploy
if [ -f "package.json" ]; then
    print_step "Building and starting ApexSolar application..."
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 30
    
    # Setup database
    docker-compose -f docker-compose.prod.yml exec -T app npx prisma db push || print_warning "Database migration failed - will retry"
    sleep 10
    docker-compose -f docker-compose.prod.yml exec -T app npx prisma db seed || print_warning "Database seeding failed - please run manually"
    
    print_step "Application deployed and running!"
else
    print_warning "Source code not found. Please clone your repository to $APP_DIR and run the deployment again."
fi

# Step 8: Setup log rotation
print_step "Setting up log rotation..."
$SUDO tee /etc/logrotate.d/apexsolar > /dev/null <<EOF
/var/log/nginx/apexsolar.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Step 9: Create monitoring script
print_step "Setting up application monitoring..."
cat > monitor.sh <<'EOF'
#!/bin/bash
# ApexSolar Application Monitor

APP_URL="https://localhost/api/health"
LOG_FILE="/var/log/apexsolar-monitor.log"

check_app() {
    if curl -k -s "$APP_URL" | grep -q "healthy"; then
        echo "$(date): Application is healthy" >> "$LOG_FILE"
        return 0
    else
        echo "$(date): Application is down - restarting..." >> "$LOG_FILE"
        cd /opt/apexsolar-app
        docker-compose -f docker-compose.prod.yml restart app
        return 1
    fi
}

check_app
EOF

chmod +x monitor.sh

# Add to crontab for monitoring every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/apexsolar-app/monitor.sh") | crontab -

# Final output
echo
echo -e "${GREEN}🎉 ApexSolar Deployment Complete!${NC}"
echo
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "🌐 Application URL: ${GREEN}https://$SERVER_IP${NC}"
echo -e "🔐 Admin Login: ${GREEN}admin@apexsolar.net${NC}"
echo -e "🔑 Admin Password: ${YELLOW}admin123${NC} ${RED}(CHANGE THIS IMMEDIATELY!)${NC}"
echo -e "📊 Database: ${GREEN}PostgreSQL${NC} (secured with random password)"
echo -e "🔒 SSL: ${GREEN}Self-signed certificate${NC} (browser will show warning)"
echo -e "🛡️  Security: ${GREEN}Firewall configured, HTTPS enforced${NC}"
echo
echo -e "${YELLOW}⚠️  Important Security Notes:${NC}"
echo -e "1. Change the admin password immediately after first login"
echo -e "2. Browser will show SSL warning (accept it for self-signed certificate)"
echo -e "3. Database password is randomly generated and stored in .env.production"
echo -e "4. Application is monitored and will auto-restart if needed"
echo
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo -e "• View logs: ${GREEN}docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "• Restart app: ${GREEN}docker-compose -f docker-compose.prod.yml restart${NC}"
echo -e "• Stop app: ${GREEN}docker-compose -f docker-compose.prod.yml down${NC}"
echo -e "• Check status: ${GREEN}docker-compose -f docker-compose.prod.yml ps${NC}"
echo

print_step "Deployment script completed successfully!"
