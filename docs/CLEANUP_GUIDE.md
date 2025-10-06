# Test Data Cleanup Guide

## Overview
After rigorous testing, it's essential to clean up test data from the database to maintain a clean development environment.

## Cleanup Scripts

### 1. Comprehensive Cleanup
```bash
./scripts/cleanup-test-data.sh
```
- **Interactive**: Asks for confirmation before cleanup
- **Comprehensive**: Removes ALL test data via API and database
- **Safe**: Only runs in development environment
- **Thorough**: Cleans uploaded files, database records, and API data

### 2. Quick Cleanup
```bash
./scripts/quick-cleanup.sh
```
- **Automated**: No prompts, runs immediately
- **Fast**: Uses the comprehensive script with auto-confirmation
- **Perfect for**: CI/CD and automated testing

### 3. Automatic Cleanup
Test suites automatically run cleanup:
- Individual tests clean up their own data
- Test runner performs final cleanup
- No manual intervention needed

## What Gets Cleaned

### Database Records
- ✅ Test employees (name/email containing "test")
- ✅ Test clients (name/email containing "test") 
- ✅ Test invoices (description containing "test")
- ✅ Test payments (description containing "test")
- ✅ Test attendance records
- ✅ Test challans

### Uploaded Files
- ✅ Employee photos and documents
- ✅ Challan files  
- ✅ Invoice attachments
- ✅ Temporary test files

### API Data
- ✅ Data created via API endpoints
- ✅ Relationships and dependencies
- ✅ Proper deletion order (payments → invoices → clients → employees)

## Safety Features

### Development Only
- Checks server is running locally
- Requires admin authentication
- Prompts for confirmation

### Backup Preservation
- Only removes test-related data
- Preserves production-like data
- Maintains admin/accountant users

### Error Handling
- Graceful failure handling
- Multiple cleanup methods as fallback
- Detailed logging and reporting

## Usage Examples

### After Manual Testing
```bash
# Interactive cleanup with confirmation
./scripts/cleanup-test-data.sh
```

### After Automated Tests
```bash
# Quick cleanup without prompts  
./scripts/quick-cleanup.sh
```

### Before Fresh Testing
```bash
# Clean + reseed database
./scripts/cleanup-test-data.sh
npx prisma db seed
```

## Integration with Tests

### Test Suites
- `tests/run-all-tests.sh` - Runs cleanup after all tests
- `tests/test-client-payment-management.sh` - Individual test cleanup

### CI/CD Integration
```bash
# In your CI pipeline
npm run dev &
npm run test
./scripts/quick-cleanup.sh
```

## Verification

### Before Cleanup
```bash
# Check current data counts
curl -s http://localhost:3000/api/employees | grep -o '"id":[0-9]*' | wc -l
curl -s http://localhost:3000/api/clients | grep -o '"id":[0-9]*' | wc -l
```

### After Cleanup
The script provides detailed before/after counts:
```
📊 Current Data Counts:
   Employees: 51
   Clients: 6
   Invoices: 0
   Payments: 6

📊 Final Data Counts:
   Employees: 2 (removed: 49)
   Clients: 0 (removed: 6)
   Invoices: 0 (removed: 0)  
   Payments: 0 (removed: 6)
```

## Troubleshooting

### Server Not Running
```bash
# Start development server first
npm run dev
```

### Authentication Failed
```bash
# Ensure admin user exists
npx prisma db seed
```

### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

## Best Practices

1. **Always cleanup after testing** - Prevents data pollution
2. **Use quick cleanup in automation** - Faster for CI/CD
3. **Verify cleanup success** - Check the summary report
4. **Reseed if needed** - Run `npx prisma db seed` for fresh admin users
5. **Monitor file uploads** - Cleanup removes test files from uploads/

---

**Remember**: Clean database = reliable tests = confident deployments! 🧹✨
