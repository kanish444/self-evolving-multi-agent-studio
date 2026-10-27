from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AIRequestHistoryResponse(BaseModel):
    id: str
    project_id: str
    user_id: Optional[str] = None
    agent_role: str
    task_type: str
    prompt: str
    model: str
    provider: str
    temperature: float
    created_at: datetime

    class Config:
        from_attributes = True

class AIResponseHistoryResponse(BaseModel):
    id: str
    request_id: str
    project_id: str
    agent_role: str
    content: Optional[str] = None
    structured_data: Optional[str] = None
    model: str
    provider: str
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    latency_ms: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
