#!/bin/bash

# SSL Setup Script for LogiFin API on VM
# This script will:
# 1. Install Nginx
# 2. Generate a self-signed SSL certificate
# 3. Configure Nginx as HTTPS reverse proxy
# 4. Open port 443 in firewall
# 5. Restart services

set -e

echo "🔐 LogiFin SSL Setup Script"
echo "============================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Installing Nginx...${NC}"
apt update
apt install -y nginx openssl

echo ""
echo -e "${YELLOW}Step 2: Generating SSL Certificate...${NC}"
# Generate self-signed certificate valid for 1 year
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/logifin-selfsigned.key \
  -out /etc/ssl/certs/logifin-selfsigned.crt \
  -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=LogiFin/OU=IT/CN=34.93.247.3"

chmod 600 /etc/ssl/private/logifin-selfsigned.key
chmod 644 /etc/ssl/certs/logifin-selfsigned.crt

echo -e "${GREEN}✓ SSL Certificate generated${NC}"
echo "  Location: /etc/ssl/certs/logifin-selfsigned.crt"
echo "  Key: /etc/ssl/private/logifin-selfsigned.key"

echo ""
echo -e "${YELLOW}Step 3: Configuring Nginx...${NC}"

# Create Nginx configuration
cat > /etc/nginx/sites-available/logifin << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name 34.93.247.3;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    server_name 34.93.247.3;

    # SSL Certificate
    ssl_certificate /etc/ssl/certs/logifin-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/logifin-selfsigned.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Timeouts
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    # Logging
    access_log /var/log/nginx/logifin-access.log;
    error_log /var/log/nginx/logifin-error.log;

    # Proxy to Docker backend
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;

        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Disable buffering for better performance
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/logifin /etc/nginx/sites-enabled/logifin

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

echo -e "${GREEN}✓ Nginx configured${NC}"

echo ""
echo -e "${YELLOW}Step 4: Configuring Firewall...${NC}"

# Check if UFW is installed and active
if command -v ufw &> /dev/null; then
    echo "Configuring UFW firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✓ UFW firewall rules added${NC}"
else
    echo "UFW not found. If using cloud provider firewall, manually allow ports 80 and 443."
fi

echo ""
echo -e "${YELLOW}Step 5: Starting Nginx...${NC}"
systemctl enable nginx
systemctl restart nginx

echo ""
echo -e "${GREEN}✅ SSL Setup Complete!${NC}"
echo ""
echo "======================================"
echo "Your API is now available at:"
echo "  🔒 https://34.93.247.3/api"
echo "  🔒 https://34.93.247.3/api/health"
echo ""
echo "Testing API health endpoint..."
sleep 2

# Test the API
if curl -k -s https://localhost/api/health | grep -q "ok"; then
    echo -e "${GREEN}✓ API is responding correctly!${NC}"
else
    echo -e "${RED}⚠ API test failed. Check Docker logs: docker-compose logs -f backend${NC}"
fi

echo ""
echo "Next Steps:"
echo "1. Test HTTPS: curl -k https://34.93.247.3/api/health"
echo "2. Push frontend changes and deploy on Netlify"
echo "3. Visit https://tf.rollingradius.com and test login"
echo ""
echo "Note: Browsers will show 'Not Secure' warning because this is a self-signed certificate."
echo "Users need to click 'Advanced' → 'Proceed to site' to accept it."
echo ""
echo "For production, consider using a domain name with Let's Encrypt for a trusted certificate."
echo "======================================"
