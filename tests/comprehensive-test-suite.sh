#!/bin/bash

# ApexSolar Comprehensive Test Suite
# Tests all major functionality of the employee management system

# Remove set -e to continue on errors
# set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
# Use environment variable or default to localhost for testing
BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="admin@apexsolar.net"
ADMIN_PASSWORD="admin123"
ACCOUNTANT_EMAIL="accountant@apexsolar.net"
ACCOUNTANT_PASSWORD="accountant123"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test tracking arrays
declare -a TEST_RESULTS
declare -a TEST_NAMES

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_test() {
    echo -e "${YELLOW}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    TEST_NAMES+=("$test_name")
    
    print_test "Testing: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name passed"
        TEST_RESULTS+=("PASS")
        return 0
    else
        print_error "$test_name failed"
        TEST_RESULTS+=("FAIL")
        return 1
    fi
}

# Function to get auth token
get_auth_token() {
    local email="$1"
    local password="$2"
    
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null || echo "")
    
    if [ -z "$response" ]; then
        echo ""
        return 1
    fi
    
    local token=$(echo "$response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    
    if [ -n "$token" ]; then
        echo "$token"
        return 0
    else
        echo ""
        return 1
    fi
}

# Function to create test employee
create_test_employee() {
    local token="$1"
    local timestamp=$(date +%s)
    local employee_data="{
        \"name\": \"TEST_EMPLOYEE_${timestamp}\",
        \"phone\": \"9876543210\",
        \"email\": \"test.employee.${timestamp}@test.apexsolar.com\",
        \"address\": \"TEST_ADDRESS_${timestamp}, Test City\",
        \"dateOfJoining\": \"2024-01-01\"
    }"
    
    local response=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$employee_data")
    
    local employee_id=$(echo "$response" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    
    if [ -n "$employee_id" ]; then
        echo "$employee_id"
        return 0
    else
        echo ""
        return 1
    fi
}

# Function to create test image file
create_test_image() {
    local filename="$1"
    # Create a minimal PNG image (1x1 pixel)
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > "$filename"
}

# Function to create test PDF file
create_test_pdf() {
    local filename="$1"
    # Create a minimal PDF
    cat > "$filename" << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
180
%%EOF
EOF
}

# Test functions
test_health_endpoint() {
    local response=$(curl -s "$BASE_URL/api/health" 2>/dev/null || echo "")
    if [ -z "$response" ]; then
        echo "No response from health endpoint"
        return 1
    fi
    echo "$response" | grep -q '"status":"healthy"'
}

test_admin_login() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ]
}

test_accountant_login() {
    local token=$(get_auth_token "$ACCOUNTANT_EMAIL" "$ACCOUNTANT_PASSWORD")
    [ -n "$token" ]
}

test_invalid_login() {
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"invalid@test.com","password":"wrongpassword"}')
    echo "$response" | grep -q '"success":false'
}

test_admin_me_endpoint() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/auth/me")
    echo "$response" | grep -q '"role":"ADMIN"'
}

test_accountant_me_endpoint() {
    local token=$(get_auth_token "$ACCOUNTANT_EMAIL" "$ACCOUNTANT_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/auth/me")
    echo "$response" | grep -q '"role":"ACCOUNTANT"'
}

test_get_employees() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/employees")
    echo "$response" | grep -q '"success":true'
}

test_create_employee() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ]
}

test_get_employee_by_id() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/employees/$employee_id")
    echo "$response" | grep -q '"success":true'
}

test_update_employee() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    local update_data='{"name": "Updated Test Employee", "phone": "9876543211"}'
    local response=$(curl -s -X PUT "$BASE_URL/api/employees/$employee_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$update_data")
    
    echo "$response" | grep -q '"success":true'
}

test_delete_employee() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    local response=$(curl -s -X DELETE "$BASE_URL/api/employees/$employee_id" \
        -H "Authorization: Bearer $token")
    
    echo "$response" | grep -q '"success":true'
}

test_upload_profile_photo() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    create_test_image "test-profile.png"
    
    local response=$(curl -s -X POST "$BASE_URL/api/documents/upload" \
        -H "Authorization: Bearer $token" \
        -F "file=@test-profile.png" \
        -F "employeeId=$employee_id" \
        -F "documentType=PROFILE_PHOTO")
    
    rm -f "test-profile.png"
    echo "$response" | grep -q '"success":true'
}

