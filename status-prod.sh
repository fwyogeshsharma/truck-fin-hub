#!/bin/bash

# ============================================
# LogiFin Production Status Script
# ============================================
# This script shows the status of production services
# ============================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 LogiFin Service Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Show running containers
log_info "Service Status:"
docker-compose ps
echo ""

# Show resource usage
log_info "Resource Usage:"
docker stats --no-stream $(docker-compose ps -q) 2>/dev/null || echo "No containers running"
echo ""

# Check if services are responding
log_info "Health Checks:"

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

PORT=${PORT:-3001}

# Check backend API
if curl -s -f "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
    log_success "Backend API is responding at http://localhost:${PORT}"
else
    echo "❌ Backend API is not responding"
fi

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U "${DB_USER:-postgres}" > /dev/null 2>&1; then
    log_success "PostgreSQL database is ready"
else
    echo "❌ PostgreSQL database is not ready"
fi

echo ""
