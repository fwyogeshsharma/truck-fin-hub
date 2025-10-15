from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from psycopg2.extras import RealDictCursor

from ..models import UserResponse, UserUpdate
from ..auth import get_current_user, get_password_hash
from ..database import get_db_cursor

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
async def get_users(role: Optional[str] = Query(None)):
    """Get all users or filter by role"""
    with get_db_cursor() as cursor:
        if role:
            cursor.execute(
                "SELECT id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at FROM users WHERE role = %s AND deleted_at IS NULL ORDER BY created_at DESC",
                (role,)
            )
        else:
            cursor.execute(
                "SELECT id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC"
            )

        users = cursor.fetchall()

    return [dict(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at FROM users WHERE id = %s AND deleted_at IS NULL",
            (user_id,)
        )
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return dict(user)


@router.get("/email/{email}", response_model=UserResponse)
async def get_user_by_email(email: str):
    """Get user by email"""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at FROM users WHERE email = %s AND deleted_at IS NULL",
            (email,)
        )
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return dict(user)


@router.get("/userId/{userId}", response_model=UserResponse)
async def get_user_by_user_id(userId: str):
    """Get user by userId"""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at FROM users WHERE user_id = %s AND deleted_at IS NULL",
            (userId,)
        )
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return dict(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate):
    """Update user"""
    with get_db_cursor(commit=True) as cursor:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND deleted_at IS NULL", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        # Build update query
        fields = []
        values = []
        for field, value in user_update.model_dump(exclude_unset=True).items():
            if value is not None:
                fields.append(f"{field} = %s")
                values.append(value)

        if not fields:
            # No fields to update, return current user
            cursor.execute(
                "SELECT id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at FROM users WHERE id = %s",
                (user_id,)
            )
            return dict(cursor.fetchone())

        values.append(user_id)
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = %s RETURNING id, user_id, email, name, phone, role, company_name, gst_number, kyc_status, is_active, created_at"

        cursor.execute(query, values)
        updated_user = cursor.fetchone()

    return dict(updated_user)


@router.put("/{user_id}/password")
async def update_password(user_id: str, data: dict):
    """Update user password"""
    new_password = data.get("newPassword")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required")

    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT id FROM users WHERE id = %s AND deleted_at IS NULL", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        password_hash = get_password_hash(new_password)
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, user_id))

    return {"message": "Password updated successfully"}


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Soft delete user"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            "UPDATE users SET deleted_at = NOW() WHERE id = %s AND deleted_at IS NULL RETURNING id",
            (user_id,)
        )
        result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}
