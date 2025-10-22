# SSL/HTTPS Setup Guide for VM

Your frontend is served over HTTPS (from Netlify), so your API must also use HTTPS to avoid "Mixed Content" errors.

## Option 1: Use Nginx as Reverse Proxy with SSL (Recommended)

This is the easiest and most secure option using Let's Encrypt for free SSL certificates.

### Step 1: SSH into your VM
```bash
ssh user@34.93.247.3
```

### Step 2: Install Nginx and Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 3: Configure Nginx as Reverse Proxy
Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/logifin
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 34.93.247.3;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 34.93.247.3;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/ssl/certs/selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/selfsigned.key;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy settings
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Create Self-Signed Certificate (Temporary)
Since you're using an IP address (not a domain), Let's Encrypt won't work. Create a self-signed certificate:

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt \
  -subj "/C=IN/ST=State/L=City/O=Organization/CN=34.93.247.3"
```

### Step 5: Enable the Nginx Configuration
```bash
sudo ln -s /etc/nginx/sites-available/logifin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Open Port 443 in Firewall
```bash
# For UFW
sudo ufw allow 443/tcp

# For Google Cloud
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTPS traffic"
```

### Step 7: Update Docker Compose to Only Listen on Localhost
Since Nginx will proxy to port 4000, update docker-compose.yml:

```yaml
    ports:
      - "127.0.0.1:4000:4000"  # Only listen on localhost
```

Then restart Docker:
```bash
cd /path/to/your/project
docker-compose down
docker-compose up -d
```

### Step 8: Test HTTPS
```bash
curl -k https://34.93.247.3:443/api/health
```

---

## Option 2: Use a Domain Name with Let's Encrypt SSL (Best Practice)

If you have a domain name (e.g., api.yourdomain.com), you can use Let's Encrypt for a trusted SSL certificate:

### Step 1: Point Domain to VM
Add an A record in your DNS:
```
api.yourdomain.com  →  34.93.247.3
```

### Step 2: Update Nginx Configuration
Replace `34.93.247.3` with `api.yourdomain.com` in the Nginx config above.

### Step 3: Get SSL Certificate from Let's Encrypt
```bash
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts. Certbot will automatically configure Nginx with SSL.

### Step 4: Auto-renewal
```bash
sudo certbot renew --dry-run
```

### Step 5: Update Your Frontend Config
Update all references from `https://34.93.247.3:4000` to `https://api.yourdomain.com`

---

## Option 3: Quick Fix - Use Cloudflare Tunnel (No SSL Setup Required)

Cloudflare Tunnel provides free HTTPS without needing to set up SSL certificates:

### Step 1: Install Cloudflared
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Step 2: Authenticate
```bash
cloudflared tunnel login
```

### Step 3: Create Tunnel
```bash
cloudflared tunnel create logifin-api
```

### Step 4: Configure Tunnel
```bash
nano ~/.cloudflared/config.yml
```

Add:
```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:4000
  - service: http_status:404
```

### Step 5: Route DNS
```bash
cloudflared tunnel route dns logifin-api api.yourdomain.com
```

### Step 6: Run Tunnel
```bash
cloudflared tunnel run logifin-api
```

---

## After Setting Up SSL

1. **Push changes to Git:**
   ```bash
   git add .
   git commit -m "Update to HTTPS API endpoints"
   git push
   ```

2. **Deploy on Netlify** - The push will trigger a new deployment with HTTPS URLs

3. **Test the connection:**
   - Open your Netlify site
   - Open browser DevTools (F12) → Network tab
   - Try to login
   - Check that API calls are using HTTPS and not being blocked

---

## Troubleshooting

### Browser Shows "Not Secure" Warning with Self-Signed Certificate
This is normal with self-signed certificates. Users will need to accept the certificate warning. For production, use a domain with Let's Encrypt (Option 2) or Cloudflare (Option 3).

### Still Getting Mixed Content Errors
1. Check browser DevTools → Console for exact error
2. Verify all API URLs are using HTTPS (not HTTP)
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check Netlify environment variables are updated

### Port 443 Not Working
1. Check firewall: `sudo ufw status`
2. Check Nginx is running: `sudo systemctl status nginx`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify SSL certificate: `sudo nginx -t`

### Backend Container Not Reachable
1. Verify backend is running: `docker ps`
2. Check backend logs: `docker logs logifin-backend`
3. Test locally: `curl http://localhost:4000/api/health`
4. Check Nginx proxy: `curl -k https://localhost:443/api/health`
