import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Users,
  Search,
  Lock,
  FileCheck,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  BarChart2,
  Sparkles,
  Key,
  Terminal,
  Check,
  X,
  AlertOctagon,
  RefreshCw,
  Plus
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/common/PageHeader'
import { governanceApi } from '../../services/api/governance'
import { useProject } from '../../context/ProjectContext'
import type {
  Policy,
  AgentBoundary,
  GovernedAction,
  ApprovalRequest,
  PolicyViolation,
  AuditEvent,
  ComplianceReport,
  SecurityException,
  GovernanceRecommendation,
  SecurityEvent,
  RoleInfo
} from '../../services/api/governance'

export default function Governance() {
  const { activeProjectId } = useProject()
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'POLICIES' | 'SIMULATOR' | 'AGENTS' | 'APPROVALS' | 'RISK' | 'AUDIT' | 'RECOMMENDATIONS'
  >('DASHBOARD')

  // Global State
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [agents, setAgents] = useState<AgentBoundary[]>([])
  const [actions, setActions] = useState<GovernedAction[]>([])
  const [_violations, setViolations] = useState<PolicyViolation[]>([])
  const [audits, setAudits] = useState<AuditEvent[]>([])
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [recommendations, setRecommendations] = useState<GovernanceRecommendation[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [_exceptions, setExceptions] = useState<SecurityException[]>([])
  const [roles, setRoles] = useState<RoleInfo[]>([])

  // Loading and action indicators
  const [loading, setLoading] = useState(false)
  const [operatorId, setOperatorId] = useState('admin') // Simulate current operator persona
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // Simulator State
  const [simActorType, setSimActorType] = useState('AGENT')
  const [simActorId, setSimActorId] = useState('developer')
  const [simActionType, setSimActionType] = useState('DEPLOY_PRODUCTION')
  const [simEnv, setSimEnv] = useState('PRODUCTION')
  const [simResource, setSimResource] = useState('src/pages/Governance/index.tsx')
  const [simTool, setSimTool] = useState('')
  const [simResult, setSimResult] = useState<any>(null)
  const [simulating, setSimulating] = useState(false)

  // Audit Filters
  const [filterActor, setFilterActor] = useState('')
  const [filterEnv, setFilterEnv] = useState('')
  const [filterDecision, setFilterDecision] = useState('')
  const [filterRisk, setFilterRisk] = useState('')

  // Risk Tab Filters
  const [riskTabLevel, setRiskTabLevel] = useState<string>('ALL')

  // Policy Creation / Versioning Form
  const [showCreatePolicy, setShowCreatePolicy] = useState(false)
  const [newPolicyId, setNewPolicyId] = useState('')
  const [newPolicyName, setNewPolicyName] = useState('')
  const [newPolicyDesc, setNewPolicyDesc] = useState('')
  const [newPolicyScope, setNewPolicyScope] = useState('GLOBAL')
  const [newPolicyRules, setNewPolicyRules] = useState('{\n  "action": "DEPLOY_PRODUCTION",\n  "environment": "PRODUCTION",\n  "decision": "APPROVAL_REQUIRED",\n  "requires_approval": true\n}')

  // Versioning state
  const [selectedPolicyForVersion, setSelectedPolicyForVersion] = useState<Policy | null>(null)
  const [versionRulesInput, setVersionRulesInput] = useState('')

  // Auto clear feedback banner
  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 6000)
      return () => clearTimeout(t)
    }
  }, [actionFeedback])

  // Fetch Telemetry datasets
  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [
        repData, polData, agData, actData, vioData,
        audData, appData, recData, evData, excData, roleData
      ] = await Promise.all([
        governanceApi.getReport().catch(() => null),
        governanceApi.getPolicies().catch(() => []),
        governanceApi.getAgents().catch(() => []),
        governanceApi.getActions().catch(() => []),
        governanceApi.getViolations().catch(() => []),
        governanceApi.getAudits().catch(() => []),
        governanceApi.getApprovals().catch(() => []),
        governanceApi.getRecommendations().catch(() => []),
        governanceApi.getEvents().catch(() => []),
        governanceApi.getExceptions().catch(() => []),
        governanceApi.getRoles().catch(() => [])
      ])
      if (repData) setReport(repData)
      setPolicies(polData)
      setAgents(agData)
      setActions(actData)
      setViolations(vioData)
      setAudits(audData)
      setApprovals(appData)
      setRecommendations(recData)
      setSecurityEvents(evData)
      setExceptions(excData)
      setRoles(roleData)
    } catch (err) {
      console.error('Failed to load governance dataset:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Execute Simulation Check
  const runSimulation = async () => {
    setSimulating(true)
    try {
      const polId = policies.length > 0 ? policies[0].id : 'POL-001'
      const res = await governanceApi.simulatePolicy(polId, {
        actor_type: simActorType,
        actor_id: simActorId,
        action_type: simActionType,
        environment: simEnv,
        project_id: activeProjectId,
        resource: simResource,
        tool_name: simTool || undefined
      })
      setSimResult(res)
    } catch (err) {
      console.error('Simulation check failed:', err)
      setSimResult({
        decision: 'DENY',
        reason: 'Simulation engine error: failed to resolve rules.',
        risk_level: 'CRITICAL',
        requires_approval: false
      })
    } finally {
      setSimulating(false)
    }
  }

  // Handle Approvals
  const handleApprove = async (reqId: string) => {
    try {
      const res = await governanceApi.approveAction(reqId, operatorId)
      setActionFeedback({ type: 'success', message: res.message || 'Request approved successfully!' })
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to approve request. Potential Four-Eyes Principle self-approval violation caught!'
      })
      fetchAllData()
    }
  }

  const handleReject = async (reqId: string) => {
    try {
      const res = await governanceApi.rejectAction(reqId, operatorId)
      setActionFeedback({ type: 'info', message: res.message || 'Request rejected successfully.' })
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to reject request.' })
      fetchAllData()
    }
  }

  // Toggle Policy status
  const handleTogglePolicy = async (polId: string) => {
    try {
      const res = await governanceApi.togglePolicy(polId)
      setActionFeedback({
        type: 'success',
        message: `Policy ${polId} is now ${res.enabled ? 'Enabled' : 'Disabled'}.`
      })
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to toggle policy.' })
    }
  }

  // Create new policy
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPolicyId || !newPolicyName || !newPolicyRules) return
    try {
      await governanceApi.createPolicy({
        id: newPolicyId,
        name: newPolicyName,
        description: newPolicyDesc,
        scope: newPolicyScope,
        rules: newPolicyRules,
        enabled: true,
        priority: 100,
        created_by: operatorId
      })
      setActionFeedback({ type: 'success', message: `Policy ${newPolicyId} created successfully.` })
      setShowCreatePolicy(false)
      setNewPolicyId('')
      setNewPolicyName('')
      setNewPolicyDesc('')
      setNewPolicyRules('{\n  "action": "DEPLOY_PRODUCTION",\n  "environment": "PRODUCTION",\n  "decision": "APPROVAL_REQUIRED",\n  "requires_approval": true\n}')
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to create policy.' })
    }
  }

  // Create new Policy Version
  const handleCreateNewVersion = async () => {
    if (!selectedPolicyForVersion || !versionRulesInput) return
    try {
      const res = await governanceApi.createPolicyVersion(selectedPolicyForVersion.id, {
        rules: versionRulesInput,
        created_by: operatorId
      })
      setActionFeedback({
        type: 'success',
        message: `Policy ${res.id} updated to version ${res.version} successfully.`
      })
      setSelectedPolicyForVersion(null)
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to create policy version.' })
    }
  }

  // AI Recommendation Handlers
  const handleApplyRecommendation = async (recId: string) => {
    try {
      const res = await governanceApi.applyRecommendation(recId, operatorId)
      setActionFeedback({ type: 'success', message: res.message || 'AI Recommendation approved and policy updated!' })
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to apply recommendation.' })
    }
  }

  const handleRejectRecommendation = async (recId: string) => {
    try {
      const res = await governanceApi.rejectRecommendation(recId, operatorId)
      setActionFeedback({ type: 'info', message: res.message || 'Recommendation rejected.' })
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to reject recommendation.' })
    }
  }

  const handleTriggerAnalysis = async () => {
    setLoading(true)
    try {
      await governanceApi.analyzeRecommendations()
      setActionFeedback({ type: 'success', message: 'GovernanceAgent completed telemetry & policy scan.' })
      fetchAllData()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Analysis scan failed.' })
    } finally {
      setLoading(false)
    }
  }

  // Fetch audited events with filters
  const applyAuditFilters = async () => {
    try {
      const filtered = await governanceApi.getAudits({
        actor_id: filterActor || undefined,
        environment: filterEnv || undefined,
        decision: filterDecision || undefined,
        risk_level: filterRisk || undefined
      })
      setAudits(filtered)
    } catch (err) {
      console.error('Failed to query audit logs:', err)
    }
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision ? decision.toUpperCase() : '') {
      case 'ALLOW':
        return <Badge variant="success">ALLOW</Badge>
      case 'DENY':
        return <Badge variant="error">DENY</Badge>
      case 'APPROVAL_REQUIRED':
        return <Badge variant="warning">APPROVAL REQUIRED</Badge>
      case 'CONDITIONALLY_ALLOWED':
        return <Badge variant="info">CONDITIONAL</Badge>
      default:
        return <Badge variant="neutral">{decision}</Badge>
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk ? risk.toUpperCase() : '') {
      case 'LOW':
        return <Badge variant="success">LOW</Badge>
      case 'MEDIUM':
        return <Badge variant="info">MEDIUM</Badge>
      case 'HIGH':
        return <Badge variant="warning">HIGH</Badge>
      case 'CRITICAL':
        return <Badge variant="error">CRITICAL</Badge>
      default:
        return <Badge variant="neutral">{risk}</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full bg-background custom-scrollbar overflow-y-auto p-6 space-y-6">
      {/* Page Header with Operator Persona Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Governance, Security & AI Trust Center"
          description="Centralized Governance layer enforcing Default Deny, Least Privilege, Explicit Authorization, Human Oversight, and Immutable Auditing."
        />
        <div className="flex items-center gap-2 bg-surface p-2 border border-border rounded text-xs font-mono self-start md:self-auto shadow-xs">
          <Key className="w-3.5 h-3.5 text-accent" />
          <span className="text-text-muted">Operator Persona:</span>
          <select
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="admin">Administrator (Role: ADMIN)</option>
            <option value="dev_user">Lead Developer (Role: DEVELOPER)</option>
            <option value="release_mgr">Release Manager (Role: RELEASE_MANAGER)</option>
            <option value="security_rev">Security Reviewer (Role: SECURITY_REVIEWER)</option>
            <option value="tester_user">QA Tester (Role: TESTER)</option>
            <option value="viewer_user">Guest Observer (Role: VIEWER)</option>
          </select>
          <Button variant="ghost" onClick={fetchAllData} size="sm" className="h-7 w-7 p-0" title="Refresh state">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded border font-mono text-xs flex items-center justify-between transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : actionFeedback.type === 'error'
              ? 'bg-error/10 border-error/30 text-error'
              : 'bg-accent/10 border-accent/30 text-accent'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : actionFeedback.type === 'error' ? (
              <AlertOctagon className="w-4 h-4 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-current hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-1 overflow-x-auto custom-scrollbar pb-0.5">
        {[
          { id: 'DASHBOARD', label: 'AI Trust Center' },
          { id: 'POLICIES', label: `Policy Center (${policies.length})` },
          { id: 'SIMULATOR', label: 'Policy Simulator' },
          { id: 'AGENTS', label: `Agent Governance (${agents.length})` },
          { id: 'APPROVALS', label: `Approval Center (${approvals.filter((a) => a.status === 'PENDING').length})` },
          { id: 'RISK', label: 'Risk Dashboard' },
          { id: 'AUDIT', label: 'Audit Explorer' },
          { id: 'RECOMMENDATIONS', label: `AI Recommendations (${recommendations.filter((r) => r.status === 'PROPOSED').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-mono border-b-2 whitespace-nowrap font-semibold transition-all ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-6 bg-surface/50 border border-dashed border-border rounded font-mono text-xs text-text-muted animate-pulse">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin text-accent" />
          Syncing with core PolicyEngine & RBAC telemetry...
        </div>
      )}

      {/* TAB 1: AI TRUST CENTER & DASHBOARD */}
      {activeTab === 'DASHBOARD' && report && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-surface-elevated border border-border border-l-4 border-l-success rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Governance Health</span>
                <ShieldCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold font-mono text-success">
                    {report.trust_score >= 80 ? 'OPTIMAL' : report.trust_score >= 50 ? 'ATTENTION' : 'CRITICAL'}
                  </h3>
                  <span className="text-xs font-mono text-text-muted">({report.trust_score}%)</span>
                </div>
                <p className="text-[10.5px] text-text-muted mt-1">Multi-agent policy compliance index</p>
              </div>
            </div>

            <div className="bg-surface-elevated border border-border border-l-4 border-l-accent rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Governed Actions</span>
                <FileCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-mono text-text-primary">{report.total_actions}</h3>
                <p className="text-[10.5px] text-text-muted mt-1 font-mono">
                  Allowed: <span className="text-success font-semibold">{report.allowed_count}</span> • Denied: <span className="text-error font-semibold">{report.denied_count}</span>
                </p>
              </div>
            </div>

            <div className="bg-surface-elevated border border-border border-l-4 border-l-error rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Policy Violations</span>
                <ShieldAlert className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-mono text-error">{report.violations_count}</h3>
                <p className="text-[10.5px] text-text-muted mt-1 font-mono">
                  Pending Approvals: <span className="text-warning font-semibold">{approvals.filter(a => a.status === 'PENDING').length}</span>
                </p>
              </div>
            </div>

            <div className="bg-surface-elevated border border-border border-l-4 border-l-system rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Active Guardrails</span>
                <Sliders className="w-5 h-5 text-system" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-mono text-text-primary">{report.active_policies_count} Policies</h3>
                <p className="text-[10.5px] text-text-muted mt-1 font-mono">
                  Active exceptions: <span className="text-warning font-semibold">{report.active_exceptions_count}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <BarChart2 className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">Risk Level Distribution</h3>
              </div>
              <div className="space-y-3 font-mono text-xs">
                {Object.entries(report.risk_distribution).map(([risk, count]) => {
                  const maxCount = Math.max(...Object.values(report.risk_distribution), 1)
                  const percentage = Math.round((count / maxCount) * 100)
                  return (
                    <div key={risk} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          {getRiskBadge(risk)}
                          <span className="text-text-muted text-[11px]">Level</span>
                        </span>
                        <span className="font-semibold">{count} actions</span>
                      </div>
                      <div className="w-full bg-background border border-border rounded h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-sm ${
                            risk === 'CRITICAL' ? 'bg-error' : risk === 'HIGH' ? 'bg-warning' : risk === 'MEDIUM' ? 'bg-info' : 'bg-success'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Security Events Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">Security Events Detector</h3>
                </div>
                <Badge variant={securityEvents.length > 0 ? 'warning' : 'success'}>
                  {securityEvents.length} detected
                </Badge>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                {securityEvents.length === 0 ? (
                  <p className="text-xs text-text-muted font-mono py-4 text-center">No anomalous security events detected.</p>
                ) : (
                  securityEvents.map((ev) => (
                    <div key={ev.id} className="p-2.5 bg-background border border-border rounded flex flex-col space-y-1 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-text-primary text-[11px]">{ev.event_type}</span>
                        {getRiskBadge(ev.severity)}
                      </div>
                      <p className="text-[11px] text-text-muted">{ev.description}</p>
                      <div className="flex justify-between text-[10px] text-text-muted pt-1 border-t border-border/40">
                        <span>Target: {ev.actor_type}:{ev.actor_id}</span>
                        <span>{ev.occurrences} occurrence(s)</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* AI Operational Transparency Stream */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">
                  AI Action Transparency Stream (Operational Explanations)
                </h3>
              </div>
              <Badge variant="neutral">Zero Hidden Chain-of-Thought</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-surface text-[10px] uppercase font-bold text-text-muted border-b border-border">
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Agent / Actor</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">Target Resource</th>
                    <th className="p-2.5">Risk</th>
                    <th className="p-2.5">Policy Decision</th>
                    <th className="p-2.5">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {actions.slice(0, 10).map((act) => (
                    <tr key={act.id} className="hover:bg-surface/30">
                      <td className="p-2.5 text-[11px] text-text-muted">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="p-2.5 font-bold text-accent">
                        {act.actor_type}:{act.actor_id}
                      </td>
                      <td className="p-2.5 font-semibold">{act.action_type}</td>
                      <td className="p-2.5 text-text-muted truncate max-w-[200px]" title={act.resource || undefined}>
                        {act.resource || 'N/A'}
                      </td>
                      <td className="p-2.5">{getRiskBadge(act.risk_level)}</td>
                      <td className="p-2.5">{getDecisionBadge(act.policy_result)}</td>
                      <td className="p-2.5 text-[11px]">
                        <span
                          className={`font-semibold ${
                            act.approval_status === 'APPROVED'
                              ? 'text-success'
                              : act.approval_status === 'REJECTED'
                              ? 'text-error'
                              : act.approval_status === 'PENDING'
                              ? 'text-warning'
                              : 'text-text-muted'
                          }`}
                        >
                          {act.approval_status || 'DIRECT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {actions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-text-muted font-mono">
                        No recent governed actions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: POLICIES & VERSIONING CENTER */}
      {activeTab === 'POLICIES' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">
                Active Governance Policies ({policies.length})
              </h3>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Versioned policy rules evaluated in priority order. Deny overrides Allow.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowCreatePolicy(!showCreatePolicy)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {showCreatePolicy ? 'Close Form' : 'Create Policy'}
            </Button>
          </div>

          {/* Create Policy Form */}
          {showCreatePolicy && (
            <Card className="p-5 border-accent/40 space-y-4">
              <h4 className="text-xs font-bold uppercase font-mono text-accent flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Define New Security Policy
              </h4>
              <form onSubmit={handleCreatePolicy} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-text-muted mb-1 text-[11px]">Policy ID</label>
                    <input
                      type="text"
                      placeholder="POL-005"
                      value={newPolicyId}
                      onChange={(e) => setNewPolicyId(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2.5 py-1.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1 text-[11px]">Policy Name</label>
                    <input
                      type="text"
                      placeholder="Database Migration Guard"
                      value={newPolicyName}
                      onChange={(e) => setNewPolicyName(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2.5 py-1.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1 text-[11px]">Scope</label>
                    <select
                      value={newPolicyScope}
                      onChange={(e) => setNewPolicyScope(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2.5 py-1.5"
                    >
                      <option value="GLOBAL">GLOBAL</option>
                      <option value="PROJECT">PROJECT</option>
                      <option value="AGENT">AGENT</option>
                      <option value="TOOL">TOOL</option>
                      <option value="ENVIRONMENT">ENVIRONMENT</option>
                      <option value="RESOURCE">RESOURCE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-text-muted mb-1 text-[11px]">Description</label>
                  <input
                    type="text"
                    placeholder="Require admin approval before modifying database schemas in staging or production"
                    value={newPolicyDesc}
                    onChange={(e) => setNewPolicyDesc(e.target.value)}
                    className="w-full bg-background border border-border rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-text-muted mb-1 text-[11px]">Rules (JSON configuration)</label>
                  <textarea
                    value={newPolicyRules}
                    onChange={(e) => setNewPolicyRules(e.target.value)}
                    className="w-full h-24 bg-background border border-border rounded p-2 font-mono text-xs custom-scrollbar"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreatePolicy(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Policy</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Edit / New Version Modal */}
          {selectedPolicyForVersion && (
            <Card className="p-5 border-warning/40 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase font-mono text-warning flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Create New Version for {selectedPolicyForVersion.name} (Current: v{selectedPolicyForVersion.version})
                </h4>
                <button onClick={() => setSelectedPolicyForVersion(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-text-muted font-mono">
                Modifying policy rules generates a new immutable historical version record (v{selectedPolicyForVersion.version + 1}).
              </p>
              <textarea
                value={versionRulesInput}
                onChange={(e) => setVersionRulesInput(e.target.value)}
                className="w-full h-32 bg-background border border-border rounded p-2.5 font-mono text-xs custom-scrollbar"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelectedPolicyForVersion(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNewVersion}>Save & Increment Version</Button>
              </div>
            </Card>
          )}

          {/* Policies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((pol) => {
              let parsedRules: any = {}
              try {
                parsedRules = JSON.parse(pol.rules || '{}')
              } catch (e) {
                parsedRules = { raw: pol.rules }
              }
              return (
                <Card key={pol.id} className="p-4 space-y-3 font-mono text-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary">{pol.name}</span>
                          <Badge variant="neutral">v{pol.version}</Badge>
                          <Badge variant="info">{pol.scope}</Badge>
                        </div>
                        <p className="text-[11px] text-text-muted mt-1">{pol.description}</p>
                      </div>
                      <Badge variant={pol.enabled ? 'success' : 'error'}>{pol.enabled ? 'Active' : 'Disabled'}</Badge>
                    </div>

                    <div className="bg-background border border-border rounded p-2 text-[11px]">
                      <span className="text-[9px] uppercase font-bold text-text-muted block mb-1">Configured Rules JSON</span>
                      <pre className="overflow-x-auto max-h-24 custom-scrollbar text-text-muted">
                        {JSON.stringify(parsedRules, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-text-muted">
                    <span>Priority: {pol.priority}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2"
                        onClick={() => {
                          setSelectedPolicyForVersion(pol)
                          setVersionRulesInput(pol.rules || '{}')
                        }}
                      >
                        New Version
                      </Button>
                      <Button
                        size="sm"
                        variant={pol.enabled ? 'ghost' : 'outline'}
                        className={`h-6 text-[10px] px-2 ${pol.enabled ? 'text-text-muted' : 'text-success border-success'}`}
                        onClick={() => handleTogglePolicy(pol.id)}
                      >
                        {pol.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE POLICY SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          {/* Simulator Controls */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Play className="w-4 h-4 text-success" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Policy Engine Simulator Parameters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Actor Type</label>
                <select
                  value={simActorType}
                  onChange={(e) => setSimActorType(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2"
                >
                  <option value="AGENT">AI Agent</option>
                  <option value="USER">User (Human Operator)</option>
                  <option value="TOOL">Tool / Integration</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Actor ID</label>
                <input
                  type="text"
                  value={simActorId}
                  onChange={(e) => setSimActorId(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Action Request</label>
                <select
                  value={simActionType}
                  onChange={(e) => setSimActionType(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2"
                >
                  <option value="READ_PROJECT">READ_PROJECT (Low Risk)</option>
                  <option value="READ_FILE">READ_FILE (Low Risk)</option>
                  <option value="WRITE_CODE">WRITE_CODE (Medium Risk)</option>
                  <option value="RUN_TEST">RUN_TEST (Low Risk)</option>
                  <option value="RUN_SANDBOX">RUN_SANDBOX (Execute code)</option>
                  <option value="DEPLOY_STAGING">DEPLOY_STAGING (Medium Risk)</option>
                  <option value="DEPLOY_PRODUCTION">DEPLOY_PRODUCTION (High Risk)</option>
                  <option value="MODIFY_DATABASE">MODIFY_DATABASE (Critical Risk)</option>
                  <option value="ACCESS_SECRET">ACCESS_SECRET (High Risk)</option>
                  <option value="MODIFY_CONFIGURATION">MODIFY_CONFIGURATION (High Risk)</option>
                  <option value="MODIFY_POLICY">MODIFY_POLICY (Critical Risk)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Target Environment</label>
                <select
                  value={simEnv}
                  onChange={(e) => setSimEnv(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2"
                >
                  <option value="PRODUCTION">Production</option>
                  <option value="STAGING">Staging</option>
                  <option value="DEVELOPMENT">Development</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Target Resource</label>
                <input
                  type="text"
                  value={simResource}
                  onChange={(e) => setSimResource(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">Tool Name (Optional)</label>
                <select
                  value={simTool}
                  onChange={(e) => setSimTool(e.target.value)}
                  className="w-full bg-background border border-border rounded p-2"
                >
                  <option value="">None (Generic)</option>
                  <option value="filesystem">Filesystem</option>
                  <option value="sandbox">Sandbox Container</option>
                  <option value="database">Database Client</option>
                  <option value="deployment">Deployment Pipeline</option>
                  <option value="secret_manager">Secret Manager</option>
                </select>
              </div>
            </div>

            <Button onClick={runSimulation} disabled={simulating} className="w-full">
              {simulating ? 'Evaluating Against Rules...' : 'Simulate Governance Decision'}
            </Button>
          </Card>

          {/* Simulation Result Output */}
          <Card className="p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider">Simulation Output & Decision Proof</h3>
                {simResult && getDecisionBadge(simResult.decision)}
              </div>

              {!simResult ? (
                <div className="p-8 text-center text-text-muted font-mono space-y-2">
                  <Sliders className="w-8 h-8 mx-auto text-text-muted/40" />
                  <p>Configure parameters on the left and click "Simulate Governance Decision" to evaluate.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-background border border-border rounded space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Calculated Decision:</span>
                      {getDecisionBadge(simResult.decision)}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Assessed Risk Level:</span>
                      {getRiskBadge(simResult.risk_level)}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Human Approval Required:</span>
                      <Badge variant={simResult.requires_approval ? 'warning' : 'neutral'}>
                        {simResult.requires_approval ? 'YES (MANDATORY)' : 'NO'}
                      </Badge>
                    </div>
                    {simResult.policy_id && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Governing Policy:</span>
                        <span className="font-semibold text-text-primary">
                          {simResult.policy_name || simResult.policy_id}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-surface border border-border rounded space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Operational Explanation</span>
                    <p className="text-xs leading-relaxed text-text-primary">{simResult.reason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-text-muted border-t border-border/50 pt-2 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-success" />
              <span>Simulated against active policy hierarchy & RBAC matrix</span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: AGENT GOVERNANCE & BOUNDARIES */}
      {activeTab === 'AGENTS' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Agent Security Boundaries & Tool Permission Profiles
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Explicit risk thresholds, allowed environments, and granular tool controls per AI agent.
              </p>
            </div>
            <Badge variant="neutral">{agents.length} Registered Agents</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((ag) => (
              <Card key={ag.agent_id} className="p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="font-bold text-text-primary uppercase">{ag.agent_id} Agent</span>
                  </div>
                  {getRiskBadge(ag.max_risk_limit)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Allowed Environments</span>
                    <span className="font-semibold text-text-primary">{ag.allowed_environments}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Project Scope</span>
                    <span className="font-semibold text-text-primary">{ag.project_id}</span>
                  </div>
                </div>

                {ag.allowed_permissions && ag.allowed_permissions.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">Granted Permissions</span>
                    <div className="flex flex-wrap gap-1">
                      {ag.allowed_permissions.map((p) => (
                        <span key={p} className="px-1.5 py-0.5 bg-background border border-border/70 rounded text-[10px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Tool Configurations Matrix</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {Object.entries(ag.tool_permissions).map(([tool, perm]) => (
                      <div key={tool} className="flex justify-between items-center p-1.5 bg-background border border-border/60 rounded">
                        <span className="text-text-muted text-[11px]">{tool}</span>
                        <span
                          className={`font-semibold text-[10px] ${
                            perm === 'ALLOWED'
                              ? 'text-success'
                              : perm === 'RESTRICTED'
                              ? 'text-warning'
                              : 'text-error'
                          }`}
                        >
                          {perm}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* RBAC Roles Summary Table */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-accent" />
              Human User RBAC Roles & Assigned Permissions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-surface text-[10px] uppercase font-bold text-text-muted border-b border-border">
                    <th className="p-2">Role Name</th>
                    <th className="p-2">Role Description</th>
                    <th className="p-2">Permissions Granted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {roles.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2 font-bold text-accent">{r.name}</td>
                      <td className="p-2 text-text-muted">{r.description}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {r.permissions.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 bg-background border border-border rounded text-[9px]">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: APPROVAL CENTER */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Manual Operator Action Approval Requests
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Enforcing the Four-Eyes Principle: Requester cannot approve their own high-risk actions.
              </p>
            </div>
            <Badge variant="warning">{approvals.filter((a) => a.status === 'PENDING').length} Pending</Badge>
          </div>

          <div className="space-y-3">
            {approvals.length === 0 ? (
              <Card className="p-8 text-center text-text-muted font-mono">
                No active or pending approval requests.
              </Card>
            ) : (
              approvals.map((req) => (
                <Card key={req.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start border-b border-border pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-xs">{req.id}</span>
                        {getRiskBadge(req.risk_level)}
                        <Badge
                          variant={
                            req.status === 'PENDING'
                              ? 'warning'
                              : req.status === 'APPROVED'
                              ? 'success'
                              : req.status === 'REJECTED'
                              ? 'error'
                              : 'neutral'
                          }
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        Action: <strong>{req.action_id}</strong> requested by: <strong>{req.requester}</strong>
                      </p>
                    </div>
                    <div className="text-[10px] text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div>
                      <span className="text-text-muted block text-[9px] uppercase font-bold">Evaluation Rationale</span>
                      <p className="text-text-primary mt-0.5 leading-relaxed">{req.reason || 'Approval required by policy'}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'PENDING' ? (
                        <>
                          <Button variant="primary" size="sm" className="bg-success border-success hover:bg-success/90" onClick={() => handleApprove(req.id)}>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve Action
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleReject(req.id)}>
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject Action
                          </Button>
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-text-muted block text-[9px] uppercase font-bold">Resolved By</span>
                          <span className="font-semibold text-text-primary">{req.approver || 'system'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: RISK DASHBOARD */}
      {activeTab === 'RISK' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Risk Classification & Sensitive Action Overview
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Classified actions categorized by blast radius, environmental sensitivity, and policy controls.
              </p>
            </div>
            <div className="flex gap-1">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskTabLevel(lvl)}
                  className={`px-2.5 py-1 text-[10px] rounded border ${
                    riskTabLevel === lvl
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface text-text-muted border-border hover:text-text-primary'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-surface text-[10px] uppercase font-bold text-text-muted border-b border-border">
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Actor & Scope</th>
                  <th className="p-3">Target Resource</th>
                  <th className="p-3">Policy Result</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {actions
                  .filter((a) => riskTabLevel === 'ALL' || a.risk_level === riskTabLevel)
                  .map((act) => (
                    <tr key={act.id} className="hover:bg-surface/30">
                      <td className="p-3 font-semibold">{act.action_type}</td>
                      <td className="p-3">{getRiskBadge(act.risk_level)}</td>
                      <td className="p-3">
                        {act.actor_type}:{act.actor_id} ({act.environment || 'N/A'})
                      </td>
                      <td className="p-3 text-text-muted max-w-[200px] truncate" title={act.resource || undefined}>
                        {act.resource || 'N/A'}
                      </td>
                      <td className="p-3">{getDecisionBadge(act.policy_result)}</td>
                      <td className="p-3 text-text-muted text-[11px]">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 7: AUDIT EXPLORER */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Immutable Governance Audit Trail Explorer
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Every sensitive action is strictly recorded with actor, trace_id, policy, decision, and redacted secrets.
              </p>
            </div>
            <Badge variant="neutral">Read Only / Non-Mutable</Badge>
          </div>

          {/* Filters Bar */}
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Actor ID</label>
              <input
                type="text"
                placeholder="developer, dev_user..."
                value={filterActor}
                onChange={(e) => setFilterActor(e.target.value)}
                className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Environment</label>
              <select
                value={filterEnv}
                onChange={(e) => setFilterEnv(e.target.value)}
                className="w-full bg-background border border-border rounded p-1.5 text-xs"
              >
                <option value="">All Environments</option>
                <option value="PRODUCTION">Production</option>
                <option value="STAGING">Staging</option>
                <option value="DEVELOPMENT">Development</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Decision</label>
              <select
                value={filterDecision}
                onChange={(e) => setFilterDecision(e.target.value)}
                className="w-full bg-background border border-border rounded p-1.5 text-xs"
              >
                <option value="">All Decisions</option>
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
                <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Risk Level</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full bg-background border border-border rounded p-1.5 text-xs"
              >
                <option value="">All Risks</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={applyAuditFilters} className="w-full">
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Query Trail
              </Button>
            </div>
          </Card>

          {/* Audit Table */}
          <Card className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border text-[10px] uppercase font-bold text-text-muted">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource Target (Masked)</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Risk</th>
                  <th className="p-3">Policy ID</th>
                  <th className="p-3">Trace ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/30">
                    <td className="p-3 text-[11px] text-text-muted">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-semibold text-text-primary">
                      {a.actor_type}:{a.actor_id}
                    </td>
                    <td className="p-3 font-semibold">{a.action}</td>
                    <td className="p-3 text-text-muted max-w-[200px] truncate" title={a.resource || undefined}>
                      {a.resource || 'N/A'}
                    </td>
                    <td className="p-3">{getDecisionBadge(a.decision)}</td>
                    <td className="p-3">{getRiskBadge(a.risk_level)}</td>
                    <td className="p-3 text-text-muted">{a.policy_id || 'N/A'}</td>
                    <td className="p-3 text-text-muted text-[10px]">{a.trace_id || 'N/A'}</td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-text-muted font-mono">
                      No audit events match the query filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 8: AI GOVERNANCE AGENT & RECOMMENDATIONS */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                AI Policy Recommendations & Human Review Workflow
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                GovernanceAgent synthesizes violation patterns and permission telemetry to propose policy upgrades.
                AI recommendations NEVER auto-apply without explicit operator approval.
              </p>
            </div>
            <Button size="sm" onClick={handleTriggerAnalysis} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Run Agent Scan
            </Button>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="p-5 space-y-3 border-l-4 border-l-accent">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-text-primary">{rec.title}</h4>
                      <Badge variant="info">{rec.category}</Badge>
                      <Badge
                        variant={
                          rec.status === 'PROPOSED'
                            ? 'warning'
                            : rec.status === 'APPLIED'
                            ? 'success'
                            : 'error'
                        }
                      >
                        {rec.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{rec.rationale}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-muted block">Risk Reduction</span>
                    <Badge variant="success">{rec.risk_reduction}</Badge>
                  </div>
                </div>

                <div className="p-2.5 bg-background border border-border rounded text-[11px]">
                  <span className="text-[9px] uppercase font-bold text-text-muted block mb-0.5">
                    Proposed Configuration Change (Target: {rec.target_id})
                  </span>
                  <pre className="text-text-muted overflow-x-auto">{rec.details}</pre>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-[10px] text-text-muted">
                    Proposed: {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Recently'}
                  </span>
                  {rec.status === 'PROPOSED' ? (
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" className="bg-success border-success hover:bg-success/90" onClick={() => handleApplyRecommendation(rec.id)}>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve & Apply Policy Update
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleRejectRecommendation(rec.id)}>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-text-muted">
                      Reviewed by: <strong>{rec.reviewed_by || 'admin'}</strong> on{' '}
                      {rec.reviewed_at ? new Date(rec.reviewed_at).toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {recommendations.length === 0 && (
              <Card className="p-8 text-center text-text-muted font-mono space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-success/50" />
                <p>No pending policy recommendations. All agent boundaries and policies conform to security baselines.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
