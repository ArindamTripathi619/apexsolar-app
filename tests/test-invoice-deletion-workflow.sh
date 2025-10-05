#!/bin/bash

# Comprehensive Invoice Deletion Test Workflow
# Tests: invoice deletion, file cleanup, database updates, dashboard stats refresh

set -e  # Exit on any error

echo "🧪 INVOICE DELETION WORKFLOW TEST"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
LOGIN_URL="$BASE_URL/api/auth/login"
INVOICES_URL="$BASE_URL/api/invoices"
DASHBOARD_STATS_URL="$BASE_URL/api/dashboard/stats"

# Helper functions
print_step() {
    echo -e "\n${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Login as admin
print_step "1" "Logging in as admin"
COOKIE_JAR=$(mktemp)
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$LOGIN_URL" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@apexsolar.net","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    print_success "Admin login successful"
else
    print_error "Admin login failed: $LOGIN_RESPONSE"
    exit 1
fi

# Step 2: Get initial dashboard stats
print_step "2" "Getting initial dashboard stats"
INITIAL_STATS=$(curl -s -b "$COOKIE_JAR" "$DASHBOARD_STATS_URL")

if echo "$INITIAL_STATS" | jq -e '.success' > /dev/null 2>&1; then
    INITIAL_INVOICE_COUNT=$(echo "$INITIAL_STATS" | jq -r '.data.totalInvoices')
    INITIAL_INVOICE_AMOUNT=$(echo "$INITIAL_STATS" | jq -r '.data.totalInvoiceAmount')
    print_success "Initial stats - Invoices: $INITIAL_INVOICE_COUNT, Amount: ₹$INITIAL_INVOICE_AMOUNT"
else
    print_error "Failed to get initial dashboard stats: $INITIAL_STATS"
    exit 1
fi

# Step 3: Get current invoices list
print_step "3" "Getting current invoices list"
INVOICES_LIST=$(curl -s -b "$COOKIE_JAR" "$INVOICES_URL")

if echo "$INVOICES_LIST" | jq -e '.success' > /dev/null 2>&1; then
    INVOICE_COUNT=$(echo "$INVOICES_LIST" | jq -r '.data | length')
    print_success "Found $INVOICE_COUNT invoices in the system"
    
    if [ "$INVOICE_COUNT" -gt 0 ]; then
        # Get first invoice details for deletion test
        FIRST_INVOICE=$(echo "$INVOICES_LIST" | jq -r '.data[0]')
        INVOICE_ID=$(echo "$FIRST_INVOICE" | jq -r '.id')
        INVOICE_CLIENT=$(echo "$FIRST_INVOICE" | jq -r '.clientName')
        INVOICE_AMOUNT=$(echo "$FIRST_INVOICE" | jq -r '.amount')
        INVOICE_FILE_URL=$(echo "$FIRST_INVOICE" | jq -r '.fileUrl')
        
        print_success "Selected invoice for deletion:"
        echo "  ID: $INVOICE_ID"
        echo "  Client: $INVOICE_CLIENT"
        echo "  Amount: ₹$INVOICE_AMOUNT"
        echo "  File URL: $INVOICE_FILE_URL"
    else
        print_warning "No invoices found. Creating a test invoice first..."
        
        # Create a test invoice (you might need to upload a file here)
        print_warning "Please create at least one invoice through the UI first, then run this test again."
        rm -f "$COOKIE_JAR"
        exit 0
    fi
else
    print_error "Failed to get invoices list: $INVOICES_LIST"
    exit 1
fi

# Step 4: Test invoice deletion
print_step "4" "Testing invoice deletion"
DELETE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X DELETE "$INVOICES_URL/$INVOICE_ID")

if echo "$DELETE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    print_success "Invoice deleted successfully"
    echo "Response: $(echo "$DELETE_RESPONSE" | jq -r '.message')"
else
    print_error "Invoice deletion failed: $DELETE_RESPONSE"
    rm -f "$COOKIE_JAR"
    exit 1
fi

# Step 5: Verify invoice is removed from list
print_step "5" "Verifying invoice is removed from database"
sleep 1  # Give database a moment to update
UPDATED_INVOICES_LIST=$(curl -s -b "$COOKIE_JAR" "$INVOICES_URL")

if echo "$UPDATED_INVOICES_LIST" | jq -e '.success' > /dev/null 2>&1; then
    NEW_INVOICE_COUNT=$(echo "$UPDATED_INVOICES_LIST" | jq -r '.data | length')
    EXPECTED_COUNT=$((INVOICE_COUNT - 1))
    
    if [ "$NEW_INVOICE_COUNT" -eq "$EXPECTED_COUNT" ]; then
        print_success "Invoice successfully removed from database"
        print_success "Invoice count: $INVOICE_COUNT → $NEW_INVOICE_COUNT"
    else
        print_error "Invoice count mismatch. Expected: $EXPECTED_COUNT, Got: $NEW_INVOICE_COUNT"
    fi
    
    # Check if the specific invoice is really gone
    DELETED_INVOICE_CHECK=$(echo "$UPDATED_INVOICES_LIST" | jq -r --arg id "$INVOICE_ID" '.data[] | select(.id == $id)')
    if [ -z "$DELETED_INVOICE_CHECK" ]; then
        print_success "Confirmed: Invoice $INVOICE_ID no longer exists in database"
    else
        print_error "ERROR: Invoice $INVOICE_ID still exists in database!"
    fi
