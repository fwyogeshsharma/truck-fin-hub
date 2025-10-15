from fastapi import APIRouter, HTTPException, status, Depends
from psycopg2.extras import RealDictCursor
import time
import random
import string

from ..models import WalletResponse, WalletUpdate, AmountRequest, InvestRequest, ReturnInvestmentRequest
from ..auth import get_current_user
from ..database import get_db_cursor

router = APIRouter(prefix="/wallets", tags=["wallets"])


def _convert_wallet_to_float(wallet):
    """Convert wallet numeric fields from Decimal to float"""
    return {
        **wallet,
        "balance": float(wallet["balance"]),
        "locked_amount": float(wallet["locked_amount"]),
        "escrowed_amount": float(wallet["escrowed_amount"]),
        "total_invested": float(wallet["total_invested"]),
        "total_returns": float(wallet["total_returns"]),
    }


@router.get("/{user_id}", response_model=WalletResponse)
async def get_wallet(user_id: str):
    """Get wallet by user ID"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
        wallet = cursor.fetchone()

        # Create wallet if it doesn't exist
        if not wallet:
            INITIAL_BALANCE = 500000  # ₹5,00,000 starting balance
            cursor.execute(
                """
                INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
                VALUES (%s, %s, 0, 0, 0, 0)
                RETURNING *
                """,
                (user_id, INITIAL_BALANCE)
            )
            wallet = cursor.fetchone()

    return _convert_wallet_to_float(dict(wallet))


@router.put("/{user_id}", response_model=WalletResponse)
async def update_wallet(user_id: str, wallet_update: WalletUpdate):
    """Update wallet"""
    # Ensure wallet exists
    await get_wallet(user_id)

    with get_db_cursor(commit=True) as cursor:
        # Build update query
        fields = []
        values = []
        for field, value in wallet_update.model_dump(exclude_unset=True).items():
            if value is not None:
                fields.append(f"{field} = %s")
                values.append(float(value))

        if not fields:
            # No fields to update, return current wallet
            cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
            wallet = cursor.fetchone()
            return _convert_wallet_to_float(dict(wallet))

        values.append(user_id)
        query = f"UPDATE wallets SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *"

        cursor.execute(query, values)
        wallet = cursor.fetchone()

    return _convert_wallet_to_float(dict(wallet))


@router.post("/{user_id}/add-money", response_model=WalletResponse)
async def add_money(user_id: str, data: AmountRequest):
    """Add money to wallet"""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Valid amount required")

    with get_db_cursor(commit=True) as cursor:
        # Get current wallet
        cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
        wallet = cursor.fetchone()

        # Update balance
        new_balance = float(wallet["balance"]) + data.amount
        cursor.execute(
            "UPDATE wallets SET balance = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *",
            (new_balance, user_id)
        )
        updated_wallet = cursor.fetchone()

        # Create transaction record
        txn_id = f"txn-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
        cursor.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, category, description, balance_after)
            VALUES (%s, %s, 'credit', %s, 'payment', %s, %s)
            """,
            (txn_id, user_id, data.amount, f"Added ₹{data.amount} to wallet", new_balance)
        )

    return _convert_wallet_to_float(dict(updated_wallet))


@router.post("/{user_id}/withdraw", response_model=WalletResponse)
async def withdraw(user_id: str, data: AmountRequest):
    """Withdraw from wallet"""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Valid amount required")

    with get_db_cursor(commit=True) as cursor:
        # Get current wallet
        cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
        wallet = cursor.fetchone()

        if float(wallet["balance"]) < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        # Update balance
        new_balance = float(wallet["balance"]) - data.amount
        cursor.execute(
            "UPDATE wallets SET balance = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *",
            (new_balance, user_id)
        )
        updated_wallet = cursor.fetchone()

        # Create transaction record
        txn_id = f"txn-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
        cursor.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, category, description, balance_after)
            VALUES (%s, %s, 'debit', %s, 'withdrawal', %s, %s)
            """,
            (txn_id, user_id, data.amount, f"Withdrawn ₹{data.amount} from wallet", new_balance)
        )

    return _convert_wallet_to_float(dict(updated_wallet))


@router.post("/{user_id}/escrow", response_model=WalletResponse)
async def move_to_escrow(user_id: str, data: AmountRequest):
    """Move money to escrow"""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Valid amount required")

    with get_db_cursor(commit=True) as cursor:
        # Get current wallet
        cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
        wallet = cursor.fetchone()

        if float(wallet["balance"]) < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        # Update wallet
        new_balance = float(wallet["balance"]) - data.amount
        new_escrowed = float(wallet["escrowed_amount"]) + data.amount
        cursor.execute(
            "UPDATE wallets SET balance = %s, escrowed_amount = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *",
            (new_balance, new_escrowed, user_id)
        )
        updated_wallet = cursor.fetchone()

        # Create transaction record
        txn_id = f"txn-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
        cursor.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, category, description, balance_after)
            VALUES (%s, %s, 'debit', %s, 'investment', %s, %s)
            """,
            (txn_id, user_id, data.amount, f"Moved ₹{data.amount} to escrow", new_balance)
        )

    return _convert_wallet_to_float(dict(updated_wallet))


@router.post("/{user_id}/invest", response_model=WalletResponse)
async def invest(user_id: str, data: InvestRequest):
    """Move from escrow to invested"""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Valid amount required")

    with get_db_cursor(commit=True) as cursor:
        # Get current wallet
        cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
        wallet = cursor.fetchone()

        if float(wallet["escrowed_amount"]) < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient escrowed amount")

        # Update wallet
        new_escrowed = float(wallet["escrowed_amount"]) - data.amount
        new_invested = float(wallet["total_invested"]) + data.amount
        cursor.execute(
            "UPDATE wallets SET escrowed_amount = %s, total_invested = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *",
            (new_escrowed, new_invested, user_id)
        )
        updated_wallet = cursor.fetchone()

        # Create transaction record
        txn_id = f"txn-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
        description = f"Invested ₹{data.amount} in trip {data.tripId}" if data.tripId else f"Invested ₹{data.amount}"
        cursor.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, category, description, balance_after)
            VALUES (%s, %s, 'debit', %s, 'investment', %s, %s)
            """,
            (txn_id, user_id, data.amount, description, float(wallet["balance"]))
        )

    return _convert_wallet_to_float(dict(updated_wallet))


@router.post("/{user_id}/return", response_model=WalletResponse)
async def return_investment(user_id: str, data: ReturnInvestmentRequest):
    """Return investment with returns"""
    if data.principal <= 0:
        raise HTTPException(status_code=400, detail="Valid principal amount required")

    with get_db_cursor(commit=True) as cursor:
        # Get current wallet
        cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
        wallet = cursor.fetchone()

        # Update wallet
        new_balance = float(wallet["balance"]) + data.principal + data.returns
        new_invested = float(wallet["total_invested"]) - data.principal
        new_returns = float(wallet["total_returns"]) + data.returns
        cursor.execute(
            "UPDATE wallets SET balance = %s, total_invested = %s, total_returns = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *",
            (new_balance, new_invested, new_returns, user_id)
        )
        updated_wallet = cursor.fetchone()

        # Create transaction record
        txn_id = f"txn-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
        cursor.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, category, description, balance_after)
            VALUES (%s, %s, 'credit', %s, 'return', %s, %s)
            """,
            (txn_id, user_id, data.principal + data.returns, f"Investment returned: ₹{data.principal} + ₹{data.returns} returns", new_balance)
        )

    return _convert_wallet_to_float(dict(updated_wallet))
