from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class AIRequest(Base):
    __tablename__ = "ai_requests"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, nullable=True)
    agent_role = Column(String, nullable=False)
    task_type = Column(String, nullable=False)
    prompt = Column(String, nullable=False)
    model = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    temperature = Column(Float, default=0.7)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project")
    responses = relationship("AIResponse", back_populates="request", cascade="all, delete-orphan")
