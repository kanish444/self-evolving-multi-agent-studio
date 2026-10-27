export interface Subtask {
  id: number
  title: string
  status: 'completed' | 'in-progress' | 'pending'
}

export interface ActivityItem {
  time: string
  action: string
}

export interface AgentPerformanceData {
  agentName: string
  tasks: number
  successRate: number
  avgExecTime: string
}

export interface Agent {
  id: string
  name: string
  role: string
  description: string
  category: 'Planning' | 'Architecture' | 'Development' | 'Testing' | 'Review' | 'Debugging' | 'Evolution'
  status: 'IDLE' | 'RUNNING' | 'IN PROGRESS' | 'COMPLETED' | 'WAITING' | 'FAILED' | 'ANALYZING'
  currentTask: string
  tasksCompleted: number
  successRate: number
  lastActive: string
  model: string
  progress: number
  subtasks: Subtask[]
  recentActivity: ActivityItem[]
  performance: {
    tasks: number
    completed: number
    failed: number
    successRate: number
    avgExecTime: string
  }
}

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'pm',
    name: 'Project Manager Agent',
    role: 'Requirement analysis and task orchestration.',
    description: 'Decomposes business requirements, defines user stories, maps dependencies, and coordinates execution phases across the pipeline.',
    category: 'Planning',
    status: 'COMPLETED',
    currentTask: 'Decompose Student CRUD requirements',
    tasksCompleted: 8,
    successRate: 98,
    lastActive: '10:41:18 AM',
    model: 'Gemini 3.5 Pro',
    progress: 100,
    subtasks: [
      { id: 1, title: 'Analyze requirements document', status: 'completed' },
      { id: 2, title: 'Decompose tasks and map deliverables', status: 'completed' },
      { id: 3, title: 'Assign tasks to Architect and Developer', status: 'completed' }
    ],
    recentActivity: [
      { time: '10:41:18 AM', action: 'Assigned task to Developer Agent' },
      { time: '10:40:55 AM', action: 'Completed requirement decomposition tree' },
      { time: '10:40:02 AM', action: 'Started requirements parsing analysis' }
    ],
    performance: {
      tasks: 8,
      completed: 8,
      failed: 0,
      successRate: 100,
      avgExecTime: '1m 15s'
    }
  },
  {
    id: 'architect',
    name: 'Architect Agent',
    role: 'System architecture and technical planning.',
    description: 'Specifies software architectural patterns, modules boundaries, and database schemas. Generates design directives.',
    category: 'Architecture',
    status: 'COMPLETED',
    currentTask: 'Design database structure and routes schema',
    tasksCompleted: 6,
    successRate: 96,
    lastActive: '10:42:02 AM',
    model: 'Gemini 3.5 Pro',
    progress: 100,
    subtasks: [
      { id: 1, title: 'Design SQLite db schema', status: 'completed' },
      { id: 2, title: 'Specify REST API endpoints layout', status: 'completed' },
      { id: 3, title: 'Approve technical implementation directives', status: 'completed' }
    ],
    recentActivity: [
      { time: '10:42:02 AM', action: 'Approved schemas for StudentController.py' },
      { time: '10:41:52 AM', action: 'Updated database tables definition file' },
      { time: '10:41:30 AM', action: 'Started schema modeling specifications' }
    ],
    performance: {
      tasks: 8,
      completed: 7,
      failed: 1,
      successRate: 98,
      avgExecTime: '54s'
    }
  },
  {
    id: 'developer',
    name: 'Developer Agent',
    role: 'Code generation and implementation.',
    description: 'Generates files, writes features, performs code edits, refactors interfaces, and implements structural backend logics.',
    category: 'Development',
    status: 'IN PROGRESS',
    currentTask: 'Implement Student CRUD API',
    tasksCompleted: 15,
    successRate: 92,
    lastActive: '10:42:15 AM',
    model: 'Gemini 3.5 Flash',
    progress: 68,
    subtasks: [
      { id: 1, title: 'Create Student model', status: 'completed' },
      { id: 2, title: 'Create database schema', status: 'completed' },
      { id: 3, title: 'Implement GET endpoint', status: 'completed' },
      { id: 4, title: 'Implement POST endpoint', status: 'in-progress' },
      { id: 5, title: 'Implement PUT endpoint', status: 'pending' },
      { id: 6, title: 'Implement DELETE endpoint', status: 'pending' }
    ],
    recentActivity: [
      { time: '10:42:15 AM', action: 'Generated StudentController.py controller file' },
      { time: '10:42:02 AM', action: 'Connected to SQLite database backend' },
      { time: '10:41:48 AM', action: 'Created GET /students retrieval endpoint' },
      { time: '10:41:32 AM', action: 'Analyzed Student model fields mapping' }
    ],
    performance: {
      tasks: 24,
      completed: 22,
      failed: 2,
      successRate: 92,
      avgExecTime: '2m 14s'
    }
  },
  {
    id: 'tester',
    name: 'Tester Agent',
    role: 'Automated software testing.',
    description: 'Generates unit tests, runs test runner scripts inside sandbox directories, and captures execution failures.',
    category: 'Testing',
    status: 'RUNNING',
    currentTask: 'Run Student API tests',
    tasksCompleted: 12,
    successRate: 95,
    lastActive: '10:42:02 AM',
    model: 'Gemini 3.5 Flash',
    progress: 45,
    subtasks: [
      { id: 1, title: 'Generate PyTest unit test files', status: 'completed' },
      { id: 2, title: 'Initialize isolated test sandbox container', status: 'in-progress' },
      { id: 3, title: 'Run endpoint diagnostic test assertions', status: 'pending' }
    ],
    recentActivity: [
      { time: '10:42:02 AM', action: 'Started 20 tests execution on API routes' },
      { time: '10:41:30 AM', action: 'Generated test_student.py script mapping' },
      { time: '10:41:00 AM', action: 'Initialized diagnostics suite profile' }
    ],
    performance: {
      tasks: 20,
      completed: 19,
      failed: 1,
      successRate: 95,
      avgExecTime: '1m 08s'
    }
  },
  {
    id: 'reviewer',
    name: 'Code Reviewer Agent',
    role: 'Code quality and engineering review.',
    description: 'Performs static code inspections, verifies styling constraints, audits complexity metrics, and suggests optimizations.',
    category: 'Review',
    status: 'WAITING',
    currentTask: 'Review StudentController.py',
    tasksCompleted: 9,
    successRate: 97,
    lastActive: '10:35:44 AM',
    model: 'Gemini 3.5 Pro',
    progress: 0,
    subtasks: [
      { id: 1, title: 'Analyze code readability and imports syntax', status: 'pending' },
      { id: 2, title: 'Verify parameterized query security rules', status: 'pending' },
      { id: 3, title: 'Check missing email validations edge cases', status: 'pending' }
    ],
    recentActivity: [
      { time: '10:35:44 AM', action: 'Completed review on models/Student.py structure' },
      { time: '10:34:20 AM', action: 'Flagged missing docstring in database connection' }
    ],
    performance: {
      tasks: 10,
      completed: 9,
      failed: 1,
      successRate: 97,
      avgExecTime: '1m 20s'
    }
  },
  {
    id: 'debugger',
    name: 'Debugger Agent',
    role: 'Failure analysis and bug fixing.',
    description: 'Diagnoses runtime crashes and build failures, inspects call traces, and rewrites patches to resolve bugs.',
    category: 'Debugging',
    status: 'WAITING',
    currentTask: 'Idle',
    tasksCompleted: 10,
    successRate: 89,
    lastActive: '10:30:12 AM',
    model: 'Gemini 3.5 Flash',
    progress: 0,
    subtasks: [
      { id: 1, title: 'Wait for test failures assignment', status: 'pending' }
    ],
    recentActivity: [
      { time: '10:30:12 AM', action: 'Patched SQL injection warning in queries list' },
      { time: '10:29:05 AM', action: 'Analyzed database connection retry loop failures' }
    ],
    performance: {
      tasks: 12,
      completed: 10,
      failed: 2,
      successRate: 89,
      avgExecTime: '1m 42s'
    }
  },
  {
    id: 'evolution',
    name: 'Evolution Agent',
    role: 'Analyze previous iterations and improve development strategy.',
    description: 'Synthesizes iteration logs and failure models to extract rules. Modifies prompts and guidelines to refine succeeding iterations.',
    category: 'Evolution',
    status: 'ANALYZING',
    currentTask: 'Analyze Iteration #3',
    tasksCompleted: 6,
    successRate: 96,
    lastActive: '10:41:32 AM',
    model: 'Gemini 3.5 Pro',
    progress: 72,
    subtasks: [
      { id: 1, title: 'Aggregate failure logs from Iteration 2', status: 'completed' },
      { id: 2, title: 'Examine pattern of raw queries warnings', status: 'completed' },
      { id: 3, title: 'Re-engineer prompt constraints for Developer Agent', status: 'in-progress' }
    ],
    recentActivity: [
      { time: '10:41:32 AM', action: 'Analyzing iteration #3 runtime patterns' },
      { time: '10:39:50 AM', action: 'Synthesized learning rules for parameter binding restrictions' }
    ],
    performance: {
      tasks: 7,
      completed: 6,
      failed: 1,
      successRate: 96,
      avgExecTime: '2m 30s'
    }
  }
]

