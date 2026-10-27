from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AgentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: str = Field("OFFLINE")

class AgentUpdateStatus(BaseModel):
    status: str = Field(..., min_length=1)

class AgentResponse(AgentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
