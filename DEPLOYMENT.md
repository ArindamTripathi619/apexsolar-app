# Deployment Guide

## GitHub Secrets Configuration

For the CI/CD pipeline to work, you need to configure the following secrets in your GitHub repository:

### Repository Secrets (Settings > Secrets and Variables > Actions)

#### Server Connection
- `HOST`: Your remote VM's IP address or domain
- `USERNAME`: SSH username for your VM (usually `root` or `ubuntu`)  
- `SSH_KEY`: Private SSH key content for passwordless access
- `PORT`: SSH port (usually `22`)

#### Database Configuration
- `DB_USER`: PostgreSQL username (e.g., `apexsolar`)
- `DB_PASSWORD`: Strong PostgreSQL password
- `DB_NAME`: Database name (e.g., `apexsolar`)

#### Application Security
- `JWT_SECRET`: Strong random string for JWT signing (64+ characters)
- `NEXTAUTH_SECRET`: Strong random string for NextAuth (64+ characters)
- `NEXTAUTH_URL`: Your production URL (e.g., `https://yourdomain.com`)

## Server Prerequisites

### 1. Install Docker and Docker Compose
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Restart session to apply docker group
newgrp docker
```

### 2. Create Application Directory
```bash
sudo mkdir -p /opt/apexsolar-app
sudo chown $USER:$USER /opt/apexsolar-app
cd /opt/apexsolar-app
mkdir -p uploads/{employees,invoices,challans}
```

### 3. Setup SSH Key Authentication
```bash
# On your local machine, generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id username@your-server-ip

# Test passwordless access
ssh username@your-server-ip
```

### 4. Configure Firewall
```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Application (temporary)
sudo ufw --force enable
```

## Manual Deployment (Alternative to CI/CD)

If you prefer manual deployment:

```bash
# 1. Clone repository on server
git clone https://github.com/ArindamTripathi619/apexsolar-app.git /opt/apexsolar-app
cd /opt/apexsolar-app

# 2. Create production environment file
cp .env.example .env.production
# Edit .env.production with your production values

# 3. Build and start services
docker-compose -f docker-compose.yml up -d --build

# 4. Setup database
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma db seed
```

## Domain and SSL Setup

### 1. Point Domain to Your Server
Update your domain's DNS A record to point to your server's IP address.

### 2. Install Nginx (Reverse Proxy)
```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/apexsolar << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
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
cd /opt/apexsolar-app
docker-compose logs -f app
```

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U apexsolar apexsolar > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U apexsolar apexsolar < backup_file.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run any new migrations
docker-compose exec app npx prisma db push
```

## Security Recommendations

1. **Change Default Credentials**: Update admin password after first login
2. **Regular Updates**: Keep server and Docker images updated
3. **Database Access**: Restrict PostgreSQL access to localhost only  
4. **File Permissions**: Ensure proper permissions on upload directories
5. **Backup Strategy**: Implement automated daily database backups
6. **Monitoring**: Set up uptime monitoring and alerts

## Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check database connection
docker-compose exec app npx prisma db push
```

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Recreate database
docker-compose down -v
docker-compose up -d
```

### File Upload Issues
```bash
# Check upload directory permissions
ls -la /opt/apexsolar-app/uploads
sudo chown -R 1001:1001 /opt/apexsolar-app/uploads
```
