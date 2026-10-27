from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field("TODO")
    priority: str = Field("MEDIUM")
    assigned_agent_id: Optional[str] = None

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Optional[str] = "MEDIUM"
    assigned_agent_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    workflow_run_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    agent_role: Optional[str] = None
    dependencies: Optional[str] = None
    input_context: Optional[str] = None
    output_reference: Optional[str] = None
    attempt_count: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: str
    project_id: str
    workflow_run_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    agent_role: Optional[str] = None
    dependencies: Optional[str] = None
    input_context: Optional[str] = None
    output_reference: Optional[str] = None
    attempt_count: Optional[int] = 0
    started_at: Optional[datetime] = None

    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

