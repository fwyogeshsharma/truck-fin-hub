@echo off
REM This script creates setup-ssl.sh and instructions for Windows users

echo ========================================
echo LogiFin SSL Setup - Windows Helper
echo ========================================
echo.
echo This script prepares the SSL setup for your Linux VM.
echo.
echo INSTRUCTIONS:
echo.
echo 1. Copy setup-ssl.sh to your VM:
echo    scp setup-ssl.sh user@34.93.247.3:~/
echo.
echo 2. SSH into your VM:
echo    ssh user@34.93.247.3
echo.
echo 3. Run the setup script:
echo    chmod +x setup-ssl.sh
echo    sudo ./setup-ssl.sh
echo.
echo 4. After setup completes, test the API:
echo    curl -k https://34.93.247.3/api/health
echo.
echo 5. Push your code changes:
echo    git add .
echo    git commit -m "Update to HTTPS"
echo    git push
echo.
echo 6. Wait for Netlify to deploy, then test:
echo    Visit https://tf.rollingradius.com
echo.
echo ========================================
echo.
echo The setup-ssl.sh script is ready in this folder!
echo.
pause
