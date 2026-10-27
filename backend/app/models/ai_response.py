from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class AIResponse(Base):
    __tablename__ = "ai_responses"

    id = Column(String, primary_key=True, index=True)
    request_id = Column(String, ForeignKey("ai_requests.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    agent_role = Column(String, nullable=False)
    content = Column(String, nullable=True)
    structured_data = Column(String, nullable=True) # JSON-serialized
    model = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    status = Column(String, default="SUCCESS") # SUCCESS, FAILED
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    request = relationship("AIRequest", back_populates="responses")
    project = relationship("Project")
