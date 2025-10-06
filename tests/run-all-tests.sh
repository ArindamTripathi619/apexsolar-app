#!/bin/bash

# ApexSolar Complete Test Suite Runner
# Runs all available test suites including new client payment management tests

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"

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

# Check if server is running
check_server() {
    if ! curl -s "$BASE_URL/api/health" >/dev/null 2>&1; then
        print_error "Server is not running at $BASE_URL"
        print_info "Please start the server with: npm run dev"
        return 1
    fi
    return 0
}

# Run a test suite and capture results
run_test_suite() {
    local test_name="$1"
    local test_script="$2"
    
    print_header "Running $test_name"
    
    if [ ! -f "tests/$test_script" ]; then
        print_error "Test script not found: tests/$test_script"
        return 1
    fi
    
    if [ ! -x "tests/$test_script" ]; then
        print_error "Test script not executable: tests/$test_script"
        return 1
    fi
    
    if bash "tests/$test_script"; then
        print_success "$test_name completed successfully"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Main execution
main() {
    print_header "ApexSolar Complete Test Suite"
    
    # Check server
    if ! check_server; then
        exit 1
    fi
    
    print_success "Server is running at $BASE_URL"
    echo ""
    
    # Track overall results
    local total_suites=0
    local passed_suites=0
    
    # Run minimal test suite first
    print_info "🔧 Running minimal test suite..."
    if run_test_suite "Minimal Test Suite" "minimal-test-suite.sh"; then
        passed_suites=$((passed_suites + 1))
    fi
    total_suites=$((total_suites + 1))
    echo ""
    
    # Run our new client payment management tests
    print_info "💰 Running client payment management tests..."
    if run_test_suite "Client Payment Management Tests" "test-client-payment-management.sh"; then
        passed_suites=$((passed_suites + 1))
    fi
    total_suites=$((total_suites + 1))
    echo ""
    
    # Run comprehensive test suite
    print_info "📋 Running comprehensive test suite..."
    if run_test_suite "Comprehensive Test Suite" "comprehensive-test-suite.sh"; then
        passed_suites=$((passed_suites + 1))
    fi
    total_suites=$((total_suites + 1))
    echo ""
    
    # Run security tests
    print_info "🔒 Running security test suite..."
    if run_test_suite "Security Test Suite" "security-test-suite.sh"; then
        passed_suites=$((passed_suites + 1))
    fi
    total_suites=$((total_suites + 1))
    echo ""
    
    # Run performance tests
    print_info "⚡ Running performance test suite..."
    if run_test_suite "Performance Test Suite" "performance-test-suite.sh"; then
        passed_suites=$((passed_suites + 1))
    fi
    total_suites=$((total_suites + 1))
    echo ""
    
    # Summary
    print_header "Overall Test Results"

# Automatic cleanup after all tests
echo ""
echo "🧹 Running automatic test data cleanup..."
if [ -f "scripts/quick-cleanup.sh" ]; then
    ./scripts/quick-cleanup.sh
else
    echo "⚠️  Cleanup script not found. Run manually: ./scripts/cleanup-test-data.sh"
fi
    echo -e "${BLUE}Total Test Suites: $total_suites${NC}"
    echo -e "${GREEN}Passed Suites: $passed_suites${NC}"
    echo -e "${RED}Failed Suites: $((total_suites - passed_suites))${NC}"
    
    local success_rate=$((passed_suites * 100 / total_suites))
    echo -e "${BLUE}Success Rate: $success_rate%${NC}"
    
    echo ""
    if [ $passed_suites -eq $total_suites ]; then
        print_success "🎉 ALL TEST SUITES PASSED! Your application is ready for production!"
    else
        print_error "Some test suites failed. Please review the results above."
    fi
    
    return $((total_suites - passed_suites))
}

# Run all tests
main "$@"
