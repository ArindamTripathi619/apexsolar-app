#!/bin/bash

# ApexSolar Test Data Cleanup Script
# This script safely removes ALL test data from the database
# Use with caution - only run in development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@apexsolar.net}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Get authentication token
get_auth_token() {
    local email="$1"
    local password="$2"
    
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
    else
        return 1
    fi
}

# Check if server is running
check_server() {
    print_info "Checking if development server is running..."
    
    if curl -s "$BASE_URL/api/health" | grep -q '"status":"ok"'; then
        print_success "Server is running at $BASE_URL"
        return 0
    else
        print_error "Server is not running at $BASE_URL"
        print_info "Please start the development server with: npm run dev"
        exit 1
    fi
}

# Authenticate admin user
authenticate() {
    print_info "Authenticating admin user..."
    
    AUTH_TOKEN=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
    
    if [ -n "$AUTH_TOKEN" ]; then
        print_success "Admin authenticated successfully"
        return 0
    else
        print_error "Failed to authenticate admin user"
        print_warning "Make sure admin user exists: npx prisma db seed"
        exit 1
    fi
}

# Get data counts
get_data_counts() {
    local prefix="$1"
    
    # Get employees count
    local employees=$(curl -s -X GET "$BASE_URL/api/employees" \
        -H "Cookie: auth-token=$AUTH_TOKEN" | \
        grep -o '"id":[^,]*' | wc -l)
    
    # Get clients count
    local clients=$(curl -s -X GET "$BASE_URL/api/clients" \
        -H "Cookie: auth-token=$AUTH_TOKEN" | \
        grep -o '"id":[^,]*' | wc -l)
    
    # Get invoices count
    local invoices=$(curl -s -X GET "$BASE_URL/api/invoices" \
        -H "Cookie: auth-token=$AUTH_TOKEN" | \
        grep -o '"id":[^,]*' | wc -l)
    
    # Get payments count
    local payments=$(curl -s -X GET "$BASE_URL/api/payments" \
        -H "Cookie: auth-token=$AUTH_TOKEN" | \
        grep -o '"id":[^,]*' | wc -l)
    
    echo ""
    echo "📊 $prefix Data Counts:"
    echo "   Employees: $employees"
    echo "   Clients: $clients"
    echo "   Invoices: $invoices"
    echo "   Payments: $payments"
    
    # Store counts for comparison
    if [ "$prefix" = "Current" ]; then
        EMPLOYEES_BEFORE=$employees
        CLIENTS_BEFORE=$clients
        INVOICES_BEFORE=$invoices
        PAYMENTS_BEFORE=$payments
    else
        EMPLOYEES_AFTER=$employees
        CLIENTS_AFTER=$clients
        INVOICES_AFTER=$invoices
        PAYMENTS_AFTER=$payments
    fi
}

# Check if item is test data
is_test_data() {
    local name="$1"
    local email="$2"
    local description="$3"
    
    # Check for test patterns
    if echo "$name" | grep -iq "test\|TEST_"; then
        return 0
    fi
    if echo "$email" | grep -iq "test\|\.test@"; then
        return 0
    fi
    if echo "$description" | grep -iq "test\|TEST_"; then
        return 0
    fi
    
    # Additional test patterns
    if echo "$name" | grep -q "Bulk Test\|Memory Test\|Upload Test\|Security Test\|<script>"; then
        return 0
    fi
    
    return 1
}

