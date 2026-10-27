import sys
import os
import pytest
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.project import Project
from app.models.task import Task
from app.models.iteration import Iteration
from app.models.test_result import TestResult
from app.models.evolution import Evolution
from app.models.memory import Memory
from app.models.log import Log

@pytest.fixture(autouse=True, scope="session")
def setup_test_project_data():
    """
    Ensures that test project P001 and associated records exist for the test suite.
    """
    db = SessionLocal()
    try:
        # 1. Project P001
        p = db.query(Project).filter(Project.id == "P001").first()
        if not p:
            p = Project(
                id="P001",
                name="Test Vehicle Service Management",
                description="Core test project for unit testing",
                status="ACTIVE",
                current_iteration=1,
                workspace_path="backend/workspaces/P001"
            )
            db.add(p)
            db.commit()

        # 2. Task
        t = db.query(Task).filter(Task.project_id == "P001").first()
        if not t:
            t = Task(
                id="task-01",
                project_id="P001",
                title="Setup Core Models",
                description="Initial setup of database models",
                status="COMPLETED",
                agent_role="DEVELOPER"
            )
            db.add(t)
            db.commit()

        # 3. Iteration
        it = db.query(Iteration).filter(Iteration.project_id == "P001").first()
        if not it:
            it = Iteration(
                id="it-P001-1",
                project_id="P001",
                number=1,
                goal="Initialize architecture",
                status="COMPLETED"
            )
            db.add(it)
            db.commit()

        # 4. TestResult
        tr = db.query(TestResult).filter(TestResult.project_id == "P001").first()
        if not tr:
            tr = TestResult(
                id="tr-P001-1",
                project_id="P001",
                task_id=t.id,
                name="test_models_validation",
                status="PASSED",
                duration="0.15s"
            )
            db.add(tr)
            db.commit()

        # 5. Evolution
        evo = db.query(Evolution).filter(Evolution.project_id == "P001").first()
        if not evo:
            evo = Evolution(
                id="evo-P001-1",
                project_id="P001",
                iteration_id=it.id,
                title="Model Validation Refactoring",
                problem="Missing validation constraints",
                solution="Added field validations",
                learning="Always validate schemas upfront",
                confidence="HIGH"
            )
            db.add(evo)
            db.commit()

        # 6. Memory
        mem = db.query(Memory).filter(Memory.project_id == "P001").first()
        if not mem:
            mem = Memory(
                id="mem-P001-1",
                project_id="P001",
                category="CODING",
                title="Input sanitization pattern",
                content="Sanitize incoming JSON payload before DB insertion"
            )
            db.add(mem)
            db.commit()

        # 7. Log
        log = db.query(Log).filter(Log.project_id == "P001").first()
        if not log:
            log = Log(
                id="log-P001-1",
                project_id="P001",
                type="INFO",
                status="COMPLETED",
                action="INITIALIZE",
                message="Project initialized successfully",
                trace_id="tr-init-1",
                correlation_id="corr-init-1",
                timestamp="12:00:00"
            )
            db.add(log)
            db.commit()

        yield
    finally:
        db.close()
