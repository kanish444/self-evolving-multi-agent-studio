export interface TimelineEvent {
  time: string
  label: string
  status: 'info' | 'success' | 'warning' | 'error' | 'pending'
}

export interface TestCase {
  id: string
  name: string
  type: 'Unit' | 'API' | 'Integration' | 'Security' | 'UI'
  agent: string
  status: 'PASS' | 'FAIL' | 'RUNNING' | 'SKIPPED'
  executionTime: string
  lastRun: string
  endpoint?: string
  input?: string
  expected?: string
  actual?: string
  response?: string
  rootCause?: string
  suggestedFix?: string
  relatedFile?: string
  line?: number
  traceback?: string
  codeDiffBefore?: string
  codeDiffAfter?: string
  timeline?: TimelineEvent[]
}

export interface TestStats {
  total: number
  passed: number
  failed: number
  running: number
  skipped: number
  passRate: number
  executionTime: string
}

export interface TestHistoryItem {
  iteration: string
  passed: number
  failed: number
  running: number
  skipped: number
}

export interface DebuggerAnalysis {
  agent: string
  status: 'ANALYZING' | 'IDLE' | 'COMPLETED'
  currentIssue: string
  rootCause: string
  analysis: string
  suggestedAction: string
  progress: number
  filesAnalyzed: number
  possibleCauses: number
  fixConfidence: number
}

export const initialTestStats: TestStats = {
  total: 20,
  passed: 15,
  failed: 3,
  running: 1,
  skipped: 1,
  passRate: 75,
  executionTime: '4m 32s',
}

export const initialTestHistory: TestHistoryItem[] = [
  { iteration: 'Iteration 01', passed: 12, failed: 8, running: 0, skipped: 0 },
  { iteration: 'Iteration 02', passed: 16, failed: 4, running: 0, skipped: 0 },
  { iteration: 'Iteration 03', passed: 19, failed: 1, running: 0, skipped: 0 },
]

export const initialDebuggerAnalysis: DebuggerAnalysis = {
  agent: 'Debugger Agent',
  status: 'ANALYZING',
  currentIssue: 'test_duplicate_email',
  rootCause: 'Missing duplicate-email validation.',
  analysis: 'Database insertion occurs before checking whether the email already exists.',
  suggestedAction: 'Validate email uniqueness before db.add().',
  progress: 82,
  filesAnalyzed: 3,
  possibleCauses: 2,
  fixConfidence: 94,
}

