#!/bin/bash

echo "=== Company Admin Setup Helper ==="
echo ""
echo "This script helps you set up company admin users who can approve shipper requests."
echo ""

# Step 1: List all companies
echo "Step 1: Fetching available companies..."
echo ""
curl -s http://localhost:3001/api/companies?active=true | python -m json.tool
echo ""
echo "Note down the company ID you want to create an admin for."
echo ""

# Step 2: List all users
echo "Step 2: Fetching all users..."
echo ""
curl -s http://localhost:3001/api/migrations/list-users | python -m json.tool
echo ""
echo "Note down the user ID you want to make a company admin."
echo ""

# Step 3: Instructions
echo "Step 3: Set a user as company admin"
echo ""
echo "Run the following command, replacing USER_ID and COMPANY_ID with actual values:"
echo ""
echo "curl -X POST http://localhost:3001/api/migrations/set-company-admin \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"userId\": \"USER_ID\", \"companyId\": \"COMPANY_ID\"}'"
echo ""
echo "Example:"
echo "curl -X POST http://localhost:3001/api/migrations/set-company-admin \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"userId\": \"abc123\", \"companyId\": \"delhivery\"}'"
echo ""
echo "=== Manual Usage ==="
echo ""
read -p "Do you want to set up a company admin now? (y/n): " answer

if [ "$answer" == "y" ] || [ "$answer" == "Y" ]; then
  read -p "Enter User ID: " user_id
  read -p "Enter Company ID: " company_id

  echo ""
  echo "Setting up company admin..."
  curl -X POST http://localhost:3001/api/migrations/set-company-admin \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$user_id\", \"companyId\": \"$company_id\"}"
  echo ""
  echo ""
  echo "Done! The user should now be able to see pending shipper requests in their admin portal."
else
  echo "Setup cancelled. You can run the curl command manually when ready."
fi
