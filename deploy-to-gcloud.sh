#!/bin/bash

# LogiFin - Google Cloud Deployment Script
# This script automates the deployment to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════╗"
echo "║   LogiFin - Google Cloud Deployment   ║"
echo "╔════════════════════════════════════════╗"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project configured${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Project ID: $PROJECT_ID${NC}"

# Get region (default to us-central1)
REGION=${REGION:-us-central1}
echo -e "${GREEN}✓ Region: $REGION${NC}"

# Get Cloud SQL connection name
echo ""
echo "Fetching Cloud SQL instances..."
INSTANCES=$(gcloud sql instances list --format="value(name)" 2>/dev/null)

if [ -z "$INSTANCES" ]; then
    echo -e "${YELLOW}Warning: No Cloud SQL instances found${NC}"
    echo "You may need to create one first. See DEPLOYMENT.md for instructions."
    CLOUD_SQL_CONNECTION_NAME=""
else
    # Use first instance or let user specify
    FIRST_INSTANCE=$(echo "$INSTANCES" | head -n 1)
    CLOUD_SQL_CONNECTION_NAME="$PROJECT_ID:$REGION:$FIRST_INSTANCE"
    echo -e "${GREEN}✓ Using Cloud SQL instance: $FIRST_INSTANCE${NC}"
    echo -e "  Connection name: $CLOUD_SQL_CONNECTION_NAME"
fi

# Build the image
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Building Docker image..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud builds submit --tag gcr.io/$PROJECT_ID/logifin-backend

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Deploy to Cloud Run
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploying to Cloud Run..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEPLOY_CMD="gcloud run deploy logifin-backend \
  --image gcr.io/$PROJECT_ID/logifin-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3001,DB_PORT=5432,DB_NAME=logifin,DB_USER=postgres \
  --set-secrets DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0"

# Add Cloud SQL connection if available
if [ ! -z "$CLOUD_SQL_CONNECTION_NAME" ]; then
    DEPLOY_CMD="$DEPLOY_CMD \
      --add-cloudsql-instances $CLOUD_SQL_CONNECTION_NAME \
      --set-env-vars DB_HOST=/cloudsql/$CLOUD_SQL_CONNECTION_NAME"
fi

eval $DEPLOY_CMD

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Deployment successful${NC}"

# Get service URL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SERVICE_URL=$(gcloud run services describe logifin-backend \
  --region $REGION \
  --format='value(status.url)')

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/api/health"
echo ""

# Test the health endpoint
echo "Testing health endpoint..."
if curl -f -s "$SERVICE_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Health check failed (this might be temporary)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps:"
echo "1. Test your API: curl $SERVICE_URL/api/health"
echo "2. View logs: gcloud run services logs read logifin-backend --region $REGION"
echo "3. Update frontend to use: $SERVICE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
