from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class LogBase(BaseModel):
    type: str = Field(..., min_length=1)  # INFO, SUCCESS, WARNING, ERROR, etc.
    status: str = Field(..., min_length=1)  # RUNNING, COMPLETED, FAILED, etc.
    action: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    file: Optional[str] = None
    test: Optional[str] = None
    trace_id: str = Field(..., min_length=1)
    correlation_id: str = Field(..., min_length=1)
    timestamp: str = Field(..., min_length=1)  # e.g., "10:41:50"

class LogCreate(LogBase):
    iteration_id: Optional[str] = None
    agent_id: Optional[str] = None
    task_id: Optional[str] = None

class LogResponse(LogBase):
    id: str
    project_id: str
    iteration_id: Optional[str]
    agent_id: Optional[str]
    task_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
