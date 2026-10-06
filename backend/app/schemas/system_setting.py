from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

class SystemSettingResponse(SystemSettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
