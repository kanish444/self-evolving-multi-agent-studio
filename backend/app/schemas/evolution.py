from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class EvolutionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    problem: str = Field(..., min_length=1)
    solution: str = Field(..., min_length=1)
    learning: str = Field(..., min_length=1)
    confidence: str = Field("HIGH")

class EvolutionCreate(EvolutionBase):
    iteration_id: str = Field(..., min_length=1)

class EvolutionResponse(EvolutionBase):
    id: str
    project_id: str
    iteration_id: str
    created_at: datetime

    class Config:
        from_attributes = True
