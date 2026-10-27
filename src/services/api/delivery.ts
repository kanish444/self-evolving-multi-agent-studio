import { apiRequest } from './client'

export interface Environment {
  id: string
  environment_name: string
  base_url: string
  runtime_config: Record<string, any>
  deployment_policy: Record<string, any>
  health_check_config: Record<string, any>
}

export interface Release {
  id: string
  project_id: string
  artifact_id: string
  version: string
  environment: string
  status: 'DRAFT' | 'READY' | 'APPROVAL_REQUIRED' | 'APPROVED' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED' | 'ROLLED_BACK' | 'CANCELLED'
  created_by: string
  approved_by?: string
  created_at: string
  deployed_at?: string
  completed_at?: string
  rollback_reference?: string
}

export interface DeploymentStage {
  id: string
  deployment_id: string
  stage_name: 'SOURCE_VALIDATION' | 'BUILD' | 'UNIT_TEST' | 'SECURITY_SCAN' | 'PACKAGE' | 'DEPLOY' | 'SMOKE_TEST'
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  logs_reference?: string
  started_at: string
  completed_at?: string
}

export interface DeploymentApproval {
  id: string
  deployment_id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comments?: string
  approved_by?: string
  approved_at?: string
}

export interface HealthCheckResult {
  id: string
  deployment_id: string
  name: string
  status: 'PASS' | 'FAIL'
  check_type: string
  response_time_ms: number
  checked_at: string
}

export interface DeploymentDetails {
  id: string
  environment: string
  status: string
  provider: string
  strategy: string
  started_at: string
  completed_at?: string
  error_message?: string
  stages: DeploymentStage[]
  approvals: DeploymentApproval[]
  health_checks: HealthCheckResult[]
}

export interface ReleaseDetailsResponse {
  release: Release
  deployments: DeploymentDetails[]
}

export interface TriggerReleasePayload {
  project_id: string
  version: string
  environment: string
  created_by: string
  simulate_health_failure?: boolean
}

export interface SubmitApprovalPayload {
  approved: boolean
  comments: string
  approved_by: string
  simulate_health_failure?: boolean
}

export const deliveryApi = {
  getEnvironments: (projectId: string) =>
    apiRequest<Environment[]>(`/delivery/environments/${projectId}`),

  getReleases: (projectId: string) =>
    apiRequest<Release[]>(`/delivery/releases/${projectId}`),

  getReleaseDetails: (releaseId: string) =>
    apiRequest<ReleaseDetailsResponse>(`/delivery/releases/detail/${releaseId}`),

  triggerRelease: (payload: TriggerReleasePayload) =>
    apiRequest<any>(`/delivery/releases`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitApproval: (approvalId: string, payload: SubmitApprovalPayload) =>
    apiRequest<any>(`/delivery/approvals/${approvalId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  rollback: (deploymentId: string) =>
    apiRequest<any>(`/delivery/deployments/${deploymentId}/rollback`, {
      method: 'POST',
    }),
}
