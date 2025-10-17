#!/bin/bash

# ============================================
# LogiFin Production Logs Script
# ============================================
# This script displays logs from production services
# ============================================

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📋 LogiFin Service Logs${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if a specific service is requested
if [ -z "$1" ]; then
    echo "📋 Showing logs for all services (press Ctrl+C to exit)"
    echo ""
    docker-compose logs -f --tail=100
else
    echo "📋 Showing logs for: $1 (press Ctrl+C to exit)"
    echo ""
    docker-compose logs -f --tail=100 "$1"
fi
