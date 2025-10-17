# LogiFin - Quick Start Guide

## 🚀 Deploy to Production in 3 Steps

> **Note**: Node.js is NOT required on the host machine. Docker handles all builds!

### 1️⃣ Setup Environment
```bash
# Copy environment template
cp .env.production.example .env

# Generate secure JWT secret (choose one method):
# Method 1: Using openssl (available on most systems)
openssl rand -hex 64

# Method 2: Using Node.js (if you have it installed)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Edit .env and set:
# - DB_PASSWORD (set a strong password)
# - JWT_SECRET (use the generated secret above)
nano .env
```

### 2️⃣ Deploy
```bash
./deploy-prod.sh
```

### 3️⃣ Verify
```bash
./status-prod.sh
```

---

## 📋 Common Commands

| Command | Description |
|---------|-------------|
| `./deploy-prod.sh` | 🚀 Deploy/redeploy application |
| `./stop-prod.sh` | 🛑 Stop all services |
| `./restart-prod.sh` | 🔄 Restart all services |
| `./logs-prod.sh` | 📋 View all logs |
| `./logs-prod.sh backend` | 📋 View backend logs only |
| `./logs-prod.sh postgres` | 📋 View database logs only |
| `./status-prod.sh` | 📊 Check service status |

---

## 🔧 Docker Commands (Manual)

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View status
docker-compose ps

# Rebuild and start
docker-compose up -d --build
```

---

## 🗄️ Database Access

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d logifin

# Create backup
docker-compose exec postgres pg_dump -U postgres logifin > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20250117.sql | docker-compose exec -T postgres psql -U postgres -d logifin
```

---

## 🌐 Access Points

- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **Database**: localhost:5432

---

## 🐛 Troubleshooting

```bash
# View all logs
docker-compose logs

# Check what's wrong
./status-prod.sh

# Complete reset (⚠️ deletes data)
docker-compose down -v
./deploy-prod.sh

# Check if port is in use
netstat -tlnp | grep 3001
```

---

## 📚 Need More Help?

- Full Guide: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- Docker Compose: [docker-compose.yml](./docker-compose.yml)
- Environment: [.env.production.example](./.env.production.example)
