# Company Admin Setup Helper (PowerShell)

Write-Host "=== Company Admin Setup Helper ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script helps you set up company admin users who can approve shipper requests."
Write-Host ""

# Step 1: List all companies
Write-Host "Step 1: Fetching available companies..." -ForegroundColor Yellow
Write-Host ""
$companies = Invoke-RestMethod -Uri "http://localhost:3001/api/companies?active=true" -Method Get
$companies | ConvertTo-Json -Depth 5 | Write-Host
Write-Host ""
Write-Host "Note down the company ID you want to create an admin for." -ForegroundColor Green
Write-Host ""

# Step 2: List all users
Write-Host "Step 2: Fetching all users..." -ForegroundColor Yellow
Write-Host ""
$users = Invoke-RestMethod -Uri "http://localhost:3001/api/migrations/list-users" -Method Get
$users | ConvertTo-Json -Depth 5 | Write-Host
Write-Host ""
Write-Host "Note down the user ID you want to make a company admin." -ForegroundColor Green
Write-Host ""

# Step 3: Instructions
Write-Host "Step 3: Set a user as company admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "Example PowerShell command:" -ForegroundColor Cyan
Write-Host '$body = @{' -ForegroundColor Gray
Write-Host '    userId = "USER_ID"' -ForegroundColor Gray
Write-Host '    companyId = "COMPANY_ID"' -ForegroundColor Gray
Write-Host '} | ConvertTo-Json' -ForegroundColor Gray
Write-Host 'Invoke-RestMethod -Uri "http://localhost:3001/api/migrations/set-company-admin" -Method Post -Body $body -ContentType "application/json"' -ForegroundColor Gray
Write-Host ""

# Manual usage
$answer = Read-Host "Do you want to set up a company admin now? (y/n)"

if ($answer -eq "y" -or $answer -eq "Y") {
    $userId = Read-Host "Enter User ID"
    $companyId = Read-Host "Enter Company ID"

    Write-Host ""
    Write-Host "Setting up company admin..." -ForegroundColor Yellow

    $body = @{
        userId = $userId
        companyId = $companyId
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "http://localhost:3001/api/migrations/set-company-admin" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"

        Write-Host ""
        Write-Host "Success!" -ForegroundColor Green
        $result | ConvertTo-Json -Depth 5 | Write-Host
        Write-Host ""
        Write-Host "Done! The user should now be able to see pending shipper requests in their admin portal." -ForegroundColor Green
    }
    catch {
        Write-Host ""
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "Setup cancelled. You can run the command manually when ready." -ForegroundColor Yellow
}
