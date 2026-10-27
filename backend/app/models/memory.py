from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Memory(Base):
    __tablename__ = "memories"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)  # ARCHITECTURE, CODING, TESTING, DEBUGGING, SECURITY, PERFORMANCE, WORKFLOW
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)  # Maps to description
    source = Column(String, nullable=True)  # Maps to sourceAgent
    confidence = Column(Float, default=0.95)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Frontend UI compatibility fields
    importance = Column(String, default="Medium")  # Critical, High, Medium, Low
    status = Column(String, default="Verified")  # Verified, Draft, Archived
    tags = Column(String, nullable=True)  # Comma-separated list
    related_failures = Column(String, nullable=True)  # Comma-separated list
    related_agents = Column(String, nullable=True)  # Comma-separated list
    used_in_count = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    impact_score = Column(String, nullable=True)
    usage_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    last_used = Column(String, nullable=True)
    iteration = Column(String, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="memories")
