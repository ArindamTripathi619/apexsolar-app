# Simplified CI/CD Workflow

This project now uses a simplified CI/CD approach focused on **local testing** followed by **direct production deployment**.

## Workflow Overview

### 1. Local Testing (`testing.yml`)
- **Triggers**: Push/PR to main branch
- **What it does**:
  - Sets up PostgreSQL test database
  - Runs ESLint and TypeScript checks
  - Builds and starts the application locally
  - Runs comprehensive test suites:
    - Minimal test suite (health checks, auth, basic API)
    - Authentication tests
    - Security tests
    - Performance tests
- **Environment**: Localhost with test database

### 2. Production Deployment (`deploy.yml`)
- **Triggers**: Push to main branch (after tests pass)
- **What it does**:
  - Runs linting and type checking
  - Builds the application
  - Builds and pushes Docker image to Google Artifact Registry
  - Deploys to Google Cloud Run (production)
  - Performs health check verification
- **Environment**: Production on Google Cloud

## Key Benefits of This Approach

✅ **Simplified Architecture**: No staging environment to maintain  
✅ **Faster CI/CD**: Direct local testing → production deployment  
✅ **Cost Effective**: No additional staging resources needed  
✅ **Comprehensive Testing**: All testing done locally with full test suite  
✅ **Production Ready**: Only tested code reaches production  

## Test Scripts

All test scripts are environment-aware and use `TEST_BASE_URL` environment variable:

- `minimal-test-suite.sh`: Core functionality tests
- `test-auth-fixes.sh`: Authentication flow tests  
- `security-test-suite.sh`: Security vulnerability tests
- `performance-test-suite.sh`: Performance and load tests
- `comprehensive-test-suite.sh`: Full end-to-end test suite

## Local Development

To run tests locally:

```bash
# Set environment variable (optional - defaults to localhost:3000)
export TEST_BASE_URL=http://localhost:3000

# Start your local server
npm run dev

# Run specific test suite
./tests/minimal-test-suite.sh
./tests/comprehensive-test-suite.sh
```

## Removed Files

The following files were moved to `-old.yml` backups as they're no longer needed:
- `deploy-old.yml`: Complex staging/production workflow
- `testing-old.yml`: Complex multi-environment testing
- `quality-old.yml`: Separate quality checks (now integrated)
- `security-old.yml`: Separate security checks (now integrated)

This simplified approach provides the same level of testing and deployment confidence with much less complexity.
