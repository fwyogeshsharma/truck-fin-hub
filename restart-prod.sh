#!/bin/bash

# ============================================
# LogiFin Production Restart Script
# ============================================
# This script restarts all production services
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
echo -e "${BLUE}🔄 Restarting LogiFin Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

log_info "Restarting all services..."
docker-compose restart

log_success "All services restarted"
echo ""
log_info "View logs with: docker-compose logs -f"
echo ""
