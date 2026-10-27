from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TestResultBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field("RUNNING")
    expected_result: Optional[str] = Field(None, max_length=1000)
    actual_result: Optional[str] = Field(None, max_length=1000)
    error_message: Optional[str] = Field(None, max_length=2000)
    duration: Optional[str] = Field(None, max_length=50)

class TestResultCreate(TestResultBase):
    task_id: Optional[str] = None
    iteration_id: Optional[str] = None

class TestResultResponse(TestResultBase):
    id: str
    project_id: str
    task_id: Optional[str]
    iteration_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
