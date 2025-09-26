# GitHub Actions Setup for Native Deployment

## Required GitHub Secrets

To enable CI/CD deployment to your Debian server, configure these secrets in your GitHub repository:

**Repository Settings → Secrets and Variables → Actions → New Repository Secret**

### Server Connection Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `HOST` | Your server's IP address or domain | `203.0.113.1` or `yourdomain.com` |
| `USERNAME` | SSH username for your server | `ubuntu` or `debian` |
| `SSH_KEY` | Private SSH key content | Content of your `~/.ssh/id_rsa` file |
| `PASSPHRASE` | SSH key passphrase (optional - only if your key is protected) | `your-ssh-key-passphrase` |
| `PORT` | SSH port (optional, defaults to 22) | `22` |

### Database Configuration (Optional)

These are only needed if you want to override the default database settings:

| Secret Name | Description | Default |
|-------------|-------------|---------|
| `DB_USER` | PostgreSQL username | `apexsolar_user` |
| `DB_PASSWORD` | PostgreSQL password | Set during manual setup |
| `DB_NAME` | Database name | `apexsolar` |

## SSH Key Setup

### 1. Generate SSH Key (if you don't have one)

On your local machine:
```bash
# Generate SSH key with passphrase (recommended for security)
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"
# You will be prompted to enter a passphrase - remember this for the PASSPHRASE secret

# Or generate without passphrase (less secure but simpler)
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com" -N ""
```

### 2. Copy Public Key to Server

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub username@your-server-ip
```

### 3. Add Private Key and Passphrase to GitHub Secrets

#### For the SSH_KEY secret:
```bash
# Copy the private key content
cat ~/.ssh/id_rsa
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) and paste it as the `SSH_KEY` secret in GitHub.

#### For the PASSPHRASE secret (if you used a passphrase):
- If you created your SSH key with a passphrase, add that exact passphrase as the `PASSPHRASE` secret in GitHub
- If you created your SSH key without a passphrase, you can leave the `PASSPHRASE` secret empty or not create it at all

### 4. Test SSH Connection

Before setting up GitHub Actions, test your SSH connection locally:

```bash
# Test SSH connection
ssh -i ~/.ssh/id_rsa username@your-server-ip

# If using a passphrase-protected key, you'll be prompted for the passphrase
# This should work without issues before proceeding with GitHub Actions
```

## Server Prerequisites

Ensure your Debian server has the following installed:

### 1. Git Configuration
```bash
# Configure git for the deployment user
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"
```

### 2. Application Directory Setup
```bash
# Clone repository to the deployment location
sudo mkdir -p /opt/apexsolar-app
sudo chown $USER:$USER /opt/apexsolar-app
git clone https://github.com/YourUsername/apexsolar-app.git /opt/apexsolar-app
cd /opt/apexsolar-app
```

### 3. Initial Deployment
Run the deployment script once manually:
```bash
chmod +x deploy-debian.sh
./deploy-debian.sh
```

## Workflow Overview

The GitHub Actions workflow will:

### On Pull Requests:
1. ✅ Run tests
2. ✅ Run linting
3. ✅ Build application
4. ✅ Verify everything works

### On Push to Main:
1. ✅ Run tests and build
2. ✅ Deploy to production server via SSH
3. ✅ Pull latest code
4. ✅ Install dependencies
5. ✅ Run database migrations
6. ✅ Build application
7. ✅ Restart with PM2

## Deployment Commands

The workflow executes these commands on your server:

```bash
# Navigate to app directory
cd /opt/apexsolar-app

# Pull latest changes
git pull origin main

# Install production dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Build application
npm run build

# Restart application
pm2 restart apexsolar-app

# Save PM2 configuration
pm2 save
```

## Monitoring Deployments

### View Deployment Status
- Go to your GitHub repository
- Click on **Actions** tab
- View deployment progress and logs

### Check Application Status on Server
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs apexsolar-app

# Monitor application
pm2 monit
```

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```
Error: dial tcp: connect: connection refused
```
**Solution:**
- Verify `HOST`, `USERNAME`, `PORT` secrets
- Ensure SSH key is correctly added
- Check server firewall allows SSH (port 22)

#### 2. Permission Denied
```
Error: permission denied (publickey)
```
**Solution:**
- Verify SSH key format in GitHub secret
- Ensure public key is in server's `~/.ssh/authorized_keys`
- Check SSH key permissions on server
- **If using passphrase-protected key**: Ensure `PASSPHRASE` secret is set correctly
- **If not using passphrase**: You can leave `PASSPHRASE` secret empty

#### 3. Database Connection Failed
```
Error: P1001: Can't reach database server
```
**Solution:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env.production`
- Ensure database exists and user has permissions

#### 4. PM2 Process Not Found
```
Error: Process apexsolar-app not found
```
**Solution:**
- Run initial deployment manually first
- Verify PM2 is installed: `pm2 --version`
- Check ecosystem.config.js exists

### Debug Commands

Run these on your server to diagnose issues:

```bash
# Check application status
pm2 status
pm2 logs apexsolar-app --lines 50

# Check database connectivity
npx prisma db push

# Check application build
npm run build

# Test application manually
npm start
```

## Security Best Practices

1. **Use dedicated deployment user**: Don't use root for deployments
2. **Restrict SSH key**: Use a dedicated SSH key only for deployments
3. **Limit sudo access**: The deployment user shouldn't need sudo for app operations
4. **Monitor logs**: Regularly check deployment and application logs
5. **Backup database**: Implement automated backups before deployments

## Environment-Specific Configurations

### Production Environment
- Ensure `NODE_ENV=production` in `.env.production`
- Use strong JWT secrets (auto-generated in deployment script)
- Configure proper domain in `NEXTAUTH_URL`

### Staging Environment
You can create a separate workflow for staging:
- Use different secrets (STAGING_HOST, etc.)
- Deploy on push to `develop` branch
- Use separate staging database

This setup provides reliable, automated deployments while maintaining security and monitoring capabilities.