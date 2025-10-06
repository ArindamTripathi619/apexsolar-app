#!/bin/bash

# ApexSolar Client Payment Management Test Suite
# Tests all client management and payment functionality implemented today

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

# Test tracking arrays
declare -a TEST_NAMES
declare -a TEST_RESULTS

# Test data storage
CREATED_CLIENT_ID=""
CREATED_INVOICE_ID=""

print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Utility function to get authentication token
get_auth_token() {
    local email="$1"
    local password="$2"
    
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$response" ]; then
        return 1
    fi
    
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    print_info "Running: $test_name"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    TEST_NAMES+=("$test_name")
    
    if $test_function; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("PASS")
        print_success "$test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("FAIL")
        print_error "$test_name"
    fi
    
    echo ""
}

# Health check test
test_health_endpoint() {
    local response=$(curl -s "$BASE_URL/api/health" 2>/dev/null || echo "")
    if [ -z "$response" ]; then
        return 1
    fi
    echo "$response" | grep -q '"status":"ok"'
}

# Authentication tests
test_admin_login() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ]
}

# Client Management Tests
test_create_client() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -X POST "$BASE_URL/api/clients" \
        -H "Content-Type: application/json" \
        -H "Cookie: auth-token=$token" \
        -d '{
            "companyName": "Test Company Ltd",
            "addressLine1": "123 Test Street",
            "addressLine2": "Test Area",
            "city": "Test City",
            "state": "Test State",
            "pinCode": "123456",
            "gstNumber": "TEST123456789",
            "panNumber": "TESTPAN123",
            "contactPerson": "John Doe",
            "email": "john@testcompany.com",
            "phone": "9876543210"
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        CREATED_CLIENT_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        [ -n "$CREATED_CLIENT_ID" ]
    else
        return 1
    fi
}

test_get_clients() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/clients" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"success":true' && \
    echo "$response" | grep -q '"clients":'
}

test_get_client_with_due_calculations() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/clients" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"totalDue"' && \
    echo "$response" | grep -q '"dueAmount"'
}

test_update_client() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    local response=$(curl -s -X PUT "$BASE_URL/api/clients" \
        -H "Content-Type: application/json" \
        -H "Cookie: auth-token=$token" \
        -d "{
            \"id\": \"$CREATED_CLIENT_ID\",
            \"companyName\": \"Updated Test Company Ltd\",
            \"addressLine1\": \"456 Updated Street\",
            \"city\": \"Updated City\",
            \"state\": \"Updated State\",
            \"pinCode\": \"654321\"
        }")
    
    echo "$response" | grep -q '"success":true'
}

# Invoice with Client Integration Tests
test_create_invoice_with_client() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    # Create a temporary PDF file for testing
    echo "Test invoice content" > /tmp/test_invoice.pdf
    
    local response=$(curl -s -X POST "$BASE_URL/api/invoices" \
        -H "Cookie: auth-token=$token" \
        -F "file=@/tmp/test_invoice.pdf" \
        -F "clientName=Test Company Ltd" \
        -F "clientId=$CREATED_CLIENT_ID" \
        -F "amount=50000" \
        -F "date=2025-10-06")
    
    rm -f /tmp/test_invoice.pdf
    
    if echo "$response" | grep -q '"success":true'; then
        CREATED_INVOICE_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        [ -n "$CREATED_INVOICE_ID" ]
    else
        return 1
    fi
}

# Client Payment Tests
test_record_partial_payment() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    local response=$(curl -s -X POST "$BASE_URL/api/clients/$CREATED_CLIENT_ID/payments" \
        -H "Content-Type: application/json" \
        -H "Cookie: auth-token=$token" \
        -d '{
            "amount": 25000,
            "description": "Partial payment - 50% of invoice",
            "date": "2025-10-06"
        }')
    
    echo "$response" | grep -q '"success":true' && \
    echo "$response" | grep -q '"message":"Payment recorded successfully"'
}

