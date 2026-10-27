import { apiRequest } from './client'

export interface MonitoredService {
  id: string
  project_id: string
  environment: string
  service_name: string
  service_type: string
  endpoint?: string
  health_check_config?: string
  monitoring_enabled: boolean
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN'
  created_at: string
  updated_at: string
}

export interface HealthCheckResult {
  id: string
  service_id: string
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'TIMEOUT'
  response_code?: number
  latency_ms: number
  error_message?: string
  checked_at: string
}

export interface Metric {
  id: string
  service_id: string
  name: string
  value: number
  unit: string
  timestamp: string
  source: string
  labels?: string
}

export interface AlertRule {
  id: string
  service_id: string
  metric_name: string
  operator: string
  threshold: number
  duration_seconds: number
  severity: string
  environment: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  service_id: string
  rule_id?: string
  severity: string
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED'
  message: string
  triggered_at: string
  resolved_at?: string
  incident_id?: string
}

export interface Incident {
  id: string
  project_id: string
  service_id?: string
  environment: string
  title: string
  description: string
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4'
  status: 'DETECTED' | 'INVESTIGATING' | 'MITIGATING' | 'MONITORING' | 'RESOLVED' | 'CLOSED'
  detected_at: string
  acknowledged_at?: string
  resolved_at?: string
  root_cause?: string
  resolution_summary?: string
  incident_type: string
}

export interface IncidentEvent {
  id: string
  incident_id: string
  event_type: string
  message: string
  timestamp: string
  details?: string
}

export interface IncidentAnalysis {
  id: string
  incident_id: string
  summary: string
  probable_root_cause: string
  evidence: string // JSON string array
  confidence: number
  impact: string
  recommended_actions: string // JSON ActionRecommendation array
  requires_human: boolean
  analyzed_at: string
}

export interface RemediationAction {
  id: string
  incident_id: string
  action: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  reason?: string
  risk?: string
  expected_impact?: string
  requires_approval: boolean
  approved_by?: string
  approved_at?: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface PostIncidentReview {
  id: string
  incident_id: string
  impact: string
  root_cause: string
  contributing_factors?: string // JSON string
  what_went_well?: string // JSON string
  what_went_wrong?: string // JSON string
  corrective_actions?: string // JSON string
  preventive_actions?: string // JSON string
  learning_candidates?: string // JSON string
  status: 'DRAFT' | 'COMPLETED'
  created_at: string
  updated_at: string
}

export interface ImprovementProposal {
  id: string
  project_id: string
  incident_id?: string
  title: string
  description: string
  proposal_type: string
  task_id?: string
  status: string
  created_at: string
  updated_at: string
}

export interface IncidentDetailsResponse {
  incident: Incident
  events: IncidentEvent[]
  analysis?: IncidentAnalysis
  remediation_actions: RemediationAction[]
}

export interface ServiceCreatePayload {
  project_id: string
  environment: string
  service_name: string
  service_type: string
  endpoint?: string
  health_check_config?: Record<string, any>
  monitoring_enabled?: boolean
}

export interface AlertRuleCreatePayload {
  service_id: string
  metric_name: string
  operator: string
  threshold: number
  duration_seconds?: number
  severity: string
  environment: string
  enabled?: boolean
}

export interface IncidentCreatePayload {
  project_id: string
  service_id?: string
  environment: string
  title: string
  description: string
  severity: string
  incident_type: string
}

export interface PostReviewUpdatePayload {
  impact: string
  root_cause: string
  contributing_factors?: string[]
  what_went_well?: string[]
  what_went_wrong?: string[]
  corrective_actions?: string[]
  preventive_actions?: string[]
  learning_candidates?: Record<string, any>[]
  status?: string
}

export const monitoringApi = {
  getServices: (projectId?: string) =>
    apiRequest<MonitoredService[]>(`/monitoring/services`, { params: { project_id: projectId } }),

  registerService: (payload: ServiceCreatePayload) =>
    apiRequest<MonitoredService>(`/monitoring/services`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getServiceDetails: (id: string) =>
    apiRequest<MonitoredService>(`/monitoring/services/${id}`),

  triggerServiceHealthCheck: (id: string, simulateStatus?: string) =>
    apiRequest<HealthCheckResult>(`/monitoring/services/${id}/health?simulate_status=${simulateStatus || ''}`, {
      method: 'POST',
    }),

  getServiceMetrics: (id: string, metricName?: string, limit?: number) =>
    apiRequest<Metric[]>(`/monitoring/services/${id}/metrics`, {
      params: { metric_name: metricName, limit },
    }),

  getAlerts: (serviceId?: string, status?: string) =>
    apiRequest<Alert[]>(`/monitoring/alerts`, { params: { service_id: serviceId, status } }),

  configureAlertRule: (payload: AlertRuleCreatePayload) =>
    apiRequest<AlertRule>(`/monitoring/alerts/rules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getIncidents: (filters: {
    project_id?: string
    service_id?: string
    environment?: string
    severity?: string
    status?: string
    incident_type?: string
  } = {}) =>
    apiRequest<Incident[]>(`/incidents`, { params: filters }),

  createIncident: (payload: IncidentCreatePayload) =>
    apiRequest<Incident>(`/incidents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getIncidentDetails: (id: string) =>
    apiRequest<IncidentDetailsResponse>(`/incidents/${id}`),

  acknowledgeIncident: (id: string) =>
    apiRequest<Incident>(`/incidents/${id}/acknowledge`, { method: 'POST' }),

  resolveIncident: (id: string) =>
    apiRequest<Incident>(`/incidents/${id}/resolve`, { method: 'POST' }),

  triggerAIAnalysis: (id: string) =>
    apiRequest<IncidentDetailsResponse>(`/incidents/${id}/analyze`, { method: 'POST' }),

  getIncidentTimeline: (id: string) =>
    apiRequest<IncidentEvent[]>(`/incidents/${id}/timeline`),

  approveAction: (id: string, actionId: string, approvedBy: string) =>
    apiRequest<{ status: string; message: string }>(`/incidents/${id}/approve-action?action_id=${actionId}`, {
      method: 'POST',
      body: JSON.stringify({ approved_by: approvedBy }),
    }),

  rejectAction: (id: string, actionId: string, approvedBy: string) =>
    apiRequest<RemediationAction>(`/incidents/${id}/reject-action?action_id=${actionId}`, {
      method: 'POST',
      body: JSON.stringify({ approved_by: approvedBy }),
    }),

  getPostIncidentReview: (id: string) =>
    apiRequest<PostIncidentReview>(`/incidents/${id}/post-review`),

  savePostIncidentReview: (id: string, payload: PostReviewUpdatePayload) =>
    apiRequest<PostIncidentReview>(`/incidents/${id}/post-review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
