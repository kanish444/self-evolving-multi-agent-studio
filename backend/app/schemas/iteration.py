from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class IterationBase(BaseModel):
    number: int = Field(..., ge=1)
    goal: Optional[str] = Field(None, max_length=1000)
    status: str = Field("PLANNED")

class IterationCreate(BaseModel):
    number: int = Field(..., ge=1)
    goal: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = "PLANNED"

class IterationUpdate(BaseModel):
    goal: Optional[str] = None
    status: Optional[str] = None
    completed_at: Optional[datetime] = None

class IterationResponse(IterationBase):
    id: str
    project_id: str
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
