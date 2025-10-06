#!/bin/bash

# Quick cleanup script for after testing
# Runs cleanup automatically without prompts

echo "🧹 Running quick test data cleanup..."

# Auto-answer yes to cleanup script
echo "y" | ./scripts/cleanup-test-data.sh

echo "✅ Quick cleanup completed!"
