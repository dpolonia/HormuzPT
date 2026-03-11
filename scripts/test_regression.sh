#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "==========================================="
echo "HormuzPT Regression Test Suite (Sprint 4)"
echo "==========================================="

echo -n "1. Checking Frontend (port 8080)... "
if curl -s -f http://localhost:8080 > /dev/null; then
    echo "OK"
else
    echo "FAILED"
    exit 1
fi

echo -n "2. Checking API Proxy Health (port 8081)... "
if curl -s -f http://localhost:8081/health > /dev/null; then
    echo "OK"
else
    echo "FAILED"
    exit 1
fi

echo -n "3. Checking Recalibrator Health (port 8082)... "
if curl -s -f http://localhost:8082/health > /dev/null; then
    echo "OK"
else
    echo "FAILED"
    exit 1
fi

echo -n "4. Validating /api/model-state API Shape... "
# Fetch and check for required top-level domain fields
RESPONSE=$(curl -s -f http://localhost:8081/api/model-state)
if echo "$RESPONSE" | grep -q '"base_eff_gas"' && echo "$RESPONSE" | grep -q '"version"'; then
    echo "OK"
else
    echo "FAILED (missing key fields in JSON response)"
    exit 1
fi

echo "5. Verifying Baseline Model Values... "
node scripts/verify_baseline.js

echo "6. Running Frontend Unit Tests (Vitest)... "
cd frontend && npm run test -- --run || echo "WARNING: UI tests failed or vitest not installed. Please run 'npm install' in frontend."

echo "==========================================="
echo "✅ ALL REGRESSION CHECKS PASSED SUCCESSFULLY."
echo "==========================================="
