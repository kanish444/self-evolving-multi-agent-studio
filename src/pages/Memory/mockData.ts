export type MemoryType =
  | 'Project Knowledge'
  | 'Agent Learning'
  | 'Error Pattern'
  | 'Successful Pattern'
  | 'Workflow Knowledge'
  | 'Coding Pattern'
  | 'Architecture Knowledge'

export type MemoryImportance = 'Critical' | 'High' | 'Medium' | 'Low'
export type MemoryStatus = 'Active' | 'Archived' | 'Needs Review' | 'Verified'

export interface Memory {
  id: string
  title: string
  type: MemoryType
  description: string
  learning: string
  sourceAgent: string
  project: string
  iteration: string
  createdAt: string
  confidence: number
  importance: MemoryImportance
  status: MemoryStatus
  tags: string[]
  relatedFailures: string[]
  relatedAgents: string[]
  usedInCount: number
  successRate: number
  impactScore: string
  usageCount: number
  successCount: number
  lastUsed: string
  relatedMemories: string[] // List of related memory IDs
  updatedAt?: string
  lastUsedAt?: string
  successfulUses?: number
  failedUses?: number
  relatedFailuresCount?: number
  relatedTestsCount?: number
  relatedTasksCount?: number
  relatedIterationsCount?: number
  relatedAgentsCount?: number
  evidenceSummary?: string
  evidenceFailureFlow?: {
    test: string
    problem: string
    detectedBy: string
    rootCauseBy: string
    learningCreatedBy: string
  }
}

export interface MemoryCategory {
  name: string
  count: number
  type: string
}

export interface MemoryTimelineItem {
  id: string
  iteration: string
  label: string
  details: string
}

export interface KnowledgeQualityStats {
  verified: number
  review: number
  lowConf: number
  freqUsed: number
  unused: number
}

export interface MemoryRetentionStats {
  critical: number
  medium: number
  low: number
}

export interface MemoryInsightCard {
  title: string
  evidence: string
  recommendation: string
}

// ------------------------------------------------------------
// Initial Mock Datasets
// ------------------------------------------------------------

