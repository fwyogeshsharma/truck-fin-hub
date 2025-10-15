from fastapi import APIRouter, HTTPException, status
from psycopg2.extras import RealDictCursor
import time
import random
import string

from ..models import BankAccountResponse, BankAccountCreate, BankAccountUpdate
from ..database import get_db_cursor

router = APIRouter(prefix="/bank-accounts", tags=["bank-accounts"])


@router.get("/user/{user_id}", response_model=list[BankAccountResponse])
async def get_bank_accounts_by_user(user_id: str):
    """Get all bank accounts for a user"""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM bank_accounts WHERE user_id = %s ORDER BY is_primary DESC, created_at DESC",
            (user_id,)
        )
        accounts = cursor.fetchall()

    return [dict(acc) for acc in accounts]


@router.get("/{account_id}", response_model=BankAccountResponse)
async def get_bank_account(account_id: str):
    """Get bank account by ID"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM bank_accounts WHERE id = %s", (account_id,))
        account = cursor.fetchone()

    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    return dict(account)


@router.get("/user/{user_id}/primary", response_model=BankAccountResponse)
async def get_primary_bank_account(user_id: str):
    """Get primary bank account for a user"""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM bank_accounts WHERE user_id = %s AND is_primary = TRUE LIMIT 1",
            (user_id,)
        )
        account = cursor.fetchone()

    if not account:
        raise HTTPException(status_code=404, detail="No primary bank account found")

    return dict(account)


@router.post("/", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_account(account: BankAccountCreate):
    """Create new bank account"""
    with get_db_cursor(commit=True) as cursor:
        # If setting as primary, unset other primary accounts
        if account.is_primary:
            cursor.execute(
                "UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = %s",
                (account.user_id,)
            )

        acc_id = f"ba-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"

        cursor.execute(
            """
            INSERT INTO bank_accounts (
                id, user_id, account_holder_name, account_number, ifsc_code,
                bank_name, account_type, is_primary
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (acc_id, account.user_id, account.account_holder_name, account.account_number,
             account.ifsc_code, account.bank_name, account.account_type, account.is_primary)
        )

        new_account = cursor.fetchone()

    return dict(new_account)


@router.put("/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(account_id: str, account_update: BankAccountUpdate):
    """Update bank account"""
    with get_db_cursor(commit=True) as cursor:
        # Check if account exists
        cursor.execute("SELECT user_id FROM bank_accounts WHERE id = %s", (account_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Bank account not found")

        # If setting as primary, unset other primary accounts
        if account_update.is_primary:
            cursor.execute(
                "UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = %s",
                (result["user_id"],)
            )

        # Build update query
        fields = []
        values = []
        for field, value in account_update.model_dump(exclude_unset=True).items():
            if value is not None:
                fields.append(f"{field} = %s")
                values.append(value)

        if not fields:
            # No fields to update, return current account
            cursor.execute("SELECT * FROM bank_accounts WHERE id = %s", (account_id,))
            account = cursor.fetchone()
            return dict(account)

        values.append(account_id)
        query = f"UPDATE bank_accounts SET {', '.join(fields)} WHERE id = %s RETURNING *"

        cursor.execute(query, values)
        updated_account = cursor.fetchone()

    return dict(updated_account)


@router.put("/{account_id}/verify", response_model=BankAccountResponse)
async def verify_bank_account(account_id: str):
    """Verify bank account"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            "UPDATE bank_accounts SET is_verified = TRUE WHERE id = %s RETURNING *",
            (account_id,)
        )
        account = cursor.fetchone()

    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    return dict(account)


@router.put("/{account_id}/set-primary", response_model=BankAccountResponse)
async def set_primary_bank_account(account_id: str):
    """Set bank account as primary"""
    with get_db_cursor(commit=True) as cursor:
        # Get account
        cursor.execute("SELECT user_id FROM bank_accounts WHERE id = %s", (account_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Bank account not found")

        # Unset other primary accounts
        cursor.execute(
            "UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = %s",
            (result["user_id"],)
        )

        # Set as primary
        cursor.execute(
            "UPDATE bank_accounts SET is_primary = TRUE WHERE id = %s RETURNING *",
            (account_id,)
        )
        account = cursor.fetchone()

    return dict(account)


@router.delete("/{account_id}")
async def delete_bank_account(account_id: str):
    """Delete bank account"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("DELETE FROM bank_accounts WHERE id = %s RETURNING id", (account_id,))
        result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Bank account not found")

    return {"message": "Bank account deleted successfully"}
