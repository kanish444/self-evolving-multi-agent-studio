from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Dict, Optional

class ExecutionFileSchema(BaseModel):
    path: str = Field(..., description="Relative file path in the workspace.")
    content: str = Field(..., description="Source code content.")

class ExecutionRequest(BaseModel):
    project_id: str = Field(..., description="Project ID context.")
    task_id: Optional[str] = Field(None, description="Related Task ID context.")
    workflow_run_id: Optional[str] = Field(None, description="Related Workflow Run ID context.")
    language: str = Field(..., description="Target runtime language (python, javascript, java).")
    files: List[ExecutionFileSchema] = Field(..., description="Files to copy into workspace.")
    entrypoint: str = Field(..., description="Entrypoint script file name.")
    test_command: Optional[str] = Field(None, description="Approved test runner command argument.")
    timeout_seconds: Optional[int] = Field(10, description="Execution timeout limit in seconds.")

class ExecutionResponse(BaseModel):
    id: str
    project_id: str
    task_id: Optional[str] = None
    workflow_run_id: Optional[str] = None
    language: str
    status: str
    entrypoint: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExecutionResultResponse(BaseModel):
    execution_id: str
    exit_code: Optional[int] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    duration_ms: int
    timed_out: bool
    resource_limited: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ExecutionDetailResponse(ExecutionResponse):
    files: List[ExecutionFileSchema] = []
    result: Optional[ExecutionResultResponse] = None

    class Config:
        from_attributes = True
