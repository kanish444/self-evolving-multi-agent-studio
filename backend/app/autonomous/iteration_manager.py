import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.autonomous import DevelopmentIteration

class IterationManager:
    @staticmethod
    def start_iteration(
        project_id: str,
        workflow_run_id: str,
        goal: str,
        iteration_number: int,
        parent_iteration_id: str = None,
        db: Session = None
    ) -> DevelopmentIteration:
        """
        Registers a new iteration step at status PLANNED inside SQLite DB.
        """
        iteration = DevelopmentIteration(
            id=f"it-{uuid.uuid4().hex[:8]}",
            project_id=project_id,
            workflow_run_id=workflow_run_id,
            iteration_number=iteration_number,
            parent_iteration_id=parent_iteration_id,
            goal=goal,
            status="PLANNED"
        )
        db.add(iteration)
        db.commit()
        db.refresh(iteration)
        return iteration

    @staticmethod
    def transition_iteration(
        iteration_id: str,
        status: str,
        artifact_id: str = None,
        execution_id: str = None,
        test_result_id: str = None,
        failure_summary: str = None,
        learning_reference: str = None,
        db: Session = None
    ) -> DevelopmentIteration:
        """
        Updates an existing iteration state. Sets completed timestamp if terminating.
        """
        iteration = db.query(DevelopmentIteration).filter(DevelopmentIteration.id == iteration_id).first()
        if iteration:
            iteration.status = status
            if artifact_id:
                iteration.artifact_id = artifact_id
            if execution_id:
                iteration.execution_id = execution_id
            if test_result_id:
                iteration.test_result_id = test_result_id
            if failure_summary:
                iteration.failure_summary = failure_summary
            if learning_reference:
                iteration.learning_reference = learning_reference
                
            if status in ["PASSED", "COMPLETED", "FAILED", "ABANDONED"]:
                iteration.completed_at = datetime.utcnow()
                
            db.commit()
            db.refresh(iteration)
        return iteration