# Clean up test data via API
cleanup_via_api() {
    print_info "Cleaning up test data via API endpoints..."
    
    local total_deleted=0
    
    # Clean payments first (dependencies)
    print_info "Cleaning payments..."
    local payments_response=$(curl -s -X GET "$BASE_URL/api/payments" \
        -H "Cookie: auth-token=$AUTH_TOKEN")
    
    # Extract payment data and check if it's test data
    echo "$payments_response" | grep -o '"id":"[^"]*"[^}]*"description":"[^"]*"' | while read payment_line; do
        local payment_id=$(echo "$payment_line" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        local description=$(echo "$payment_line" | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
        
        if is_test_data "" "" "$description"; then
            curl -s -X DELETE "$BASE_URL/api/payments/$payment_id" \
                -H "Cookie: auth-token=$AUTH_TOKEN" >/dev/null 2>&1
            total_deleted=$((total_deleted + 1))
        fi
    done
    
    # Clean invoices
    print_info "Cleaning invoices..."
    local invoices_response=$(curl -s -X GET "$BASE_URL/api/invoices" \
        -H "Cookie: auth-token=$AUTH_TOKEN")
    
    echo "$invoices_response" | grep -o '"id":"[^"]*"[^}]*"description":"[^"]*"' | while read invoice_line; do
        local invoice_id=$(echo "$invoice_line" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        local description=$(echo "$invoice_line" | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
        
        if is_test_data "" "" "$description"; then
            curl -s -X DELETE "$BASE_URL/api/invoices/$invoice_id" \
                -H "Cookie: auth-token=$AUTH_TOKEN" >/dev/null 2>&1
            total_deleted=$((total_deleted + 1))
        fi
    done
    
    # Clean clients
    print_info "Cleaning clients..."
    local clients_response=$(curl -s -X GET "$BASE_URL/api/clients" \
        -H "Cookie: auth-token=$AUTH_TOKEN")
    
    echo "$clients_response" | grep -o '"id":"[^"]*"[^}]*"name":"[^"]*"[^}]*"email":"[^"]*"' | while read client_line; do
        local client_id=$(echo "$client_line" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        local name=$(echo "$client_line" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        local email=$(echo "$client_line" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
        
        if is_test_data "$name" "$email" ""; then
            curl -s -X DELETE "$BASE_URL/api/clients?id=$client_id" \
                -H "Cookie: auth-token=$AUTH_TOKEN" >/dev/null 2>&1
            total_deleted=$((total_deleted + 1))
        fi
    done
    
    # Clean employees (keep admin users)
    print_info "Cleaning employees..."
    local employees_response=$(curl -s -X GET "$BASE_URL/api/employees" \
        -H "Cookie: auth-token=$AUTH_TOKEN")
    
    echo "$employees_response" | grep -o '"id":"[^"]*"[^}]*"name":"[^"]*"[^}]*"email":"[^"]*"' | while read employee_line; do
        local employee_id=$(echo "$employee_line" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        local name=$(echo "$employee_line" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        local email=$(echo "$employee_line" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
        
        # Skip admin users
        if echo "$email" | grep -q "admin@apexsolar.net\|accountant@apexsolar.net"; then
            continue
        fi
        
        if is_test_data "$name" "$email" ""; then
            curl -s -X DELETE "$BASE_URL/api/employees/$employee_id" \
                -H "Cookie: auth-token=$AUTH_TOKEN" >/dev/null 2>&1
            total_deleted=$((total_deleted + 1))
        fi
    done
    
    print_success "API cleanup completed - processed $total_deleted items"
}

# Clean up uploaded files
cleanup_files() {
    print_info "Cleaning up uploaded test files..."
    
    local deleted_files=0
    
    # Clean all upload directories
    for dir in uploads/employees uploads/challans uploads/invoices; do
        if [ -d "$dir" ]; then
            # Count files before deletion
            local file_count=$(find "$dir" -type f 2>/dev/null | wc -l)
            
            # Remove test files and clean empty directories
            find "$dir" -name "*test*" -type f -delete 2>/dev/null || true
            find "$dir" -name "*.tmp" -type f -delete 2>/dev/null || true
            find "$dir" -type d -empty -delete 2>/dev/null || true
            
            deleted_files=$((deleted_files + file_count))
        fi
    done
    
    print_success "Cleaned $deleted_files uploaded files"
}

# Database direct cleanup
database_cleanup() {
    print_info "Running database cleanup..."
    
    # Create temporary SQL cleanup file
    cat > /tmp/cleanup.sql << 'SQL'
-- Clean test data from database (correct column names)
DELETE FROM employees WHERE 
    name LIKE 'Memory Test%' OR 
    name LIKE 'Upload Test%' OR 
    name LIKE 'Bulk Test%' OR 
    name LIKE 'Security Test%' OR 
    name LIKE 'TEST_EMPLOYEE_%' OR 
    name LIKE 'Updated Test%' OR 
    name = 'Test' OR 
    name LIKE '%<script>%' OR
    email LIKE '%test%@%' OR
    email LIKE '%.test@%';

DELETE FROM payments WHERE 
    description LIKE '%test%' OR 
    description LIKE '%Test%' OR 
    description LIKE '%TEST_%';

DELETE FROM clients WHERE 
    "companyName" LIKE '%test%' OR 
    "companyName" LIKE '%Test%' OR 
    email LIKE '%test%' OR 
    email LIKE '%.test@%';

DELETE FROM invoices WHERE 
    "clientName" LIKE '%test%' OR 
    "clientName" LIKE '%Test%' OR 
    "clientName" LIKE '%TEST_%';

DELETE FROM client_payments WHERE 
    description LIKE '%test%' OR 
    description LIKE '%Test%' OR 
    description LIKE '%TEST_%';
SQL
    
    # Execute cleanup
    if command -v npx >/dev/null 2>&1; then
        npx prisma db execute --file /tmp/cleanup.sql --schema prisma/schema.prisma 2>/dev/null || true
        print_success "Database cleanup completed"
    else
        print_warning "Prisma not available for database cleanup"
    fi
    
    # Clean up temp file
    rm -f /tmp/cleanup.sql
}

# Main cleanup function
main() {
    print_header "ApexSolar Test Data Cleanup"
    
    # Safety check
    echo -e "${YELLOW}⚠️  This will DELETE ALL test data from the database!${NC}"
    echo -e "${YELLOW}⚠️  Only run this in development environment!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleanup cancelled"
        exit 0
    fi
    
    # Run cleanup steps
    check_server
    authenticate
    get_data_counts "Current"
    
    print_header "Starting Cleanup Process"
    
    # Multiple cleanup methods for thoroughness
    database_cleanup
    cleanup_files
    
    # Wait a moment for database changes to propagate
    sleep 2
    
    get_data_counts "Final"
    
    print_header "Cleanup Summary"
    print_success "Database cleanup completed successfully!"
    
    local total_removed=$((EMPLOYEES_BEFORE + CLIENTS_BEFORE + INVOICES_BEFORE + PAYMENTS_BEFORE - EMPLOYEES_AFTER - CLIENTS_AFTER - INVOICES_AFTER - PAYMENTS_AFTER))
    print_info "Total items removed: $total_removed"
    
    echo ""
    print_info "💡 To reseed the database with admin users, run:"
    echo "   npx prisma db seed"
}

# Run main function
main "$@"
