from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from psycopg2.extras import RealDictCursor
import time
import random
import string

from ..models import TripResponse, TripCreate, TripUpdate, BidCreate, DocumentUpload, TripBid
from ..auth import get_current_user
from ..database import get_db_cursor

router = APIRouter(prefix="/trips", tags=["trips"])


def _convert_trip_to_float(trip):
    """Convert trip numeric fields from Decimal to float"""
    result = {
        **trip,
        "distance": float(trip["distance"]),
        "weight": float(trip["weight"]),
        "amount": float(trip["amount"]),
    }
    if trip.get("interest_rate") is not None:
        result["interest_rate"] = float(trip["interest_rate"])
    if trip.get("maturity_days") is not None:
        result["maturity_days"] = int(trip["maturity_days"])
    if trip.get("load_owner_rating") is not None:
        result["load_owner_rating"] = float(trip["load_owner_rating"])
    return result


def _convert_bid_to_float(bid):
    """Convert bid numeric fields from Decimal to float"""
    return {
        **bid,
        "amount": float(bid["amount"]),
        "interest_rate": float(bid["interest_rate"]),
    }


@router.get("/", response_model=list[TripResponse])
async def get_trips(status_filter: Optional[str] = Query(None, alias="status")):
    """Get all trips or filter by status"""
    with get_db_cursor() as cursor:
        if status_filter:
            cursor.execute("SELECT * FROM trips WHERE status = %s ORDER BY created_at DESC", (status_filter,))
        else:
            cursor.execute("SELECT * FROM trips ORDER BY created_at DESC")

        trips = cursor.fetchall()

        # Get all bids for all trips
        cursor.execute("SELECT * FROM trip_bids ORDER BY created_at DESC")
        all_bids = cursor.fetchall()

        # Group bids by trip_id
        bids_by_trip = {}
        for bid in all_bids:
            trip_id = bid["trip_id"]
            if trip_id not in bids_by_trip:
                bids_by_trip[trip_id] = []
            bids_by_trip[trip_id].append(_convert_bid_to_float(dict(bid)))

        # Add bids to trips
        result = []
        for trip in trips:
            trip_dict = _convert_trip_to_float(dict(trip))
            trip_dict["bids"] = bids_by_trip.get(trip["id"])
            result.append(trip_dict)

    return result


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str):
    """Get trip by ID"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM trips WHERE id = %s", (trip_id,))
        trip = cursor.fetchone()

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        # Get bids
        cursor.execute("SELECT * FROM trip_bids WHERE trip_id = %s ORDER BY created_at DESC", (trip_id,))
        bids = cursor.fetchall()

        # Get documents
        cursor.execute("SELECT * FROM trip_documents WHERE trip_id = %s", (trip_id,))
        docs = cursor.fetchall()
        documents = {doc["document_type"]: doc["document_data"] for doc in docs}

        trip_dict = _convert_trip_to_float(dict(trip))
        trip_dict["bids"] = [_convert_bid_to_float(dict(bid)) for bid in bids] if bids else None
        trip_dict["documents"] = documents if documents else None

    return trip_dict


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(trip: TripCreate):
    """Create new trip"""
    with get_db_cursor(commit=True) as cursor:
        trip_id = f"trip-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"

        cursor.execute(
            """
            INSERT INTO trips (
                id, load_owner_id, load_owner_name, load_owner_logo, load_owner_rating,
                client_company, client_logo, origin, destination, distance, load_type,
                weight, amount, interest_rate, maturity_days, risk_level, insurance_status, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING *
            """,
            (
                trip_id, trip.load_owner_id, trip.load_owner_name, trip.load_owner_logo,
                trip.load_owner_rating, trip.client_company, trip.client_logo, trip.origin,
                trip.destination, trip.distance, trip.load_type, trip.weight, trip.amount,
                trip.interest_rate, trip.maturity_days or 30, trip.risk_level or 'low',
                trip.insurance_status
            )
        )

        new_trip = cursor.fetchone()

    return _convert_trip_to_float(dict(new_trip))


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, trip_update: TripUpdate):
    """Update trip"""
    with get_db_cursor(commit=True) as cursor:
        # Check if trip exists
        cursor.execute("SELECT id FROM trips WHERE id = %s", (trip_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Trip not found")

        # Build update query
        fields = []
        values = []
        for field, value in trip_update.model_dump(exclude_unset=True).items():
            if value is not None:
                fields.append(f"{field} = %s")
                values.append(value)

        if not fields:
            # No fields to update, return current trip
            cursor.execute("SELECT * FROM trips WHERE id = %s", (trip_id,))
            trip = cursor.fetchone()
            return _convert_trip_to_float(dict(trip))

        values.append(trip_id)
        query = f"UPDATE trips SET {', '.join(fields)} WHERE id = %s RETURNING *"

        cursor.execute(query, values)
        updated_trip = cursor.fetchone()

    return _convert_trip_to_float(dict(updated_trip))


@router.post("/{trip_id}/bids", response_model=TripBid, status_code=status.HTTP_201_CREATED)
async def add_bid(trip_id: str, bid: BidCreate, current_user: dict = Depends(get_current_user)):
    """Add bid to trip"""
    with get_db_cursor(commit=True) as cursor:
        # Check if trip exists
        cursor.execute("SELECT id FROM trips WHERE id = %s", (trip_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Trip not found")

        bid_id = f"bid-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"

        cursor.execute(
            """
            INSERT INTO trip_bids (id, trip_id, lender_id, lender_name, amount, interest_rate)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (bid_id, trip_id, current_user["user_id"], current_user["name"], bid.amount, bid.interest_rate)
        )

        new_bid = cursor.fetchone()

    return _convert_bid_to_float(dict(new_bid))


@router.get("/{trip_id}/bids", response_model=list[TripBid])
async def get_trip_bids(trip_id: str):
    """Get bids for trip"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM trip_bids WHERE trip_id = %s ORDER BY created_at DESC", (trip_id,))
        bids = cursor.fetchall()

    return [_convert_bid_to_float(dict(bid)) for bid in bids]


@router.post("/{trip_id}/documents")
async def upload_document(trip_id: str, document: DocumentUpload, current_user: dict = Depends(get_current_user)):
    """Upload document for trip"""
    with get_db_cursor(commit=True) as cursor:
        # Check if trip exists
        cursor.execute("SELECT id FROM trips WHERE id = %s", (trip_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Trip not found")

        doc_id = f"doc-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"

        # Delete existing document of same type
        cursor.execute(
            "DELETE FROM trip_documents WHERE trip_id = %s AND document_type = %s",
            (trip_id, document.documentType)
        )

        # Insert new document
        cursor.execute(
            """
            INSERT INTO trip_documents (id, trip_id, document_type, document_data, uploaded_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (doc_id, trip_id, document.documentType, document.documentData, current_user["user_id"])
        )

        new_doc = cursor.fetchone()

    return dict(new_doc)


@router.delete("/{trip_id}")
async def delete_trip(trip_id: str):
    """Delete trip"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("DELETE FROM trips WHERE id = %s RETURNING id", (trip_id,))
        result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Trip not found")

    return {"message": "Trip deleted successfully"}
