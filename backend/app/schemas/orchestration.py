from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class WorkflowRunStart(BaseModel):
    project_id: str = Field(..., description="Project ID to execute the multi-agent workflow on.")
    requirement: str = Field(..., description="User requirement description to scope and build.")

class WorkflowRunResponse(BaseModel):
    id: str
    project_id: str
    status: str
    current_state: str
    current_agent: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class AgentExecutionResponse(BaseModel):
    id: str
    workflow_run_id: str
    agent_role: str
    task_id: Optional[str] = None
    input_reference: Optional[str] = None
    output_reference: Optional[str] = None
    status: str
    attempt_number: int
    latency_ms: int
    created_at: datetime

    class Config:
        from_attributes = True

class AgentHandoffResponse(BaseModel):
    id: str
    workflow_run_id: str
    from_agent: str
    to_agent: str
    task_id: Optional[str] = None
    payload_reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    comments: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    workflow_run_id: str
    task_id: Optional[str] = None
    status: str
    requested_by: str
    approved_by: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TimelineNode(BaseModel):
    state: str
    status: str # COMPLETED, CURRENT, WAITING, FAILED
    agent_role: Optional[str] = None
    timestamp: str
    message: str

class TimelineResponse(BaseModel):
    run_id: str
    current_state: str
    nodes: List[TimelineNode]
