#!/bin/bash

echo "=== Testing Role Selection API ==="
echo ""

# Test 1: Check if server is running
echo "Test 1: Checking if server is running..."
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/companies?active=true)
if [ "$SERVER_STATUS" = "200" ]; then
  echo "✅ Server is running"
else
  echo "❌ Server is not running (Status: $SERVER_STATUS)"
  exit 1
fi
echo ""

# Test 2: Check if database columns exist
echo "Test 2: Checking database columns..."
COLUMNS_CHECK=$(curl -s http://localhost:3001/api/migrations/check-user-columns | grep -o '"allPresent":true')
if [ ! -z "$COLUMNS_CHECK" ]; then
  echo "✅ All required columns exist"
else
  echo "❌ Missing required columns"
  echo "Running migration..."
  curl -X POST http://localhost:3001/api/migrations/add-user-approval-columns
  echo ""
fi
echo ""

# Test 3: Check if companies are available
echo "Test 3: Checking if companies are available..."
COMPANIES_COUNT=$(curl -s "http://localhost:3001/api/companies?active=true" | grep -o '"id"' | wc -l)
if [ "$COMPANIES_COUNT" -gt 0 ]; then
  echo "✅ Found $COMPANIES_COUNT active companies"
else
  echo "❌ No companies found"
fi
echo ""

echo "=== All Checks Complete ==="
echo ""
echo "Next steps:"
echo "1. Restart the server (Ctrl+C and run 'npm run dev' again)"
echo "2. Try selecting shipper role in the app"
echo "3. Check server console logs for detailed output"
echo ""
echo "If you still see errors, the logs will show:"
echo "  📝 Request data received"
echo "  🔄 Database update attempt"
echo "  ✅ Success or ❌ Error with details"
