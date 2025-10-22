# LogiFin Docker Deployment Guide

## Overview
Your LogiFin project is now configured with a proper Docker setup for production deployment on VM.

## What Was Fixed

### 1. Port Configuration
- **Fixed**: Dockerfile now exposes port `4000` (was `3001`)
- **Fixed**: docker-compose.yml properly maps port `4000:4000`
- **Result**: Backend API is accessible on port 4000

### 2. Docker Compose Configuration
- PostgreSQL database with health checks
- Backend service that waits for database to be ready
- Proper environment variable configuration
- Persistent database storage with volumes

### 3. Startup Scripts
- **start.sh**: Enhanced with automatic database schema initialization
- **start-docker.sh**: Linux/Mac deployment script
- **start-docker.bat**: Windows deployment script

## Quick Start

### Prerequisites
- Docker installed on your VM
- Docker Compose installed
- Port 4000 and 5432 available

### Deployment Steps

#### On Linux/Mac VM:
```bash
# Make the script executable
chmod +x start-docker.sh

# Run the deployment
./start-docker.sh
```

#### On Windows:
```batch
# Just run the batch file
start-docker.bat
```

#### Manual Deployment:
```bash
# Stop any existing containers
docker-compose down

# Clean up
docker system prune -f

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## Configuration

### Environment Variables
Edit `.env.production` for production configuration:

```env
# API Configuration
VITE_API_URL=http://YOUR_VM_IP:4000/api

# Server Configuration
NODE_ENV=production
PORT=4000

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=logifin

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# CORS
ALLOWED_ORIGINS=http://YOUR_VM_IP,http://YOUR_VM_IP:4000
```

**IMPORTANT**:
- Change `YOUR_VM_IP` to your actual VM IP address (e.g., `34.31.185.19`)
- Change `JWT_SECRET` to a secure random string (minimum 32 characters)
- Update `DB_PASSWORD` to a strong password

## Services

### Backend API
- **URL**: http://YOUR_VM_IP:4000/api
- **Health Check**: http://YOUR_VM_IP:4000/api/health
- **Container Name**: logifin-backend

### PostgreSQL Database
- **Host**: localhost (or postgres from within Docker network)
- **Port**: 5432
- **Database**: logifin
- **Container Name**: logifin-postgres

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Container Management
```bash
# Check status
docker-compose ps

# Restart backend
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d logifin

# Run SQL file
docker-compose exec -T postgres psql -U postgres -d logifin < your_script.sql

# Backup database
docker-compose exec postgres pg_dump -U postgres logifin > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d logifin < backup.sql
```

### Debugging
```bash
# Enter backend container shell
docker-compose exec backend sh

# Check backend environment variables
docker-compose exec backend env

# Check if database is ready
docker-compose exec postgres pg_isready -U postgres

# View backend process
docker-compose exec backend ps aux
```

## Database Schema

The database schema is **automatically initialized** when the container starts for the first time:

1. The `start.sh` script checks if the `users` table exists
2. If not found, it runs `src/db/schema.postgres.sql`
3. This creates all necessary tables and indexes

### Manual Schema Creation (if needed)
```bash
# From your host machine
npm run build:server
npx tsx scripts/create-postgres-schema.ts

# Or from inside the container
docker-compose exec backend npx tsx scripts/create-postgres-schema.ts
```

### Running Migrations
```bash
# From your host machine
npm run build:server
npx tsx scripts/run-migrations.ts

# Or from inside the container
docker-compose exec backend npx tsx scripts/run-migrations.ts
```

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait a few seconds and check again
# 2. Port already in use - stop other services on port 4000
# 3. Schema not created - check logs for schema creation errors
```

### Database Connection Issues
```bash
# Verify database is healthy
docker-compose ps

# Should show:
# postgres | running (healthy)

# If unhealthy, check database logs
docker-compose logs postgres
```

### Port Already in Use
```bash
# Windows - Find and kill process
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac - Find and kill process
lsof -ti:4000 | xargs kill -9
```

### Schema Not Created
```bash
# Manually create schema
docker-compose exec backend npx tsx scripts/create-postgres-schema.ts

# Check if tables exist
docker-compose exec postgres psql -U postgres -d logifin -c "\dt"
```

### Reset Everything
```bash
# Stop and remove everything including volumes
docker-compose down -v

# Clean up Docker
docker system prune -af

# Restart
./start-docker.sh
```

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `JWT_SECRET` in `.env.production` to a secure random string
- [ ] Update `DB_PASSWORD` to a strong password
- [ ] Update `ALLOWED_ORIGINS` with your actual frontend URL
- [ ] Update `VITE_API_URL` with your VM's public IP
- [ ] Ensure firewall allows traffic on ports 4000 and 5432
- [ ] Set up SSL/TLS (consider using nginx reverse proxy)
- [ ] Configure automatic backups for PostgreSQL
- [ ] Set up monitoring and logging
- [ ] Test health check endpoint: `http://YOUR_VM_IP:4000/api/health`

## Architecture

```
┌─────────────────────────────────────────────────┐
│                     VM                          │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Docker Network                    │  │
│  │                                           │  │
│  │  ┌────────────────┐  ┌─────────────────┐ │  │
│  │  │   PostgreSQL   │  │    Backend API   │ │  │
│  │  │                │  │                  │ │  │
│  │  │   Port: 5432   │◄─┤   Port: 4000    │ │  │
│  │  │                │  │                  │ │  │
│  │  │   Container:   │  │   Container:     │ │  │
│  │  │   postgres     │  │   backend        │ │  │
│  │  └────────────────┘  └─────────────────┘ │  │
│  │         │                     │           │  │
│  └─────────┼─────────────────────┼───────────┘  │
│            │                     │              │
│            ▼                     ▼              │
│      Volume:                 Exposes:          │
│   postgres_data            Port 4000           │
│                                                 │
└─────────────────────────────────────────────────┘
                                │
                                ▼
                        External Access:
                   http://VM_IP:4000/api
```

## File Structure

```
truck-fin-hub/
├── Dockerfile                    # Backend container configuration
├── docker-compose.yml            # Multi-container orchestration
├── start.sh                      # Container startup script
├── start-docker.sh               # Linux/Mac deployment script
├── start-docker.bat              # Windows deployment script
├── .env.production               # Production environment config
├── server/                       # Backend source code
│   ├── index.ts                 # Main server entry point
│   └── routes/                  # API routes
├── src/
│   └── db/
│       ├── database.ts          # Database connection
│       ├── config.postgres.ts   # PostgreSQL config
│       ├── schema.postgres.sql  # Database schema
│       └── migrations/          # SQL migrations
└── scripts/
    ├── create-postgres-schema.ts
    └── run-migrations.ts
```

## Support

If you encounter any issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose exec backend env`
3. Check database connection: `docker-compose exec postgres pg_isready`
4. Review this guide for troubleshooting steps

---

**Created**: 2025-10-22
**Version**: 1.0
**Status**: Production Ready
