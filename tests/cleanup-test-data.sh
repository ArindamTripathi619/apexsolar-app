#!/bin/bash

# Test Data Cleanup Script
# Removes test employees and files created during testing

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="admin@apexsolar.net"
ADMIN_PASSWORD="admin123"

echo -e "${YELLOW}🧹 Starting test data cleanup...${NC}"

# Function to login and get token
login_admin() {
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Get admin token
TOKEN=$(login_admin)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get admin token for cleanup${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin authenticated for cleanup${NC}"

# Function to delete test employees
cleanup_test_employees() {
    echo -e "${YELLOW}🗑️ Cleaning up test employees...${NC}"
    
    # Get all employees
    local employees_response=$(curl -s -X GET "$BASE_URL/api/employees" \
        -H "Authorization: Bearer $TOKEN")
    
    # Extract employee IDs that look like test data (contain "test" or have sequential numbers)
    local test_employee_ids=$(echo "$employees_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | while read id; do
        # Get employee details to check if it's test data
        local employee_detail=$(curl -s -X GET "$BASE_URL/api/employees/$id" \
            -H "Authorization: Bearer $TOKEN")
        
        # Check if employee name/email contains test indicators
        if echo "$employee_detail" | grep -qi "test\|demo\|sample\|temp"; then
            echo "$id"
        fi
    done)
    
    # Delete test employees
    local deleted_count=0
    for emp_id in $test_employee_ids; do
        if [ ! -z "$emp_id" ]; then
            local delete_response=$(curl -s -X DELETE "$BASE_URL/api/employees/$emp_id" \
                -H "Authorization: Bearer $TOKEN")
            
            if echo "$delete_response" | grep -q '"success":true'; then
                ((deleted_count++))
                echo -e "${GREEN}✅ Deleted test employee: $emp_id${NC}"
            else
                echo -e "${RED}❌ Failed to delete employee: $emp_id${NC}"
            fi
        fi
    done
    
    echo -e "${GREEN}🧹 Cleanup complete: Deleted $deleted_count test employees${NC}"
}

# Function to cleanup test files
cleanup_test_files() {
    echo -e "${YELLOW}🗑️ Cleaning up test files...${NC}"
    
    # This would require additional API endpoints or file system cleanup
    # For now, just report that file cleanup is needed
    echo -e "${YELLOW}ℹ️ Manual file cleanup may be needed for uploaded test files${NC}"
}

# Run cleanup functions
cleanup_test_employees
cleanup_test_files

echo -e "${GREEN}✅ Test data cleanup completed${NC}"