test_upload_aadhar_card() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    create_test_pdf "test-aadhar.pdf"
    
    local response=$(curl -s -X POST "$BASE_URL/api/documents/upload" \
        -H "Authorization: Bearer $token" \
        -F "file=@test-aadhar.pdf" \
        -F "employeeId=$employee_id" \
        -F "documentType=AADHAR_CARD")
    
    rm -f "test-aadhar.pdf"
    echo "$response" | grep -q '"success":true'
}

test_create_payment_due() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    local payment_data="{
        \"employeeId\": \"$employee_id\",
        \"type\": \"DUE\",
        \"amount\": 5000,
        \"description\": \"Monthly salary due\",
        \"date\": \"2024-01-15\"
    }"
    
    local response=$(curl -s -X POST "$BASE_URL/api/payments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$payment_data")
    
    echo "$response" | grep -q '"success":true'
}

test_create_payment_advance() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    local payment_data="{
        \"employeeId\": \"$employee_id\",
        \"type\": \"ADVANCE\",
        \"amount\": 2000,
        \"description\": \"Salary advance\",
        \"date\": \"2024-01-10\"
    }"
    
    local response=$(curl -s -X POST "$BASE_URL/api/payments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$payment_data")
    
    echo "$response" | grep -q '"success":true'
}

test_get_payments() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/payments")
    echo "$response" | grep -q '"success":true'
}

test_clear_payment() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    # Create a due first
    local due_data="{
        \"employeeId\": \"$employee_id\",
        \"type\": \"DUE\",
        \"amount\": 5000,
        \"description\": \"Monthly salary due\",
        \"date\": \"2024-01-15\"
    }"
    
    local due_response=$(curl -s -X POST "$BASE_URL/api/payments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$due_data")
    
    local due_id=$(echo "$due_response" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    [ -n "$due_id" ] || return 1
    
    # Clear the payment
    local clear_data="{\"paymentId\": \"$due_id\"}"
    local response=$(curl -s -X POST "$BASE_URL/api/payments/clear" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$clear_data")
    
    echo "$response" | grep -q '"success":true'
}

test_create_attendance() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_id=$(create_test_employee "$token")
    [ -n "$employee_id" ] || return 1
    
    local attendance_data="{
        \"employeeId\": \"$employee_id\",
        \"month\": 1,
        \"year\": 2024,
        \"daysWorked\": 22
    }"
    
    local response=$(curl -s -X POST "$BASE_URL/api/attendance" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$attendance_data")
    
    echo "$response" | grep -q '"success":true'
}

test_get_attendance() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/attendance")
    echo "$response" | grep -q '"success":true'
}

test_create_invoice() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    create_test_pdf "test-invoice.pdf"
    
    local response=$(curl -s -X POST "$BASE_URL/api/invoices" \
        -H "Authorization: Bearer $token" \
        -F "file=@test-invoice.pdf" \
        -F "clientName=Test Client" \
        -F "amount=25000" \
        -F "date=2024-01-15")
    
    rm -f "test-invoice.pdf"
    echo "$response" | grep -q '"success":true'
}

test_get_invoices() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/invoices")
    echo "$response" | grep -q '"success":true'
}

test_upload_pf_challan() {
    local token=$(get_auth_token "$ACCOUNTANT_EMAIL" "$ACCOUNTANT_PASSWORD")
    [ -n "$token" ] || return 1
    
    create_test_pdf "test-pf-challan.pdf"
    
    local response=$(curl -s -X POST "$BASE_URL/api/challans" \
        -H "Authorization: Bearer $token" \
        -F "file=@test-pf-challan.pdf" \
        -F "month=1" \
        -F "year=2024" \
        -F "type=PF")
    
    rm -f "test-pf-challan.pdf"
    echo "$response" | grep -q '"success":true'
}

test_upload_esi_challan() {
    local token=$(get_auth_token "$ACCOUNTANT_EMAIL" "$ACCOUNTANT_PASSWORD")
    [ -n "$token" ] || return 1
    
    create_test_pdf "test-esi-challan.pdf"
    
    local response=$(curl -s -X POST "$BASE_URL/api/challans" \
        -H "Authorization: Bearer $token" \
        -F "file=@test-esi-challan.pdf" \
        -F "month=2" \
        -F "year=2024" \
        -F "type=ESI")
    
    rm -f "test-esi-challan.pdf"
    echo "$response" | grep -q '"success":true'
}

