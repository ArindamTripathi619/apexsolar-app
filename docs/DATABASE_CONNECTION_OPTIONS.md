# Database Connection String Options for Cloud Run

## Current Issue
The connection string format might not be compatible with Prisma in Cloud Run environment.

## Alternative Connection String Formats to Try

### Option 1: Standard Socket Format (Current - Not Working)
```
postgresql://apexsolar-user:ApexSolar2024!@/apexsolar?host=/cloudsql/apexsolar-app:asia-south1:apexsolar-db
```

### Option 2: Localhost with Socket (Try This First)
```
postgresql://apexsolar-user:ApexSolar2024!@localhost/apexsolar?host=/cloudsql/apexsolar-app:asia-south1:apexsolar-db
```

### Option 3: Full Socket Path Format
```
postgresql://apexsolar-user:ApexSolar2024!@localhost/apexsolar?host=/cloudsql/apexsolar-app:asia-south1:apexsolar-db&sslmode=require
```

### Option 4: Public IP (Fallback - Less Secure)
```
postgresql://apexsolar-user:ApexSolar2024!@35.200.232.74:5432/apexsolar?sslmode=require
```

### Option 5: URL Encoded Password (If Special Characters Cause Issues)
```
postgresql://apexsolar-user:ApexSolar2024%21@localhost/apexsolar?host=/cloudsql/apexsolar-app:asia-south1:apexsolar-db
```

## Steps to Test Each Option

1. **Update GitHub Secret**: Go to repository Settings → Secrets and variables → Actions
2. **Edit DATABASE_URL secret** with one of the formats above
3. **Re-run the deployment**
4. **Check if login works**

## Quick Test Commands

Test connection locally with Cloud SQL Proxy:
```bash
# Start Cloud SQL Proxy
cloud_sql_proxy -instances=apexsolar-app:asia-south1:apexsolar-db=tcp:5432

# Test connection
psql "postgresql://apexsolar-user:ApexSolar2024!@localhost:5432/apexsolar"
```

## Recommended Order to Try:
1. Option 2 (localhost with socket)
2. Option 4 (public IP as fallback)
3. Option 3 (with SSL mode)
4. Option 5 (URL encoded)
