from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from psycopg2.extras import RealDictCursor

from ..models import TransactionResponse
from ..database import get_db_cursor

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _convert_transaction_to_float(txn):
    """Convert transaction numeric fields from Decimal to float"""
    return {
        **txn,
        "amount": float(txn["amount"]),
        "balance_after": float(txn["balance_after"]),
    }


@router.get("/", response_model=list[TransactionResponse])
async def get_transactions():
    """Get all transactions"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM transactions ORDER BY timestamp DESC")
        transactions = cursor.fetchall()

    return [_convert_transaction_to_float(dict(txn)) for txn in transactions]


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str):
    """Get transaction by ID"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM transactions WHERE id = %s", (transaction_id,))
        transaction = cursor.fetchone()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return _convert_transaction_to_float(dict(transaction))


@router.get("/user/{user_id}", response_model=list[TransactionResponse])
async def get_transactions_by_user(
    user_id: str,
    limit: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    """Get transactions by user with optional filters"""
    with get_db_cursor() as cursor:
        if type:
            cursor.execute(
                "SELECT * FROM transactions WHERE user_id = %s AND type = %s ORDER BY timestamp DESC",
                (user_id, type)
            )
        elif category:
            cursor.execute(
                "SELECT * FROM transactions WHERE user_id = %s AND category = %s ORDER BY timestamp DESC",
                (user_id, category)
            )
        elif limit:
            cursor.execute(
                "SELECT * FROM transactions WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s",
                (user_id, limit)
            )
        else:
            cursor.execute(
                "SELECT * FROM transactions WHERE user_id = %s ORDER BY timestamp DESC",
                (user_id,)
            )

        transactions = cursor.fetchall()

    return [_convert_transaction_to_float(dict(txn)) for txn in transactions]
