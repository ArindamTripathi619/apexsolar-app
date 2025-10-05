# Database Connection Troubleshooting

## Current Issue
The Cloud Run deployment is failing with:
```
Invalid `prisma.user.findUnique()` invocation: The provided database string is invalid. 
Error parsing connection string: empty host in database URL.
```

## Root Cause Analysis
1. The DATABASE_URL environment variable is either empty or malformed in Cloud Run
2. Cloud SQL connection might not be properly configured
3. The connection string format might be incorrect for Cloud Run

## Solutions

### Option 1: Verify DATABASE_URL Secret
Your DATABASE_URL secret in GitHub should be:
```
postgresql://apexsolar-user:ApexSolar2024!@/apexsolar?host=/cloudsql/apexsolar-app:asia-south1:apexsolar-db
```

### Option 2: Alternative Connection String Format
If the above doesn't work, try this format:
```
postgresql://apexsolar-user:ApexSolar2024!@localhost/apexsolar?host=/cloudsql/apexsolar-app:asia-south1:apexsolar-db
```

### Option 3: Public IP Connection (Less Secure)
As a fallback, you could use the public IP:
```
postgresql://apexsolar-user:ApexSolar2024!@35.200.232.74:5432/apexsolar
```

## Debugging Steps

1. **Check Cloud SQL Instance Status**
```bash
gcloud sql instances describe apexsolar-db --project=apexsolar-app
```

2. **Verify Cloud SQL Connection String**
```bash
gcloud sql instances describe apexsolar-db --format="value(connectionName)"
```

3. **Test Database Connection Locally**
```bash
# Using Cloud SQL Proxy
cloud_sql_proxy -instances=apexsolar-app:asia-south1:apexsolar-db=tcp:5432
psql "postgresql://apexsolar-user:ApexSolar2024!@localhost:5432/apexsolar"
```

## Cloud Run Configuration
The deployment now includes:
- `--add-cloudsql-instances=apexsolar-app:asia-south1:apexsolar-db`
- This enables the Cloud SQL proxy in Cloud Run

## Next Steps
1. Update the DATABASE_URL secret in GitHub if needed
2. Re-run the deployment
3. Monitor Cloud Run logs for any connection issues
