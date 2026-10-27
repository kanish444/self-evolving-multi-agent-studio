from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class MemoryBase(BaseModel):
    category: str = Field(..., min_length=1)  # ARCHITECTURE, CODING, TESTING, etc.
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)  # description
    source: Optional[str] = None  # sourceAgent
    confidence: Optional[float] = 0.95
    importance: Optional[str] = "Medium"
    status: Optional[str] = "Verified"
    tags: Optional[str] = None  # Comma-separated list in database
    related_failures: Optional[str] = None  # Comma-separated list in database
    related_agents: Optional[str] = None  # Comma-separated list in database
    used_in_count: Optional[int] = 0
    success_rate: Optional[float] = 0.0
    impact_score: Optional[str] = None
    usage_count: Optional[int] = 0
    success_count: Optional[int] = 0
    last_used: Optional[str] = None
    iteration: Optional[str] = None

class MemoryCreate(MemoryBase):
    pass

class MemoryUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    source: Optional[str] = None
    confidence: Optional[float] = None
    importance: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[str] = None
    related_failures: Optional[str] = None
    related_agents: Optional[str] = None
    used_in_count: Optional[int] = None
    success_rate: Optional[float] = None
    impact_score: Optional[str] = None
    usage_count: Optional[int] = None
    success_count: Optional[int] = None
    last_used: Optional[str] = None
    iteration: Optional[str] = None

class MemoryResponse(MemoryBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
