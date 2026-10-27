import { apiRequest } from './client'

export interface Policy {
  id: string
  name: string
  description?: string
  scope: string
  rules?: string
  enabled: boolean
  priority: number
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at: string
  version: number
}

export interface AgentBoundary {
  agent_id: string
  project_id: string
  allowed_environments: string
  max_risk_limit: string
  allowed_permissions?: string[]
  tool_permissions: Record<string, string>
}

export interface GovernedAction {
  id: string
  actor_type: string
  actor_id: string
  action_type: string
  project_id?: string
  environment?: string
  resource?: string
  risk_level: string
  policy_result: string
  approval_status?: string
  created_at: string
  completed_at?: string
}

export interface ApprovalRequest {
  id: string
  action_id: string
  requester: string
  approver?: string
  risk_level: string
  reason?: string
  status: string
  created_at: string
  resolved_at?: string
  expires_at?: string
}

export interface PolicyViolation {
  id: string
  actor_type: string
  actor_id: string
  action: string
  policy_id?: string
  severity: string
  description?: string
  detected_at: string
  status: string
  resolution?: string
}

export interface AuditEvent {
  id: string
  actor_type: string
  actor_id: string
  action: string
  resource?: string
  project_id?: string
  environment?: string
  decision: string
  policy_id?: string
  risk_level: string
  approval_id?: string
  timestamp: string
  trace_id?: string
}

export interface SecurityException {
  exception_id: string
  policy_id?: string
  reason: string
  requested_by: string
  approved_by: string
  scope: string
  expiration: string
  risk: string
  status: string
  created_at?: string
}

export interface GovernanceRecommendation {
  id: string
  title: string
  category: string
  recommendation_type: string
  target_id: string
  details: string
  rationale: string
  risk_reduction: string
  status: string
  created_at?: string
  reviewed_by?: string
  reviewed_at?: string
  resulting_policy_id?: string
}

export interface SecurityEvent {
  id: string
  event_type: string
  actor_type: string
  actor_id: string
  severity: string
  description: string
  occurrences: number
  first_detected_at?: string
  last_detected_at?: string
  status: string
  incident_id?: string
}

export interface RoleInfo {
  id: string
  name: string
  description?: string
  permissions: string[]
  created_at?: string
}

export interface PermissionInfo {
  id: string
  name: string
  description?: string
  resource?: string
  action?: string
  risk_level: string
}

export interface ComplianceReport {
  total_actions: number
  allowed_count: number
  denied_count: number
  pending_approvals: number
  violations_count: number
  security_events_count?: number
  risk_distribution: Record<string, number>
  active_policies_count: number
  active_exceptions_count: number
  trust_score: number
  recommendations_count?: number
}

export interface SimulateRequest {
  actor_type: string
  actor_id: string
  action_type: string
  project_id?: string
  environment?: string
  resource?: string
  tool_name?: string
}

export interface SimulationResult {
  decision: 'ALLOW' | 'DENY' | 'APPROVAL_REQUIRED' | 'CONDITIONALLY_ALLOWED'
  reason: string
  requires_approval: boolean
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  policy_id?: string
  policy_name?: string
}

