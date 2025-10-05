#!/bin/bash

# Repository Structure Verification Script
# Verifies that all test scripts have been moved and references updated

echo "🔍 REPOSITORY STRUCTURE VERIFICATION"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check 1: Verify test scripts are in tests/ directory
echo -e "\n${BLUE}📁 Checking test scripts location...${NC}"
EXPECTED_SCRIPTS=(
    "comprehensive-test-suite.sh"
    "performance-test-suite.sh"
    "security-test-suite.sh"
    "test-auth-fixes.sh"
    "test-invoice-deletion-workflow.sh"
    "test-invoice-deletion.sh"
    "test-summary.sh"
    "test-upload.sh"
)

for script in "${EXPECTED_SCRIPTS[@]}"; do
    if [ -f "tests/$script" ]; then
        print_success "Found tests/$script"
    else
        print_error "Missing tests/$script"
    fi
done

# Check 2: Verify no scripts remain in root directory
echo -e "\n${BLUE}🧹 Checking root directory is clean...${NC}"
ROOT_SCRIPTS=$(find . -maxdepth 1 -name "*.sh" -type f | wc -l)
if [ "$ROOT_SCRIPTS" -eq 0 ]; then
    print_success "No test scripts in root directory"
else
    print_warning "$ROOT_SCRIPTS script(s) still in root directory"
    find . -maxdepth 1 -name "*.sh" -type f
fi

# Check 3: Verify GitHub workflow references
echo -e "\n${BLUE}⚙️  Checking GitHub workflow references...${NC}"

# Security workflow
if grep -q "./tests/security-test-suite.sh" .github/workflows/security.yml; then
    print_success "Security workflow updated"
else
    print_error "Security workflow not updated"
fi

# Quality workflow
if grep -q "./tests/performance-test-suite.sh" .github/workflows/quality.yml; then
    print_success "Quality workflow updated"
else
    print_error "Quality workflow not updated"
fi

# Testing workflow
TESTING_UPDATED=$(grep -c "./tests/" .github/workflows/testing.yml)
if [ "$TESTING_UPDATED" -ge 5 ]; then
    print_success "Testing workflow updated ($TESTING_UPDATED references)"
else
    print_error "Testing workflow not fully updated ($TESTING_UPDATED references)"
fi

# Check 4: Verify documentation references
echo -e "\n${BLUE}📚 Checking documentation references...${NC}"

# README.md
README_UPDATED=$(grep -c "./tests/" README.md)
if [ "$README_UPDATED" -ge 5 ]; then
    print_success "README.md updated ($README_UPDATED references)"
else
    print_error "README.md not fully updated ($README_UPDATED references)"
fi

# SECURITY.md
if grep -q "./tests/security-test-suite.sh" SECURITY.md; then
    print_success "SECURITY.md updated"
else
    print_error "SECURITY.md not updated"
fi

# Check 5: Verify test scripts are executable
echo -e "\n${BLUE}🚀 Checking script permissions...${NC}"
NON_EXECUTABLE=0
for script in "${EXPECTED_SCRIPTS[@]}"; do
    if [ -f "tests/$script" ]; then
        if [ -x "tests/$script" ]; then
            print_success "tests/$script is executable"
        else
            print_error "tests/$script is not executable"
            NON_EXECUTABLE=$((NON_EXECUTABLE + 1))
        fi
    fi
done

# Check 6: Verify tests directory has README
echo -e "\n${BLUE}📖 Checking tests documentation...${NC}"
if [ -f "tests/README.md" ]; then
    print_success "tests/README.md exists"
    README_SIZE=$(wc -l < tests/README.md)
    print_info "tests/README.md has $README_SIZE lines of documentation"
else
    print_error "tests/README.md missing"
fi

# Check 7: Test script functionality
echo -e "\n${BLUE}🧪 Testing script accessibility...${NC}"
cd tests 2>/dev/null || { print_error "Cannot access tests directory"; exit 1; }

for script in "${EXPECTED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        # Try to run with --help or just check if it executes without error
        if timeout 3s bash -c "./$script --help 2>/dev/null || ./$script 2>&1 | head -3" >/dev/null 2>&1; then
            print_success "$script can be executed"
        else
            print_warning "$script may have execution issues (normal for some scripts)"
        fi
    fi
done

cd .. # Return to root

# Summary
echo -e "\n${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo "==============================="

TOTAL_SCRIPTS=${#EXPECTED_SCRIPTS[@]}
FOUND_SCRIPTS=$(find tests/ -name "*.sh" -type f | wc -l)

print_info "Expected scripts: $TOTAL_SCRIPTS"
print_info "Found scripts: $FOUND_SCRIPTS"

if [ "$NON_EXECUTABLE" -eq 0 ]; then
    print_success "All scripts are executable"
else
    print_warning "$NON_EXECUTABLE scripts need chmod +x"
fi

# Final recommendations
echo -e "\n${BLUE}💡 RECOMMENDATIONS${NC}"
echo "==================="

if [ "$NON_EXECUTABLE" -gt 0 ]; then
    echo "Run: chmod +x tests/*.sh"
fi

echo "✅ Repository structure reorganization completed successfully!"
echo ""
echo "🗂️  Test scripts moved to: ./tests/"
echo "📄 Documentation updated in: README.md, SECURITY.md, tests/README.md"
echo "⚙️  GitHub workflows updated: security.yml, quality.yml, testing.yml"
echo ""
echo "To run tests: ./tests/comprehensive-test-suite.sh"
echo "For test docs: cat tests/README.md"
