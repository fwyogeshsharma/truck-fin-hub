from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from psycopg2.extras import RealDictCursor
import time
import random
import string

from ..models import LoginRequest, TokenResponse, UserCreate, UserResponse
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user
from ..config import settings
from ..database import get_db_cursor

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user"""
    with get_db_cursor(commit=True) as cursor:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s AND deleted_at IS NULL", (user.email,))
        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with email {user.email} already exists"
            )

        # Create new user
        id = f"u-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
        user_id = id
        password_hash = get_password_hash(user.password)

        cursor.execute(
            """
            INSERT INTO users (id, user_id, email, password_hash, name, phone, role, company_name, gst_number)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at
            """,
            (id, user_id, user.email, password_hash, user.name, user.phone, user.role, user.company_name, user.gst_number)
        )

        new_user = cursor.fetchone()

        # Create wallet for user
        cursor.execute(
            """
            INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
            VALUES (%s, 500000, 0, 0, 0, 0)
            """,
            (user_id,)
        )

    return dict(new_user)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """Login user and return JWT token"""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, user_id, email, password_hash, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at FROM users WHERE email = %s AND deleted_at IS NULL",
            (credentials.email,)
        )
        user = cursor.fetchone()

    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )

    # Remove password hash from response
    user_dict = dict(user)
    del user_dict["password_hash"]

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/logout")
async def logout():
    """Logout user (client should delete token)"""
    return {"message": "Successfully logged out"}
