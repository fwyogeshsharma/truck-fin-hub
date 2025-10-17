#!/bin/bash

# ============================================
# LogiFin Production Stop Script
# ============================================
# This script stops all production services
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

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🛑 Stopping LogiFin Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

log_info "Stopping all services..."
docker-compose down

log_success "All services stopped"
echo ""
log_info "To remove volumes (delete database data), run:"
echo "  docker-compose down -v"
echo ""