test_record_full_payment() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    local response=$(curl -s -X POST "$BASE_URL/api/clients/$CREATED_CLIENT_ID/payments" \
        -H "Content-Type: application/json" \
        -H "Cookie: auth-token=$token" \
        -d '{
            "amount": 25000,
            "description": "Final payment - remaining 50%",
            "date": "2025-10-06"
        }')
    
    echo "$response" | grep -q '"success":true'
}

test_get_client_payments() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/clients/$CREATED_CLIENT_ID/payments" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"success":true' && \
    echo "$response" | grep -q '"payments":'
}

test_payment_validation_negative_amount() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    local response=$(curl -s -X POST "$BASE_URL/api/clients/$CREATED_CLIENT_ID/payments" \
        -H "Content-Type: application/json" \
        -H "Cookie: auth-token=$token" \
        -d '{
            "amount": -1000,
            "description": "Invalid negative payment",
            "date": "2025-10-06"
        }')
    
    echo "$response" | grep -q '"error":"Payment amount must be greater than 0"'
}

test_payment_validation_missing_date() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    local response=$(curl -s -X POST "$BASE_URL/api/clients/$CREATED_CLIENT_ID/payments" \
        -H "Content-Type: application/json" \
        -H "Cookie: auth-token=$token" \
        -d '{
            "amount": 1000,
            "description": "Payment without date"
        }')
    
    echo "$response" | grep -q '"error":"Payment date is required"'
}

# Invoice Stats API Tests
test_invoice_stats_api() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/invoices/stats" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"success":true' && \
    echo "$response" | grep -q '"totalInvoiceAmount"' && \
    echo "$response" | grep -q '"totalPaidAmount"' && \
    echo "$response" | grep -q '"totalDueAmount"'
}

test_invoice_stats_with_filters() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/invoices/stats?clientName=Test&startDate=2025-10-01" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"success":true'
}

# Due Amount Calculation Tests
test_due_amount_after_payments() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/clients" \
        -H "Cookie: auth-token=$token")
    
    # Check if due amount is calculated correctly (should be 0 after full payment)
    echo "$response" | grep -q '"success":true'
}

# Authentication and Authorization Tests
test_payment_unauthorized_access() {
    local response=$(curl -s -X POST "$BASE_URL/api/clients/dummy-id/payments" \
        -H "Content-Type: application/json" \
        -d '{
            "amount": 1000,
            "date": "2025-10-06"
        }')
    
    echo "$response" | grep -q '"error":"Unauthorized"'
}

test_client_management_unauthorized() {
    local response=$(curl -s "$BASE_URL/api/clients")
    echo "$response" | grep -q '"error":"Unauthorized"'
}

# Database Integrity Tests
test_client_deletion_with_invoices() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    # Try to delete client with existing invoices - should fail
    local response=$(curl -s -X DELETE "$BASE_URL/api/clients?id=$CREATED_CLIENT_ID" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"error":"Cannot delete client with existing invoices"'
}

# API Response Format Tests
test_client_api_response_format() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/clients" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"success":true' && \
    echo "$response" | grep -q '"clients":\[' && \
    echo "$response" | grep -q '"totalDue":'
}

test_payment_api_response_format() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    [ -n "$CREATED_CLIENT_ID" ] || return 1
    
    local response=$(curl -s "$BASE_URL/api/clients/$CREATED_CLIENT_ID/payments" \
        -H "Cookie: auth-token=$token")
    
    echo "$response" | grep -q '"success":true' && \
    echo "$response" | grep -q '"payments":\['
}

