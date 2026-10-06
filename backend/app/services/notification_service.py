from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.notification import Notification, NotificationCategory

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    link: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        link=link,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