export const initialMemories: Memory[] = [
  {
    id: 'mem-01',
    title: 'Database validation should precede CRUD generation',
    type: 'Agent Learning',
    description: 'Structural database checks are required in front of the developer generation cycle to prevent broken ORM SQL transactions.',
    learning: 'Database validation should occur before CRUD code generation.',
    sourceAgent: 'Evolution',
    project: 'Student Management System',
    iteration: 'Iteration 03',
    createdAt: '25 May, 10:43 AM',
    confidence: 94,
    importance: 'High',
    status: 'Verified',
    tags: ['database', 'validation', 'crud', 'workflow'],
    relatedFailures: ['Duplicate email test failure', 'Missing age constraint validation'],
    relatedAgents: ['Tester', 'Debugger', 'Evolution'],
    usedInCount: 3,
    successRate: 100,
    impactScore: 'Reduced database-related failures by 76%',
    usageCount: 3,
    successCount: 3,
    lastUsed: '10:42 AM',
    relatedMemories: ['mem-03', 'mem-04'],
    relatedFailuresCount: 6,
    relatedTestsCount: 8,
    relatedTasksCount: 8,
    relatedIterationsCount: 3,
    relatedAgentsCount: 3,
    evidenceSummary: 'Learning supported by repeated observations across multiple iterations.',
    evidenceFailureFlow: {
      test: 'test_duplicate_email',
      problem: 'Duplicate email validation missing.',
      detectedBy: 'Tester Agent',
      rootCauseBy: 'Debugger Agent',
      learningCreatedBy: 'Evolution Agent'
    }
  },
  {
    id: 'mem-02',
    title: 'Reuse API error handling pattern',
    type: 'Successful Pattern',
    description: 'Centralizing controller endpoints exceptions using inheriting base models provides uniform JSON formatting and decreases debugging overhead.',
    learning: 'Extend exception-handler inheritance in future microservice generators.',
    sourceAgent: 'Code Reviewer',
    project: 'Student Management System',
    iteration: 'Iteration 02',
    createdAt: '24 May, 03:15 PM',
    confidence: 91,
    importance: 'Medium',
    status: 'Active',
    tags: ['api', 'error-handling', 'design-pattern'],
    relatedFailures: ['Uncaught JSON parse crash'],
    relatedAgents: ['Developer', 'Code Reviewer'],
    usedInCount: 12,
    successRate: 92,
    impactScore: 'Decreased global exceptions error rate by 42%',
    usageCount: 12,
    successCount: 11,
    lastUsed: '02:30 PM',
    relatedMemories: ['mem-05'],
  },
  {
    id: 'mem-03',
    title: 'Email uniqueness must be validated before insert',
    type: 'Error Pattern',
    description: 'Enforcing unique query filter scans inside StudentController models avoids SQLite integrity violations and deadlock exceptions.',
    learning: 'Apply unique constraints verify logic prior to database addition commands.',
    sourceAgent: 'Debugger',
    project: 'Student Management System',
    iteration: 'Iteration 01',
    createdAt: '22 May, 09:20 AM',
    confidence: 96,
    importance: 'Critical',
    status: 'Verified',
    tags: ['database', 'validation', 'duplicate', 'integrity'],
    relatedFailures: ['IntegrityError: UNIQUE constraint failed'],
    relatedAgents: ['Debugger', 'Tester'],
    usedInCount: 5,
    successRate: 100,
    impactScore: 'Eliminated SQLite constraint violations completely',
    usageCount: 5,
    successCount: 5,
    lastUsed: '10:42 AM',
    relatedMemories: ['mem-01', 'mem-04'],
    relatedFailuresCount: 4,
    relatedTestsCount: 5,
    relatedTasksCount: 6,
    relatedIterationsCount: 2,
    relatedAgentsCount: 2,
    evidenceSummary: 'Learning established after duplicate entries bypass UI layer controls during batch actions.',
    evidenceFailureFlow: {
      test: 'test_student_duplicate_email',
      problem: 'SQLite UNIQUE constraint failed on student.email.',
      detectedBy: 'Tester Agent',
      rootCauseBy: 'Debugger Agent',
      learningCreatedBy: 'Evolution Agent'
    }
  },
  {
    id: 'mem-04',
    title: 'Validate database schemas before ORM commits',
    type: 'Architecture Knowledge',
    description: 'Enforcing structure mapping checks prevents ORM attributes mismatch warnings during server initialization runs.',
    learning: 'Check compiler model definitions against actual SQL DB layouts.',
    sourceAgent: 'Architect',
    project: 'Student Management System',
    iteration: 'Iteration 01',
    createdAt: '20 May, 01:10 PM',
    confidence: 88,
    importance: 'High',
    status: 'Verified',
    tags: ['database', 'schema', 'architecture'],
    relatedFailures: ['SQLAlchemy model key mismatch'],
    relatedAgents: ['Architect', 'Developer'],
    usedInCount: 4,
    successRate: 75,
    impactScore: 'Eliminated start-up warnings in sandbox initialization',
    usageCount: 4,
    successCount: 3,
    lastUsed: 'Yesterday, 04:00 PM',
    relatedMemories: ['mem-01', 'mem-03'],
  },
  {
    id: 'mem-05',
    title: 'Enforce parameterized query binding rules',
    type: 'Coding Pattern',
    description: 'String formatting inside raw SQL queries must be banned to prevent SQL injection vulnerabilities and static check flags.',
    learning: 'Prohibit string interpolation queries; enforce bound param schemas.',
    sourceAgent: 'Code Reviewer',
    project: 'Student Management System',
    iteration: 'Iteration 02',
    createdAt: '23 May, 11:30 AM',
    confidence: 95,
    importance: 'Critical',
    status: 'Verified',
    tags: ['security', 'sql-injection', 'coding-standard'],
    relatedFailures: ['SQL Injection scanner exploit', 'Search parameters parse syntax error'],
    relatedAgents: ['Code Reviewer', 'Developer'],
    usedInCount: 9,
    successRate: 100,
    impactScore: 'Resolved all security static scan vulnerabilities',
    usageCount: 9,
    successCount: 9,
    lastUsed: '01:15 PM',
    relatedMemories: ['mem-02'],
  },
  {
    id: 'mem-06',
    title: 'Input model age range restriction criteria',
    type: 'Workflow Knowledge',
    description: 'Custom validator schema triggers should validate age fields to check if they reside in the boundary limit 18 to 120.',
    learning: 'Validate integer constraints during model validation processes.',
    sourceAgent: 'Tester',
    project: 'Student Management System',
    iteration: 'Iteration 03',
    createdAt: '25 May, 10:43 AM',
    confidence: 90,
    importance: 'Low',
    status: 'Needs Review',
    tags: ['validation', 'boundary-check', 'workflow'],
    relatedFailures: ['Age field bounds check bypassed'],
    relatedAgents: ['Tester', 'Debugger'],
    usedInCount: 2,
    successRate: 100,
    impactScore: 'Prevented invalid age inputs from reaching database records',
    usageCount: 2,
    successCount: 2,
    lastUsed: '10:43 AM',
    relatedMemories: ['mem-01'],
  },
  {
    id: 'mem-07',
    title: 'Session rate-limiting middleware rules',
    type: 'Project Knowledge',
    description: 'Global router security must restrict excess client queries during traffic stress periods.',
    learning: 'Implement standard slow-down decorators in settings profiles.',
    sourceAgent: 'Architect',
    project: 'Other Projects',
    iteration: 'Iteration 01',
    createdAt: '15 May, 09:00 AM',
    confidence: 85,
    importance: 'Low',
    status: 'Archived',
    tags: ['security', 'rate-limit', 'infrastructure'],
    relatedFailures: ['Mock concurrent traffic overload'],
    relatedAgents: ['Architect'],
    usedInCount: 1,
    successRate: 100,
    impactScore: 'Secured API against distributed concurrent flooding',
    usageCount: 1,
    successCount: 1,
    lastUsed: '15 May, 10:00 AM',
    relatedMemories: [],
  },
  {
    id: 'mem-08',
    title: 'Early return checks for authentication routing',
    type: 'Coding Pattern',
    description: 'Ensure guard clauses check for authentication tokens immediately in route handlers to minimize execution paths for unauthenticated users.',
    learning: 'Validate route authentication tokens in the first line of controller execution.',
    sourceAgent: 'Developer',
    project: 'Student Management System',
    iteration: 'Iteration 02',
    createdAt: '21 May, 02:40 PM',
    confidence: 92,
    importance: 'High',
    status: 'Verified',
    tags: ['auth', 'guard-clauses', 'routing'],
    relatedFailures: ['Null token router bypass crash'],
    relatedAgents: ['Developer', 'Code Reviewer'],
    usedInCount: 7,
    successRate: 100,
    impactScore: 'Reduced route handler latency by 14ms on bad requests',
    usageCount: 7,
    successCount: 7,
    lastUsed: '24 May, 11:20 AM',
    relatedMemories: ['mem-05'],
  },
  {
    id: 'mem-09',
    title: 'Student grading calculation formula logic',
    type: 'Project Knowledge',
    description: 'Business rules dictate that grading calculation must round averages up to the nearest integer to prevent student complaints.',
    learning: 'Round student grades ceiling in average score controller modules.',
    sourceAgent: 'Project Manager',
    project: 'Student Management System',
    iteration: 'Iteration 02',
    createdAt: '19 May, 04:30 PM',
    confidence: 87,
    importance: 'Medium',
    status: 'Active',
    tags: ['grading', 'business-rules', 'calculations'],
    relatedFailures: ['Floating grade precision mismatch mismatch'],
    relatedAgents: ['Project Manager', 'Developer'],
    usedInCount: 2,
    successRate: 100,
    impactScore: 'Resolved student average discrepancy tickets',
    usageCount: 2,
    successCount: 2,
    lastUsed: 'Yesterday, 09:15 AM',
    relatedMemories: [],
  },
  {
    id: 'mem-10',
    title: 'Race conditions during student bulk upload',
    type: 'Error Pattern',
    description: 'Concurrent bulk uploads bypass sequence increments in SQLite, resulting in duplicate key index clashes.',
    learning: 'Wrap bulk import records in sequential database locks to serialize transaction blocks.',
    sourceAgent: 'Debugger',
    project: 'Student Management System',
    iteration: 'Iteration 03',
    createdAt: '26 May, 09:12 AM',
    confidence: 97,
    importance: 'Critical',
    status: 'Needs Review',
    tags: ['concurrency', 'bulk-upload', 'sqlite', 'race-condition'],
    relatedFailures: ['Lock conflict on bulk records insert', 'Concurrent index duplicate crash'],
    relatedAgents: ['Debugger', 'Tester', 'Developer'],
    usedInCount: 4,
    successRate: 75,
    impactScore: 'Mitigated SQLite locking blocks during batch CSV actions',
    usageCount: 4,
    successCount: 3,
    lastUsed: '27 May, 01:10 PM',
    relatedMemories: ['mem-03'],
    relatedFailuresCount: 5,
    relatedTestsCount: 7,
    relatedTasksCount: 5,
    relatedIterationsCount: 2,
    relatedAgentsCount: 3,
    evidenceSummary: 'Concurrent database write requests bypass sequence generation inside SQLite thread loops.',
    evidenceFailureFlow: {
      test: 'test_bulk_student_upload_stress',
      problem: 'Database lock block due to concurrent transaction race.',
      detectedBy: 'Tester Agent',
      rootCauseBy: 'Debugger Agent',
      learningCreatedBy: 'Evolution Agent'
    }
  },
  {
    id: 'mem-11',
    title: 'Lint checklist pre-commit hook integrations',
    type: 'Workflow Knowledge',
    description: 'Developers pushing code without compiling dependencies trigger build breaking errors in the CI/CD pipeline.',
    learning: 'Install oxlint pre-commit hooks to block incomplete branch updates.',
    sourceAgent: 'Evolution',
    project: 'Student Management System',
    iteration: 'Iteration 03',
    createdAt: '27 May, 11:00 AM',
    confidence: 93,
    importance: 'High',
    status: 'Active',
    tags: ['linter', 'ci-cd', 'workflow-optimization'],
    relatedFailures: ['Failed build on main branch due to unreferenced imports'],
    relatedAgents: ['Evolution', 'Architect'],
    usedInCount: 6,
    successRate: 100,
    impactScore: 'Avoided build-breaker commits completely over 6 runs',
    usageCount: 6,
    successCount: 6,
    lastUsed: '28 May, 05:00 PM',
    relatedMemories: ['mem-04'],
  },
  {
    id: 'mem-12',
    title: 'Throttle test runtime execution cycles',
    type: 'Workflow Knowledge',
    description: 'Executing comprehensive integrations suites continuously stalls local developer environments during feature editing iterations.',
    learning: 'Isolate unit tests inside pre-commit hooks; postpone system tests to the master build server.',
    sourceAgent: 'Tester',
    project: 'Student Management System',
    iteration: 'Iteration 03',
    createdAt: '28 May, 09:30 AM',
    confidence: 89,
    importance: 'Low',
    status: 'Verified',
    tags: ['testing', 'throttle', 'workflow-efficiency'],
    relatedFailures: ['Local machine freeze due to concurrent test instances'],
    relatedAgents: ['Tester', 'Code Reviewer'],
    usedInCount: 3,
    successRate: 100,
    impactScore: 'Decreased local branch commit delay from 8m down to 40s',
    usageCount: 3,
    successCount: 3,
    lastUsed: 'Just now',
    relatedMemories: ['mem-11'],
  }
]

