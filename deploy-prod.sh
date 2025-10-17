#!/bin/bash

# ============================================
# LogiFin Production Deployment Script
# ============================================
# This script handles the complete production deployment:
# - Environment validation
# - Docker services (PostgreSQL)
# - Application build
# - Backend server startup
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}🚀 $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# ============================================
# Step 1: Check Prerequisites
# ============================================
print_header "Checking Prerequisites"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    log_info "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi
log_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    log_info "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi
log_success "Docker Compose is installed"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running. Please start Docker first."
    exit 1
fi
log_success "Docker daemon is running"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    log_info "Visit: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
log_success "Node.js is installed (${NODE_VERSION})"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm first."
    exit 1
fi
NPM_VERSION=$(npm -v)
log_success "npm is installed (v${NPM_VERSION})"

# ============================================
# Step 2: Environment Configuration
# ============================================
print_header "Checking Environment Configuration"

# Check if .env file exists
if [ ! -f .env ]; then
    log_warning ".env file not found"
    if [ -f .env.production.example ]; then
        log_info "Copying .env.production.example to .env"
        cp .env.production.example .env
        log_warning "Please update .env with your production values before continuing"
        log_info "Edit .env file and press Enter to continue..."
        read -p ""
    else
        log_error "No .env.production.example found. Cannot create .env file."
        exit 1
    fi
else
    log_success ".env file found"
fi

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
    log_success "Environment variables loaded"
fi

# Check critical environment variables
log_info "Validating critical environment variables..."

MISSING_VARS=0
check_env_var() {
    if [ -z "${!1}" ]; then
        log_error "Missing required environment variable: $1"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        log_success "$1 is set"
    fi
}

check_env_var "DB_PASSWORD"
check_env_var "JWT_SECRET"

if [ $MISSING_VARS -gt 0 ]; then
    log_error "$MISSING_VARS required environment variable(s) missing"
    log_info "Please update your .env file with the required values"
    exit 1
fi

# Warn about default JWT secret
if [ "${JWT_SECRET}" = "your-super-secret-jwt-key-change-in-production-min-32-chars" ]; then
    log_warning "You're using the default JWT_SECRET! This is insecure for production."
    log_info "Generate a secure secret with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ============================================
# Step 3: Install Dependencies
# ============================================
print_header "Installing Dependencies"

if [ ! -d "node_modules" ]; then
    log_info "node_modules not found. Installing dependencies..."
    npm install
    log_success "Dependencies installed"
else
    log_info "node_modules found. Checking for updates..."
    npm ci
    log_success "Dependencies verified"
fi

# ============================================
# Step 4: Build Application
# ============================================
print_header "Building Application"

log_info "Building frontend and backend..."
npm run build

if [ ! -d "dist" ]; then
    log_error "Build failed - dist directory not created"
    exit 1
fi

log_success "Application built successfully"

# ============================================
# Step 5: Stop Existing Services
# ============================================
print_header "Stopping Existing Services"

log_info "Stopping any running services..."
docker-compose down --remove-orphans || true
log_success "Existing services stopped"

# ============================================
# Step 6: Start Docker Services
# ============================================
print_header "Starting Docker Services"

log_info "Starting PostgreSQL database..."
docker-compose up -d postgres

log_info "Waiting for PostgreSQL to be healthy..."
MAX_RETRIES=30
RETRY_COUNT=0

until docker-compose ps postgres | grep -q "healthy" || [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done
echo ""

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    log_error "PostgreSQL failed to start after $MAX_RETRIES attempts"
    log_info "Checking logs..."
    docker-compose logs postgres
    exit 1
fi

log_success "PostgreSQL is healthy and ready"

# ============================================
# Step 7: Start Backend Service
# ============================================
print_header "Starting Backend Service"

log_info "Building and starting backend container..."
docker-compose up -d --build backend

log_info "Waiting for backend to be healthy..."
RETRY_COUNT=0
MAX_RETRIES=40

until docker-compose ps backend | grep -q "healthy" || [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 3
done
echo ""

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    log_error "Backend failed to start after $MAX_RETRIES attempts"
    log_info "Checking logs..."
    docker-compose logs backend
    exit 1
fi

log_success "Backend is healthy and ready"

# ============================================
# Step 8: Deployment Summary
# ============================================
print_header "Deployment Summary"

log_success "LogiFin application deployed successfully!"
echo ""
log_info "Services running:"
docker-compose ps
echo ""
log_info "Backend API: http://localhost:${PORT:-3001}"
log_info "Database: PostgreSQL on localhost:${DB_PORT:-5432}"
echo ""
log_info "Useful commands:"
echo "  - View logs:           docker-compose logs -f"
echo "  - View backend logs:   docker-compose logs -f backend"
echo "  - View database logs:  docker-compose logs -f postgres"
echo "  - Stop services:       docker-compose down"
echo "  - Restart services:    docker-compose restart"
echo "  - View status:         docker-compose ps"
echo ""
log_success "Deployment complete! 🎉"
