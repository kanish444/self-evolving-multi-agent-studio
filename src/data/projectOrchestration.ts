export interface LogMessage {
  id: string
  level: 'info' | 'success' | 'warning' | 'error' | 'evolution'
  timestamp: string
  msg: string
}

export interface IterationInfo {
  version: string
  status: string
  successRate: string
  bugs: string
  execTime: string
  evolScore: string
  health: 'success' | 'warning' | 'error'
  learning: string
  improvements: string
}

export interface TaskQueueItem {
  id: string
  task: string
  agent: string
  priority: 'Low' | 'Medium' | 'High'
  status: string
  progress: number
  started: string
}

export interface ActivityFeedItem {
  id: string
  time: string
  agent: string
  action: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface HandoffItem {
  id: string
  fromAgent: string
  toAgent: string
  timestamp: string
}

export interface ProjectAgentInfo {
  currentTask: string
  subtasks: { id: number; title: string; status: 'completed' | 'in-progress' | 'pending' }[]
  recentActivity: { time: string; action: string }[]
}

// 1. Simulation logs for all 7 steps per project
export const PROJECT_SIMULATION_STEPS: Record<string, Record<number, Omit<LogMessage, 'timestamp' | 'id'>[]>> = {
  P001: {
    1: [
      { level: 'info', msg: 'Project Manager: Initializing orchestration run on branch "main".' },
      { level: 'info', msg: 'Project Manager: Analyzing requirements for "Student Management System (SMS)".' },
      { level: 'success', msg: 'Project Manager: Requirement decomposed. Assigned tasks to Architect and Developer.' }
    ],
    2: [
      { level: 'info', msg: 'Architect Agent: Reviewing code environment stack (React, FastAPI, SQLite).' },
      { level: 'info', msg: 'Architect Agent: Designing data model and database schema file: "docs/schema.sql".' },
      { level: 'success', msg: 'Architect Agent: REST API routes defined. OpenAPI docs generated.' }
    ],
    3: [
      { level: 'info', msg: 'Developer Agent: Checking out sandbox environment workspace.' },
      { level: 'info', msg: 'Developer Agent: Writing implementation for controllers/StudentController.py.' },
      { level: 'warning', msg: 'Developer Agent: SQL warning - Constructed query dynamically via string formatting.' },
      { level: 'success', msg: 'Developer Agent: Committing build changes to workspace sandbox branch.' }
    ],
    4: [
      { level: 'info', msg: 'Tester Agent: Provisioning isolated Docker sandbox environment.' },
      { level: 'info', msg: 'Tester Agent: Executing test suite (8 cases total) inside sandbox container...' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_student_creation_invalid_email (Expected 400 Bad Request, got 500).' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_student_sql_injection (Raw query crash in search endpoint).' },
      { level: 'warning', msg: 'Tester Agent: Test suite complete. 6/8 passed. 2 errors reported.' }
    ],
    5: [
      { level: 'info', msg: 'Code Reviewer: Performing static code analysis and security scans.' },
      { level: 'warning', msg: 'Code Reviewer: SQL Injection vulnerability found in StudentController.py:L42.' },
      { level: 'warning', msg: 'Code Reviewer: Refactor suggested: Enforce request validation schemas on routes.' },
      { level: 'info', msg: 'Code Reviewer: Code review report generated. Handoff sent to Debugger.' }
    ],
    6: [
      { level: 'info', msg: 'Debugger Agent: Reviewing test failure logs and code reviewer feedback.' },
      { level: 'info', msg: 'Debugger Agent: Patching SQL vulnerability with parameterized query bindings.' },
      { level: 'info', msg: 'Debugger Agent: Patching validation error by adding format schema validation.' },
      { level: 'success', msg: 'Debugger Agent: Patches compiled successfully. Re-running tests...' },
      { level: 'success', msg: 'Debugger Agent: Success! 8/8 tests passed. Sandbox verification complete.' }
    ],
    7: [
      { level: 'info', msg: 'Evolution Agent: Comparing run results against baseline.' },
      { level: 'evolution', msg: 'Evolution Agent: Root cause analysis: Developer agent used string formatting for query construction.' },
      { level: 'evolution', msg: 'Evolution Agent: Prompt Guideline modification: Added strict parameter bindings constraint to Developer Agent prompt.' },
      { level: 'evolution', msg: 'Evolution Agent: Saved new learning: "Always enforce request schemas and parameterized bindings in backend services."' },
      { level: 'success', msg: 'Evolution Agent: System model weights/prompt settings updated. Run complete.' }
    ]
  },
  P002: {
    1: [
      { level: 'info', msg: 'Project Manager: Initializing orchestration run on branch "main".' },
      { level: 'info', msg: 'Project Manager: Analyzing requirements for "E-Commerce Microservices".' },
      { level: 'success', msg: 'Project Manager: Decomposed orders, inventory reservations, and billing transaction saga.' }
    ],
    2: [
      { level: 'info', msg: 'Architect Agent: Inspecting microservice topology (Docker, FastAPI, Redis, PostgreSQL).' },
      { level: 'info', msg: 'Architect Agent: Outlining distributed saga pattern and idempotency contracts.' },
      { level: 'success', msg: 'Architect Agent: Event schema definitions exported to "docs/event_contracts.json".' }
    ],
    3: [
      { level: 'info', msg: 'Developer Agent: Initializing workspace in services/order_service.py.' },
      { level: 'info', msg: 'Developer Agent: Writing implementation for checkout order processing and inventory hold.' },
      { level: 'warning', msg: 'Developer Agent: Concurrent write warning - Multiple workers accessing same stock count.' },
      { level: 'success', msg: 'Developer Agent: Committing order orchestration handlers to sandbox repository.' }
    ],
    4: [
      { level: 'info', msg: 'Tester Agent: Provisioning multi-service Docker sandbox test network.' },
      { level: 'info', msg: 'Tester Agent: Executing test suite (12 cases) for payment and inventory transactions...' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_inventory_deadlock_on_checkout (Database row deadlock encountered).' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_payment_idempotency_token (Duplicate charges on network retry).' },
      { level: 'warning', msg: 'Tester Agent: Test suite finished with 10/12 passed. 2 critical regressions caught.' }
    ],
    5: [
      { level: 'info', msg: 'Code Reviewer: Scanning order service for race conditions and data anomalies.' },
      { level: 'warning', msg: 'Code Reviewer: Concurrency bottleneck in inventory_service.py:L78 without distributed lock.' },
      { level: 'warning', msg: 'Code Reviewer: Idempotency token missing unique index constraint in database schema.' },
      { level: 'info', msg: 'Code Reviewer: Dispatched remediation report to Debugger Agent.' }
    ],
    6: [
      { level: 'info', msg: 'Debugger Agent: Applying Redis distributed mutex lock to stock reservation.' },
      { level: 'info', msg: 'Debugger Agent: Adding idempotent payment transaction token verification middleware.' },
      { level: 'success', msg: 'Debugger Agent: Patches deployed. Re-running high-concurrency checkout stress tests...' },
      { level: 'success', msg: 'Debugger Agent: Success! 12/12 tests passed under 500 concurrent orders/sec.' }
    ],
    7: [
      { level: 'info', msg: 'Evolution Agent: Comparing transactional consistency metrics across iterations.' },
      { level: 'evolution', msg: 'Evolution Agent: Root cause: Unlocked stock decrement allows race conditions under high concurrency.' },
      { level: 'evolution', msg: 'Evolution Agent: Prompt Guideline modification: Developer agent must always use distributed mutexes for shared resources.' },
      { level: 'evolution', msg: 'Evolution Agent: Saved new learning: "Enforce idempotent transaction tokens and distributed mutex locks for checkout workflows."' },
      { level: 'success', msg: 'Evolution Agent: Self-healing rules updated. E-Commerce Microservices pipeline converged.' }
    ]
  },
  P003: {
    1: [
      { level: 'info', msg: 'Project Manager: Initializing orchestration run on branch "main".' },
      { level: 'info', msg: 'Project Manager: Analyzing requirements for "Autonomous Agent Engine".' },
      { level: 'success', msg: 'Project Manager: Decomposed actor state machine, event dispatcher, and LLM stream buffers.' }
    ],
    2: [
      { level: 'info', msg: 'Architect Agent: Reviewing Rust Tokio async runtime and RocksDB state storage.' },
      { level: 'info', msg: 'Architect Agent: Defining trait hierarchies and bounded message bus channels.' },
      { level: 'success', msg: 'Architect Agent: Trait contracts verified in "src/engine/mod.rs".' }
    ],
    3: [
      { level: 'info', msg: 'Developer Agent: Checking out engine crate workspace in Cargo.toml.' },
      { level: 'info', msg: 'Developer Agent: Writing implementation for actor transitions in src/state_machine.rs.' },
      { level: 'warning', msg: 'Developer Agent: Unbounded mpsc channel detected during streaming token ingestion.' },
      { level: 'success', msg: 'Developer Agent: Compiling engine binary with release optimization flags.' }
    ],
    4: [
      { level: 'info', msg: 'Tester Agent: Provisioning isolated Linux container for Rust cargo tests.' },
      { level: 'info', msg: 'Tester Agent: Running cargo test --all (16 cases)...' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_agent_state_cycle_timeout (Thread worker lockup in state convergence).' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_tokio_deadlock_channel (Channel buffer overflow during LLM bursting).' },
      { level: 'warning', msg: 'Tester Agent: Cargo test completed: 14 passed, 2 failed.' }
    ],
    5: [
      { level: 'info', msg: 'Code Reviewer: Auditing Rust safety constraints and async lifetime bounds.' },
      { level: 'warning', msg: 'Code Reviewer: High memory growth detected from unbounded channel buffer in state_machine.rs:L114.' },
      { level: 'info', msg: 'Code Reviewer: Generated zero-cost backpressure patch specification.' }
    ],
    6: [
      { level: 'info', msg: 'Debugger Agent: Refactoring channel dispatchers to bounded tokio::sync::mpsc with capacity 1024.' },
      { level: 'info', msg: 'Debugger Agent: Added exponential backpressure timeouts to stream event consumers.' },
      { level: 'success', msg: 'Debugger Agent: Cargo test verified! 16/16 test assertions passed without deadlock.' },
      { level: 'success', msg: 'Debugger Agent: Latency dropped to 4.2ms per agent transition step.' }
    ],
    7: [
      { level: 'info', msg: 'Evolution Agent: Extracting memory buffer usage patterns across iteration runs.' },
      { level: 'evolution', msg: 'Evolution Agent: Root cause: Unbounded async channels leak memory under high token generation velocity.' },
      { level: 'evolution', msg: 'Evolution Agent: Prompt Guideline modification: Enforce bounded channels with explicit backpressure timeouts in async engines.' },
      { level: 'evolution', msg: 'Evolution Agent: Saved new learning: "Use bounded tokio channels with explicit backpressure timeouts for actor loops."' },
      { level: 'success', msg: 'Evolution Agent: Autonomous Agent Engine prompt rules stabilized.' }
    ]
  },
  P004: {
    1: [
      { level: 'info', msg: 'Project Manager: Initializing orchestration run on branch "main".' },
      { level: 'info', msg: 'Project Manager: Analyzing requirements for "Vehicle Service Management System".' },
      { level: 'success', msg: 'Project Manager: Decomposed service bay scheduling, mechanic assignment, and self-healing repair rescheduling.' }
    ],
    2: [
      { level: 'info', msg: 'Architect Agent: Reviewing scheduling engine stack (FastAPI, SQLAlchemy, SQLite).' },
      { level: 'info', msg: 'Architect Agent: Modeling bay capacity constraints and collision detection schema: "app/models/vehicle.py".' },
      { level: 'success', msg: 'Architect Agent: Service allocation API contracts published to "docs/vehicle_booking.json".' }
    ],
    3: [
      { level: 'info', msg: 'Developer Agent: Checking out booking service repository.' },
      { level: 'info', msg: 'Developer Agent: Writing implementation for app/services/booking_service.py.' },
      { level: 'warning', msg: 'Developer Agent: Concurrency notice - Booking slot queries lack database row-level locking.' },
      { level: 'success', msg: 'Developer Agent: Committing vehicle appointment scheduler to sandbox branch.' }
    ],
    4: [
      { level: 'info', msg: 'Tester Agent: Provisioning isolated Docker sandbox environment.' },
      { level: 'info', msg: 'Tester Agent: Executing test suite (10 cases) for vehicle appointment workflows...' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_booking_slot_collision (Two vehicles booked into Bay 3 at identical timestamp).' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_vehicle_odometer_validation (Accepted negative odometer reading in service intake).' },
      { level: 'warning', msg: 'Tester Agent: Test run finished. 8/10 passed. 2 scheduling collisions reported.' }
    ],
    5: [
      { level: 'info', msg: 'Code Reviewer: Analyzing booking conflict handling and appointment state machine.' },
      { level: 'warning', msg: 'Code Reviewer: Race condition identified in booking_service.py:L64: Simultaneous bookings collide.' },
      { level: 'warning', msg: 'Code Reviewer: Missing Pydantic field constraint for vehicle mileage.' },
      { level: 'info', msg: 'Code Reviewer: Handed off self-healing resolution plan to Debugger Agent.' }
    ],
    6: [
      { level: 'info', msg: 'Debugger Agent: Implementing atomic time-slot reservation lock in booking_service.py.' },
      { level: 'info', msg: 'Debugger Agent: Adding automated self-healing reallocation logic to route overflow bookings to Bay 4.' },
      { level: 'info', msg: 'Debugger Agent: Enforced positive integer validator on vehicle odometer fields.' },
      { level: 'success', msg: 'Debugger Agent: Re-running pytest suite... 10/10 tests passed! Bay conflicts 100% resolved.' }
    ],
    7: [
      { level: 'info', msg: 'Evolution Agent: Auditing self-healing recovery efficiency across iterations.' },
      { level: 'evolution', msg: 'Evolution Agent: Root cause: Unlocked appointment booking slots caused double-booking collisions during peak traffic.' },
      { level: 'evolution', msg: 'Evolution Agent: Prompt Guideline modification: Enforce atomic slot reservation locks and automated self-healing reallocation for vehicle bays.' },
      { level: 'evolution', msg: 'Evolution Agent: Saved new learning: "Enforce atomic slot reservation locks and automated self-healing reallocation for vehicle bays."' },
      { level: 'success', msg: 'Evolution Agent: Self-healing loop converged for Vehicle Service Management System.' }
    ]
  },
  P005: {
    1: [
      { level: 'info', msg: 'Project Manager: Initializing orchestration run on branch "main".' },
      { level: 'info', msg: 'Project Manager: Analyzing requirements for "Library Management System".' },
      { level: 'success', msg: 'Project Manager: Decomposed book catalog index, borrowing limits, due-date calculation, and fines.' }
    ],
    2: [
      { level: 'info', msg: 'Architect Agent: Reviewing circulation architecture and relational database schemas.' },
      { level: 'info', msg: 'Architect Agent: Defining ISBN relational mappings and overdue fine tier formulas.' },
      { level: 'success', msg: 'Architect Agent: Schema contracts defined for books, patrons, and checkout transactions.' }
    ],
    3: [
      { level: 'info', msg: 'Developer Agent: Checking out library core in src/services/circulation.ts.' },
      { level: 'info', msg: 'Developer Agent: Writing implementation for book checkouts, returns, and daily fine calculators.' },
      { level: 'warning', msg: 'Developer Agent: Timezone warning - Client timestamp used for due date computation.' },
      { level: 'success', msg: 'Developer Agent: Committing circulation module to sandbox repository.' }
    ],
    4: [
      { level: 'info', msg: 'Tester Agent: Provisioning isolated sandbox container for library tests.' },
      { level: 'info', msg: 'Tester Agent: Running test suite (14 cases) for library circulation workflows...' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_overdue_fine_calculation (Fine calculated erroneously on weekend leap day).' },
      { level: 'error', msg: 'Tester Agent: FAIL: test_duplicate_isbn_checkout (Single copy checked out simultaneously to 2 members).' },
      { level: 'warning', msg: 'Tester Agent: Test execution complete. 12/14 passed. 2 logic errors flagged.' }
    ],
    5: [
      { level: 'info', msg: 'Code Reviewer: Auditing loan duration mathematics and inventory availability checks.' },
      { level: 'warning', msg: 'Code Reviewer: Local timezone conversion discrepancy in circulation.ts:L91.' },
      { level: 'warning', msg: 'Code Reviewer: Missing transaction lock around copy availability status updates.' },
      { level: 'info', msg: 'Code Reviewer: Sent patch directives to Debugger Agent.' }
    ],
    6: [
      { level: 'info', msg: 'Debugger Agent: Standardizing all due-date math to ISO UTC timestamps with grace period handling.' },
      { level: 'info', msg: 'Debugger Agent: Added atomic book copy reservation check prior to checkout commit.' },
      { level: 'success', msg: 'Debugger Agent: Re-running library verification tests... 14/14 passed cleanly.' }
    ],
    7: [
      { level: 'info', msg: 'Evolution Agent: Analyzing date-math failure patterns and checkout race conditions.' },
      { level: 'evolution', msg: 'Evolution Agent: Root cause: Localized timezone arithmetic causes boundary bugs in loan duration calculations.' },
      { level: 'evolution', msg: 'Evolution Agent: Prompt Guideline modification: Always standardize on UTC timestamps and enforce atomic single-copy locks.' },
      { level: 'evolution', msg: 'Evolution Agent: Saved new learning: "Standardize UTC timestamps for loan duration checks and enforce atomic ISBN checkout locks."' },
      { level: 'success', msg: 'Evolution Agent: Library Management System self-evolution cycle complete.' }
    ]
  }
}

// 2. Iteration Baseline Data per project
export const PROJECT_ITERATIONS_DATA: Record<string, IterationInfo[]> = {
  P001: [
    {
      version: 'Iteration 01',
      status: 'Baseline Run',
      successRate: '68%',
      bugs: '7 detected, 5 fixed',
      execTime: '6m 12s',
      evolScore: '68',
      health: 'warning',
      learning: 'Developer agent was missing model-level request parameter validation, causing database schema mismatch errors.',
      improvements: 'Architect enforced validator middleware; Developer guidelines updated with strict input schema rules.'
    },
    {
      version: 'Iteration 02',
      status: 'Evolved Run',
      successRate: '81%',
      bugs: '3 detected, 3 fixed',
      execTime: '4m 45s',
      evolScore: '81',
      health: 'success',
      learning: 'SQL statements constructed via string interpolation in database service. Vulnerable to injection vectors during search scans.',
      improvements: 'Developer guidelines updated to prohibit raw queries. Forced parameterized bindings.'
    },
    {
      version: 'Iteration 03',
      status: 'Optimized Run',
      successRate: '94%',
      bugs: '1 detected, 1 fixed',
      execTime: '4m 12s',
      evolScore: '92',
      health: 'success',
      learning: 'System converged. Student registration uniqueness and GPA calculations verified with concurrent thread locks.',
      improvements: 'Security audit logs verified. Average compilation latency dropped by 18.4%.'
    }
  ],
  P002: [
    {
      version: 'Iteration 01',
      status: 'Baseline Run',
      successRate: '62%',
      bugs: '9 detected, 6 fixed',
      execTime: '7m 40s',
      evolScore: '62',
      health: 'warning',
      learning: 'Saga state transitions lacked distributed compensation logic on billing payment failure.',
      improvements: 'Architect added automated rollback compensation steps in event contracts.'
    },
    {
      version: 'Iteration 02',
      status: 'Evolved Run',
      successRate: '84%',
      bugs: '2 detected, 2 fixed',
      execTime: '5m 10s',
      evolScore: '84',
      health: 'success',
      learning: 'Inventory stock decrements caused database deadlocks under high-concurrency order spikes.',
      improvements: 'Developer guidelines enforced Redis distributed mutex locks for inventory rows.'
    },
    {
      version: 'Iteration 03',
      status: 'Optimized Run',
      successRate: '96%',
      bugs: '0 detected, 0 fixed',
      execTime: '3m 50s',
      evolScore: '95',
      health: 'success',
      learning: 'Full transaction idempotency achieved across orders and billing services with zero duplicate payments.',
      improvements: 'Saga latency optimized to 18ms per order transaction.'
    }
  ],
  P003: [
    {
      version: 'Iteration 01',
      status: 'Baseline Run',
      successRate: '70%',
      bugs: '6 detected, 4 fixed',
      execTime: '8m 20s',
      evolScore: '65',
      health: 'warning',
      learning: 'Unbounded tokio mpsc channels caused memory spike during high-frequency token generation bursts.',
      improvements: 'Architect mandated bounded channel capacities with explicit backpressure handling.'
    },
    {
      version: 'Iteration 02',
      status: 'Evolved Run',
      successRate: '88%',
      bugs: '2 detected, 2 fixed',
      execTime: '4m 30s',
      evolScore: '86',
      health: 'success',
      learning: 'State machine cycle timeout in actor worker thread caused deadlocks during nested goal delegations.',
      improvements: 'Developer implemented non-blocking timeout select loops in state machine dispatcher.'
    },
    {
      version: 'Iteration 03',
      status: 'Optimized Run',
      successRate: '97%',
      bugs: '0 detected, 0 fixed',
      execTime: '3m 15s',
      evolScore: '96',
      health: 'success',
      learning: 'Rust engine achieved deterministic state transitions and zero-copy token streaming.',
      improvements: 'Throughput increased by 310% to 14,000 transitions per second.'
    }
  ],
  P004: [
    {
      version: 'Iteration 01',
      status: 'Baseline Run',
      successRate: '65%',
      bugs: '8 detected, 6 fixed',
      execTime: '6m 50s',
      evolScore: '64',
      health: 'warning',
      learning: 'Booking appointment scheduler lacked concurrency row locks, leading to service bay double-booking collisions.',
      improvements: 'Architect enforced atomic bay reservation locks and automated self-healing rescheduling logic.'
    },
    {
      version: 'Iteration 02',
      status: 'Evolved Run',
      successRate: '86%',
      bugs: '2 detected, 2 fixed',
      execTime: '4m 20s',
      evolScore: '85',
      health: 'success',
      learning: 'Vehicle maintenance mileage calculations failed on negative odometer input readings.',
      improvements: 'Developer added Pydantic positive integer constraints and service interval warning thresholds.'
    },
    {
      version: 'Iteration 03',
      status: 'Optimized Run',
      successRate: '98%',
      bugs: '0 detected, 0 fixed',
      execTime: '3m 30s',
      evolScore: '97',
      health: 'success',
      learning: 'Self-healing booking engine automatically reallocates bay conflicts without human intervention.',
      improvements: 'Zero bay scheduling collisions recorded across 1,000 simulated booking attempts.'
    }
  ],
  P005: [
    {
      version: 'Iteration 01',
      status: 'Baseline Run',
      successRate: '64%',
      bugs: '8 detected, 5 fixed',
      execTime: '6m 30s',
      evolScore: '63',
      health: 'warning',
      learning: 'Due-date calculation utilized client local timezones, leading to inconsistent fine penalties on date boundaries.',
      improvements: 'Architect enforced UTC timestamp standardization and grace period calculation rules.'
    },
    {
      version: 'Iteration 02',
      status: 'Evolved Run',
      successRate: '85%',
      bugs: '3 detected, 3 fixed',
      execTime: '4m 40s',
      evolScore: '83',
      health: 'success',
      learning: 'Single-copy books could be checked out concurrently by multiple patrons due to missing atomic checkout locks.',
      improvements: 'Developer added atomic database status locks on book circulation records.'
    },
    {
      version: 'Iteration 03',
      status: 'Optimized Run',
      successRate: '95%',
      bugs: '1 detected, 1 fixed',
      execTime: '3m 45s',
      evolScore: '93',
      health: 'success',
      learning: 'Library circulation and automated fine calculations converged with complete transaction isolation.',
      improvements: 'Catalog query latency reduced by 40% with ISBN index optimization.'
    }
  ]
}

// 3. Project-specific Agent Task Queues and Activities
export const PROJECT_AGENT_TASKS: Record<string, {
  taskQueue: TaskQueueItem[]
  activityFeed: ActivityFeedItem[]
  handoffs: HandoffItem[]
  agentDetails: Record<string, ProjectAgentInfo>
}> = {
  P001: {
    taskQueue: [
      { id: 't1', task: 'Implement Student CRUD API', agent: 'Developer Agent', priority: 'High', status: 'In Progress', progress: 68, started: '10:41:05 AM' },
      { id: 't2', task: 'Run Student API unit tests', agent: 'Tester Agent', priority: 'High', status: 'Running', progress: 45, started: '10:42:02 AM' },
      { id: 't3', task: 'Review StudentController.py', agent: 'Code Reviewer Agent', priority: 'Medium', status: 'Waiting', progress: 0, started: '10:42:15 AM' },
      { id: 't4', task: 'Analyze Iteration #3 Learnings', agent: 'Evolution Agent', priority: 'High', status: 'Analyzing', progress: 72, started: '10:41:32 AM' }
    ],
    activityFeed: [
      { id: 'a1', time: '10:42:15 AM', agent: 'Developer Agent', action: 'Created StudentController.py', type: 'success' },
      { id: 'a2', time: '10:42:02 AM', agent: 'Tester Agent', action: 'Started 20 tests on Student routes', type: 'info' },
      { id: 'a3', time: '10:41:52 AM', agent: 'Architect Agent', action: 'Updated database schema definitions in schema.sql', type: 'success' },
      { id: 'a4', time: '10:41:32 AM', agent: 'Evolution Agent', action: 'Analyzing parameter binding constraints', type: 'info' },
      { id: 'a5', time: '10:41:18 AM', agent: 'Project Manager Agent', action: 'Decomposed Student CRUD requirements', type: 'info' }
    ],
    handoffs: [
      { id: 'h1', fromAgent: 'Project Manager', toAgent: 'Architect', timestamp: '10:40:02 AM' },
      { id: 'h2', fromAgent: 'Architect', toAgent: 'Developer', timestamp: '10:41:18 AM' },
      { id: 'h3', fromAgent: 'Developer', toAgent: 'Tester', timestamp: '10:42:02 AM' },
      { id: 'h4', fromAgent: 'Tester', toAgent: 'Debugger', timestamp: '10:42:10 AM' },
      { id: 'h5', fromAgent: 'Debugger', toAgent: 'Tester', timestamp: '10:42:35 AM' }
    ],
    agentDetails: {
      pm: {
        currentTask: 'Decompose Student CRUD requirements',
        subtasks: [
          { id: 1, title: 'Analyze requirements document', status: 'completed' },
          { id: 2, title: 'Decompose tasks and map deliverables', status: 'completed' },
          { id: 3, title: 'Assign tasks to Architect and Developer', status: 'completed' }
        ],
        recentActivity: [
          { time: '10:41:18 AM', action: 'Assigned task to Developer Agent' },
          { time: '10:40:55 AM', action: 'Completed requirement decomposition tree' }
        ]
      },
      architect: {
        currentTask: 'Design database structure and routes schema',
        subtasks: [
          { id: 1, title: 'Design SQLite db schema', status: 'completed' },
          { id: 2, title: 'Specify REST API endpoints layout', status: 'completed' }
        ],
        recentActivity: [
          { time: '10:42:02 AM', action: 'Approved schemas for StudentController.py' }
        ]
      },
      developer: {
        currentTask: 'Implement Student CRUD API',
        subtasks: [
          { id: 1, title: 'Create Student model', status: 'completed' },
          { id: 2, title: 'Implement GET /students endpoint', status: 'completed' },
          { id: 3, title: 'Implement POST /students endpoint', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '10:42:15 AM', action: 'Generated StudentController.py controller file' }
        ]
      },
      tester: {
        currentTask: 'Run Student API tests',
        subtasks: [
          { id: 1, title: 'Generate PyTest unit test files', status: 'completed' },
          { id: 2, title: 'Run endpoint diagnostic test assertions', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '10:42:02 AM', action: 'Started 20 tests execution on API routes' }
        ]
      }
    }
  },
  P002: {
    taskQueue: [
      { id: 't1', task: 'Implement Order Processing Saga & Inventory Locks', agent: 'Developer Agent', priority: 'High', status: 'In Progress', progress: 75, started: '11:10:05 AM' },
      { id: 't2', task: 'Run Checkout Concurrency Stress tests', agent: 'Tester Agent', priority: 'High', status: 'Running', progress: 50, started: '11:11:20 AM' },
      { id: 't3', task: 'Review order_service.py for Deadlocks', agent: 'Code Reviewer Agent', priority: 'High', status: 'Waiting', progress: 0, started: '11:12:00 AM' },
      { id: 't4', task: 'Verify Redis Mutex Lock Policies', agent: 'Evolution Agent', priority: 'Medium', status: 'Analyzing', progress: 80, started: '11:12:30 AM' }
    ],
    activityFeed: [
      { id: 'a1', time: '11:12:30 AM', agent: 'Developer Agent', action: 'Created services/order_service.py with Saga pattern', type: 'success' },
      { id: 'a2', time: '11:11:45 AM', agent: 'Tester Agent', action: 'Executed 12 concurrent order checkout test scenarios', type: 'info' },
      { id: 'a3', time: '11:11:00 AM', agent: 'Architect Agent', action: 'Approved event-driven contracts in event_contracts.json', type: 'success' },
      { id: 'a4', time: '11:10:15 AM', agent: 'Evolution Agent', action: 'Optimizing Redis mutex timeout thresholds', type: 'info' },
      { id: 'a5', time: '11:09:50 AM', agent: 'Project Manager Agent', action: 'Decomposed order checkout & inventory reservation pipeline', type: 'info' }
    ],
    handoffs: [
      { id: 'h1', fromAgent: 'Project Manager', toAgent: 'Architect', timestamp: '11:09:50 AM' },
      { id: 'h2', fromAgent: 'Architect', toAgent: 'Developer', timestamp: '11:11:00 AM' },
      { id: 'h3', fromAgent: 'Developer', toAgent: 'Tester', timestamp: '11:11:45 AM' },
      { id: 'h4', fromAgent: 'Tester', toAgent: 'Debugger', timestamp: '11:12:10 AM' }
    ],
    agentDetails: {
      pm: {
        currentTask: 'Decompose Order Checkout & Billing Saga',
        subtasks: [
          { id: 1, title: 'Analyze order state transition specs', status: 'completed' },
          { id: 2, title: 'Define compensation triggers for payment failures', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:09:50 AM', action: 'Assigned order processing tasks to Developer' }
        ]
      },
      architect: {
        currentTask: 'Design Event-Driven Saga & Distributed Locks',
        subtasks: [
          { id: 1, title: 'Specify Redis mutex contracts', status: 'completed' },
          { id: 2, title: 'Define idempotency token schema', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:11:00 AM', action: 'Approved event_contracts.json schemas' }
        ]
      },
      developer: {
        currentTask: 'Implement Order Saga & Redis Mutex Locks',
        subtasks: [
          { id: 1, title: 'Create order_service.py', status: 'completed' },
          { id: 2, title: 'Implement inventory lock reservation', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:12:30 AM', action: 'Created services/order_service.py' }
        ]
      },
      tester: {
        currentTask: 'Run Checkout Concurrency tests',
        subtasks: [
          { id: 1, title: 'Run payment idempotency verification', status: 'completed' },
          { id: 2, title: 'Execute high-load inventory lock tests', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:11:45 AM', action: 'Started 12 checkout test scenarios' }
        ]
      }
    }
  },
  P003: {
    taskQueue: [
      { id: 't1', task: 'Implement Rust State Machine Dispatcher', agent: 'Developer Agent', priority: 'High', status: 'In Progress', progress: 82, started: '11:20:05 AM' },
      { id: 't2', task: 'Run Tokio Channel Concurrency tests', agent: 'Tester Agent', priority: 'High', status: 'Running', progress: 60, started: '11:21:10 AM' },
      { id: 't3', task: 'Review state_machine.rs for Deadlocks', agent: 'Code Reviewer Agent', priority: 'High', status: 'Waiting', progress: 0, started: '11:22:00 AM' },
      { id: 't4', task: 'Analyze Tokio Actor Buffer Memory Profiles', agent: 'Evolution Agent', priority: 'Medium', status: 'Analyzing', progress: 85, started: '11:22:30 AM' }
    ],
    activityFeed: [
      { id: 'a1', time: '11:22:30 AM', agent: 'Developer Agent', action: 'Compiled src/state_machine.rs with bounded channels', type: 'success' },
      { id: 'a2', time: '11:21:50 AM', agent: 'Tester Agent', action: 'Ran 16 Rust cargo test assertions on actor loops', type: 'info' },
      { id: 'a3', time: '11:21:00 AM', agent: 'Architect Agent', action: 'Verified thread-safe actor traits in src/engine/mod.rs', type: 'success' },
      { id: 'a4', time: '11:20:20 AM', agent: 'Evolution Agent', action: 'Extracted zero-copy streaming patterns from telemetry', type: 'info' },
      { id: 'a5', time: '11:19:40 AM', agent: 'Project Manager Agent', action: 'Decomposed async state transition specifications', type: 'info' }
    ],
    handoffs: [
      { id: 'h1', fromAgent: 'Project Manager', toAgent: 'Architect', timestamp: '11:19:40 AM' },
      { id: 'h2', fromAgent: 'Architect', toAgent: 'Developer', timestamp: '11:21:00 AM' },
      { id: 'h3', fromAgent: 'Developer', toAgent: 'Tester', timestamp: '11:21:50 AM' }
    ],
    agentDetails: {
      pm: {
        currentTask: 'Decompose Actor State Machine & Tokio Loops',
        subtasks: [
          { id: 1, title: 'Analyze async actor lifecycle requirements', status: 'completed' },
          { id: 2, title: 'Define backpressure threshold rules', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:19:40 AM', action: 'Assigned actor loop tasks to Developer' }
        ]
      },
      architect: {
        currentTask: 'Specify Rust Trait Hierarchy & Tokio Channels',
        subtasks: [
          { id: 1, title: 'Define bounded mpsc channel specs', status: 'completed' },
          { id: 2, title: 'Verify thread-safe Send + Sync bounds', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:21:00 AM', action: 'Approved src/engine/mod.rs traits' }
        ]
      },
      developer: {
        currentTask: 'Implement Rust State Machine Dispatcher',
        subtasks: [
          { id: 1, title: 'Create src/state_machine.rs', status: 'completed' },
          { id: 2, title: 'Implement bounded channel dispatchers', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:22:30 AM', action: 'Compiled src/state_machine.rs' }
        ]
      },
      tester: {
        currentTask: 'Run Tokio Channel Concurrency tests',
        subtasks: [
          { id: 1, title: 'Execute cargo test --all', status: 'completed' },
          { id: 2, title: 'Profile actor transition latency', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:21:50 AM', action: 'Ran 16 Rust cargo test assertions' }
        ]
      }
    }
  },
  P004: {
    taskQueue: [
      { id: 't1', task: 'Implement Vehicle Booking Self-Healing API', agent: 'Developer Agent', priority: 'High', status: 'In Progress', progress: 70, started: '11:30:05 AM' },
      { id: 't2', task: 'Run Vehicle Diagnostics & Booking tests', agent: 'Tester Agent', priority: 'High', status: 'Running', progress: 55, started: '11:31:15 AM' },
      { id: 't3', task: 'Review booking_service.py for Bay Collisions', agent: 'Code Reviewer Agent', priority: 'Medium', status: 'Waiting', progress: 0, started: '11:32:00 AM' },
      { id: 't4', task: 'Analyze Self-Healing Bay Reallocation Rules', agent: 'Evolution Agent', priority: 'High', status: 'Analyzing', progress: 78, started: '11:32:40 AM' }
    ],
    activityFeed: [
      { id: 'a1', time: '11:32:40 AM', agent: 'Developer Agent', action: 'Created app/services/booking_service.py with self-healing locks', type: 'success' },
      { id: 'a2', time: '11:31:50 AM', agent: 'Tester Agent', action: 'Executed 10 vehicle bay reservation test cases', type: 'info' },
      { id: 'a3', time: '11:31:10 AM', agent: 'Architect Agent', action: 'Designed bay collision detection schema in vehicle.py', type: 'success' },
      { id: 'a4', time: '11:30:30 AM', agent: 'Evolution Agent', action: 'Synthesizing automated appointment reallocation rules', type: 'info' },
      { id: 'a5', time: '11:29:55 AM', agent: 'Project Manager Agent', action: 'Decomposed vehicle service bay scheduling requirements', type: 'info' }
    ],
    handoffs: [
      { id: 'h1', fromAgent: 'Project Manager', toAgent: 'Architect', timestamp: '11:29:55 AM' },
      { id: 'h2', fromAgent: 'Architect', toAgent: 'Developer', timestamp: '11:31:10 AM' },
      { id: 'h3', fromAgent: 'Developer', toAgent: 'Tester', timestamp: '11:31:50 AM' },
      { id: 'h4', fromAgent: 'Tester', toAgent: 'Debugger', timestamp: '11:32:15 AM' }
    ],
    agentDetails: {
      pm: {
        currentTask: 'Decompose Service Bay Scheduling & Healing',
        subtasks: [
          { id: 1, title: 'Analyze appointment booking conflict scenarios', status: 'completed' },
          { id: 2, title: 'Map self-healing bay reallocation rules', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:29:55 AM', action: 'Assigned booking conflict tasks to Developer' }
        ]
      },
      architect: {
        currentTask: 'Design Bay Allocation & Mileage Validation Schema',
        subtasks: [
          { id: 1, title: 'Design vehicle.py SQLite models', status: 'completed' },
          { id: 2, title: 'Specify atomic time-slot reservation lock', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:31:10 AM', action: 'Approved schemas for booking_service.py' }
        ]
      },
      developer: {
        currentTask: 'Implement Vehicle Booking Self-Healing Logic',
        subtasks: [
          { id: 1, title: 'Create app/services/booking_service.py', status: 'completed' },
          { id: 2, title: 'Implement atomic slot lock & conflict reallocation', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:32:40 AM', action: 'Generated app/services/booking_service.py' }
        ]
      },
      tester: {
        currentTask: 'Run Vehicle Booking & Conflict tests',
        subtasks: [
          { id: 1, title: 'Generate PyTest booking conflict suites', status: 'completed' },
          { id: 2, title: 'Run bay collision simulation tests', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:31:50 AM', action: 'Started 10 tests on vehicle booking routes' }
        ]
      }
    }
  },
  P005: {
    taskQueue: [
      { id: 't1', task: 'Implement Book Circulation & Due Date Engine', agent: 'Developer Agent', priority: 'High', status: 'In Progress', progress: 72, started: '11:40:05 AM' },
      { id: 't2', task: 'Run ISBN Checkout & Fine Calculation tests', agent: 'Tester Agent', priority: 'High', status: 'Running', progress: 48, started: '11:41:20 AM' },
      { id: 't3', task: 'Review circulation.ts for UTC Timezone Bugs', agent: 'Code Reviewer Agent', priority: 'Medium', status: 'Waiting', progress: 0, started: '11:42:00 AM' },
      { id: 't4', task: 'Verify Penalty Tier Daily Fee Calculations', agent: 'Evolution Agent', priority: 'High', status: 'Analyzing', progress: 75, started: '11:42:40 AM' }
    ],
    activityFeed: [
      { id: 'a1', time: '11:42:40 AM', agent: 'Developer Agent', action: 'Created src/services/circulation.ts with UTC math', type: 'success' },
      { id: 'a2', time: '11:41:55 AM', agent: 'Tester Agent', action: 'Ran 14 library book checkout and return test cases', type: 'info' },
      { id: 'a3', time: '11:41:15 AM', agent: 'Architect Agent', action: 'Modeled ISBN relational schemas in book.ts', type: 'success' },
      { id: 'a4', time: '11:40:35 AM', agent: 'Evolution Agent', action: 'Synthesizing overdue fine calculation boundary rules', type: 'info' },
      { id: 'a5', time: '11:39:50 AM', agent: 'Project Manager Agent', action: 'Decomposed catalog management & loan lifecycle specs', type: 'info' }
    ],
    handoffs: [
      { id: 'h1', fromAgent: 'Project Manager', toAgent: 'Architect', timestamp: '11:39:50 AM' },
      { id: 'h2', fromAgent: 'Architect', toAgent: 'Developer', timestamp: '11:41:15 AM' },
      { id: 'h3', fromAgent: 'Developer', toAgent: 'Tester', timestamp: '11:41:55 AM' }
    ],
    agentDetails: {
      pm: {
        currentTask: 'Decompose Book Catalog & Loan Lifecycle',
        subtasks: [
          { id: 1, title: 'Analyze library checkout duration rules', status: 'completed' },
          { id: 2, title: 'Map penalty tier fine formulas', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:39:50 AM', action: 'Assigned circulation tasks to Developer' }
        ]
      },
      architect: {
        currentTask: 'Design ISBN Catalog & Circulation Relational Schemas',
        subtasks: [
          { id: 1, title: 'Design src/models/book.ts schema', status: 'completed' },
          { id: 2, title: 'Specify atomic single-copy loan lock', status: 'completed' }
        ],
        recentActivity: [
          { time: '11:41:15 AM', action: 'Approved schemas for circulation.ts' }
        ]
      },
      developer: {
        currentTask: 'Implement Circulation & Overdue Fine Engine',
        subtasks: [
          { id: 1, title: 'Create src/services/circulation.ts', status: 'completed' },
          { id: 2, title: 'Implement ISO UTC timestamp due-date engine', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:42:40 AM', action: 'Generated src/services/circulation.ts' }
        ]
      },
      tester: {
        currentTask: 'Run ISBN Checkout & Fine Calculation tests',
        subtasks: [
          { id: 1, title: 'Execute overdue fine penalty calculations', status: 'completed' },
          { id: 2, title: 'Test duplicate ISBN simultaneous borrowing', status: 'in-progress' }
        ],
        recentActivity: [
          { time: '11:41:55 AM', action: 'Started 14 tests on library routes' }
        ]
      }
    }
  }
}
