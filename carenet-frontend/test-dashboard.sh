#!/bin/bash

echo "🧪 Testing Dashboard Endpoints..."
echo ""

# Test 1: Check backend health
echo "1. Backend Health Check:"
if curl -s http://localhost:8091/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8091"
else
    echo "❌ Backend is NOT running"
    echo "   Start with: cd /Users/sbwaxan/Desktop/carenet-backend && mvn spring-boot:run"
    exit 1
fi
echo ""

# Test 2: Test user context
echo "2. User Context Test:"
CONTEXT_RESPONSE=$(curl -s -H "X-User-Id: 1" http://localhost:8091/dashboard/context)
echo "Response: $CONTEXT_RESPONSE"
echo ""

# Test 3: Test user dashboard
echo "3. User Dashboard Test:"
DASHBOARD_RESPONSE=$(curl -s -H "X-User-Id: 1" http://localhost:8091/dashboard/user)
echo "Response: $DASHBOARD_RESPONSE"
echo ""

# Test 4: Check if user exists
echo "4. Check User in Database:"
echo "Run this manually:"
echo "mysql -u root -pBramma@3681 CareNet -e \"SELECT id, name, email FROM user WHERE id = 1;\""
echo ""

echo "🎯 Test Complete!"
