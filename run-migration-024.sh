#!/bin/bash

# Migration Script for Running Migration 024
# Creates 300+ trips for transporter with lender integration
# File: 024_create_user_trips_with_lender.sql

set -e

echo "🚀  LogiFin Database Migration 024"
echo "====================================="
echo "Creating 300+ trips with complete data synchronization"
echo ""

# Docker container name
CONTAINER_NAME="${POSTGRES_CONTAINER:-logifin-postgres}"
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"

echo "⚙️  Configuration:"
echo "   Container: $CONTAINER_NAME"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌  Error: Docker is not installed"
    echo "Please install Docker Desktop"
    exit 1
fi

# Check if PostgreSQL container is running
echo "🔍  Checking Docker container..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌  Error: PostgreSQL container '${CONTAINER_NAME}' is not running"
    echo "Starting containers with docker-compose..."
    docker-compose up -d