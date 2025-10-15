# TruckFin Hub - FastAPI Backend

A complete FastAPI backend implementation for the TruckFin Hub logistics financing platform.

## Features

- **Complete REST API** - All endpoints from the original Express.js backend
- **PostgreSQL Database** - Full support with automatic numeric type conversion
- **JWT Authentication** - Secure token-based authentication
- **Auto-generated Documentation** - Interactive API docs at `/docs`
- **Type Safety** - Pydantic models for request/response validation
- **CORS Support** - Configured for frontend integration

## Project Structure

```
fastapi-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection & utilities
│   ├── models.py            # Pydantic models
│   ├── auth.py              # Authentication utilities
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Auth endpoints (register, login)
│       ├── users.py         # User management
│       ├── wallets.py       # Wallet operations
│       ├── trips.py         # Trip management
│       ├── investments.py   # Investment operations
│       ├── transactions.py  # Transaction history
│       ├── notifications.py # Notifications
│       └── bank_accounts.py # Bank account management
├── .env                     # Environment variables
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd fastapi-backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Update `.env` file with your database credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/logifin
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Start the Server

**Development Mode (with auto-reload):**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Production Mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Access the API

- **API Base URL:** http://localhost:8000/api
- **Interactive Docs:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (with optional role filter)
- `GET /api/users/{user_id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `GET /api/users/userId/{userId}` - Get user by userId
- `PUT /api/users/{user_id}` - Update user
- `PUT /api/users/{user_id}/password` - Update password
- `DELETE /api/users/{user_id}` - Delete user (soft delete)

### Wallets
- `GET /api/wallets/{user_id}` - Get wallet
- `PUT /api/wallets/{user_id}` - Update wallet
- `POST /api/wallets/{user_id}/add-money` - Add money to wallet
- `POST /api/wallets/{user_id}/withdraw` - Withdraw from wallet
- `POST /api/wallets/{user_id}/escrow` - Move money to escrow
- `POST /api/wallets/{user_id}/invest` - Move from escrow to invested
- `POST /api/wallets/{user_id}/return` - Return investment with returns

### Trips
- `GET /api/trips` - Get all trips (with optional status filter)
- `GET /api/trips/{trip_id}` - Get trip by ID
- `POST /api/trips` - Create new trip
- `PUT /api/trips/{trip_id}` - Update trip
- `POST /api/trips/{trip_id}/bids` - Add bid to trip (requires auth)
- `GET /api/trips/{trip_id}/bids` - Get bids for trip
- `POST /api/trips/{trip_id}/documents` - Upload document (requires auth)
- `DELETE /api/trips/{trip_id}` - Delete trip

### Investments
- `GET /api/investments` - Get all investments
- `GET /api/investments/{investment_id}` - Get investment by ID
- `GET /api/investments/lender/{lender_id}` - Get investments by lender
- `GET /api/investments/trip/{trip_id}` - Get investments by trip
- `POST /api/investments` - Create new investment
- `PUT /api/investments/{investment_id}/status` - Update investment status
- `DELETE /api/investments/{investment_id}` - Delete investment

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/{transaction_id}` - Get transaction by ID
- `GET /api/transactions/user/{user_id}` - Get transactions by user (with optional filters)

### Notifications
- `GET /api/notifications` - Get all notifications (with optional user filter)
- `GET /api/notifications/{notification_id}` - Get notification by ID
- `POST /api/notifications` - Create new notification
- `PUT /api/notifications/{notification_id}/read` - Mark as read
- `DELETE /api/notifications/{notification_id}` - Delete notification

### Bank Accounts
- `GET /api/bank-accounts/user/{user_id}` - Get bank accounts by user
- `GET /api/bank-accounts/{account_id}` - Get bank account by ID
- `GET /api/bank-accounts/user/{user_id}/primary` - Get primary bank account
- `POST /api/bank-accounts` - Create new bank account
- `PUT /api/bank-accounts/{account_id}` - Update bank account
- `PUT /api/bank-accounts/{account_id}/verify` - Verify bank account
- `PUT /api/bank-accounts/{account_id}/set-primary` - Set as primary
- `DELETE /api/bank-accounts/{account_id}` - Delete bank account

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by calling the login endpoint:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## Key Features

### Automatic Numeric Conversion
All numeric fields (amounts, balances, rates, etc.) are automatically converted from PostgreSQL NUMERIC type to Python float, ensuring correct mathematical operations.

### Connection Pooling
Uses psycopg2 connection pooling for efficient database connections.

### Data Validation
Pydantic models provide automatic request/response validation with helpful error messages.

### Interactive Documentation
FastAPI automatically generates OpenAPI documentation with a built-in testing interface.

## Testing

You can test the API using:

1. **Interactive Docs:** Visit http://localhost:8000/docs
2. **cURL:** Use command line requests
3. **Postman/Insomnia:** Import the OpenAPI schema from `/openapi.json`

Example cURL request:
```bash
curl -X GET http://localhost:8000/api/health
```

## Database

The application connects to the same PostgreSQL database as the Node.js backend. No schema changes are required.

### Database Configuration

Ensure your PostgreSQL database is running and accessible:
- Host: localhost
- Port: 5432
- Database: logifin
- Username: postgres
- Password: postgres

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing key | Required |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time | 30 |

## Production Deployment

For production deployment:

1. Change `SECRET_KEY` to a strong random value
2. Use environment variables instead of `.env` file
3. Enable HTTPS
4. Use a production WSGI server (uvicorn with workers)
5. Set up proper logging
6. Configure database connection pooling limits

Example production command:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --no-access-log
```

## Differences from Node.js Backend

The FastAPI backend provides the same functionality with these improvements:

1. **Type Safety** - Pydantic models ensure type correctness
2. **Auto Documentation** - OpenAPI docs generated automatically
3. **Better Performance** - FastAPI is one of the fastest Python frameworks
4. **Async Support** - Native async/await support (though we use sync database operations)
5. **Clear Error Messages** - Better validation error responses

## Troubleshooting

**Database Connection Error:**
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Ensure database exists

**Import Errors:**
- Run `pip install -r requirements.txt`
- Check Python version (3.10+ recommended)

**Port Already in Use:**
- Change port: `uvicorn app.main:app --port 8001`
- Or kill process using port 8000

## License

Same as the main TruckFin Hub project.
