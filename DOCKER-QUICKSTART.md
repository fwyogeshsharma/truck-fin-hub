# Docker Quick Start Guide

Fast guide to get LogiFin running with Docker locally and deploying to Google Cloud.

## 🚀 Local Development with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Quick Start (3 steps)

```bash
# 1. Copy environment template
cp .env.production.example .env.production

# 2. Edit .env.production with your settings
# (Use a text editor to set DB_PASSWORD, JWT_SECRET, etc.)

# 3. Run with Docker Compose
docker-compose up --build
```

Your API will be available at: `http://localhost:3001`

### Test the API

```bash
# Health check
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

### Stop the containers

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v
```

---

## 🌐 Deploy to Google Cloud (Cloud Run)

### One-Time Setup

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Set your project
gcloud config set project YOUR_PROJECT_ID

# 3. Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com

# 4. Create PostgreSQL database
gcloud sql instances create logifin-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --backup

# 5. Create database
gcloud sql databases create logifin --instance=logifin-db

# 6. Set database password
gcloud sql users set-password postgres \
  --instance=logifin-db \
  --password=YOUR_SECURE_PASSWORD

# 7. Store secrets
echo -n "your-jwt-secret-min-32-chars" | \
  gcloud secrets create jwt-secret --data-file=-

echo -n "YOUR_SECURE_PASSWORD" | \
  gcloud secrets create db-password --data-file=-

# 8. Get Cloud SQL connection name (save this!)
gcloud sql instances describe logifin-db --format='value(connectionName)'
```

### Deploy Application

```bash
# Set variables (replace with your values)
export PROJECT_ID=$(gcloud config get-value project)
export CLOUD_SQL_CONNECTION_NAME="YOUR_PROJECT:us-central1:logifin-db"

# Build and push image
gcloud builds submit --tag gcr.io/$PROJECT_ID/logifin-backend

# Deploy to Cloud Run
gcloud run deploy logifin-backend \
  --image gcr.io/$PROJECT_ID/logifin-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances $CLOUD_SQL_CONNECTION_NAME \
  --set-env-vars NODE_ENV=production,PORT=3001,DB_HOST=/cloudsql/$CLOUD_SQL_CONNECTION_NAME,DB_PORT=5432,DB_NAME=logifin,DB_USER=postgres \
  --set-secrets DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10

# Get your service URL
gcloud run services describe logifin-backend \
  --region us-central1 \
  --format='value(status.url)'
```

### Verify Deployment

```bash
# Test your deployed API (replace URL with yours)
curl https://YOUR-SERVICE-URL/api/health
```

---

## 📋 Common Commands

### Docker Commands

```bash
# View logs
docker-compose logs -f backend

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up --build

# Remove all containers and start fresh
docker-compose down -v
docker-compose up --build
```

### Google Cloud Commands

```bash
# View logs
gcloud run services logs read logifin-backend \
  --region us-central1 --limit 50

# Update deployment
gcloud builds submit --tag gcr.io/$PROJECT_ID/logifin-backend
gcloud run deploy logifin-backend \
  --image gcr.io/$PROJECT_ID/logifin-backend \
  --region us-central1

# List all services
gcloud run services list

# Connect to database
gcloud sql connect logifin-db --user=postgres

# View database backups
gcloud sql backups list --instance=logifin-db
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# Find process using port 3001
# Windows:
netstat -ano | findstr :3001

# Mac/Linux:
lsof -i :3001

# Change port in .env.production:
PORT=3002
```

### Issue: "Migrations failed"

**Solution:**
```bash
# Run migrations manually
docker-compose exec backend node dist/scripts/run-migrations.js

# Or restart to re-run migrations
docker-compose restart backend
```

### Issue: Cloud Run deployment fails

**Solution:**
```bash
# Check build logs
gcloud builds list --limit=5

# View detailed logs
gcloud builds log BUILD_ID

# Common fixes:
# 1. Verify Cloud SQL connection name
# 2. Check secrets exist: gcloud secrets list
# 3. Ensure APIs are enabled
```

---

## 📊 Environment Variables

Required environment variables in `.env.production`:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
DB_HOST=postgres                    # For Docker: postgres
                                   # For Cloud Run: /cloudsql/CONNECTION_NAME
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=logifin

# Security
JWT_SECRET=your-jwt-secret-min-32-chars

# Optional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=LogiFin <noreply@logifin.com>
```

---

## 📚 More Documentation

- **Full Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Docker Documentation**: https://docs.docker.com
- **Google Cloud Run**: https://cloud.google.com/run/docs
- **Cloud SQL**: https://cloud.google.com/sql/docs

---

## 💡 Tips

1. **Start Simple**: Test locally with Docker first
2. **Use Secrets**: Never commit passwords or secrets
3. **Monitor Costs**: Start with smallest instance and scale up
4. **Backup Regularly**: Enable automatic backups on Cloud SQL
5. **Use Staging**: Create a staging environment for testing

---

**Need Help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
