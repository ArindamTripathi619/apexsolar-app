#!/bin/bash

# Test Authentication Fixes
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🔧 Testing Authentication Fixes"
echo "Target: $BASE_URL"
echo "=================================="

# Test 1: Login and get token
echo "1. Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@apexsolar.net","password":"admin123"}')

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -n "$TOKEN" ]; then
    echo "✅ Login successful, token extracted: ${TOKEN:0:20}..."
    
    # Test 2: /api/auth/me with Bearer token
    echo -e "\n2. Testing /api/auth/me with Bearer token..."
    ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/auth/me")
    echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"
    
    if echo "$ME_RESPONSE" | grep -q '"success":true'; then
        echo "✅ /api/auth/me now accepts Bearer tokens!"
    else
        echo "❌ /api/auth/me still not working with Bearer tokens"
    fi
    
    # Test 3: Create employee for attendance test
    echo -e "\n3. Creating test employee for attendance test..."
    EMPLOYEE_DATA='{"name": "Test Employee", "phone": "9876543210", "email": "test@apexsolar.com"}'
    EMPLOYEE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$EMPLOYEE_DATA")
    
    EMPLOYEE_ID=$(echo "$EMPLOYEE_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    
    if [ -n "$EMPLOYEE_ID" ]; then
        echo "✅ Employee created: $EMPLOYEE_ID"
        
        # Test 4: Attendance API with Bearer token
        echo -e "\n4. Testing attendance API with Bearer token..."
        ATTENDANCE_DATA="{\"employeeId\": \"$EMPLOYEE_ID\", \"month\": 1, \"year\": 2024, \"daysWorked\": 22}"
        ATTENDANCE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/attendance" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$ATTENDANCE_DATA")
        
        echo "$ATTENDANCE_RESPONSE" | jq '.' 2>/dev/null || echo "$ATTENDANCE_RESPONSE"
        
        if echo "$ATTENDANCE_RESPONSE" | grep -q '"success":true'; then
            echo "✅ Attendance API now accepts Bearer tokens!"
        else
            echo "❌ Attendance API still not working with Bearer tokens"
        fi
        
        # Test 5: Get attendance
        echo -e "\n5. Testing get attendance..."
        GET_ATTENDANCE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/attendance")
        echo "$GET_ATTENDANCE_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_ATTENDANCE_RESPONSE" | head -c 100
        
        if echo "$GET_ATTENDANCE_RESPONSE" | grep -q '"success":true'; then
            echo "✅ Get attendance working!"
        else
            echo "❌ Get attendance still failing"
        fi
    else
        echo "❌ Failed to create test employee"
    fi
    
    # Test 6: Accountant login and challan test
    echo -e "\n6. Testing accountant login and challan APIs..."
    ACCOUNTANT_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"accountant@apexsolar.net","password":"accountant123"}')
    
    ACCOUNTANT_TOKEN=$(echo "$ACCOUNTANT_LOGIN" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    
    if [ -n "$ACCOUNTANT_TOKEN" ]; then
        echo "✅ Accountant login successful"
        
        # Create test PDF for challan
        cat > test-challan.pdf << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
trailer
<<
/Size 2
/Root 1 0 R
>>
startxref
0
%%EOF
EOF
        
        # Test challan upload
        echo -e "\n7. Testing challan upload with Bearer token..."
        CHALLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/challans" \
            -H "Authorization: Bearer $ACCOUNTANT_TOKEN" \
            -F "file=@test-challan.pdf" \
            -F "month=1" \
            -F "year=2024" \
            -F "type=PF")
        
        echo "$CHALLAN_RESPONSE" | jq '.' 2>/dev/null || echo "$CHALLAN_RESPONSE"
        
        if echo "$CHALLAN_RESPONSE" | grep -q '"success":true'; then
            echo "✅ Challan upload now works with Bearer tokens!"
        else
            echo "❌ Challan upload still failing with Bearer tokens"
        fi
        
        # Test get challans
        echo -e "\n8. Testing get challans..."
        GET_CHALLANS_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCOUNTANT_TOKEN" "$BASE_URL/api/challans")
        echo "$GET_CHALLANS_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_CHALLANS_RESPONSE" | head -c 100
        
        if echo "$GET_CHALLANS_RESPONSE" | grep -q '"success":true'; then
            echo "✅ Get challans working!"
        else
            echo "❌ Get challans still failing"
        fi
        
        # Cleanup
        rm -f test-challan.pdf
    else
        echo "❌ Accountant login failed"
    fi
    
else
    echo "❌ Login failed, cannot proceed with other tests"
fi

echo -e "\n🔧 Authentication fix testing complete!"
