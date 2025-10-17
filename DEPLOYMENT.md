# LogiFin - Google Cloud Deployment Guide

Complete guide for deploying LogiFin backend to Google Cloud Platform (GCP).

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Testing with Docker](#local-testing-with-docker)
3. [Google Cloud Setup](#google-cloud-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local testing)
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
- [Git](https://git-scm.com/downloads)
- Node.js 20+ (for development)

### Google Cloud Account
- Active GCP account with billing enabled
- Project created in GCP Console
- Sufficient permissions (Project Editor or Owner role)

---

## Local Testing with Docker

### 1. Build and Test Locally

```bash
# Clone the repository
cd truck-fin-hub

# Copy and configure environment
cp .env.production.example .env.production
# Edit .env.production with your local settings

# Build and run with Docker Compose
docker-compose up --build

# Test the API
curl http://localhost:3001/api/health
```

### 2. Verify Database Migrations

```bash
# Check container logs
docker-compose logs backend

# You should see:
# ✅ Database migrations completed!
# 🚀 Starting API server...
```

### 3. Stop containers

```bash
docker-compose down
# To remove volumes as well:
docker-compose down -v
```

---

## Google Cloud Setup

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

### 2. Create Cloud SQL PostgreSQL Instance

```bash
# Create Cloud SQL instance
gcloud sql instances create logifin-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup \
  --backup-start-time=03:00

# Create database
gcloud sql databases create logifin \
  --instance=logifin-db

# Set root password
gcloud sql users set-password postgres \
  --instance=logifin-db \
  --password=YOUR_SECURE_PASSWORD

# Get connection name (save this for later)
gcloud sql instances describe logifin-db --format='value(connectionName)'
# Output format: PROJECT_ID:REGION:INSTANCE_NAME
```

### 3. Create Secrets in Secret Manager

```bash
# Create JWT secret
echo -n "your-super-secret-jwt-key-min-32-chars" | \
  gcloud secrets create jwt-secret --data-file=-

# Create database password
echo -n "YOUR_SECURE_PASSWORD" | \
  gcloud secrets create db-password --data-file=-

# Create SMTP password (if using email)
echo -n "your-smtp-password" | \
  gcloud secrets create smtp-password --data-file=-
```

---

## Deployment Options

### Option 1: Cloud Run (Recommended - Serverless)

Cloud Run is a fully managed serverless platform that automatically scales your application.

```bash
# Set environment variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export SERVICE_NAME=logifin-backend
export CLOUD_SQL_CONNECTION_NAME="PROJECT_ID:REGION:logifin-db"

# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run with Cloud SQL connection
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $CLOUD_SQL_CONNECTION_NAME \
  --set-env-vars NODE_ENV=production \
  --set-env-vars PORT=3001 \
  --set-env-vars DB_HOST=/cloudsql/$CLOUD_SQL_CONNECTION_NAME \
  --set-env-vars DB_PORT=5432 \
  --set-env-vars DB_NAME=logifin \
  --set-env-vars DB_USER=postgres \
  --set-secrets DB_PASSWORD=db-password:latest \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0

# Get the service URL
gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'
```

### Option 2: Compute Engine (VM-based)

For more control over the infrastructure, deploy on a Compute Engine VM.

```bash
# Create VM instance
gcloud compute instances create logifin-vm \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server

# Configure firewall
gcloud compute firewall-rules create allow-logifin \
  --allow tcp:3001 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# SSH into the VM
gcloud compute ssh logifin-vm --zone=us-central1-a

# On the VM, run these commands:
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Clone your repository
git clone https://github.com/your-username/truck-fin-hub.git
cd truck-fin-hub

# Create .env.production file with your settings
nano .env.production

# Run with Docker Compose
docker compose up -d

# Check logs
docker compose logs -f backend
```

### Option 3: Google Kubernetes Engine (GKE - For Scale)

For large-scale deployments with advanced orchestration needs.

```bash
# Create GKE cluster
gcloud container clusters create logifin-cluster \
  --zone us-central1-a \
  --num-nodes 2 \
  --machine-type e2-medium

# Get credentials
gcloud container clusters get-credentials logifin-cluster --zone us-central1-a

# Build and push image
gcloud builds submit --tag gcr.io/$PROJECT_ID/logifin-backend

# Create Kubernetes deployment files (deployment.yaml, service.yaml)
# Then apply:
kubectl apply -f kubernetes/

# Expose service
kubectl expose deployment logifin-backend --type=LoadBalancer --port 80 --target-port 3001
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Test health endpoint
curl https://YOUR_SERVICE_URL/api/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

### 2. Run Database Migrations

Migrations run automatically on container startup via `start.sh`, but you can verify:

```bash
# For Cloud Run:
gcloud run services logs read $SERVICE_NAME --region $REGION --limit 100

# Look for:
# ✅ Database migrations completed!
```

### 3. Setup Custom Domain (Optional)

```bash
# For Cloud Run:
gcloud run domain-mappings create \
  --service $SERVICE_NAME \
  --domain api.yourdomain.com \
  --region $REGION

# Follow instructions to update DNS records
```

### 4. Configure SSL/TLS

Cloud Run provides automatic HTTPS. For custom domains:
- Cloud Run: Automatically provisions SSL certificates
- Compute Engine: Use Let's Encrypt with Nginx/Caddy
- GKE: Use cert-manager for automatic certificate management

---

## Monitoring & Maintenance

### 1. View Logs

```bash
# Cloud Run logs
gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50

# Compute Engine logs
gcloud compute ssh logifin-vm --zone=us-central1-a --command="docker compose logs -f backend"

# Or use Cloud Logging in GCP Console
```

### 2. Monitor Performance

```bash
# View Cloud Run metrics
gcloud run services describe $SERVICE_NAME --region $REGION

# Set up alerts in Cloud Monitoring
```

### 3. Database Backups

```bash
# Cloud SQL automatic backups are enabled by default
# Manual backup:
gcloud sql backups create --instance=logifin-db

# List backups:
gcloud sql backups list --instance=logifin-db

# Restore from backup:
gcloud sql backups restore BACKUP_ID --backup-instance=logifin-db
```

### 4. Update Deployment

```bash
# Rebuild and redeploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME
gcloud run deploy $SERVICE_NAME --image gcr.io/$PROJECT_ID/$SERVICE_NAME --region $REGION
```

### 5. Scale Application

```bash
# For Cloud Run (auto-scales):
gcloud run services update $SERVICE_NAME \
  --min-instances 1 \
  --max-instances 20 \
  --region $REGION

# For Compute Engine:
# Create instance group and load balancer
```

---

## Troubleshooting

### Issue: Container fails to start

```bash
# Check logs
gcloud run services logs read $SERVICE_NAME --region $REGION --limit 100

# Common causes:
# - Database connection issues
# - Missing environment variables
# - Port binding issues
```

### Issue: Database connection errors

```bash
# Verify Cloud SQL connection
gcloud sql instances describe logifin-db

# Test connection from Cloud Shell
gcloud sql connect logifin-db --user=postgres --quiet

# Check if Cloud SQL Admin API is enabled
gcloud services list --enabled | grep sqladmin
```

### Issue: Migrations fail

```bash
# SSH into container (Cloud Run)
gcloud run services proxy $SERVICE_NAME --region $REGION

# Or check migration logs in Cloud Logging
```

### Issue: Out of memory errors

```bash
# Increase memory allocation
gcloud run services update $SERVICE_NAME \
  --memory 1Gi \
  --region $REGION
```

### Issue: Slow response times

```bash
# Check Cloud SQL performance
gcloud sql operations list --instance=logifin-db

# Upgrade Cloud SQL tier
gcloud sql instances patch logifin-db --tier=db-g1-small

# Add read replicas for scaling
gcloud sql instances create logifin-db-replica \
  --master-instance-name=logifin-db \
  --tier=db-f1-micro \
  --region=us-central1
```

---

## Cost Optimization

### Cloud Run (Pay per use)
- Minimum instances: 0 (scales to zero when not in use)
- Maximum instances: 10-20 (adjust based on traffic)
- CPU: 1 (sufficient for most workloads)
- Memory: 512Mi (increase if needed)

### Cloud SQL
- Start with db-f1-micro ($10-20/month)
- Upgrade to db-g1-small for production
- Enable automatic storage increases
- Set up maintenance windows

### Best Practices
1. Use Cloud CDN for static assets
2. Implement caching (Redis/Memcached)
3. Use Cloud Storage for file uploads
4. Enable connection pooling
5. Set up autoscaling policies

---

## Security Checklist

- [ ] All secrets stored in Secret Manager (not in code)
- [ ] Database has strong password
- [ ] JWT secret is long and random (64+ characters)
- [ ] Cloud SQL has private IP (recommended for production)
- [ ] Firewall rules restrict access
- [ ] HTTPS enforced (automatic with Cloud Run)
- [ ] Regular backups enabled
- [ ] Monitoring and alerts configured
- [ ] Rate limiting enabled on API
- [ ] CORS configured with allowed origins only

---

## Support & Resources

- **GCP Documentation**: https://cloud.google.com/docs
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Cloud SQL Docs**: https://cloud.google.com/sql/docs
- **Docker Documentation**: https://docs.docker.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

## Quick Commands Reference

```bash
# View service status
gcloud run services list

# View logs (last 50 lines)
gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50

# SSH into VM
gcloud compute ssh logifin-vm --zone=us-central1-a

# Connect to Cloud SQL
gcloud sql connect logifin-db --user=postgres

# Update environment variables
gcloud run services update $SERVICE_NAME \
  --set-env-vars KEY=VALUE \
  --region $REGION

# View all secrets
gcloud secrets list

# Delete resources (cleanup)
gcloud run services delete $SERVICE_NAME --region $REGION
gcloud sql instances delete logifin-db
```

---

**Happy Deploying! 🚀**