export interface TaskQueueItem {
  id: string
  task: string
  agent: string
  priority: 'Low' | 'Medium' | 'High'
  status: string
  progress: number
  started: string
}

export const MOCK_TASK_QUEUE: TaskQueueItem[] = [
  {
    id: 't1',
    task: 'Implement Student CRUD API',
    agent: 'Developer Agent',
    priority: 'High',
    status: 'In Progress',
    progress: 68,
    started: '10:41:05 AM'
  },
  {
    id: 't2',
    task: 'Run Student API tests',
    agent: 'Tester Agent',
    priority: 'High',
    status: 'Running',
    progress: 45,
    started: '10:42:02 AM'
  },
  {
    id: 't3',
    task: 'Review StudentController.py',
    agent: 'Code Reviewer Agent',
    priority: 'Medium',
    status: 'Waiting',
    progress: 0,
    started: '10:42:15 AM'
  },
  {
    id: 't4',
    task: 'Analyze Iteration #3',
    agent: 'Evolution Agent',
    priority: 'High',
    status: 'Analyzing',
    progress: 72,
    started: '10:41:32 AM'
  }
]

export interface ActivityFeedItem {
  id: string
  time: string
  agent: string
  action: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export const MOCK_ACTIVITY_FEED: ActivityFeedItem[] = [
  { id: 'a1', time: '10:42:15 AM', agent: 'Developer Agent', action: 'Created StudentController.py', type: 'success' },
  { id: 'a2', time: '10:42:02 AM', agent: 'Tester Agent', action: 'Started 20 tests', type: 'info' },
  { id: 'a3', time: '10:41:52 AM', agent: 'Architect Agent', action: 'Updated architecture definitions structure', type: 'success' },
  { id: 'a4', time: '10:41:32 AM', agent: 'Evolution Agent', action: 'Analyzing iteration #3 parameters convergence', type: 'info' },
  { id: 'a5', time: '10:41:18 AM', agent: 'Project Manager Agent', action: 'Assigned task to Developer Agent', type: 'info' }
]

export interface HandoffItem {
  id: string
  fromAgent: string
  toAgent: string
  timestamp: string
}

export const MOCK_HANDOFFS: HandoffItem[] = [
  { id: 'h1', fromAgent: 'Project Manager', toAgent: 'Architect', timestamp: '10:40:02 AM' },
  { id: 'h2', fromAgent: 'Architect', toAgent: 'Developer', timestamp: '10:41:18 AM' },
  { id: 'h3', fromAgent: 'Developer', toAgent: 'Tester', timestamp: '10:42:02 AM' },
  { id: 'h4', fromAgent: 'Tester', toAgent: 'Debugger', timestamp: '10:42:10 AM' },
  { id: 'h5', fromAgent: 'Debugger', toAgent: 'Tester', timestamp: '10:42:35 AM' },
  { id: 'h6', fromAgent: 'Tester', toAgent: 'Code Reviewer', timestamp: '10:42:48 AM' },
  { id: 'h7', fromAgent: 'Code Reviewer', toAgent: 'Evolution Agent', timestamp: '10:42:55 AM' }
]
