#!/bin/bash

# Test employee profile picture upload

# First login to get a token
echo "Getting admin token..."
TOKEN_RESPONSE=$(curl -s -X POST https://apexsolar-302444603160.asia-south1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@apexsolar.net","password":"admin123"}')

echo "Login response: $TOKEN_RESPONSE"

# Extract token from response
TOKEN=$(echo $TOKEN_RESPONSE | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Get an employee ID to test with
echo "Getting employee list..."
EMPLOYEES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  https://apexsolar-302444603160.asia-south1.run.app/api/employees)

echo "Employees response: $EMPLOYEES_RESPONSE"

# Extract first employee ID
EMPLOYEE_ID=$(echo $EMPLOYEES_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

if [ -z "$EMPLOYEE_ID" ]; then
  echo "No employees found to test with"
  exit 1
fi

echo "Testing with employee ID: $EMPLOYEE_ID"

# Create a small test image file
echo "Creating test image file..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image.png

# Test upload
echo "Testing file upload..."
UPLOAD_RESPONSE=$(curl -s -X POST https://apexsolar-302444603160.asia-south1.run.app/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.png" \
  -F "employeeId=$EMPLOYEE_ID" \
  -F "documentType=PROFILE_PHOTO")

echo "Upload response: $UPLOAD_RESPONSE"

# Cleanup
rm -f test-image.png

echo "Test completed."
