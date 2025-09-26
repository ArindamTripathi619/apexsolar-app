# Debian Server Deployment Guide

This guide covers both automated and manual deployment options for the ApexSolar application on Debian/Ubuntu servers.

## 🚀 Automated Deployment Options

### Option 1: GitHub Actions CI/CD (Recommended)
Automatic deployment on every push to main branch.
- **Setup**: See `GITHUB_ACTIONS_SETUP.md`
- **Benefits**: Automated testing, deployment, and rollback
- **Requirements**: GitHub repository with secrets configured

### Option 2: Local Deployment Script
One-command deployment from your local machine.
- **Command**: `./deploy-debian.sh`
- **Benefits**: Interactive setup, immediate deployment
- **Requirements**: Direct access to Debian server

## 📋 Manual Deployment

For custom setups or troubleshooting, follow these manual steps:

## Server Prerequisites

### 1. Update System and Install Node.js
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE apexsolar;
CREATE USER apexsolar_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE apexsolar TO apexsolar_user;
\q
```

### 3. Create Application Directory
```bash
sudo mkdir -p /opt/apexsolar-app
sudo chown $USER:$USER /opt/apexsolar-app
cd /opt/apexsolar-app
mkdir -p uploads/{employees,invoices,challans}
```

### 4. Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 5. Configure Firewall
```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Application (temporary)
sudo ufw --force enable
```

## Application Deployment

### 1. Clone and Setup Application
```bash
# Clone repository
git clone https://github.com/YourUsername/apexsolar-app.git /opt/apexsolar-app
cd /opt/apexsolar-app

# Install dependencies
npm install --production

# Create production environment file
cp .env.example .env.production
# Edit .env.production with your production values
```

### 2. Configure Environment Variables
Edit `/opt/apexsolar-app/.env.production`:
```bash
# Database configuration
DATABASE_URL="postgresql://apexsolar_user:your_secure_password@localhost:5432/apexsolar"

# JWT configuration
JWT_SECRET="your-super-secret-jwt-key-here-64-characters-minimum"
JWT_EXPIRES_IN="7d"

# NextAuth configuration
NEXTAUTH_SECRET="your-super-secret-nextauth-key-here-64-characters-minimum"
NEXTAUTH_URL="https://yourdomain.com"

# File upload configuration
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880

# Initial admin credentials
ADMIN_EMAIL="admin@apexsolar.net"
ADMIN_PASSWORD="change-this-secure-password"

# Environment
NODE_ENV="production"
```

### 3. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with initial data
npm run db:seed
```

### 4. Build Application
```bash
# Build for production
npm run build
```

### 5. Start Application with PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'apexsolar-app',
    script: 'npm',
    args: 'start',
    cwd: '/opt/apexsolar-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/apexsolar/error.log',
    out_file: '/var/log/apexsolar/out.log',
    log_file: '/var/log/apexsolar/combined.log',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G'
  }]
}
EOF

# Create log directory
sudo mkdir -p /var/log/apexsolar
sudo chown $USER:$USER /var/log/apexsolar

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
```

## Domain and SSL Setup

### 1. Point Domain to Your Server
Update your domain's DNS A record to point to your server's IP address.

### 2. Install Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/apexsolar << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # File upload size limit
        client_max_body_size 10M;
    }
    
    # Static file serving
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/apexsolar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Setup SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Monitoring and Maintenance

### View Application Logs
```bash
# View PM2 logs
pm2 logs apexsolar-app

# View specific log files
tail -f /var/log/apexsolar/error.log
tail -f /var/log/apexsolar/out.log

# Monitor application status
pm2 status
pm2 monit
```

### Database Backup
```bash
# Create backup script
sudo tee /usr/local/bin/backup-apexsolar.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/apexsolar"
mkdir -p $BACKUP_DIR

# Database backup
sudo -u postgres pg_dump apexsolar > $BACKUP_DIR/apexsolar_db_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/apexsolar_files_$DATE.tar.gz -C /opt/apexsolar-app uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

# Make script executable
sudo chmod +x /usr/local/bin/backup-apexsolar.sh

# Add to crontab for daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-apexsolar.sh") | crontab -
```

### Update Application
```bash
# Pull latest changes
cd /opt/apexsolar-app
git pull origin main

# Install new dependencies
npm install --production

# Run database migrations if any
npx prisma db push

# Rebuild application
npm run build

# Restart application
pm2 restart apexsolar-app
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Check system resources
htop                    # System resources
pm2 monit             # Application monitoring
sudo systemctl status nginx postgresql
```

## Security Recommendations

1. **Change Default Credentials**: Update admin password after first login
2. **Regular Updates**: Keep server and Node.js updated
3. **Database Security**: Use strong passwords and limit PostgreSQL access
4. **File Permissions**: Ensure proper permissions on upload directories
5. **Backup Strategy**: Implement automated daily database backups
6. **Monitoring**: Set up uptime monitoring and alerts
7. **SSL Certificates**: Keep SSL certificates up to date with auto-renewal

## Troubleshooting

### Application Won't Start
```bash
# Check application logs
pm2 logs apexsolar-app

# Check if port 3000 is in use
sudo netstat -tlnp | grep :3000

# Restart application
pm2 restart apexsolar-app
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -c "SELECT version();"

# Check database permissions
sudo -u postgres psql -c "\l"
```

### File Upload Issues
```bash
# Check upload directory permissions
ls -la /opt/apexsolar-app/uploads
sudo chown -R $USER:$USER /opt/apexsolar-app/uploads
sudo chmod -R 755 /opt/apexsolar-app/uploads
```

### Performance Issues
```bash
# Monitor system resources
htop

# Check application memory usage
pm2 monit

# Optimize database if needed
sudo -u postgres psql apexsolar -c "VACUUM ANALYZE;"
```
