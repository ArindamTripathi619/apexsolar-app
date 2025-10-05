#!/bin/bash

# ApexSolar Security Test Suite
# Tests security vulnerabilities and edge cases

# Remove set -e to continue on errors
# set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="admin@apexsolar.net"
ADMIN_PASSWORD="admin123"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    print_test "Testing: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name passed"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

get_auth_token() {
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    echo "$response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

# Test SQL injection attempts
test_sql_injection_login() {
    local malicious_payloads=(
        "admin@apexsolar.net'; DROP TABLE users; --"
        "admin@apexsolar.net' OR '1'='1"
        "admin@apexsolar.net' UNION SELECT * FROM users --"
        "admin@apexsolar.net'; UPDATE users SET password='hacked' --"
    )
    
    for payload in "${malicious_payloads[@]}"; do
        local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$payload\",\"password\":\"admin123\"}")
        
        # Should fail gracefully, not expose database errors
        if echo "$response" | grep -qi "error\|sql\|database\|table"; then
            if echo "$response" | grep -qi "drop\|update\|select\|union"; then
                return 1  # SQL injection might be working
            fi
        fi
    done
    
    return 0  # All SQL injection attempts properly handled
}

# Test XSS attempts
test_xss_protection() {
    local token=$(get_auth_token)
    [ -n "$token" ] || return 1
    
    local xss_payloads=(
        "<script>alert('XSS')</script>"
        "javascript:alert('XSS')"
        "<img src=x onerror=alert('XSS')>"
        "';alert('XSS');//"
    )
    
    for payload in "${xss_payloads[@]}"; do
        local employee_data="{
            \"name\": \"$payload\",
            \"phone\": \"9876543210\",
            \"email\": \"xss.test@apexsolar.com\",
            \"address\": \"Test Address\",
            \"dateOfJoining\": \"2024-01-01\"
        }"
        
        local response=$(curl -s -X POST "$BASE_URL/api/employees" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$employee_data")
        
        # Check if XSS payload is properly sanitized
        if echo "$response" | grep -F "$payload" | grep -qi "script\|javascript\|onerror"; then
            return 1  # XSS payload not properly sanitized
        fi
    done
    
    return 0
}

# Test authentication bypass attempts
test_auth_bypass_attempts() {
    # Test with no token
    local response1=$(curl -s "$BASE_URL/api/employees")
    if ! echo "$response1" | grep -q "Authentication required\|Unauthorized\|401"; then
        return 1
    fi
    
    # Test with invalid token
    local response2=$(curl -s -H "Authorization: Bearer invalid_token_123" "$BASE_URL/api/employees")
    if ! echo "$response2" | grep -q "Invalid token\|Unauthorized\|401"; then
        return 1
    fi
    
    # Test with malformed token
    local response3=$(curl -s -H "Authorization: invalid_format" "$BASE_URL/api/employees")
    if ! echo "$response3" | grep -q "Authentication required\|Unauthorized\|401"; then
        return 1
    fi
    
    return 0
}

# Test JWT token tampering
test_jwt_tampering() {
    local token=$(get_auth_token)
    [ -n "$token" ] || return 1
    
    # Tamper with the token (change a character)
    local tampered_token="${token:0:-5}xxxxx"
    
    local response=$(curl -s -H "Authorization: Bearer $tampered_token" "$BASE_URL/api/employees")
    
    # Should reject tampered token
    echo "$response" | grep -q "Invalid token\|Unauthorized\|401"
}

