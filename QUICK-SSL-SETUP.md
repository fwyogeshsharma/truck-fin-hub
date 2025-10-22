# Quick SSL Setup Guide

This guide will help you set up HTTPS for your API on the VM at 34.93.247.3.

## Option 1: Automatic Setup (Recommended - 5 minutes)

### Step 1: Copy the setup script to your VM

**On Windows (PowerShell or Command Prompt):**
```bash
scp setup-ssl.sh your-username@34.93.247.3:~/
```

**On Linux/Mac:**
```bash
scp setup-ssl.sh your-username@34.93.247.3:~/
```

Replace `your-username` with your actual SSH username.

### Step 2: SSH into your VM
```bash
ssh your-username@34.93.247.3
```

### Step 3: Run the setup script
```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

The script will automatically:
- ✅ Install Nginx
- ✅ Generate SSL certificate
- ✅ Configure Nginx as HTTPS reverse proxy
- ✅ Open firewall ports (80, 443)
- ✅ Start Nginx
- ✅ Test the API

### Step 4: Verify it works
```bash
curl -k https://34.93.247.3/api/health
```

You should see: `{"status":"ok","message":"Server is running"}`

### Step 5: Deploy Frontend
```bash
# Exit SSH (Ctrl+D or type 'exit')
# Then on your local machine:
git add .
git commit -m "Update API to HTTPS"
git push
```

Wait 2-3 minutes for Netlify to deploy.

### Step 6: Test on Production
1. Visit https://tf.rollingradius.com
2. Try to login
3. It should work! ✅

---

## Option 2: Manual Setup

If you prefer to run commands manually:

### 1. Install Nginx
```bash
sudo apt update
sudo apt install -y nginx openssl
```

### 2. Generate SSL Certificate
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/logifin-selfsigned.key \
  -out /etc/ssl/certs/logifin-selfsigned.crt \
  -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=LogiFin/CN=34.93.247.3"

sudo chmod 600 /etc/ssl/private/logifin-selfsigned.key
```

### 3. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/logifin
```

Paste this content:
```nginx
server {
    listen 80;
    server_name 34.93.247.3;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 34.93.247.3;

    ssl_certificate /etc/ssl/certs/logifin-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/logifin-selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Enable and Start Nginx
```bash
sudo ln -s /etc/nginx/sites-available/logifin /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Open Firewall Ports
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 6. Test
```bash
curl -k https://34.93.247.3/api/health
```

---

## Troubleshooting

### Port 443 already in use
```bash
sudo netstat -tulpn | grep :443
sudo systemctl stop apache2  # if Apache is running
sudo systemctl restart nginx
```

### Nginx config test fails
```bash
sudo nginx -t
# Fix any errors shown
sudo systemctl restart nginx
```

### API not responding
```bash
# Check if Docker backend is running
docker ps

# Check backend logs
docker logs logifin-backend

# Test backend directly
curl http://localhost:4000/api/health
```

### Firewall blocking connections
```bash
# Check UFW status
sudo ufw status

# Allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# For Google Cloud, also check GCP firewall rules:
gcloud compute firewall-rules list
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0
```

### Still getting mixed content error
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+Shift+R)
3. Check Network tab - verify requests go to https://34.93.247.3
4. Verify Netlify deployed with new environment variables

---

## Understanding the Setup

**Before SSL:**
```
Browser (HTTPS) → tries to call → API (HTTP) ❌ BLOCKED by browser
```

**After SSL with Nginx:**
```
Browser (HTTPS) → API (HTTPS) via Nginx (port 443) → Docker backend (HTTP on localhost:4000) ✅ WORKS
```

Nginx acts as a "reverse proxy" that:
1. Accepts HTTPS connections on port 443
2. Decrypts the SSL traffic
3. Forwards to your Docker backend on localhost:4000
4. Sends encrypted response back to browser

---

## Self-Signed Certificate Warning

Users will see: **"Your connection is not private"** or **"Not secure"**

This is normal for self-signed certificates. To proceed:
1. Click **"Advanced"**
2. Click **"Proceed to 34.93.247.3"**
3. The site will load normally

For production, use a domain name with Let's Encrypt (free, trusted certificate):
```bash
# If you have a domain (e.g., api.yourdomain.com):
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Files Created

- `/etc/ssl/certs/logifin-selfsigned.crt` - SSL certificate
- `/etc/ssl/private/logifin-selfsigned.key` - Private key
- `/etc/nginx/sites-available/logifin` - Nginx configuration
- `/var/log/nginx/logifin-access.log` - Access logs
- `/var/log/nginx/logifin-error.log` - Error logs

---

## Need Help?

1. Check Nginx logs: `sudo tail -f /var/log/nginx/logifin-error.log`
2. Check Docker logs: `docker logs -f logifin-backend`
3. Test connectivity: `curl -k https://localhost/api/health`
4. Check firewall: `sudo ufw status`
