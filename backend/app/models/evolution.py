from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Evolution(Base):
    __tablename__ = "evolutions"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    iteration_id = Column(String, ForeignKey("iterations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    problem = Column(String, nullable=False)
    solution = Column(String, nullable=False)
    learning = Column(String, nullable=False)
    confidence = Column(String, default="HIGH")  # HIGH, MEDIUM, LOW
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="evolutions")
    iteration = relationship("Iteration", back_populates="evolutions")
