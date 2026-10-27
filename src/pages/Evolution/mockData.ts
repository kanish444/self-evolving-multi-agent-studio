export type WorkflowStatus = 'Applied' | 'Recommended' | 'Rejected'
export type ImpactLevel = 'High' | 'Medium' | 'Low'
export type InsightType = 'failure' | 'success'

export interface IterationData {
  id: string
  version: string
  successRate: number
  bugs: number
  execTime: string
  coverRate: number
  workflowImps: number
  health: 'success' | 'warning' | 'error'
  learning: string
  improvements: string
  startTime: string
  endTime: string
  totalTests: number
  passedTests: number
  failedTests: number
  agentsInvolved: string[]
  status: string
}

export interface LearningData {
  id: string
  pattern: string
  evidence: string
  learning: string
  confidence: number
  agent: string
  iteration: string
  impact: ImpactLevel
  whyItMatters: string
  source: string
  createdIn: string
  usedIn: string
}

export interface WorkflowChange {
  id: string
  iteration: string
  beforeWorkflow: string[]
  afterWorkflow: string[]
  whyChanged: string
  expectedImpact: string
  actualImpact: string
  status: WorkflowStatus
}

export interface EvolutionInsight {
  id: string
  type: InsightType
  title: string
  occurrences: number
  impact: ImpactLevel
  recommendation: string
}

export interface FailurePattern {
  category: string
  count: number
  percentage: number
}

export interface EvolutionScoreBreakdown {
  label: string
  value: number
}

export interface SessionLog {
  time: string
  msg: string
}

export interface EvolutionSession {
  status: string
  iteration: string
  failuresReviewed: number
  patternsFound: number
  newLearnings: number
  workflowChanges: number
  progress: number
  logs: SessionLog[]
}

export interface DecisionItem {
  id: string
  observation: string
  decision: string
  reason: string
  expectedImpact: string
  confidence: number
  status: 'Recommended' | 'Accepted' | 'Rejected'
}

// ------------------------------------------------------------
// Initial Mock Datasets
// ------------------------------------------------------------

export const mockIterations: IterationData[] = [
  {
    id: 'iter-01',
    version: 'Iteration 01',
    successRate: 68,
    bugs: 7,
    execTime: '6m 21s',
    coverRate: 54,
    workflowImps: 3,
    health: 'warning',
    learning: 'Database schema mismatches encountered repeatedly due to missing validator constraints in primary data model input payloads.',
    improvements: 'Added model input schema constraints and integrated request validator schema pipelines.',
    startTime: '2026-08-28 10:10:00',
    endTime: '2026-08-28 10:16:21',
    totalTests: 20,
    passedTests: 13,
    failedTests: 7,
    agentsInvolved: ['Architect Agent', 'Developer Agent', 'Tester Agent'],
    status: 'Baseline'
  },
  {
    id: 'iter-02',
    version: 'Iteration 02',
    successRate: 81,
    bugs: 3,
    execTime: '5m 08s',
    coverRate: 76,
    workflowImps: 5,
    health: 'success',
    learning: 'SQL query construction used raw string concatenation, causing execution crashes during search parameter sweeps and rendering vulnerable pipelines.',
    improvements: 'Enforced parameters binding constraints on generated queries. Integrated static lint rules.',
    startTime: '2026-08-28 10:25:00',
    endTime: '2026-08-28 10:30:08',
    totalTests: 20,
    passedTests: 16,
    failedTests: 4,
    agentsInvolved: ['Architect Agent', 'Developer Agent', 'Tester Agent', 'Reviewer Agent', 'Debugger Agent'],
    status: 'Workflow Updated'
  },
  {
    id: 'iter-03',
    version: 'Iteration 03',
    successRate: 94,
    bugs: 1,
    execTime: '4m 32s',
    coverRate: 92,
    workflowImps: 8,
    health: 'success',
    learning: 'Transaction lock collision observed under concurrent query stress. Mitigated through localized retry intervals in database repository.',
    improvements: 'Implemented transaction retry wrappers and verified concurrent traffic stress tests without deadlocks.',
    startTime: '2026-08-28 10:40:00',
    endTime: '2026-08-28 10:44:32',
    totalTests: 20,
    passedTests: 19,
    failedTests: 1,
    agentsInvolved: ['Architect Agent', 'Developer Agent', 'Tester Agent', 'Reviewer Agent', 'Debugger Agent', 'Evolution Agent'],
    status: 'Current'
  }
]