export const governanceApi = {
  getPolicies: (scope?: string): Promise<Policy[]> =>
    apiRequest<Policy[]>(`/governance/policies${scope ? `?scope=${scope}` : ''}`),
    
  createPolicy: (data: Partial<Policy>): Promise<Policy> =>
    apiRequest<Policy>('/governance/policies', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  getPolicy: (id: string): Promise<Policy> =>
    apiRequest<Policy>(`/governance/policies/${id}`),

  updatePolicy: (id: string, data: Partial<Policy>): Promise<Policy> =>
    apiRequest<Policy>(`/governance/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  togglePolicy: (id: string): Promise<{ id: string; enabled: boolean }> =>
    apiRequest<{ id: string; enabled: boolean }>(`/governance/policies/${id}/toggle`, {
      method: 'POST'
    }),
    
  simulatePolicy: (id: string, data: SimulateRequest): Promise<SimulationResult> =>
    apiRequest<SimulationResult>(`/governance/policies/${id}/simulate`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  createPolicyVersion: (id: string, data: { rules: string; created_by?: string }): Promise<Policy> =>
    apiRequest<Policy>(`/governance/policies/${id}/version`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  getAgents: (projectId?: string): Promise<AgentBoundary[]> =>
    apiRequest<AgentBoundary[]>(`/governance/agents${projectId ? `?project_id=${projectId}` : ''}`),
    
  getActions: (params?: { actor_id?: string; action_type?: string; environment?: string; risk_level?: string }): Promise<GovernedAction[]> => {
    let query = ''
    if (params) {
      const qParts: string[] = []
      if (params.actor_id) qParts.push(`actor_id=${params.actor_id}`)
      if (params.action_type) qParts.push(`action_type=${params.action_type}`)
      if (params.environment) qParts.push(`environment=${params.environment}`)
      if (params.risk_level) qParts.push(`risk_level=${params.risk_level}`)
      if (qParts.length > 0) query = '?' + qParts.join('&')
    }
    return apiRequest<GovernedAction[]>(`/governance/actions${query}`)
  },
    
  getViolations: (params?: { severity?: string; status?: string }): Promise<PolicyViolation[]> => {
    let query = ''
    if (params) {
      const qParts: string[] = []
      if (params.severity) qParts.push(`severity=${params.severity}`)
      if (params.status) qParts.push(`status=${params.status}`)
      if (qParts.length > 0) query = '?' + qParts.join('&')
    }
    return apiRequest<PolicyViolation[]>(`/governance/violations${query}`)
  },
    
  getAudits: (params?: {
    actor_id?: string
    action?: string
    environment?: string
    decision?: string
    risk_level?: string
  }): Promise<AuditEvent[]> => {
    let query = ''
    if (params) {
      const qParts: string[] = []
      if (params.actor_id) qParts.push(`actor_id=${params.actor_id}`)
      if (params.action) qParts.push(`action=${params.action}`)
      if (params.environment) qParts.push(`environment=${params.environment}`)
      if (params.decision) qParts.push(`decision=${params.decision}`)
      if (params.risk_level) qParts.push(`risk_level=${params.risk_level}`)
      if (qParts.length > 0) query = '?' + qParts.join('&')
    }
    return apiRequest<AuditEvent[]>(`/governance/audit${query}`)
  },
  
  getApprovals: (status?: string): Promise<ApprovalRequest[]> =>
    apiRequest<ApprovalRequest[]>(`/governance/approvals${status ? `?status=${status}` : ''}`),
    
  approveAction: (id: string, approver: string, comment?: string): Promise<any> =>
    apiRequest<any>(`/governance/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver, comment })
    }),
    
  rejectAction: (id: string, approver: string, comment?: string): Promise<any> =>
    apiRequest<any>(`/governance/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approver, comment })
    }),
    
  getReport: (): Promise<ComplianceReport> =>
    apiRequest<ComplianceReport>('/governance/report'),

  getRiskDetails: (): Promise<any> =>
    apiRequest<any>('/governance/risk'),

  getRoles: (): Promise<RoleInfo[]> =>
    apiRequest<RoleInfo[]>('/governance/roles'),

  getPermissions: (): Promise<PermissionInfo[]> =>
    apiRequest<PermissionInfo[]>('/governance/permissions'),

  getExceptions: (status?: string): Promise<SecurityException[]> =>
    apiRequest<SecurityException[]>(`/governance/exceptions${status ? `?status=${status}` : ''}`),

  createException: (data: Partial<SecurityException> & { duration_minutes?: number }): Promise<SecurityException> =>
    apiRequest<SecurityException>('/governance/exceptions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  revokeException: (id: string, revoker: string): Promise<any> =>
    apiRequest<any>(`/governance/exceptions/${id}/revoke?revoker=${revoker}`, {
      method: 'POST'
    }),

  getRecommendations: (status?: string): Promise<GovernanceRecommendation[]> =>
    apiRequest<GovernanceRecommendation[]>(`/governance/recommendations${status ? `?status=${status}` : ''}`),

  analyzeRecommendations: (): Promise<GovernanceRecommendation[]> =>
    apiRequest<GovernanceRecommendation[]>('/governance/recommendations/analyze', {
      method: 'POST'
    }),

  applyRecommendation: (id: string, reviewer: string, comment?: string): Promise<any> =>
    apiRequest<any>(`/governance/recommendations/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify({ reviewer, comment })
    }),

  rejectRecommendation: (id: string, reviewer: string, comment?: string): Promise<any> =>
    apiRequest<any>(`/governance/recommendations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewer, comment })
    }),

  getEvents: (status?: string): Promise<SecurityEvent[]> =>
    apiRequest<SecurityEvent[]>(`/governance/events${status ? `?status=${status}` : ''}`)
}
