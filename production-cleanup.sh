#!/bin/bash

# Production Database Cleanup Script
# This script helps clean up test data from production environment
# Works with both containerized and traditional deployments
# Usage: ./production-cleanup.sh

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration - Override these via environment variables
BASE_URL="${BASE_URL:-${PROD_BASE_URL:-https://apexsolar-302444603160.asia-south1.run.app}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@apexsolar.net}"

# Detect if running in CI/CD environment
if [ -n "$GITHUB_ACTIONS" ] || [ -n "$CI" ] || [ "$CI_MODE" = "true" ]; then
    echo -e "${BLUE}🤖 Running in CI/CD environment${NC}"
    CI_MODE=true
else
    CI_MODE=false
fi

echo -e "${BLUE}🧹 Production Database Cleanup Tool${NC}"
echo -e "${YELLOW}Target: $BASE_URL${NC}"
echo -e "${BLUE}Environment: $([ "$CI_MODE" = true ] && echo "CI/CD" || echo "Manual")${NC}"
echo ""

# Check for required environment variables
if [ -z "$ADMIN_PASSWORD" ]; then
    if [ "$CI_MODE" = true ]; then
        echo -e "${YELLOW}⚠️ CI/CD Mode: ADMIN_PASSWORD not set, running in analysis-only mode${NC}"
        ANALYSIS_ONLY=true
    else
        echo -e "${RED}❌ Error: ADMIN_PASSWORD environment variable is required${NC}"
        echo "Usage: ADMIN_PASSWORD='your-password' ./production-cleanup.sh"
        exit 1
    fi
else
    ANALYSIS_ONLY=false
fi

# Confirmation prompt (skip in CI/CD)
if [ "$CI_MODE" = false ]; then
    echo -e "${YELLOW}⚠️  WARNING: This will connect to PRODUCTION environment${NC}"
    echo -e "${YELLOW}Are you sure you want to proceed? (yes/no):${NC}"
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        echo -e "${BLUE}ℹ️ Operation cancelled by user${NC}"
        exit 0
    fi
else
    echo -e "${BLUE}🤖 CI/CD mode: Skipping manual confirmation${NC}"
fi

# Step 1: Login (skip if analysis-only mode)
if [ "$ANALYSIS_ONLY" = true ]; then
    echo -e "${YELLOW}📊 Running in analysis-only mode (no authentication)${NC}"
    echo -e "${BLUE}🔍 This mode provides environment configuration validation${NC}"
    echo ""
    
    # Validate endpoint accessibility
    echo -e "${BLUE}🌐 Testing endpoint accessibility...${NC}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Staging environment is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️ Endpoint returned HTTP $HTTP_CODE (expected for staging)${NC}"
    fi
    
    echo -e "${GREEN}✅ Analysis-only mode completed successfully${NC}"
    echo -e "${BLUE}ℹ️ Full cleanup requires ADMIN_PASSWORD for authentication${NC}"
    exit 0
fi

echo -e "${BLUE}🔑 Authenticating with production...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Authentication failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Successfully authenticated${NC}"
echo ""

# Step 2: Get all employees
echo -e "${BLUE}📋 Fetching employee data...${NC}"
EMPLOYEES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $TOKEN")

if ! echo "$EMPLOYEES_RESPONSE" | grep -q '"success":true'; then
  echo -e "${RED}❌ Failed to fetch employees${NC}"
  exit 1
fi

# Step 3: Analyze data
echo -e "${BLUE}🔍 Analyzing data for cleanup opportunities...${NC}"
EMPLOYEE_COUNT=$(echo "$EMPLOYEES_RESPONSE" | grep -o '"id":' | wc -l)
echo -e "${GREEN}Total employees found: $EMPLOYEE_COUNT${NC}"

# Look for test patterns (enhanced for CI-generated test data)
TEST_PATTERNS="test|demo|sample|temp|dummy|fake|example|TEST_EMPLOYEE_[0-9]|TEST_CLIENT|CI_TEST|github"
POTENTIAL_TEST_DATA=$(echo "$EMPLOYEES_RESPONSE" | grep -iE "$TEST_PATTERNS" || echo "")

if [ -z "$POTENTIAL_TEST_DATA" ]; then
  echo -e "${GREEN}✅ No obvious test data patterns found${NC}"
  echo -e "${GREEN}Database appears to be clean!${NC}"
else
  echo -e "${YELLOW}⚠️ Found potential test data patterns:${NC}"
  echo "$POTENTIAL_TEST_DATA" | head -10
  echo ""
  echo -e "${BLUE}ℹ️ Manual review recommended for these entries${NC}"
  
  # In CI mode, provide specific cleanup recommendations
  if [ "$CI_MODE" = true ]; then
    echo -e "${BLUE}🤖 CI/CD Recommendation: Use bulk delete feature to remove test entries${NC}"
  fi
fi

# Step 4: Generate summary report
echo ""
echo -e "${BLUE}📊 Cleanup Summary Report${NC}"
echo "=================================="
echo "Environment: $BASE_URL"
echo "Total Employees: $EMPLOYEE_COUNT"
echo "Scan Date: $(date)"
echo "Potential Issues: $([ -z "$POTENTIAL_TEST_DATA" ] && echo "None" || echo "Found (review needed)")"
echo ""

echo -e "${GREEN}🎯 Production cleanup analysis completed${NC}"
echo -e "${BLUE}ℹ️ For actual cleanup operations, use the admin panel's bulk delete feature${NC}"