export const mockLearnings: LearningData[] = [
  {
    id: 'lrn-01',
    pattern: 'Repeated database insertion failures',
    evidence: '6 failed tasks',
    learning: 'Validate database constraints before generating CRUD operations.',
    confidence: 94,
    agent: 'Evolution Agent',
    iteration: 'Iteration 01',
    impact: 'High',
    whyItMatters: 'Enforcing validation constraints at the controller level before database interaction prevents transactional dirty commits and avoids costly rollbacks or syntax mismatches in ORM middleware.',
    source: 'StudentController.py:L42',
    createdIn: 'Iteration 01',
    usedIn: 'Iteration 02, Iteration 03'
  },
  {
    id: 'lrn-02',
    pattern: 'Invalid API input causes repeated failures',
    evidence: '5 failed tests',
    learning: 'Apply input validation before route implementation.',
    confidence: 91,
    agent: 'Tester + Debugger',
    iteration: 'Iteration 02',
    impact: 'High',
    whyItMatters: 'API routes without explicit Dantic/Pydantic request body validation allow corrupt data to enter internal services, causing downstream null-pointer exceptions and unhandled system failures.',
    source: 'FastAPI Router Engine',
    createdIn: 'Iteration 02',
    usedIn: 'Iteration 03'
  },
  {
    id: 'lrn-03',
    pattern: 'Inconsistent API error handling',
    evidence: '3 failed tests',
    learning: 'Use a shared API exception-handling strategy.',
    confidence: 88,
    agent: 'Reviewer Agent',
    iteration: 'Iteration 02',
    impact: 'Medium',
    whyItMatters: 'Ad-hoc response error formats make integration debugging highly complex. Centralizing exception handlers guarantees uniform JSON responses (error keys, codes, tracking IDs).',
    source: 'main.py (Global Handlers)',
    createdIn: 'Iteration 02',
    usedIn: 'Iteration 03'
  }
]

export const mockWorkflowChanges: WorkflowChange[] = [
  {
    id: 'wfc-01',
    iteration: 'Iteration 02',
    beforeWorkflow: ['Architect', 'Developer', 'Tester'],
    afterWorkflow: ['Architect', 'Developer', 'Static Check', 'Tester'],
    whyChanged: 'Developer agent was committing raw SQL queries causing query syntax failures during integration runs.',
    expectedImpact: 'Prevent SQL syntax crashes and identify security injections before runtime.',
    actualImpact: 'Syntax errors and static warning logs reduced by 88% in test phases.',
    status: 'Applied'
  },
  {
    id: 'wfc-02',
    iteration: 'Iteration 03',
    beforeWorkflow: ['Architect', 'Developer', 'Static Check', 'Tester'],
    afterWorkflow: ['Architect', 'Schema Validation', 'Developer', 'Static Check', 'Tester'],
    whyChanged: 'Repeated database constraint validation failures during record creations.',
    expectedImpact: 'Enforce structural data validations before sending queries to DB engine.',
    actualImpact: 'Database constraints errors reduced by 76% in Iteration 03.',
    status: 'Applied'
  }
]

export const mockEvolutionInsights: EvolutionInsight[] = [
  {
    id: 'ins-01',
    type: 'failure',
    title: 'Database Validation',
    occurrences: 8,
    impact: 'High',
    recommendation: 'Add schema validation before code generation.'
  },
  {
    id: 'ins-02',
    type: 'failure',
    title: 'Input Validation',
    occurrences: 5,
    impact: 'Medium',
    recommendation: 'Add input validation parameters to generated API routes.'
  },
  {
    id: 'ins-03',
    type: 'success',
    title: 'Reusable API Exception Handler',
    occurrences: 12,
    impact: 'High',
    recommendation: 'Enforce exception-handler inheritance in future microservice generators.'
  }
]

export const mockFailurePatterns: FailurePattern[] = [
  { category: 'Database', count: 8, percentage: 47 },
  { category: 'Validation', count: 5, percentage: 29 },
  { category: 'API Handling', count: 3, percentage: 18 },
  { category: 'Other', count: 1, percentage: 6 }
]

export const mockScoreBreakdown: EvolutionScoreBreakdown[] = [
  { label: 'Code Quality', value: 22 },
  { label: 'Bug Reduction', value: 40 },
  { label: 'Test Coverage', value: 16 },
  { label: 'Error Handling', value: 18 },
  { label: 'Performance', value: 15 }
]

export const mockEvolutionSession: EvolutionSession = {
  status: 'ANALYZING',
  iteration: 'Iteration 03',
  failuresReviewed: 12,
  patternsFound: 6,
  newLearnings: 4,
  workflowChanges: 2,
  progress: 78,
  logs: [
    { time: '10:43:12', msg: 'Reviewing database transactional failures' },
    { time: '10:43:25', msg: 'Repeated constraint deadlock pattern identified' },
    { time: '10:43:39', msg: 'New learning added: Enforce optimistic concurrency handlers' },
    { time: '10:43:51', msg: 'Workflow modification proposed: Inject retry wrappers' },
    { time: '10:44:02', msg: 'Measuring expected improvement gains' }
  ]
}

export const mockEvolutionDecision: DecisionItem = {
  id: 'dec-01',
  observation: 'Database validation failures appeared repeatedly across multiple iterations.',
  decision: 'Insert schema validation before backend code generation.',
  reason: 'Previous iterations show repeated failures caused by missing schema validations on model entries.',
  expectedImpact: 'Reduce database-related integrity exceptions.',
  confidence: 94,
  status: 'Recommended'
}