export const initialTestCases: TestCase[] = [
  {
    id: 'tc-1',
    name: 'test_get_students',
    type: 'API',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.45s',
    lastRun: '1m ago',
    endpoint: 'GET /students',
    input: '{}',
    expected: 'HTTP 200\n[{"id": 1, "name": "Alice", "email": "alice@school.edu"}]',
    actual: 'HTTP 200\n[{"id": 1, "name": "Alice", "email": "alice@school.edu"}]',
    response: '{"status": "success", "data": [{"id": 1, "name": "Alice", "email": "alice@school.edu"}]}',
  },
  {
    id: 'tc-2',
    name: 'test_create_student',
    type: 'API',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.62s',
    lastRun: '1m ago',
    endpoint: 'POST /students',
    input: '{"name": "Bob", "email": "bob@school.edu", "age": 20}',
    expected: 'HTTP 201\n{"id": 2, "name": "Bob", "email": "bob@school.edu", "age": 20}',
    actual: 'HTTP 201\n{"id": 2, "name": "Bob", "email": "bob@school.edu", "age": 20}',
    response: '{"status": "created", "id": 2}',
  },
  {
    id: 'tc-3',
    name: 'test_duplicate_email',
    type: 'API',
    agent: 'Tester Agent',
    status: 'FAIL',
    executionTime: '0.30s',
    lastRun: '1m ago',
    endpoint: 'POST /students',
    input: '{"name": "Alice Duplicate", "email": "alice@school.edu", "age": 22}',
    expected: 'HTTP 400\n{"detail": "Email already exists"}',
    actual: 'HTTP 201\n{"id": 3, "name": "Alice Duplicate", "email": "alice@school.edu", "age": 22}',
    response: '{"id": 3, "status": "created"}',
    rootCause: 'Duplicate email validation is not being enforced before database insertion.',
    suggestedFix: 'Add email existence validation before inserting a new student.',
    relatedFile: 'StudentController.py',
    line: 42,
    traceback: `Traceback (most recent call last):
  File "/workspace/tests/test_students.py", line 24, in test_duplicate_email
    response = client.post("/students", json=payload)
  File "/usr/local/lib/python3.10/site-packages/fastapi/testclient.py", line 124, in post
    return self.request("POST", url, json=json, **kwargs)
  File "/workspace/tests/test_students.py", line 28, in test_duplicate_email
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
AssertionError: Expected status code 400, received 201.`,
    codeDiffBefore: `def create_student(student: StudentSchema, db: Session = Depends(get_db)):
    db_student = Student(
        name=student.name,
        email=student.email,
        age=student.age
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student`,
    codeDiffAfter: `def create_student(student: StudentSchema, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(
        Student.email == student.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )
        
    db_student = Student(
        name=student.name,
        email=student.email,
        age=student.age
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student`,
    timeline: [
      { time: '10:42:15', label: 'Test Started', status: 'info' },
      { time: '10:42:16', label: 'Failure Detected (Assert HTTP 400, got 201)', status: 'error' },
      { time: '10:42:17', label: 'Debugger Agent Started', status: 'info' },
      { time: '10:42:19', label: 'Root Cause Identified (Missing email filter check)', status: 'success' },
      { time: '10:42:21', label: 'Fix Suggested (StudentController.py:L42)', status: 'success' },
      { time: '10:42:25', label: 'Waiting for Retest', status: 'pending' },
    ],
  },
  {
    id: 'tc-4',
    name: 'test_update_student',
    type: 'API',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.55s',
    lastRun: '1m ago',
    endpoint: 'PUT /students/1',
    input: '{"name": "Alice Smith"}',
    expected: 'HTTP 200\n{"id": 1, "name": "Alice Smith", "email": "alice@school.edu"}',
    actual: 'HTTP 200\n{"id": 1, "name": "Alice Smith", "email": "alice@school.edu"}',
    response: '{"status": "updated"}',
  },
  {
    id: 'tc-5',
    name: 'test_delete_student',
    type: 'API',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.40s',
    lastRun: '1m ago',
    endpoint: 'DELETE /students/1',
    input: '{}',
    expected: 'HTTP 200\n{"message": "Student deleted"}',
    actual: 'HTTP 200\n{"message": "Student deleted"}',
    response: '{"status": "deleted"}',
  },
  {
    id: 'tc-6',
    name: 'test_invalid_input',
    type: 'Unit',
    agent: 'Tester Agent',
    status: 'FAIL',
    executionTime: '0.28s',
    lastRun: '1m ago',
    endpoint: 'POST /students',
    input: '{"name": "Bob", "email": "bob@school.edu", "age": 150}',
    expected: 'HTTP 400\n{"detail": "Age must be between 18 and 120"}',
    actual: 'HTTP 201\n{"id": 4, "name": "Bob", "email": "bob@school.edu", "age": 150}',
    response: '{"id": 4, "status": "created"}',
    rootCause: 'Validation logic for the age range is completely missing in student model schema.',
    suggestedFix: 'Implement custom validation validator for student age attribute constraint.',
    relatedFile: 'StudentController.py',
    line: 18,
    traceback: `Traceback (most recent call last):
  File "/workspace/tests/test_students.py", line 42, in test_invalid_input
    response = client.post("/students", json={"name": "Bob", "age": 150})
  File "/workspace/tests/test_students.py", line 45, in test_invalid_input
    assert response.status_code == 400, f"Expected 400 validation error, got {response.status_code}"
AssertionError: Expected status code 400 validation error, received 201.`,
    codeDiffBefore: `    # Student definition
    db_student = Student(
        name=student.name,
        email=student.email,
        age=student.age
    )`,
    codeDiffAfter: `    # Student definition with validation
    if student.age < 18 or student.age > 120:
        raise HTTPException(
            status_code=400,
            detail="Age must be between 18 and 120"
        )
    db_student = Student(
        name=student.name,
        email=student.email,
        age=student.age
    )`,
    timeline: [
      { time: '10:43:01', label: 'Test Started', status: 'info' },
      { time: '10:43:02', label: 'Failure Detected (Age limit bypassed)', status: 'error' },
      { time: '10:43:04', label: 'Debugger Agent Started', status: 'info' },
      { time: '10:43:06', label: 'Root Cause Identified (Missing boundary limit constraints)', status: 'success' },
      { time: '10:43:08', label: 'Waiting for Retest', status: 'pending' },
    ],
  },
  {
    id: 'tc-7',
    name: 'test_sql_injection_protection',
    type: 'Security',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.95s',
    lastRun: '2m ago',
    endpoint: 'GET /students?search=Alice%27%20OR%201%3D1',
    input: '{}',
    expected: 'HTTP 200\n[]',
    actual: 'HTTP 200\n[]',
    response: '{"status": "success", "data": []}',
  },
  {
    id: 'tc-8',
    name: 'test_xss_prevention',
    type: 'Security',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.88s',
    lastRun: '2m ago',
    endpoint: 'POST /students',
    input: '{"name": "<script>alert(1)</script>", "email": "xss@school.edu"}',
    expected: 'HTTP 201\n{"name": "&lt;script&gt;alert(1)&lt;/script&gt;"}',
    actual: 'HTTP 201\n{"name": "&lt;script&gt;alert(1)&lt;/script&gt;"}',
    response: '{"status": "created", "sanitized": true}',
  },
  {
    id: 'tc-9',
    name: 'test_db_connection_pooling',
    type: 'Integration',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '1.20s',
    lastRun: '3m ago',
    endpoint: 'Internal db test',
    input: '{"connections": 100}',
    expected: 'Database Pool operational',
    actual: 'Database Pool operational',
    response: '{"status": "active", "active_connections": 12}',
  },
  {
    id: 'tc-10',
    name: 'test_cache_eviction_policy',
    type: 'Integration',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.68s',
    lastRun: '3m ago',
    endpoint: 'Internal cache test',
    input: '{"evict": "lru"}',
    expected: 'Cache cleared correctly',
    actual: 'Cache cleared correctly',
    response: '{"status": "evicted", "keys_removed": 14}',
  },
  {
    id: 'tc-11',
    name: 'test_auth_token_expiration',
    type: 'Unit',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.22s',
    lastRun: '3m ago',
  },
  {
    id: 'tc-12',
    name: 'test_refresh_token_rotation',
    type: 'Unit',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.35s',
    lastRun: '3m ago',
  },
  {
    id: 'tc-13',
    name: 'test_file_upload_limit',
    type: 'Integration',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.90s',
    lastRun: '4m ago',
  },
  {
    id: 'tc-14',
    name: 'test_cors_headers_policy',
    type: 'Security',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.41s',
    lastRun: '4m ago',
  },
  {
    id: 'tc-15',
    name: 'test_concurrent_writes',
    type: 'Integration',
    agent: 'Tester Agent',
    status: 'FAIL',
    executionTime: '1.80s',
    lastRun: '4m ago',
    endpoint: 'POST /students (Concurrency)',
    input: '{"threads": 10, "requests_per_thread": 5}',
    expected: 'Database transaction lock handled, no dirty writes',
    actual: 'TransactionException: Deadlock detected in database session execution',
    response: '{"error": "Deadlock detected", "code": 500}',
    rootCause: 'Student Controller is not utilizing optimistic locking or retrying failed transactions.',
    suggestedFix: 'Implement transaction retry decorator or pessimistic update locks.',
    relatedFile: 'StudentController.py',
    line: 74,
    traceback: `Traceback (most recent call last):
  File "/workspace/tests/test_students.py", line 124, in test_concurrent_writes
    results = run_concurrent_posts()
  File "/workspace/tests/test_students.py", line 130, in run_concurrent_posts
    raise TransactionException("Deadlock detected in database session execution")
TransactionException: Deadlock detected in database session execution`,
    codeDiffBefore: `def save_student(db, student):
    db.add(student)
    db.commit()`,
    codeDiffAfter: `def save_student(db, student):
    for attempt in range(3):
        try:
            db.add(student)
            db.commit()
            break
        except OperationalError as e:
            if "deadlock" in str(e).lower() and attempt < 2:
                db.rollback()
                time.sleep(0.1)
                continue
            raise e`,
    timeline: [
      { time: '10:44:10', label: 'Concurrent Threads Spun Up', status: 'info' },
      { time: '10:44:11', label: 'Deadlock Detected', status: 'error' },
      { time: '10:44:12', label: 'Debugger Analysis Initiated', status: 'info' },
      { time: '10:44:15', label: 'Fix Suggested', status: 'success' },
    ],
  },
  {
    id: 'tc-16',
    name: 'test_student_gpa_calculation',
    type: 'Unit',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.15s',
    lastRun: '5m ago',
  },
  {
    id: 'tc-17',
    name: 'test_notification_webhook',
    type: 'Unit',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.48s',
    lastRun: '5m ago',
  },
  {
    id: 'tc-18',
    name: 'test_pdf_report_generation',
    type: 'UI',
    agent: 'Tester Agent',
    status: 'RUNNING',
    executionTime: '1.20s',
    lastRun: 'Active now',
  },
  {
    id: 'tc-19',
    name: 'test_csv_bulk_import',
    type: 'Unit',
    agent: 'Tester Agent',
    status: 'PASS',
    executionTime: '0.67s',
    lastRun: '5m ago',
  },
  {
    id: 'tc-20',
    name: 'test_rate_limiter_policy',
    type: 'Security',
    agent: 'Tester Agent',
    status: 'SKIPPED',
    executionTime: '0.00s',
    lastRun: 'Never',
  },
]
