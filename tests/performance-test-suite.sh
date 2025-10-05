#!/bin/bash

# ApexSolar Performance & Load Test Suite
# Tests system performance under various load conditions

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

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get auth token
get_auth_token() {
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    echo "$response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

# Performance test for concurrent logins
test_concurrent_logins() {
    print_info "Testing concurrent login requests..."
    
    local concurrent_requests=10
    local pids=()
    local start_time=$(date +%s)
    
    for i in $(seq 1 $concurrent_requests); do
        {
            curl -s -X POST "$BASE_URL/api/auth/login" \
                -H "Content-Type: application/json" \
                -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
                > "/tmp/login_test_$i.log" 2>&1
        } &
        pids+=($!)
    done
    
    # Wait for all requests to complete
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Check results
    local successful_logins=0
    for i in $(seq 1 $concurrent_requests); do
        if grep -q '"success":true' "/tmp/login_test_$i.log"; then
            ((successful_logins++))
        fi
        rm -f "/tmp/login_test_$i.log"
    done
    
    echo "Concurrent Login Test Results:"
    echo "- Requests: $concurrent_requests"
    echo "- Successful: $successful_logins"
    echo "- Duration: ${duration}s"
    echo "- Avg response time: $((duration * 1000 / concurrent_requests))ms"
    
    if [ $successful_logins -eq $concurrent_requests ]; then
        print_success "All concurrent logins successful"
    else
        print_error "Some concurrent logins failed"
    fi
}

# Performance test for bulk employee creation
test_bulk_employee_creation() {
    print_info "Testing bulk employee creation..."
    
    local token=$(get_auth_token)
    [ -n "$token" ] || { print_error "Failed to get auth token"; return 1; }
    
    local employee_count=20
    local start_time=$(date +%s)
    local successful_creates=0
    
    for i in $(seq 1 $employee_count); do
        local employee_data="{
            \"name\": \"Bulk Test Employee $i\",
            \"phone\": \"987654321$i\",
            \"email\": \"bulk.test$i@apexsolar.com\",
            \"address\": \"Test Address $i, Test City\",
            \"dateOfJoining\": \"2024-01-01\"
        }"
        
        local response=$(curl -s -X POST "$BASE_URL/api/employees" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$employee_data")
        
        if echo "$response" | grep -q '"success":true'; then
            ((successful_creates++))
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "Bulk Employee Creation Test Results:"
    echo "- Attempted: $employee_count"
    echo "- Successful: $successful_creates"
    echo "- Duration: ${duration}s"
    echo "- Avg time per creation: $((duration * 1000 / employee_count))ms"
    
    if [ $successful_creates -eq $employee_count ]; then
        print_success "All bulk employee creations successful"
    else
        print_error "Some bulk employee creations failed"
    fi
}

# File upload stress test
test_file_upload_stress() {
    print_info "Testing file upload stress..."
    
    local token=$(get_auth_token)
    [ -n "$token" ] || { print_error "Failed to get auth token"; return 1; }
    
    # Create test employee first
    local employee_data='{"name": "Upload Test Employee", "phone": "9876543210", "email": "upload.test@apexsolar.com"}'
    local employee_response=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$employee_data")
    
    local employee_id=$(echo "$employee_response" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    [ -n "$employee_id" ] || { print_error "Failed to create test employee"; return 1; }
    
    # Create test files of different sizes
    echo "Creating test files..."
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > small_test.png
    
    # Create larger file (repeat content)
    for i in {1..100}; do
        echo "This is line $i of a larger test file for stress testing the upload functionality." >> large_test.txt
    done
    
    local upload_count=10
    local successful_uploads=0
    local start_time=$(date +%s)
    
    for i in $(seq 1 $upload_count); do
        local file_to_upload="small_test.png"
        if [ $((i % 3)) -eq 0 ]; then
            file_to_upload="large_test.txt"
        fi
        
        local response=$(curl -s -X POST "$BASE_URL/api/documents/upload" \
            -H "Authorization: Bearer $token" \
            -F "file=@$file_to_upload" \
            -F "employeeId=$employee_id" \
            -F "documentType=OTHER")
        
        if echo "$response" | grep -q '"success":true'; then
            ((successful_uploads++))
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "File Upload Stress Test Results:"
    echo "- Attempted uploads: $upload_count"
    echo "- Successful uploads: $successful_uploads"
    echo "- Duration: ${duration}s"
    echo "- Avg time per upload: $((duration * 1000 / upload_count))ms"
    
    # Cleanup
    rm -f small_test.png large_test.txt
    
    if [ $successful_uploads -eq $upload_count ]; then
        print_success "All file uploads successful"
    else
        print_error "Some file uploads failed"
    fi
}

# Database connection stress test
test_database_stress() {
    print_info "Testing database connection stress..."
    
    local token=$(get_auth_token)
    [ -n "$token" ] || { print_error "Failed to get auth token"; return 1; }
    
    local query_count=50
    local successful_queries=0
    local start_time=$(date +%s)
    
    for i in $(seq 1 $query_count); do
        local response=$(curl -s -H "Authorization: Bearer $token" "$BASE_URL/api/employees")
        
        if echo "$response" | grep -q '"success":true'; then
            ((successful_queries++))
        fi
        
        # Small delay to simulate realistic usage
        sleep 0.1
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "Database Stress Test Results:"
    echo "- Query attempts: $query_count"
    echo "- Successful queries: $successful_queries"
    echo "- Duration: ${duration}s"
    echo "- Avg query time: $((duration * 1000 / query_count))ms"
    
    if [ $successful_queries -eq $query_count ]; then
        print_success "All database queries successful"
    else
        print_error "Some database queries failed"
    fi
}

# API endpoint response time test
test_response_times() {
    print_info "Testing API response times..."
    
    local token=$(get_auth_token)
    [ -n "$token" ] || { print_error "Failed to get auth token"; return 1; }
    
    declare -A endpoints=(
        ["Health"]="/api/health"
        ["Employees"]="/api/employees"
        ["Payments"]="/api/payments"
        ["Attendance"]="/api/attendance"
        ["Invoices"]="/api/invoices"
        ["Challans"]="/api/challans"
        ["Dashboard"]="/api/dashboard/stats"
    )
    
    echo "Endpoint Response Time Analysis:"
    echo "================================"
    
    for endpoint_name in "${!endpoints[@]}"; do
        local endpoint="${endpoints[$endpoint_name]}"
        local total_time=0
        local iterations=5
        
        for i in $(seq 1 $iterations); do
            local start_time=$(date +%s%3N)
            
            if [ "$endpoint" = "/api/health" ]; then
                curl -s "$BASE_URL$endpoint" > /dev/null
            else
                curl -s -H "Authorization: Bearer $token" "$BASE_URL$endpoint" > /dev/null
            fi
            
            local end_time=$(date +%s%3N)
            local response_time=$((end_time - start_time))
            total_time=$((total_time + response_time))
        done
        
        local avg_time=$((total_time / iterations))
        printf "%-12s: %4dms (avg of %d requests)\n" "$endpoint_name" "$avg_time" "$iterations"
    done
}

# Memory usage simulation test
test_memory_usage() {
    print_info "Testing memory usage with large payloads..."
    
    local token=$(get_auth_token)
    [ -n "$token" ] || { print_error "Failed to get auth token"; return 1; }
    
    # Create employee with large description
    local large_description=""
    for i in {1..1000}; do
        large_description+="This is a very long description designed to test memory usage and large payload handling. "
    done
    
    local employee_data="{
        \"name\": \"Memory Test Employee\",
        \"phone\": \"9876543210\",
        \"email\": \"memory.test@apexsolar.com\",
        \"address\": \"$large_description\",
        \"dateOfJoining\": \"2024-01-01\"
    }"
    
    local start_time=$(date +%s%3N)
    local response=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$employee_data")
    local end_time=$(date +%s%3N)
    
    local response_time=$((end_time - start_time))
    
    echo "Large Payload Test Results:"
    echo "- Payload size: ~$(echo "$employee_data" | wc -c) bytes"
    echo "- Response time: ${response_time}ms"
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Large payload handled successfully"
    else
        print_error "Large payload handling failed"
    fi
}

# Main execution
main() {
    print_header "ApexSolar Performance & Load Test Suite"
    echo -e "${BLUE}Testing Base URL: $BASE_URL${NC}"
    echo -e "${BLUE}Start Time: $(date)${NC}"
    echo ""
    
    test_concurrent_logins
    echo ""
    
    test_bulk_employee_creation
    echo ""
    
    test_file_upload_stress
    echo ""
    
    test_database_stress
    echo ""
    
    test_response_times
    echo ""
    
    test_memory_usage
    echo ""
    
    print_header "Performance Test Summary"
    echo -e "${BLUE}End Time: $(date)${NC}"
    print_success "Performance testing completed!"
}

main "$@"
