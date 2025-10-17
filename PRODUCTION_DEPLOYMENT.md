# LogiFin Production Deployment Guide

This guide will help you deploy LogiFin to production using Docker and Docker Compose.

## 📋 Prerequisites

Before deploying, ensure you have the following installed:

- **Docker** (version 20.10+) - **REQUIRED**
- **Docker Compose** (version 2.0+) - **REQUIRED**
- **Node.js** (version 18+) - **OPTIONAL** (only for local development)
- **npm** (version 8+) - **OPTIONAL** (only for local development)

> **Important**: Node.js is NOT required on the host machine for production deployment. Docker will handle all building and running of the application. Node.js is only needed if you want to run the application locally for development.

### Installing Prerequisites

#### Docker (Required)
- **Linux**: Follow [Docker installation guide](https://docs.docker.com/engine/install/)
- **macOS**: Install [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: Install [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/)

#### Node.js (Optional)
- Download from [nodejs.org](https://nodejs.org/) or use a version manager like `nvm`
- Only needed for local development, not for Docker-based production deployment

## 🚀 Quick Start

### 1. Configure Environment Variables

```bash
# Copy the production example file
cp .env.production.example .env

# Edit the .env file with your production values
nano .env  # or use your preferred editor
```

**Critical variables to update:**
- `DB_PASSWORD` - Set a strong database password
- `JWT_SECRET` - Generate with:
  - Using openssl: `openssl rand -hex 64`
  - Or using Node.js (if installed): `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `SMTP_*` - Configure your email service (optional)

### 2. Deploy the Application

```bash
# Run the deployment script
./deploy-prod.sh
```

This script will:
- ✅ Check all prerequisites (Docker, Docker Compose)
- ✅ Validate environment configuration
- ✅ Build the application (inside Docker containers)
- ✅ Start PostgreSQL database
- ✅ Run database migrations
- ✅ Start the backend server

> **Note**: The script builds everything inside Docker, so you don't need Node.js installed on your host machine!

### 3. Verify Deployment

```bash
# Check service status
./status-prod.sh

# View logs
./logs-prod.sh

# Or view specific service logs
./logs-prod.sh backend
./logs-prod.sh postgres
```

## 📦 Available Scripts

### `./deploy-prod.sh`
**Complete deployment script**
- Performs full deployment from scratch
- Checks prerequisites and validates environment
- Builds and starts all services
- **Use this for initial deployment**

### `./stop-prod.sh`
**Stop all services**
```bash
./stop-prod.sh
```

### `./restart-prod.sh`
**Restart all services**
```bash
./restart-prod.sh
```

### `./logs-prod.sh`
**View service logs**
```bash
# View all logs
./logs-prod.sh

# View specific service logs
./logs-prod.sh backend
./logs-prod.sh postgres
```

### `./status-prod.sh`
**Check service status and health**
```bash
./status-prod.sh
```

## 🔧 Manual Docker Commands

If you prefer to use Docker Compose directly:

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Rebuild and restart
docker-compose up -d --build
```

## 🗄️ Database Management

### Access PostgreSQL Database

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d logifin

# Run SQL from file
docker-compose exec -T postgres psql -U postgres -d logifin < backup.sql

# Create backup
docker-compose exec postgres pg_dump -U postgres logifin > backup.sql
```

### Database Migrations

Migrations run automatically during deployment. To run manually:

```bash
docker-compose exec backend node dist/scripts/run-migrations.js
```

## 📊 Monitoring

### View Container Stats

```bash
docker stats $(docker-compose ps -q)
```

### Check Container Health

```bash
docker-compose ps
```

### View Detailed Logs

```bash
# Last 100 lines, follow new logs
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f --tail=100 backend
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` from default value
- [ ] Set a strong `DB_PASSWORD`
- [ ] Update `ALLOWED_ORIGINS` with your domain
- [ ] Configure SMTP settings for email
- [ ] Disable `ENABLE_SWAGGER` in production
- [ ] Set `ENABLE_DEBUG_LOGS=false`
- [ ] Review and update all default passwords
- [ ] Set up SSL/TLS termination (nginx/traefik)
- [ ] Configure firewall rules
- [ ] Set up backup strategy

## 🌐 Production Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network                   │
│  ┌────────────────────────────────────┐ │
│  │  Backend Container                 │ │
│  │  - Node.js 20                      │ │
│  │  - Express API                     │ │
│  │  - Port: 3001                      │ │
│  └────────────┬───────────────────────┘ │
│               │                          │
│  ┌────────────▼───────────────────────┐ │
│  │  PostgreSQL Container              │ │
│  │  - PostgreSQL 16                   │ │
│  │  - Port: 5432                      │ │
│  │  - Persistent Volume               │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔄 Update/Redeploy

To update the application with new code:

```bash
# Pull latest code
git pull origin main

# Redeploy
./deploy-prod.sh
```

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
docker info

# Check logs for errors
docker-compose logs

# Remove containers and retry
docker-compose down -v
./deploy-prod.sh
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

### Backend API Not Responding

```bash
# Check backend logs
docker-compose logs backend

# Check backend container status
docker-compose ps backend

# Restart backend
docker-compose restart backend
```

### Port Already in Use

```bash
# Check what's using the port
netstat -tlnp | grep 3001

# Update PORT in .env file
# Or stop the conflicting service
```

## 📈 Performance Tuning

### Optimize PostgreSQL

Edit `docker-compose.yml` to add PostgreSQL tuning:

```yaml
postgres:
  command: >
    postgres
    -c shared_buffers=256MB
    -c max_connections=200
    -c effective_cache_size=1GB
```

### Scale Backend

```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3
```

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

## 🔒 Backup Strategy

### Automated Backups

Create a backup script:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U postgres logifin > "$BACKUP_DIR/logifin_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/logifin_$DATE.sql"

echo "Backup created: $BACKUP_DIR/logifin_$DATE.sql.gz"
```

### Restore from Backup

```bash
# Stop services
./stop-prod.sh

# Remove volumes
docker-compose down -v

# Start database
docker-compose up -d postgres

# Wait for database to be ready
sleep 10

# Restore backup
gunzip -c backups/logifin_20250117_120000.sql.gz | \
  docker-compose exec -T postgres psql -U postgres -d logifin

# Start all services
./deploy-prod.sh
```

## 🌐 Reverse Proxy Setup (Nginx)

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📞 Support

For issues or questions:
- Check logs: `./logs-prod.sh`
- View status: `./status-prod.sh`
- Review Docker Compose logs: `docker-compose logs`

## 📝 Environment Variables Reference

See `.env.production.example` for a complete list of available configuration options.

### Required Variables
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret (min 32 chars)

### Optional Variables
- `PORT` - API server port (default: 3001)
- `DB_HOST` - Database host (default: postgres)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database user (default: postgres)
- `DB_NAME` - Database name (default: logifin)
- `SMTP_*` - Email configuration
- `ALLOWED_ORIGINS` - CORS allowed origins
- `ENABLE_SWAGGER` - Enable API documentation
- `LOG_LEVEL` - Logging level (info, debug, error)

## 🎉 Success!

Once deployed successfully, your API will be available at:
- **API**: `http://localhost:3001/api`
- **Health Check**: `http://localhost:3001/api/health`

For frontend deployment, build with:
```bash
npm run build
```

The built frontend will be in `dist/` directory and can be served with any static file server.
