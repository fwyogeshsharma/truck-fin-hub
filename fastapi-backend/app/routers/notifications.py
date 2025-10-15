from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from psycopg2.extras import RealDictCursor
import time
import random
import string

from ..models import NotificationResponse, NotificationCreate
from ..database import get_db_cursor

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(user_id: Optional[str] = Query(None)):
    """Get all notifications or filter by user"""
    with get_db_cursor() as cursor:
        if user_id:
            cursor.execute(
                "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
        else:
            cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC")

        notifications = cursor.fetchall()

    return [dict(notif) for notif in notifications]


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(notification_id: str):
    """Get notification by ID"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM notifications WHERE id = %s", (notification_id,))
        notification = cursor.fetchone()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return dict(notification)


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(notification: NotificationCreate):
    """Create new notification"""
    with get_db_cursor(commit=True) as cursor:
        notif_id = f"notif-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"

        cursor.execute(
            """
            INSERT INTO notifications (id, user_id, title, message, type)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (notif_id, notification.user_id, notification.title, notification.message, notification.type)
        )

        new_notification = cursor.fetchone()

    return dict(new_notification)


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s RETURNING id",
            (notification_id,)
        )
        result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete notification"""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("DELETE FROM notifications WHERE id = %s RETURNING id", (notification_id,))
        result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification deleted successfully"}