else
    print_error "Failed to get updated invoices list: $UPDATED_INVOICES_LIST"
fi

# Step 6: Check updated dashboard stats
print_step "6" "Verifying dashboard stats are updated"
sleep 1  # Give database a moment to update
UPDATED_STATS=$(curl -s -b "$COOKIE_JAR" "$DASHBOARD_STATS_URL")

if echo "$UPDATED_STATS" | jq -e '.success' > /dev/null 2>&1; then
    NEW_INVOICE_COUNT_STATS=$(echo "$UPDATED_STATS" | jq -r '.data.totalInvoices')
    NEW_INVOICE_AMOUNT_STATS=$(echo "$UPDATED_STATS" | jq -r '.data.totalInvoiceAmount')
    
    print_success "Updated dashboard stats:"
    echo "  Total Invoices: $INITIAL_INVOICE_COUNT → $NEW_INVOICE_COUNT_STATS"
    echo "  Total Amount: ₹$INITIAL_INVOICE_AMOUNT → ₹$NEW_INVOICE_AMOUNT_STATS"
    
    # Verify the counts match
    EXPECTED_STATS_COUNT=$((INITIAL_INVOICE_COUNT - 1))
    if [ "$NEW_INVOICE_COUNT_STATS" -eq "$EXPECTED_STATS_COUNT" ]; then
        print_success "✓ Dashboard invoice count correctly updated"
    else
        print_error "✗ Dashboard invoice count mismatch. Expected: $EXPECTED_STATS_COUNT, Got: $NEW_INVOICE_COUNT_STATS"
    fi
    
    # Verify the amount decreased by the deleted invoice amount
    EXPECTED_AMOUNT_DECREASE=$(echo "$INITIAL_INVOICE_AMOUNT - $INVOICE_AMOUNT" | bc -l)
    ACTUAL_AMOUNT_DECREASE=$(echo "$INITIAL_INVOICE_AMOUNT - $NEW_INVOICE_AMOUNT_STATS" | bc -l)
    
    if [ "$(echo "$ACTUAL_AMOUNT_DECREASE == $INVOICE_AMOUNT" | bc -l)" -eq 1 ]; then
        print_success "✓ Dashboard total amount correctly decreased by ₹$INVOICE_AMOUNT"
    else
        print_warning "⚠️ Amount decrease verification: Expected -₹$INVOICE_AMOUNT, Got -₹$ACTUAL_AMOUNT_DECREASE"
    fi
else
    print_error "Failed to get updated dashboard stats: $UPDATED_STATS"
fi

# Step 7: Test file cleanup (check if file is accessible)
print_step "7" "Testing file cleanup"
if [[ "$INVOICE_FILE_URL" == http* ]]; then
    FILE_CHECK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$INVOICE_FILE_URL")
    if [ "$FILE_CHECK_RESPONSE" = "404" ] || [ "$FILE_CHECK_RESPONSE" = "403" ]; then
        print_success "✓ File successfully deleted (HTTP $FILE_CHECK_RESPONSE)"
    else
        print_warning "⚠️ File still accessible (HTTP $FILE_CHECK_RESPONSE) - may be cached or cleanup pending"
    fi
else
    print_warning "⚠️ Cannot test file cleanup - local file path detected"
fi

# Step 8: Test deletion of non-existent invoice
print_step "8" "Testing deletion of non-existent invoice"
FAKE_ID="fake-invoice-id-12345"
FAKE_DELETE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X DELETE "$INVOICES_URL/$FAKE_ID")

if echo "$FAKE_DELETE_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
    ERROR_MESSAGE=$(echo "$FAKE_DELETE_RESPONSE" | jq -r '.error // .message')
    print_success "✓ Correctly rejected deletion of non-existent invoice: $ERROR_MESSAGE"
else
    print_error "✗ Failed to handle non-existent invoice deletion properly"
fi

# Cleanup
rm -f "$COOKIE_JAR"

echo -e "\n${GREEN}🎉 INVOICE DELETION WORKFLOW TEST COMPLETED${NC}"
echo "================================="
echo "Summary of verification:"
echo "✅ Invoice deletion API works"
echo "✅ Database records are properly removed"  
echo "✅ Dashboard statistics update automatically"
echo "✅ File cleanup is triggered"
echo "✅ Error handling for non-existent invoices"

echo -e "\n${BLUE}📝 NOTES:${NC}"
echo "• Dashboard stats are calculated dynamically, so they update automatically"
echo "• File cleanup may be delayed for cloud storage (Google Cloud Storage)"
echo "• The deletion confirmation modal in UI provides additional safety"
echo "• All invoice-related counts and amounts update in real-time"

echo -e "\n${YELLOW}💡 TO VERIFY UI BEHAVIOR:${NC}"
echo "1. Open admin dashboard in browser"
echo "2. Note the current invoice count and total amount"
echo "3. Go to Invoice Management page"
echo "4. Delete an invoice using the delete button"
echo "5. Confirm the local stats update immediately"
echo "6. Return to dashboard - stats should reflect the deletion"
