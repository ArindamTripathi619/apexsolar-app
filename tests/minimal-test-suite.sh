#!/bin/bash

# ApexSolar Minimal Test Suite
# Fast tests for critical functionality only - minimal data creation

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="admin@apexsolar.net"
ADMIN_PASSWORD="admin123"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_test() {
    echo -e "${YELLOW}➤ $1${NC}"
    ((TOTAL_TESTS++))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

# Function to login
login() {
    local email="$1"
    local password="$2"
    
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Test 1: Health Check
test_health_check() {
    print_test "Health Check"
    local response=$(curl -s "$BASE_URL/api/health")
    if echo "$response" | grep -q '"status":"healthy"'; then
        print_success "Health check passed"
        return 0
    else
        print_error "Health check failed"
        return 1
    fi
}

# Test 2: Admin Authentication
test_admin_auth() {
    print_test "Admin Authentication"
    local token=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    if [ -n "$token" ] && [ "$token" != "null" ]; then
        print_success "Admin authentication successful"
        echo "$token"
        return 0
    else
        print_error "Admin authentication failed"
        return 1
    fi
}

# Test 3: Basic API Access (without creating data)
test_api_access() {
    local token="$1"
    print_test "API Access Test"
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/employees")
    if echo "$response" | grep -q '\[.*\]'; then
        print_success "API access working"
        return 0
    else
        print_error "API access failed"
        return 1
    fi
}

# Test 4: Database Connection
test_database_connection() {
    print_test "Database Connection"
    local response=$(curl -s "$BASE_URL/api/test")
    if echo "$response" | grep -q '"success":true'; then
        print_success "Database connection working"
        return 0
    else
        print_error "Database connection failed"
        return 1
    fi
}

# Main execution
print_header "ApexSolar Minimal Test Suite"

# Run critical tests only
test_health_check
ADMIN_TOKEN=$(test_admin_auth)

if [ -n "$ADMIN_TOKEN" ]; then
    test_api_access "$ADMIN_TOKEN"
fi

test_database_connection

# Print summary
echo ""
print_header "Test Summary"
echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