export const initialCategories: MemoryCategory[] = [
  { name: 'ALL', count: 12, type: 'ALL' },
  { name: 'PROJECT KNOWLEDGE', count: 2, type: 'Project Knowledge' },
  { name: 'AGENT LEARNINGS', count: 1, type: 'Agent Learning' },
  { name: 'ERROR PATTERNS', count: 2, type: 'Error Pattern' },
  { name: 'SUCCESSFUL PATTERNS', count: 1, type: 'Successful Pattern' },
  { name: 'WORKFLOW KNOWLEDGE', count: 3, type: 'Workflow Knowledge' },
  { name: 'CODING PATTERNS', count: 2, type: 'Coding Pattern' },
  { name: 'ARCHITECTURE KNOWLEDGE', count: 1, type: 'Architecture Knowledge' },
]

export const mockMemoryTimeline: Record<string, MemoryTimelineItem[]> = {
  'mem-01': [
    { id: 't-1', iteration: 'Iteration 01', label: 'Memory Created', details: 'Identified database constraints bypass during test runs.' },
    { id: 't-2', iteration: 'Iteration 02', label: 'Memory Refined', details: 'Added specific schema validator requirements.' },
    { id: 't-3', iteration: 'Iteration 03', label: 'Memory Strengthened', details: 'Pre-validation logic inserted before CRUD scaffolding runs.' },
  ],
  'mem-03': [
    { id: 't-4', iteration: 'Iteration 01', label: 'Memory Created', details: 'Initial model email checks failed database stress runs.' },
    { id: 't-5', iteration: 'Iteration 02', label: 'Refinement Added', details: 'Validation rules mapped inside controller schemas.' },
  ],
  'mem-10': [
    { id: 't-6', iteration: 'Iteration 02', label: 'Failure Spotted', details: 'High concurrence SQLite locking observed.' },
    { id: 't-7', iteration: 'Iteration 03', label: 'Memory Created', details: 'Locked serialization policies added to controller hooks.' }
  ]
}

export const mockQualityStats: KnowledgeQualityStats = {
  verified: 24,
  review: 5,
  lowConf: 4,
  freqUsed: 16,
  unused: 8,
}

export const mockRetentionStats: MemoryRetentionStats = {
  critical: 92,
  medium: 76,
  low: 48,
}

export const mockMemoryInsight: MemoryInsightCard = {
  title: 'Database Constraints Retention',
  evidence: '3 related tasks, 6 related failures, 94% confidence',
  recommendation: 'Continue prioritizing database validation before CRUD generation rules.',
}
