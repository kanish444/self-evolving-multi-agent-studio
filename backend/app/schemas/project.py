from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: str = Field("PLANNING")
    requirements: Optional[str] = None
    architecture_plan: Optional[str] = None
    permissions_granted: Optional[str] = None
    repo_url: Optional[str] = None
    workspace_path: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    requirements: Optional[str] = None
    repo_url: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    current_iteration: Optional[int] = None
    requirements: Optional[str] = None
    architecture_plan: Optional[str] = None
    permissions_granted: Optional[str] = None
    repo_url: Optional[str] = None
    workspace_path: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    current_iteration: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
