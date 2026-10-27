import logging
from sqlalchemy.orm import Session
from ..models.autonomous import DevelopmentIteration, AutonomyPolicy, FailureAnalysis
from ..models.orchestration import WorkflowRun
from .policies import PolicyEngine

logger = logging.getLogger(__name__)

class DevelopmentLoopController:
    @staticmethod
    def get_iteration_history(workflow_run_id: str, db: Session):
        """
        Returns all completed and active iterations for a given workflow execution run.
        """
        return db.query(DevelopmentIteration)\
                 .filter(DevelopmentIteration.workflow_run_id == workflow_run_id)\
                 .order_by(DevelopmentIteration.iteration_number.asc())\
                 .all()

    @staticmethod
    def check_limits(
        project_id: str,
        workflow_run_id: str,
        db: Session
    ) -> tuple[bool, str]:
        """
        Validates loop iteration counters against policy limits.
        Returns (is_valid, halt_reason).
        """
        policy = PolicyEngine.get_or_create_policy(project_id, db)
        iterations = DevelopmentLoopController.get_iteration_history(workflow_run_id, db)
        
        # 1. Max Iteration Limit
        if len(iterations) >= policy.max_iterations:
            return False, "MAX_ITERATIONS_REACHED"

        # 2. Max Debug Cycles limit (count FAILED or DEBUGGING iterations)
        debug_attempts = [it for it in iterations if it.status in ["FAILED", "DEBUGGING", "FIXING"]]
        if len(debug_attempts) >= policy.max_debug_cycles:
            return False, "MAX_DEBUG_CYCLES_EXCEEDED"

        return True, ""

    @staticmethod
    def detect_repeated_failure(
        workflow_run_id: str,
        db: Session
    ) -> bool:
        """
        Checks if the exact same failure error exception is repeated 3 times in a row.
        """
        iterations = DevelopmentLoopController.get_iteration_history(workflow_run_id, db)
        # We need at least 3 completed iterations to trace a repeated error loop
        if len(iterations) < 3:
            return False

        last_three = iterations[-3:]
        summaries = [it.failure_summary for it in last_three if it.failure_summary]
        
        if len(summaries) < 3:
            return False

        # Normalize summaries (e.g. stripping variable memory IDs or time timestamps)
        def clean_msg(msg: str) -> str:
            msg = msg.split(" at 0x")[0]
            # Get first two lines of error traceback
            lines = msg.strip().split("\n")
            return "\n".join(lines[:2]).strip().lower()

        cleaned = [clean_msg(s) for s in summaries]
        
        # If all 3 match, halt execution to prevent infinite API spend
        if cleaned[0] == cleaned[1] == cleaned[2]:
            logger.warning(f"Repeated loop failure pattern detected: {cleaned[0]}")
            return True

        return False

    @staticmethod
    def trigger_fail_safe(
        workflow_run_id: str,
        reason: str,
        db: Session
    ) -> None:
        """
        Halts the autonomous workflow state and transitions state to WAITING_FOR_HUMAN.
        """
        run = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_run_id).first()
        if run:
            run.status = "PAUSED"
            run.current_state = "WAITING_FOR_HUMAN"
            run.error_message = f"Loop halted safely: {reason}"
            db.commit()
            logger.info(f"Fail-safe activated on run {workflow_run_id}. Loop status set to WAITING_FOR_HUMAN.")
