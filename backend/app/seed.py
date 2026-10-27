from datetime import datetime
from .models.project import Project
from .models.agent import Agent
from .models.task import Task
from .models.iteration import Iteration
from .models.test_result import TestResult
from .models.evolution import Evolution
from .models.memory import Memory
from .models.log import Log
from .models.delivery import Release, Deployment, DeploymentStage, DeploymentApproval, HealthCheckResult, RollbackRecord, EnvironmentConfig
from .models.autonomous import DevelopmentIteration, ArtifactVersion
from .models.orchestration import WorkflowRun
from .core.database import SessionLocal

def seed_db():
    db = SessionLocal()
    
    try:
        # Clear existing tables (except alembic_version)
        print("Clearing tables...")
        db.query(Log).delete()
        db.query(Memory).delete()
        db.query(Evolution).delete()
        db.query(TestResult).delete()
        db.query(Task).delete()
        
        # Clear delivery tables first (dependencies)
        db.query(RollbackRecord).delete()
        db.query(HealthCheckResult).delete()
        db.query(DeploymentApproval).delete()
        db.query(DeploymentStage).delete()
        db.query(Deployment).delete()
        db.query(Release).delete()
        db.query(EnvironmentConfig).delete()
        
        # Clear autonomous & workflow run tables
        db.query(DevelopmentIteration).delete()
        db.query(ArtifactVersion).delete()
        db.query(WorkflowRun).delete()
        
        db.query(Iteration).delete()
        db.query(Agent).delete()
        db.query(Project).delete()
        db.commit()
        
        # 1. Seed Projects
        print("Seeding Projects...")
        p1 = Project(
            id="P001",
            name="Student Management System",
            description="A React and Node.js platform to orchestrate class registries and GPA summaries.",
            status="IN_PROGRESS",
            current_iteration=3
        )
        p2 = Project(
            id="P002",
            name="E-Commerce Microservices",
            description="Dockerized microservice backend handling orders, inventories, and billing transactions.",
            status="PAUSED",
            current_iteration=1
        )
        p3 = Project(
            id="P003",
            name="Autonomous Agent Engine",
            description="A Rust-based state machine container running goal-oriented LLM orchestration pipelines.",
            status="ARCHIVED",
            current_iteration=1
        )
        p4 = Project(
            id="P004",
            name="Vehicle Service Management System",
            description="Autonomous software development loop demonstrating self-healing vehicle booking logic.",
            status="IN_PROGRESS",
            current_iteration=1
        )
        db.add_all([p1, p2, p3, p4])
        db.commit()

        # 2. Seed Agents
        print("Seeding Agents...")
        agents = [
            Agent(id="PM", name="Project Manager", role="Project Manager", description="Orchestrates lifecycle timelines and divides workflow requirements.", status="IDLE"),
            Agent(id="Architect", name="Architect", role="Architect", description="Designs structural layouts and outlines file dependency frameworks.", status="IDLE"),
            Agent(id="Developer", name="Developer", role="Developer", description="Implements logic features, refactors syntax, and updates database schemas.", status="IDLE"),
            Agent(id="Tester", name="Tester", role="Tester", description="Runs test suites, catches failure diagnostics, and tracks validation benchmarks.", status="IDLE"),
            Agent(id="Reviewer", name="Code Reviewer", role="Reviewer", description="Audits coding outputs, flags style regressions, and approves patch pull requests.", status="IDLE"),
            Agent(id="Debugger", name="Debugger", role="Debugger", description="Traces call stacks, isolates root causes, and generates targeted fix recommendations.", status="IDLE"),
            Agent(id="Evolution", name="Evolution Agent", role="Evolution Agent", description="Examines execution history, extracts rules, and updates memory vectors.", status="IDLE"),
            Agent(id="Memory", name="Memory System", role="Memory System", description="Archives observations and validates semantic patterns.", status="IDLE"),
            Agent(id="System", name="System", role="System Controller", description="Platform background events and sandbox telemetry daemon.", status="IDLE")
        ]
        db.add_all(agents)
        db.commit()

        # 3. Seed Iterations
        print("Seeding Iterations...")
        it1 = Iteration(id="it-P001-1", project_id="P001", number=1, goal="Loaded baseline metrics and repository scaffolding structures.", status="COMPLETED", started_at=datetime.utcnow(), completed_at=datetime.utcnow())
        it2 = Iteration(id="it-P001-2", project_id="P001", number=2, goal="Authentication and early return security guards validation.", status="COMPLETED", started_at=datetime.utcnow(), completed_at=datetime.utcnow())
        it3 = Iteration(id="it-P001-3", project_id="P001", number=3, goal="Student unique validation and concurrent upload thread locks.", status="ACTIVE", started_at=datetime.utcnow())
        db.add_all([it1, it2, it3])
        db.commit()

        # 4. Seed Tasks
        print("Seeding Tasks...")
        t1 = Task(id="task-01", project_id="P001", title="Database Models scaffolding", description="Initial ORM database declarations and project directories config.", status="COMPLETED", priority="HIGH", assigned_agent_id="Architect")
        t2 = Task(id="task-02", project_id="P001", title="Student CRUD API", description="Implements student insert, update, and get routes.", status="COMPLETED", priority="HIGH", assigned_agent_id="Developer")
        t3 = Task(id="task-03", project_id="P001", title="Authentication Testing", description="Integrate security guards check filters across route controllers.", status="COMPLETED", priority="CRITICAL", assigned_agent_id="Tester")
        t4 = Task(id="task-04", project_id="P001", title="Bulk Student Upload", description="Stress test concurrency thread locks when uploading CSV rosters.", status="COMPLETED", priority="HIGH", assigned_agent_id="Debugger")
        t5 = Task(id="task-05", project_id="P001", title="Linter Integration", description="Configure oxlint hooks and check code formatting constraints.", status="COMPLETED", priority="LOW", assigned_agent_id="Reviewer")
        db.add_all([t1, t2, t3, t4, t5])
        db.commit()

        # 5. Seed Test Results
        print("Seeding Test Results...")
        tr1 = TestResult(
            id="test-1", project_id="P001", task_id="task-02", iteration_id="it-P001-3",
            name="test_duplicate_email", description="Asserts duplicate emails return Bad Request validation status.",
            status="PASSED", expected_result="HTTP 400 Bad Request", actual_result="HTTP 400 Bad Request",
            duration="14ms"
        )
        tr2 = TestResult(
            id="test-2", project_id="P001", task_id="task-03", iteration_id="it-P001-2",
            name="test_auth_guard_null_token", description="Asserts null token requests return Unauthorized statuses.",
            status="PASSED", expected_result="HTTP 401 Unauthorized", actual_result="HTTP 401 Unauthorized",
            duration="8ms"
        )
        tr3 = TestResult(
            id="test-3", project_id="P001", task_id="task-04", iteration_id="it-P001-3",
            name="test_bulk_student_upload_stress", description="Verifies concurrency SQLite serialized write performance.",
            status="PASSED", expected_result="Zero write collisions over 20 threads", actual_result="Zero write collisions over 20 threads",
            duration="1.8s"
        )
        db.add_all([tr1, tr2, tr3])
        db.commit()

        # 6. Seed Evolutions
        print("Seeding Evolutions...")
        ev1 = Evolution(
            id="evo-1", project_id="P001", iteration_id="it-P001-3",
            title="Duplicate email check guard",
            problem="Missing verification checks allowed duplication errors.",
            solution="Developer Agent added a verify_unique_email hook before DB saves.",
            learning="Always assert unique constraints checks at ORM layer prior to persisting records.",
            confidence="HIGH"
        )
        ev2 = Evolution(
            id="evo-2", project_id="P001", iteration_id="it-P001-2",
            title="Null JWT payload filter check",
            problem="Null token header bypass returns NullPointerException status code.",
            solution="Developer Agent added early return validation gates on incoming requests.",
            learning="JWT interceptors should discard empty tokens immediately at filter stage.",
            confidence="HIGH"
        )
        ev3 = Evolution(
            id="evo-3", project_id="P001", iteration_id="it-P001-3",
            title="SQLite serialized locks handling",
            problem="Simultaneous bulk thread uploads throw SQLite busy locks exceptions.",
            solution="Developer Agent locked SQLite write loops using transaction mutexes.",
            learning="Always wrap bulk concurrency writing inside database serial locks.",
            confidence="HIGH"
        )
        db.add_all([ev1, ev2, ev3])
        db.commit()

        # 7. Seed Memories (Cognitive evidence mappings)
        print("Seeding Memories...")
        mem1 = Memory(
            id="mem-01", project_id="P001", category="CODING",
            title="DB Duplicate email verification check",
            content="Missing validation checks before ORM insertions led to integrity errors. Resolved by adding a unique constraints check hook in the project controller.",
            source="Developer", confidence=0.98, importance="Critical", status="Verified",
            tags="database,orm,validation", related_failures="test_duplicate_email", related_agents="Developer,Tester",
            used_in_count=1, success_rate=100.0, impact_score="Fixed duplicate user bugs", usage_count=1, success_count=1,
            last_used="Just now", iteration="Iteration 03"
        )
        mem2 = Memory(
            id="mem-03", project_id="P001", category="SECURITY",
            title="Null token guard check",
            content="Missing length checking on request tokens triggered HTTP 500 crashes. Fixed by injecting an early exit filter check in the JWT validation stack.",
            source="Developer", confidence=0.95, importance="High", status="Verified",
            tags="security,jwt,auth", related_failures="test_auth_guard_null_token", related_agents="Developer,Tester,Debugger",
            used_in_count=1, success_rate=100.0, impact_score="Secured endpoint filters", usage_count=1, success_count=1,
            last_used="1 day ago", iteration="Iteration 02"
        )
        mem3 = Memory(
            id="mem-10", project_id="P001", category="PERFORMANCE",
            title="SQLite bulk thread serialized locks",
            content="Concurrent thread uploads caused write collisions due to SQLite's locking mechanism. Solved by serialized transaction connection pools wrappers.",
            source="Developer", confidence=0.92, importance="Medium", status="Verified",
            tags="sqlite,concurrency,performance", related_failures="test_bulk_student_upload_stress", related_agents="Developer,Debugger",
            used_in_count=2, success_rate=98.5, impact_score="Isolates connection threads", usage_count=2, success_count=2,
            last_used="2 hours ago", iteration="Iteration 03"
        )
        db.add_all([mem1, mem2, mem3])
        db.commit()

        # 8. Seed Log Events (matching logs.mock.ts)
        print("Seeding Log Events...")
        mock_logs = [
            # Iteration 03 logs
            ("evt-01", "INFO", "RUNNING", "PM", "Task Assigned", "Assigned Task 02 to Developer", "StudentController.py", None, "trace_03_00218", "corr_03_99182", "10:41:50"),
            ("evt-02", "INFO", "RUNNING", "Architect", "Inspect Scope", "Analyzing class schema declarations in controller", "Student.py", None, "trace_03_00218", "corr_03_99182", "10:41:55"),
            ("evt-03", "SUCCESS", "COMPLETED", "Developer", "Generate Code", "Scaffolded repository database access methods", "StudentController.py", None, "trace_03_00218", "corr_03_99182", "10:41:58"),
            ("evt-04", "INFO", "WAITING", "System", "Trigger Sandbox", "Reloading application sandbox context container", None, None, "trace_03_00218", "corr_03_99182", "10:42:02"),
            ("evt-05", "INFO", "RUNNING", "Tester", "Start Testing", "Triggering verification suite: test_duplicate_email", "test_student.py", "test_duplicate_email", "trace_03_00218", "corr_03_99182", "10:42:05"),
            ("evt-06", "WARNING", "WAITING", "Tester", "Slow Response", "Endpoint POST /api/students took 185ms (limit 150ms)", "StudentController.py", "test_duplicate_email", "trace_03_00218", "corr_03_99182", "10:42:10"),
            ("evt-07", "ERROR", "FAILED", "Tester", "Test Failed", "AssertionError: Expected HTTP 400, got HTTP 201 Created", "test_student.py", "test_duplicate_email", "trace_03_00218", "corr_03_99182", "10:42:22"),
            ("evt-08", "INFO", "ANALYZING", "Debugger", "Isolate Error", "Analyzing test trace. Root cause: Missing validation check", "StudentController.py", "test_duplicate_email", "trace_03_00218", "corr_03_99182", "10:42:35"),
            ("evt-09", "SUCCESS", "COMPLETED", "Developer", "Apply Fix", "Added verify_unique_email hook check before database save", "StudentController.py", "test_duplicate_email", "trace_03_00218", "corr_03_99182", "10:42:48"),
            ("evt-10", "INFO", "RETRYING", "Tester", "Retrying Test", "Triggering verification suite: test_duplicate_email (Attempt 2)", "test_student.py", "test_duplicate_email", "trace_03_00218", "corr_03_99182", "10:42:55"),
            ("evt-11", "SUCCESS", "COMPLETED", "Tester", "Test Passed", "Assertion success: Duplicate emails returned HTTP 400", "test_student.py", "test_duplicate_email", "trace_03_00218", "corr_03_99182", "10:43:08"),
            ("evt-12", "REVIEW", "COMPLETED", "Reviewer", "Audit Changes", "Patch verified. Unique constraints conform to specifications", "StudentController.py", None, "trace_03_00218", "corr_03_99182", "10:43:20"),
            ("evt-13", "EVOLUTION", "STORED", "Evolution", "Formulate Rule", "Extracted rule: Verify unique values before database writes", None, None, "trace_03_00218", "corr_03_99182", "10:43:35"),
            ("evt-14", "MEMORY", "STORED", "Memory", "Save Memory", "Saved cognitive learning node: mem-01 (DB Verification)", None, None, "trace_03_00218", "corr_03_99182", "10:43:48"),
            
            # Iteration 02 logs
            ("evt-20", "INFO", "RUNNING", "PM", "Task Assigned", "Assigned Task 03 to Tester", "test_auth.py", None, "trace_02_00106", "corr_02_38102", "09:12:10"),
            ("evt-21", "INFO", "RUNNING", "Tester", "Start Testing", "Triggering verification suite: test_auth_guard_null_token", "test_auth.py", "test_auth_guard_null_token", "trace_02_00106", "corr_02_38102", "09:12:15"),
            ("evt-22", "ERROR", "FAILED", "Tester", "Test Failed", "NullPointerException in TokenParser at line 48", "TokenParser.py", "test_auth_guard_null_token", "trace_02_00106", "corr_02_38102", "09:12:22"),
            ("evt-23", "INFO", "ANALYZING", "Debugger", "Isolate Error", "Isolating JWT parsing checks. JWT claims require early length check validation", "TokenParser.py", "test_auth_guard_null_token", "trace_02_00106", "corr_02_38102", "09:12:35"),
            ("evt-24", "SUCCESS", "COMPLETED", "Developer", "Apply Fix", "Added early returns for null JWT payloads inside auth filters", "TokenParser.py", "test_auth_guard_null_token", "trace_02_00106", "corr_02_38102", "09:12:45"),
            ("evt-25", "SUCCESS", "COMPLETED", "Tester", "Test Passed", "Assertion success: Null tokens return HTTP 401 Unauthorized", "test_auth.py", "test_auth_guard_null_token", "trace_02_00106", "corr_02_38102", "09:12:55"),
            ("evt-26", "MEMORY", "STORED", "Memory", "Save Memory", "Saved cognitive learning node: mem-03 (Null Token Guard)", None, None, "trace_02_00106", "corr_02_38102", "09:13:10"),
            
            # Iteration 03 bulk write lock logs
            ("evt-30", "INFO", "RUNNING", "PM", "Task Assigned", "Assigned Task 04 to Developer", "database.py", None, "trace_03_00219", "corr_03_99210", "11:22:15"),
            ("evt-31", "INFO", "RUNNING", "Tester", "Start Testing", "Triggering stress test: test_bulk_student_upload_stress", "test_stress.py", "test_bulk_student_upload_stress", "trace_03_00219", "corr_03_99210", "11:22:20"),
            ("evt-32", "ERROR", "FAILED", "Tester", "Test Failed", "SQLite3 OperationalError: database is locked timeout", "database.py", "test_bulk_student_upload_stress", "trace_03_00219", "corr_03_99210", "11:22:38"),
            ("evt-33", "INFO", "ANALYZING", "Debugger", "Isolate Error", "Identified high concurrent SQLite writes without serialized lock connection pool wrappers", "database.py", "test_bulk_student_upload_stress", "trace_03_00219", "corr_03_99210", "11:22:50"),
            ("evt-34", "SUCCESS", "COMPLETED", "Developer", "Apply Fix", "Wrapped database transaction write operations in thread-safe mutex serialized pools", "database.py", "test_bulk_student_upload_stress", "trace_03_00219", "corr_03_99210", "11:23:05"),
            ("evt-35", "SUCCESS", "COMPLETED", "Tester", "Test Passed", "Assertion success: Uploaded CSV rosters over 20 threads safely", "test_stress.py", "test_bulk_student_upload_stress", "trace_03_00219", "corr_03_99210", "11:23:25"),
            ("evt-36", "MEMORY", "STORED", "Memory", "Save Memory", "Saved cognitive learning node: mem-10 (SQLite Mutex Serialization)", None, None, "trace_03_00219", "corr_03_99210", "11:23:40")
        ]
        
        print("Inserting logs...")
        for id_, type_, status_, agent_, action_, message_, file_, test_, trace_, corr_, timestamp_ in mock_logs:
            db.add(Log(
                id=id_,
                project_id="P001",
                iteration_id="it-P001-3" if "03" in trace_ else "it-P001-2",
                agent_id=agent_,
                task_id="task-02" if "218" in trace_ else ("task-03" if "106" in trace_ else "task-04"),
                type=type_,
                status=status_,
                action=action_,
                message=message_,
                file=file_,
                test=test_,
                trace_id=trace_,
                correlation_id=corr_,
                timestamp=timestamp_
            ))
        db.commit()
        print("Database seeded successfully with all models and logs!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    import os
    # Add project root to path if running directly
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    seed_db()
