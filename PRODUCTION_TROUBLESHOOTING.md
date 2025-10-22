# Production API Connection Troubleshooting

## Issue: "Failed to fetch" error on Netlify frontend

This guide helps you diagnose and fix API connection issues between Netlify (frontend) and your backend server.

---

## Step 1: Verify Backend is Running

SSH into your production server (34.31.185.19) and check:

```bash
# Check if Docker containers are running
docker ps

# You should see:
# - logifin-backend
# - logifin-postgres

# Check backend logs
docker logs logifin-backend --tail 50

# Expected output should show:
# ✅ PostgreSQL Database connected successfully
# 🚀 Server is running on port 3001
```

If containers are NOT running:
```bash
cd /path/to/truck-fin-hub
docker compose up -d --build
```

---

## Step 2: Test Backend API Directly

From your production server:

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

From your local machine or anywhere else:

```bash
# Test from outside the server
curl http://34.31.185.19:3001/api/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

**If this fails:**
- Backend is not accessible from outside
- Check firewall/security group settings below

---

## Step 3: Check Firewall/Security Group

Your production server must allow incoming traffic on port 3001.

### For GCP (Google Cloud Platform):

```bash
# Create firewall rule to allow port 3001
gcloud compute firewall-rules create allow-logifin-api \
  --allow tcp:3001 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow LogiFin API traffic"
```

### For AWS EC2:

1. Go to EC2 Dashboard → Security Groups
2. Select your instance's security group
3. Add Inbound Rule:
   - Type: Custom TCP
   - Port: 3001
   - Source: 0.0.0.0/0 (or specific IPs for security)

### For Linux UFW Firewall:

```bash
# Allow port 3001
sudo ufw allow 3001/tcp
sudo ufw reload
sudo ufw status
```

---

## Step 4: Verify CORS Configuration

Check if CORS is properly configured:

```bash
# Test CORS from command line
curl -H "Origin: https://your-app.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://34.31.185.19:3001/api/health -v

# Look for these headers in response:
# Access-Control-Allow-Origin: https://your-app.netlify.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## Step 5: Rebuild Backend with CORS Updates

The recent changes added proper CORS configuration. Rebuild:

```bash
# On production server
cd /path/to/truck-fin-hub

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build

# Check logs
docker logs logifin-backend -f
```

---

## Step 6: Update Netlify Environment Variable

1. Go to Netlify Dashboard
2. Site Settings → Environment Variables
3. Add/Update:
   - Key: `VITE_API_URL`
   - Value: `http://34.31.185.19:3001/api`

4. Trigger a new deploy:
   ```bash
   # Redeploy from Netlify dashboard
   # OR push a new commit to trigger rebuild
   ```

---

## Step 7: Check Network from Browser

Once frontend is deployed:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for the failed request:
   - Check the request URL (should be http://34.31.185.19:3001/api/...)
   - Check response status (404? 500? CORS error?)
   - Check response headers

---

## Common Issues and Solutions

### Issue: "ERR_CONNECTION_REFUSED"
**Cause:** Backend not running or port not accessible
**Solution:** Check Steps 1 and 3

### Issue: "CORS policy" error
**Cause:** Backend not allowing your Netlify domain
**Solution:**
1. Get your exact Netlify URL (e.g., `https://your-app-name.netlify.app`)
2. Update ALLOWED_ORIGINS in docker-compose.yml or .env.production
3. Rebuild backend

### Issue: Request goes to wrong URL
**Cause:** VITE_API_URL not set correctly in Netlify
**Solution:** Check Step 6

### Issue: Mixed content (HTTPS → HTTP)
**Cause:** Netlify uses HTTPS, backend uses HTTP
**Solution:** Either:
- Add SSL certificate to backend (recommended)
- OR use HTTP-only Netlify URL for testing

---

## Quick Fix Checklist

✅ Backend containers running
✅ Backend accessible from outside (`curl http://34.31.185.19:3001/api/health`)
✅ Firewall allows port 3001
✅ CORS configured with Netlify URL
✅ Netlify environment variable `VITE_API_URL` set correctly
✅ Netlify rebuild triggered after env variable change

---

## Test Commands Summary

```bash
# 1. Check backend is running
docker ps | grep logifin-backend

# 2. Test API locally on server
curl http://localhost:3001/api/health

# 3. Test API from outside
curl http://34.31.185.19:3001/api/health

# 4. Check backend logs
docker logs logifin-backend --tail 100

# 5. Restart backend
docker compose restart backend

# 6. Rebuild backend completely
docker compose down
docker compose up -d --build
```

---

## Still Not Working?

Check these advanced issues:

1. **Docker network issues:**
   ```bash
   docker network ls
   docker network inspect truck-fin-hub_logifin-network
   ```

2. **Port already in use:**
   ```bash
   sudo netstat -tulpn | grep 3001
   # or
   sudo lsof -i :3001
   ```

3. **Backend crash loop:**
   ```bash
   docker logs logifin-backend --tail 200
   # Look for error messages
   ```

---

## Contact

If issue persists, share:
1. Output of `curl http://34.31.185.19:3001/api/health`
2. Backend logs: `docker logs logifin-backend --tail 100`
3. Browser console error screenshot
4. Your Netlify URL