# Test file upload security
test_file_upload_security() {
    local token=$(get_auth_token)
    [ -n "$token" ] || return 1
    
    # Create test employee
    local employee_data='{"name": "Security Test Employee", "phone": "9876543210", "email": "security.test@apexsolar.com"}'
    local employee_response=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$employee_data")
    
    local employee_id=$(echo "$employee_response" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    [ -n "$employee_id" ] || return 1
    
    # Test malicious file uploads
    
    # 1. Test PHP file upload
    echo "<?php system('ls'); ?>" > malicious.php
    local response1=$(curl -s -X POST "$BASE_URL/api/documents/upload" \
        -H "Authorization: Bearer $token" \
        -F "file=@malicious.php" \
        -F "employeeId=$employee_id" \
        -F "documentType=OTHER")
    
    # Should reject PHP files
    local php_rejected=0
    if echo "$response1" | grep -q "Invalid file type\|File type not allowed\|error"; then
        php_rejected=1
    fi
    
    # 2. Test executable file upload
    echo -e "#!/bin/bash\necho 'malicious script'" > malicious.sh
    chmod +x malicious.sh
    local response2=$(curl -s -X POST "$BASE_URL/api/documents/upload" \
        -H "Authorization: Bearer $token" \
        -F "file=@malicious.sh" \
        -F "employeeId=$employee_id" \
        -F "documentType=OTHER")
    
    # Should reject executable files
    local script_rejected=0
    if echo "$response2" | grep -q "Invalid file type\|File type not allowed\|error"; then
        script_rejected=1
    fi
    
    # 3. Test oversized file
    dd if=/dev/zero of=large_file.bin bs=1M count=50 2>/dev/null  # 50MB file
    local response3=$(curl -s -X POST "$BASE_URL/api/documents/upload" \
        -H "Authorization: Bearer $token" \
        -F "file=@large_file.bin" \
        -F "employeeId=$employee_id" \
        -F "documentType=OTHER")
    
    # Should reject oversized files
    local size_rejected=0
    if echo "$response3" | grep -q "File too large\|File size exceeded\|error"; then
        size_rejected=1
    fi
    
    # Cleanup
    rm -f malicious.php malicious.sh large_file.bin
    
    # All security checks should pass
    [ $php_rejected -eq 1 ] && [ $script_rejected -eq 1 ] && [ $size_rejected -eq 1 ]
}

# Test rate limiting
test_rate_limiting() {
    local rapid_requests=20
    local successful_requests=0
    local rate_limited=0
    
    for i in $(seq 1 $rapid_requests); do
        local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
        
        if echo "$response" | grep -q '"success":true'; then
            ((successful_requests++))
        elif echo "$response" | grep -q "Too many requests\|Rate limit\|429"; then
            ((rate_limited++))
        fi
    done
    
    # Rate limiting should kick in for rapid requests
    [ $rate_limited -gt 0 ] || [ $successful_requests -lt $rapid_requests ]
}

# Test CORS security
test_cors_security() {
    local response=$(curl -s -H "Origin: https://malicious-site.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS "$BASE_URL/api/auth/login")
    
    # Should not allow arbitrary origins
    ! echo "$response" | grep -q "Access-Control-Allow-Origin: https://malicious-site.com"
}

# Test input validation
test_input_validation() {
    local token=$(get_auth_token)
    [ -n "$token" ] || return 1
    
    # Test invalid email format
    local invalid_employee='{"name": "Test", "phone": "123", "email": "invalid-email", "address": "Test"}'
    local response1=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$invalid_employee")
    
    # Should reject invalid email
    local email_rejected=0
    if echo "$response1" | grep -q "Invalid email\|Validation error\|error"; then
        email_rejected=1
    fi
    
    # Test invalid phone format
    local invalid_phone='{"name": "Test", "phone": "abc", "email": "test@test.com", "address": "Test"}'
    local response2=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$invalid_phone")
    
    # Should reject invalid phone
    local phone_rejected=0
    if echo "$response2" | grep -q "Invalid phone\|Validation error\|error"; then
        phone_rejected=1
    fi
    
    # Test missing required fields
    local missing_fields='{"name": "Test"}'
    local response3=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$missing_fields")
    
    # Should reject missing required fields
    local fields_rejected=0
    if echo "$response3" | grep -q "Required field\|Validation error\|error"; then
        fields_rejected=1
    fi
    
    [ $email_rejected -eq 1 ] && [ $phone_rejected -eq 1 ] && [ $fields_rejected -eq 1 ]
}

# Test session security
test_session_security() {
    local token=$(get_auth_token)
    [ -n "$token" ] || return 1
    
    # Test if token works
    local response1=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/employees")
    if ! echo "$response1" | grep -q '"success":true'; then
        return 1
    fi
    
    # Logout
    curl -s -X POST "$BASE_URL/api/auth/logout" -H "Authorization: Bearer $token" > /dev/null
    
    # Test if token is invalidated after logout
    local response2=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/employees")
    
    # Token should be invalid after logout
    echo "$response2" | grep -q "Invalid token\|Unauthorized\|401"
}

# Test password security
test_password_security() {
    # Test weak password attempts (if user creation is available)
    local weak_passwords=(
        "123"
        "password"
        "admin"
        "123456"
    )
    
    # For this test, we'll check if the system properly handles login attempts
    # with various password formats
    
    for weak_pass in "${weak_passwords[@]}"; do
        local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"nonexistent@test.com\",\"password\":\"$weak_pass\"}")
        
        # Should handle gracefully without exposing system info
        if echo "$response" | grep -qi "database\|sql\|error.*line\|stack trace"; then
            return 1
        fi
    done
    
    return 0
}

# Test HTTP security headers
test_security_headers() {
    local response=$(curl -s -I "$BASE_URL/api/health")
    
    local headers_present=0
    
    # Check for security headers
    if echo "$response" | grep -qi "x-frame-options"; then
        ((headers_present++))
    fi
    
    if echo "$response" | grep -qi "x-content-type-options"; then
        ((headers_present++))
    fi
    
    if echo "$response" | grep -qi "x-xss-protection"; then
        ((headers_present++))
    fi
    
    # Should have at least some security headers
    [ $headers_present -ge 2 ]
}

# Main execution
main() {
    print_header "ApexSolar Security Test Suite"
    echo -e "${BLUE}Testing Base URL: $BASE_URL${NC}"
    echo -e "${BLUE}Start Time: $(date)${NC}"
    echo ""
    
    # Authentication Security Tests
    print_header "Authentication Security Tests"
    run_test "SQL Injection Protection (Login)" "test_sql_injection_login"
    run_test "Authentication Bypass Attempts" "test_auth_bypass_attempts"
    run_test "JWT Token Tampering" "test_jwt_tampering"
    run_test "Session Security" "test_session_security"
    run_test "Password Security" "test_password_security"
    
    # Input Validation Tests
    print_header "Input Validation Tests"
    run_test "XSS Protection" "test_xss_protection"
    run_test "Input Validation" "test_input_validation"
    
    # File Upload Security Tests
    print_header "File Upload Security Tests"
    run_test "File Upload Security" "test_file_upload_security"
    
    # Network Security Tests
    print_header "Network Security Tests"
    run_test "Rate Limiting" "test_rate_limiting"
    run_test "CORS Security" "test_cors_security"
    run_test "HTTP Security Headers" "test_security_headers"
    
    # Test Summary
    print_header "Security Test Summary"
    echo -e "${BLUE}End Time: $(date)${NC}"
    echo ""
    echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${BLUE}Success Rate: $success_rate%${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All security tests passed! 🔒"
    else
        print_error "$FAILED_TESTS security test(s) failed - review security measures"
    fi
}

main "$@"