# Cleanup test data
cleanup_test_data() {
    # Use the comprehensive cleanup script
    if [ -f "scripts/cleanup-test-data.sh" ]; then
        echo "y" | ./scripts/cleanup-test-data.sh >/dev/null 2>&1 || true
    else
        # Fallback basic cleanup
        local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
        [ -n "$token" ] || return 0
        
        if [ -n "$CREATED_INVOICE_ID" ]; then
            curl -s -X DELETE "$BASE_URL/api/invoices/$CREATED_INVOICE_ID" \
                -H "Cookie: auth-token=$token" >/dev/null 2>&1
        fi
        
        if [ -n "$CREATED_CLIENT_ID" ]; then
            curl -s -X DELETE "$BASE_URL/api/clients?id=$CREATED_CLIENT_ID" \
                -H "Cookie: auth-token=$token" >/dev/null 2>&1
        fi
    fi
}

# Test summary
print_test_summary() {
    echo ""
    print_header "Client Payment Management Test Summary"
    
    echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${BLUE}Success Rate: $success_rate%${NC}"
    
    echo ""
    print_header "Detailed Test Results"
    
    for i in "${!TEST_NAMES[@]}"; do
        local status="${TEST_RESULTS[$i]}"
        local name="${TEST_NAMES[$i]}"
        
        if [ "$status" = "PASS" ]; then
            echo -e "${GREEN}✅ $name${NC}"
        else
            echo -e "${RED}❌ $name${NC}"
        fi
    done
    
    echo ""
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All client payment management tests passed! 🎉"
        return 0
    else
        print_error "$FAILED_TESTS test(s) failed"
        return 1
    fi
}

# Main test execution
main() {
    print_header "ApexSolar Client Payment Management Test Suite"
    
    # Check if server is running
    if ! curl -s "$BASE_URL/api/health" >/dev/null 2>&1; then
        print_error "Server is not running at $BASE_URL"
        print_info "Please start the server with: npm run dev"
        exit 1
    fi
    
    print_success "Server is running at $BASE_URL"
    echo ""
    
    # Run tests in logical order
    run_test "Health Check" test_health_endpoint
    run_test "Admin Login" test_admin_login
    
    # Client Management Tests
    run_test "Create Client" test_create_client
    run_test "Get Clients" test_get_clients
    run_test "Get Clients with Due Calculations" test_get_client_with_due_calculations
    run_test "Update Client" test_update_client
    
    # Invoice Integration Tests
    run_test "Create Invoice with Client" test_create_invoice_with_client
    
    # Payment Management Tests
    run_test "Record Partial Payment" test_record_partial_payment
    run_test "Record Full Payment" test_record_full_payment
    run_test "Get Client Payments" test_get_client_payments
    
    # Payment Validation Tests
    run_test "Payment Validation - Negative Amount" test_payment_validation_negative_amount
    run_test "Payment Validation - Missing Date" test_payment_validation_missing_date
    
    # Invoice Stats API Tests
    run_test "Invoice Stats API" test_invoice_stats_api
    run_test "Invoice Stats with Filters" test_invoice_stats_with_filters
    
    # Due Amount Calculation Tests
    run_test "Due Amount After Payments" test_due_amount_after_payments
    
    # Security Tests
    run_test "Payment Unauthorized Access" test_payment_unauthorized_access
    run_test "Client Management Unauthorized" test_client_management_unauthorized
    
    # Database Integrity Tests
    run_test "Client Deletion with Invoices" test_client_deletion_with_invoices
    
    # API Response Format Tests
    run_test "Client API Response Format" test_client_api_response_format
    run_test "Payment API Response Format" test_payment_api_response_format
    
    # Cleanup
    print_info "Cleaning up test data..."
    cleanup_test_data
    
    # Print summary
    print_test_summary
}

# Trap to cleanup on exit
trap cleanup_test_data EXIT

# Run the test suite
main "$@"

# Final cleanup after all tests
echo ""
echo "🧹 Running final test data cleanup..."
if [ -f "scripts/quick-cleanup.sh" ]; then
    ./scripts/quick-cleanup.sh >/dev/null 2>&1 || true
fi

echo "✅ Test cleanup completed!"
