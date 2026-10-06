from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.database import get_db
from backend.app.core.deps import require_admin
from backend.app.models.user import User
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.audit_log import AuditLogResponse

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Institutional Admin: Inspect audit trails and security logs."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    return logs
