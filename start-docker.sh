#!/bin/bash

# Exit on any error
set -e

# Configuration
export COMPOSE_HTTP_TIMEOUT=300

echo "🚀 Starting LogiFin Docker Deployment"
echo "===================================="
echo ""

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Clean up Docker resources
echo "🧹 Cleaning up Docker resources..."
docker system prune -f

# Build and start services
echo ""
echo "🔨 Building and starting services..."
echo "   - PostgreSQL Database"
echo "   - Backend API Server"
echo ""

docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Show logs
echo ""
echo "📋 Recent Logs:"
docker-compose logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Services available at:"
echo "   - Backend API: http://localhost:4000/api"
echo "   - Health Check: http://localhost:4000/api/health"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - View backend logs: docker-compose logs -f backend"
echo "   - View database logs: docker-compose logs -f postgres"
echo "   - Stop services: docker-compose down"
echo "   - Restart backend: docker-compose restart backend"
echo ""