test_get_challans() {
    local token=$(get_auth_token "$ACCOUNTANT_EMAIL" "$ACCOUNTANT_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/challans")
    echo "$response" | grep -q '"success":true'
}

test_get_dashboard_stats() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/dashboard/stats")
    echo "$response" | grep -q '"success":true'
}

test_unauthorized_access() {
    local response=$(curl -s "$BASE_URL/api/employees")
    echo "$response" | grep -q '"error":"Authentication required"'
}

test_accountant_cannot_create_employee() {
    local token=$(get_auth_token "$ACCOUNTANT_EMAIL" "$ACCOUNTANT_PASSWORD")
    [ -n "$token" ] || return 1
    
    local employee_data='{"name": "Test Employee", "phone": "9876543210"}'
    local response=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$employee_data")
    
    echo "$response" | grep -q '"error":"Insufficient permissions"'
}

test_logout() {
    local token=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    [ -n "$token" ] || return 1
    
    local response=$(curl -s -X POST "$BASE_URL/api/auth/logout" \
        -H "Authorization: Bearer $token")
    
    echo "$response" | grep -q '"success":true'
}

# Main test execution
main() {
    print_header "ApexSolar Comprehensive Test Suite"
    echo -e "${BLUE}Testing Base URL: $BASE_URL${NC}"
    echo -e "${BLUE}Start Time: $(date)${NC}"
    echo ""
    
    # System Health Tests
    print_header "System Health Tests"
    run_test "Health Endpoint" "test_health_endpoint"
    
    # Authentication Tests
    print_header "Authentication Tests"
    run_test "Admin Login" "test_admin_login"
    run_test "Accountant Login" "test_accountant_login"
    run_test "Invalid Login" "test_invalid_login"
    run_test "Admin Me Endpoint" "test_admin_me_endpoint"
    run_test "Accountant Me Endpoint" "test_accountant_me_endpoint"
    run_test "Logout" "test_logout"
    
    # Employee Management Tests
    print_header "Employee Management Tests"
    run_test "Get Employees" "test_get_employees"
    run_test "Create Employee" "test_create_employee"
    run_test "Get Employee by ID" "test_get_employee_by_id"
    run_test "Update Employee" "test_update_employee"
    run_test "Delete Employee" "test_delete_employee"
    
    # Document Upload Tests
    print_header "Document Upload Tests"
    run_test "Upload Profile Photo" "test_upload_profile_photo"
    run_test "Upload Aadhar Card" "test_upload_aadhar_card"
    
    # Payment Management Tests
    print_header "Payment Management Tests"
    run_test "Create Payment Due" "test_create_payment_due"
    run_test "Create Payment Advance" "test_create_payment_advance"
    run_test "Get Payments" "test_get_payments"
    run_test "Clear Payment" "test_clear_payment"
    
    # Attendance Management Tests
    print_header "Attendance Management Tests"
    run_test "Create Attendance" "test_create_attendance"
    run_test "Get Attendance" "test_get_attendance"
    
    # Invoice Management Tests
    print_header "Invoice Management Tests"
    run_test "Create Invoice" "test_create_invoice"
    run_test "Get Invoices" "test_get_invoices"
    
    # PF/ESI Challan Tests
    print_header "PF/ESI Challan Tests"
    run_test "Upload PF Challan" "test_upload_pf_challan"
    run_test "Upload ESI Challan" "test_upload_esi_challan"
    run_test "Get Challans" "test_get_challans"
    
    # Dashboard Tests
    print_header "Dashboard Tests"
    run_test "Get Dashboard Stats" "test_get_dashboard_stats"
    
    # Security & Authorization Tests
    print_header "Security & Authorization Tests"
    run_test "Unauthorized Access" "test_unauthorized_access"
    run_test "Accountant Cannot Create Employee" "test_accountant_cannot_create_employee"
    
    # Test Summary
    print_header "Test Summary"
    echo -e "${BLUE}End Time: $(date)${NC}"
    echo ""
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
        print_success "All tests passed! 🎉"
        return 0
    else
        print_error "$FAILED_TESTS test(s) failed"
        return 1
    fi
}

# Run the test suite
main "$@"
