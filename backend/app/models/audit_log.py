from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from backend.app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, UPDATE_PROFILE, STATUS_CHANGE, etc.
    entity_type = Column(String(100), nullable=False, index=True) # USER, APPLICATION, INTERVIEW, etc.
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
