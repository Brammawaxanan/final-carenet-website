#!/bin/bash

echo "🧪 Complete Dashboard Analysis & Testing"
echo "========================================"
echo ""

# Test 1: Check if backend is running
echo "1. Backend Health Check:"
if curl -s http://localhost:8091/dashboard/context > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8091"
else
    echo "❌ Backend is NOT running"
    echo "   Start with: cd /Users/sbwaxan/Desktop/carenet-backend && mvn spring-boot:run"
    exit 1
fi
echo ""

# Test 2: Test dashboard endpoints
echo "2. Dashboard Endpoint Tests:"
echo ""

echo "2a. User Context (no header):"
CONTEXT_NO_HEADER=$(curl -s http://localhost:8091/dashboard/context)
echo "Response: $CONTEXT_NO_HEADER"
echo ""

echo "2b. User Context (with header):"
CONTEXT_WITH_HEADER=$(curl -s -H "X-User-Id: 1" http://localhost:8091/dashboard/context)
echo "Response: $CONTEXT_WITH_HEADER"
echo ""

echo "2c. User Dashboard (no header):"
DASHBOARD_NO_HEADER=$(curl -s http://localhost:8091/dashboard/user)
echo "Response: $DASHBOARD_NO_HEADER"
echo ""

echo "2d. User Dashboard (with header):"
DASHBOARD_WITH_HEADER=$(curl -s -H "X-User-Id: 1" http://localhost:8091/dashboard/user)
echo "Response: $DASHBOARD_WITH_HEADER"
echo ""

# Test 3: Check what the issue is
echo "3. Analysis:"
if echo "$DASHBOARD_WITH_HEADER" | grep -q "User not found"; then
    echo "❌ ISSUE: User with ID 1 does not exist in database"
    echo ""
    echo "🔧 SOLUTION: Need to reload demo data"
    echo "   The DataLoader might not have run or failed"
    echo ""
    echo "   Try:"
    echo "   1. Stop backend (Ctrl+C)"
    echo "   2. Clear database manually"
    echo "   3. Restart backend to trigger DataLoader"
    echo ""
elif echo "$DASHBOARD_WITH_HEADER" | grep -q "activeAssignments"; then
    echo "✅ SUCCESS: Dashboard is working!"
    echo ""
    echo "📊 Dashboard Stats:"
    echo "$DASHBOARD_WITH_HEADER" | python3 -m json.tool 2>/dev/null || echo "$DASHBOARD_WITH_HEADER"
    echo ""
else
    echo "❓ UNKNOWN: Unexpected response"
    echo "Response: $DASHBOARD_WITH_HEADER"
fi

echo ""
echo "🎯 Test Complete!"
