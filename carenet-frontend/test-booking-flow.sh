#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "  🔍 CareNet Booking → Task Flow Diagnostic Test"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Test 1: Backend Server Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BACKEND_STATUS=$(curl -s http://localhost:8091/service/caregivers 2>/dev/null)
if echo "$BACKEND_STATUS" | jq -e '.caregivers' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is RUNNING on port 8091${NC}"
    CAREGIVER_COUNT=$(echo "$BACKEND_STATUS" | jq '.caregivers | length')
    echo "   📊 Caregivers available: $CAREGIVER_COUNT"
else
    echo -e "${RED}❌ Backend is DOWN or not responding${NC}"
    echo "   Please start backend: cd carenet-backend && mvn spring-boot:run"
    exit 1
fi
echo ""

# Test 2: User's Assignments
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Test 2: User's Assignments (User ID: 30)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ASSIGNMENTS=$(curl -s -H "X-User-Id: 30" http://localhost:8091/service/assignments/mine 2>/dev/null)
ASSIGNMENT_COUNT=$(echo "$ASSIGNMENTS" | jq '. | length')
echo -e "${GREEN}✅ Assignments found: $ASSIGNMENT_COUNT${NC}"

if [ "$ASSIGNMENT_COUNT" -gt 0 ]; then
    echo ""
    echo "   📊 Assignment List:"
    echo "$ASSIGNMENTS" | jq -r '.[] | "   • ID: \(.id) | Service: \(.serviceType // "N/A") | Created: \(.createdAt // "N/A")"'
else
    echo -e "${YELLOW}⚠️  No assignments found. Book a caregiver to create one.${NC}"
fi
echo ""

# Test 3: Latest Assignment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🆕 Test 3: Latest Assignment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ASSIGNMENT_COUNT" -gt 0 ]; then
    LATEST=$(echo "$ASSIGNMENTS" | jq 'sort_by(.createdAt) | reverse | .[0]')
    LATEST_ID=$(echo "$LATEST" | jq -r '.id')
    LATEST_SERVICE=$(echo "$LATEST" | jq -r '.serviceType // "N/A"')
    LATEST_CREATED=$(echo "$LATEST" | jq -r '.createdAt // "N/A"')
    
    echo -e "${GREEN}✅ Latest Assignment Details:${NC}"
    echo "   📌 ID: $LATEST_ID"
    echo "   🏷️  Service Type: $LATEST_SERVICE"
    echo "   📅 Created: $LATEST_CREATED"
else
    echo -e "${YELLOW}⚠️  No assignments to show${NC}"
    LATEST_ID=""
fi
echo ""

# Test 4: Tasks for Latest Assignment
if [ -n "$LATEST_ID" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Test 4: Tasks for Assignment $LATEST_ID"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    ACTIVITY=$(curl -s -H "X-User-Id: 30" http://localhost:8091/activity/$LATEST_ID/overview 2>/dev/null)
    TASK_COUNT=$(echo "$ACTIVITY" | jq '.tasks | length')
    
    if [ "$TASK_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Tasks found: $TASK_COUNT${NC}"
        echo ""
        echo "   📋 Task List:"
        echo "$ACTIVITY" | jq -r '.tasks[] | "   • ID: \(.id) | Title: \(.title) | Status: \(.status) | CreatedBy: \(.createdBy)"'
        echo ""
        echo "   📝 Task Descriptions:"
        echo "$ACTIVITY" | jq -r '.tasks[] | "   \(.id). \(.title): \(.description // "No description")"'
    else
        echo -e "${YELLOW}⚠️  No tasks found for this assignment${NC}"
        echo "   This might be normal if you just created the assignment"
    fi
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⏭️  Test 4: SKIPPED (No assignments)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
echo ""

# Test 5: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Backend Status:     ${GREEN}✅ Running${NC}"
echo -e "Total Assignments:  ${GREEN}$ASSIGNMENT_COUNT${NC}"
if [ -n "$LATEST_ID" ]; then
    echo -e "Latest Assignment:  ${GREEN}#$LATEST_ID ($LATEST_SERVICE)${NC}"
    echo -e "Tasks in Latest:    ${GREEN}$TASK_COUNT${NC}"
fi
echo ""

# Test 6: Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To test booking → task creation:"
echo ""
echo "1. Go to: http://localhost:5174/service"
echo "2. Click any caregiver → 'Book Now'"
echo "3. Fill in:"
echo "   • Service Type: 'Pet Care'"
echo "   • Task Description: 'Walk dog twice daily'"
echo "   • Select dates"
echo "4. Click 'Confirm Booking'"
echo "5. ${GREEN}✅ Should auto-redirect to Activity page${NC}"
echo "6. ${GREEN}✅ Should see new task immediately${NC}"
echo ""
echo "Then run this script again to verify the task was created!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Diagnostic Complete!"
echo "═══════════════════════════════════════════════════════════════"
