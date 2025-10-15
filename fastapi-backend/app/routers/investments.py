from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from psycopg2.extras import RealDictCursor
import time
import random
import string

from ..models import InvestmentResponse, InvestmentCreate, InvestmentStatusUpdate
from ..auth import get_current_user
from ..database import get_db_cursor

router = APIRouter(prefix="/investments", tags=["investments"])


def _convert_investment_to_float(inv):
    """Convert investment numeric fields from Decimal to float"""
    return {
        **inv,
        "amount": float(inv["amount"]),
        "interest_rate": float(inv["interest_rate"]),
        "expected_return": float(inv["expected_return"]),
    }


@router.get("/", response_model=list[InvestmentResponse])
async def get_investments():
    """Get all investments"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM investments ORDER BY invested_at DESC")
        investments = cursor.fetchall()

    return [_convert_investment_to_float(dict(inv)) for inv in investments]


@router.get("/{investment_id}", response_model=InvestmentResponse)
async def get_investment(investment_id: str):
    """Get investment by ID"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM investments WHERE id = %s", (investment_id,))
        investment = cursor.fetchone()

    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    return _convert_investment_to_float(dict(investment))


@router.get("/lender/{lender_id}", response_model=list[InvestmentResponse])
async def get_investments_by_lender(lender_id: str):
    """Get investments by lender"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM investments WHERE lender_id = %s ORDER BY invested_at DESC", (lender_id,))
        investments = cursor.fetchall()

    return [_convert_investment_to_float(dict(inv)) for inv in investments]


@router.get("/trip/{trip_id}", response_model=list[InvestmentResponse])
async def get_investments_by_trip(trip_id: str):
    """Get investments by trip"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM investments WHERE trip_id = %s ORDER BY invested_at DESC", (trip_id,))
        investments = cursor.fetchall()

    return [_convert_investment_to_float(dict(inv)) for inv in investments]


@router.post("/", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
async def create_investment(investment: InvestmentCreate):
    """Create new investment"""
    with get_db_cursor(commit=True) as cursor:
        inv_id = f"inv-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"

        cursor.execute(
            """
            INSERT INTO investments (
                id, lender_id, trip_id, amount, interest_rate, expected_return, status, maturity_date
            ) VALUES (%s, %s, %s, %s, %s, %s, 'escrowed', %s)
            RETURNING *
            """,
            (inv_id, investment.lender_id, investment.trip_id, investment.amount,
             investment.interest_rate, investment.expected_return, investment.maturity_date)
        )

        new_investment = cursor.fetchone()

    return _convert_investment_to_float(dict(new_investment))


@router.put("/{investment_id}/status", response_model=InvestmentResponse)
async def update_investment_status(investment_id: str, status_update: InvestmentStatusUpdate):
    """Update investment status"""
    with get_db_cursor(commit=True) as cursor:
        # Check if investment exists
        cursor.execute("SELECT id FROM investments WHERE id = %s", (investment_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Investment not found")

        if status_update.status == "completed":
            cursor.execute(
                "UPDATE investments SET status = %s, completed_at = NOW() WHERE id = %s RETURNING *",
                (status_update.status, investment_id)
            )
        else:
            cursor.execute(
                "UPDATE investments SET status = %s WHERE id = %s RETURNING *",
                (status_update.status, investment_id)
            )

        updated_investment = cursor.fetchone()

    return _convert_investment_to_float(dict(updated_investment))


@router.delete("/{investment_id}")
async def delete_investment(investment_id: str):
    """Delete investment"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("DELETE FROM investments WHERE id = %s RETURNING id", (investment_id,))
        result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Investment not found")

    return {"message": "Investment deleted successfully"}
