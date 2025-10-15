# FastAPI Backend - Installation Guide

## Prerequisites

1. **Python 3.10 or higher** - Download from https://www.python.org/downloads/
2. **PostgreSQL** - Should already be installed and running for your project
3. **pip** - Usually comes with Python

## Installation Steps

### Step 1: Verify Python Installation

Open Command Prompt (Windows) or Terminal (Mac/Linux) and run:

```bash
python --version
# or
python3 --version
```

You should see Python 3.10 or higher.

### Step 2: Navigate to the FastAPI Backend Directory

```bash
cd D:\Projects\truck-fin-hub\fastapi-backend
```

### Step 3: Create a Virtual Environment (Recommended)

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI - Web framework
- Uvicorn - ASGI server
- psycopg2-binary - PostgreSQL adapter
- Pydantic - Data validation
- python-jose - JWT handling
- passlib - Password hashing
- And other dependencies

### Step 5: Configure Environment Variables

Edit the `.env` file and update if needed:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/logifin
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Step 6: Start the Server

**Option 1: Using the batch file (Windows)**
```bash
start.bat
```

**Option 2: Using the shell script (Mac/Linux)**
```bash
chmod +x start.sh
./start.sh
```

**Option 3: Direct command**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 7: Verify Installation

Open your browser and visit:
- API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/api/health

You should see the interactive API documentation.

## Testing the API

### 1. Health Check
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\",\"role\":\"lender\"}"
```

### 3. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Save the `access_token` from the response.

### 4. Get Current User (with authentication)
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5. Get Wallet
```bash
curl http://localhost:8000/api/wallets/USER_ID_HERE
```

### 6. Get All Trips
```bash
curl http://localhost:8000/api/trips
```

## Troubleshooting

### Issue: `pip: command not found`

**Solution:** Make sure Python is added to your PATH, or use:
```bash
python -m pip install -r requirements.txt
```

### Issue: `ModuleNotFoundError`

**Solution:** Make sure you're in the virtual environment and all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: Database connection error

**Solution:**
1. Check if PostgreSQL is running
2. Verify the DATABASE_URL in `.env` file
3. Test connection: `psql -U postgres -d logifin`

### Issue: Port 8000 already in use

**Solution:** Change the port:
```bash
uvicorn app.main:app --reload --port 8001
```

### Issue: CORS errors in browser

**Solution:** The CORS middleware is configured for `localhost:5173` and `localhost:3000`. If your frontend runs on a different port, update `app/main.py`:

```python
allow_origins=["http://localhost:YOUR_PORT"],
```

## Running Both Servers

You can run both the Node.js backend (port 3001) and FastAPI backend (port 8000) simultaneously:

**Terminal 1 - Node.js Backend:**
```bash
cd D:\Projects\truck-fin-hub
npm run dev:server
```

**Terminal 2 - FastAPI Backend:**
```bash
cd D:\Projects\truck-fin-hub\fastapi-backend
uvicorn app.main:app --reload --port 8000
```

Your frontend can connect to either backend by changing the API base URL.

## Switching Frontend to FastAPI

To use the FastAPI backend with your frontend:

1. Update the API base URL in your frontend config
2. Change from `http://localhost:3001/api` to `http://localhost:8000/api`
3. The endpoints and responses are identical

Example in your frontend code:
```javascript
// Before
const API_BASE_URL = 'http://localhost:3001/api';

// After
const API_BASE_URL = 'http://localhost:8000/api';
```

## Production Deployment

For production, use:

```bash
pip install gunicorn

# Run with multiple workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Or use Docker:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Next Steps

1. Explore the interactive API docs at http://localhost:8000/docs
2. Test all endpoints using the built-in testing interface
3. Update your frontend to connect to the FastAPI backend
4. Compare performance between Node.js and FastAPI backends

## Support

If you encounter any issues:
1. Check the terminal for error messages
2. Verify all dependencies are installed
3. Ensure PostgreSQL is running and accessible
4. Check the `.env` file configuration

Enjoy your new FastAPI backend! 🚀
