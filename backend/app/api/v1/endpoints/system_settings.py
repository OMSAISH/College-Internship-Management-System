from typing import Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.deps import require_admin
from backend.app.models.user import User
from backend.app.models.system_setting import SystemSetting
from backend.app.schemas.system_setting import SystemSettingResponse, SystemSettingUpdate
from backend.app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("", response_model=List[SystemSettingResponse])
def get_system_settings(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve platform configuration settings."""
    settings = db.query(SystemSetting).all()
    if not settings:
        # Seed defaults
        defaults = [
            ("ACADEMIC_YEAR", "2025-2026", "Current active academic session"),
            ("MIN_GPA_THRESHOLD", "2.0", "Minimum GPA to apply for internships"),
            ("MAX_ACTIVE_APPLICATIONS_PER_STUDENT", "10", "Maximum concurrent active applications"),
            ("INTERVIEW_NOTICE_MIN_HOURS", "24", "Minimum hours required before interview schedule"),
            ("ALLOW_STUDENT_COMPANY_RATINGS", "true", "Enable students to submit company reviews")
        ]
        for key, val, descr in defaults:
            s = SystemSetting(key=key, value=val, description=descr)
            db.add(s)
        db.commit()
        settings = db.query(SystemSetting).all()
    return settings

@router.put("/{key}", response_model=SystemSettingResponse)
def update_system_setting(
    key: str,
    setting_in: SystemSettingUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Update a specific platform setting."""
    s = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not s:
        s = SystemSetting(key=key, value=setting_in.value, description=setting_in.description)
        db.add(s)
    else:
        s.value = setting_in.value
        if setting_in.description:
            s.description = setting_in.description
        s.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(s)

    log_audit_event(
        db=db,
        action="UPDATE_SETTING",
        entity_type="SYSTEM_SETTING",
        entity_id=s.id,
        user=current_user,
        details=f"Updated setting {key} = {s.value}"
    )

    return s
