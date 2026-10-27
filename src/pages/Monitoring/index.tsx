import React, { useState, useEffect } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Brain,
  Plus,
  Search,
  AlertCircle
} from 'lucide-react'

import { monitoringApi } from '../../services/api/monitoring'
import type {
  MonitoredService,
  Alert,
  Incident,
  IncidentEvent,
  IncidentAnalysis,
  RemediationAction,
  PostIncidentReview
} from '../../services/api/monitoring'

import { useProject } from '../../context/ProjectContext'

export default function Monitoring() {
  const { activeProjectId } = useProject()
  const projectId = activeProjectId
  const [services, setServices] = useState<MonitoredService[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  
  // Tab control: 'dashboard', 'incidents', 'rules'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'rules'>('dashboard')
  
  // Selected detail states
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [selectedIncidentDetails, setSelectedIncidentDetails] = useState<{
    incident: Incident
    events: IncidentEvent[]
    analysis?: IncidentAnalysis
    remediation_actions: RemediationAction[]
  } | null>(null)
  const [, setPirDraft] = useState<PostIncidentReview | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Record<string, number[]>>({
    request_latency: [],
    error_rate: [],
    availability: [],
    request_count: []
  })

  // Filters for Incident Center
  const [filterEnv] = useState<string>('ALL')
  const [filterSeverity] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Forms states
  const [isRegisteringService, setIsRegisteringService] = useState(false)
  const [newService, setNewService] = useState({
    service_name: '',
    service_type: 'API',
    environment: 'PRODUCTION',
    endpoint: '',
    interval_seconds: 30
  })

  const [isAddingRule, setIsAddingRule] = useState(false)
  const [newRule, setNewRule] = useState({
    service_id: '',
    metric_name: 'error_rate',
    operator: '>',
    threshold: 5,
    duration_seconds: 300,
    severity: 'HIGH',
    environment: 'PRODUCTION'
  })



  // Poll service metrics/health periodically
  useEffect(() => {
    if (!projectId) return

    const fetchData = async () => {
      try {
        const svcs = await monitoringApi.getServices(projectId)
        setServices(svcs)

        const alts = await monitoringApi.getAlerts()
        setAlerts(alts)

        const incs = await monitoringApi.getIncidents({ project_id: projectId })
        setIncidents(incs)
      } catch (err) {
        console.error('Failed to poll monitoring data', err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [projectId])

  // Load metrics when a service is selected
  useEffect(() => {
    if (!selectedServiceId) return
    const fetchMetrics = async () => {
      try {
        const lat = await monitoringApi.getServiceMetrics(selectedServiceId, 'request_latency', 12)
        const err = await monitoringApi.getServiceMetrics(selectedServiceId, 'error_rate', 12)
        const av = await monitoringApi.getServiceMetrics(selectedServiceId, 'availability', 12)
        const req = await monitoringApi.getServiceMetrics(selectedServiceId, 'request_count', 12)

        setMetrics({
          request_latency: lat.map(m => m.value),
          error_rate: err.map(m => m.value),
          availability: av.map(m => m.value),
          request_count: req.map(m => m.value)
        })
      } catch {}
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [selectedServiceId])

  // Load incident details
  useEffect(() => {
    if (!selectedIncidentId) {
      setSelectedIncidentDetails(null)
      setPirDraft(null)
      return
    }

    const fetchIncidentDetails = async () => {
      try {
        const res = await monitoringApi.getIncidentDetails(selectedIncidentId)
        setSelectedIncidentDetails(res)
        
        try {
          const pir = await monitoringApi.getPostIncidentReview(selectedIncidentId)
          setPirDraft(pir)
        } catch {
          setPirDraft(null)
        }
      } catch {}
    }

    fetchIncidentDetails()
    const interval = setInterval(fetchIncidentDetails, 5000)
    return () => clearInterval(interval)
  }, [selectedIncidentId])

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await monitoringApi.registerService({
        project_id: projectId,
        environment: newService.environment,
        service_name: newService.service_name,
        service_type: newService.service_type,
        endpoint: newService.endpoint || undefined,
        health_check_config: { interval_seconds: newService.interval_seconds }
      })
      setIsRegisteringService(false)
      setNewService({
        service_name: '',
        service_type: 'API',
        environment: 'PRODUCTION',
        endpoint: '',
        interval_seconds: 30
      })
      const svcs = await monitoringApi.getServices(projectId)
      setServices(svcs)
    } catch (err) {
      alert('Failed to register service: ' + err)
    }
  }

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await monitoringApi.configureAlertRule({
        service_id: newRule.service_id,
        metric_name: newRule.metric_name,
        operator: newRule.operator,
        threshold: Number(newRule.threshold),
        duration_seconds: Number(newRule.duration_seconds),
        severity: newRule.severity,
        environment: newRule.environment
      })
      setIsAddingRule(false)
      alert('Alert rule added successfully.')
    } catch (err) {
      alert('Failed to add alert rule: ' + err)
    }
  }

  const triggerHealthCheck = async (serviceId: string, simulateStatus?: string) => {
    try {
      await monitoringApi.triggerServiceHealthCheck(serviceId, simulateStatus)
      const svcs = await monitoringApi.getServices(projectId)
      setServices(svcs)
    } catch (err) {
      alert('Health check run failed: ' + err)
    }
  }

  const handleAcknowledge = async (id: string) => {
    try {
      await monitoringApi.acknowledgeIncident(id)
      const res = await monitoringApi.getIncidentDetails(id)
      setSelectedIncidentDetails(res)
    } catch {}
  }

  const handleResolve = async (id: string) => {
    try {
      await monitoringApi.resolveIncident(id)
      const res = await monitoringApi.getIncidentDetails(id)
      setSelectedIncidentDetails(res)
    } catch {}
  }

  const handleTriggerAIAnalysis = async (id: string) => {
    try {
      await monitoringApi.triggerAIAnalysis(id)
      const res = await monitoringApi.getIncidentDetails(id)
      setSelectedIncidentDetails(res)
    } catch {}
  }

  const handleCreateMockIncident = async () => {
    try {
      const apiSvc = services.find(s => s.service_type === 'API') || services[0]
      await monitoringApi.createIncident({
        project_id: projectId,
        service_id: apiSvc ? apiSvc.id : undefined,
        environment: 'PRODUCTION',
        title: 'HTTP 500 Internal Server Error Spikes',
        description: 'Sudden spike of HTTP 500 responses on bookings checkouts endpoints. Correlated with database locks and latency.',
        severity: 'SEV-1',
        incident_type: 'APPLICATION_ERROR'
      })
      const incs = await monitoringApi.getIncidents({ project_id: projectId })
      setIncidents(incs)
    } catch (err) {
      alert('Failed to trigger mock incident: ' + err)
    }
  }

  // Statistical filters
  const healthyServices = services.filter(s => s.status === 'HEALTHY').length
  const degradedServices = services.filter(s => s.status === 'DEGRADED').length
  const openIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length
  const criticalIncidents = incidents.filter(i => i.severity === 'SEV-1' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length
  const activeAlertsCount = alerts.filter(a => a.status === 'OPEN').length

  // Filtered incidents list
  const filteredIncidents = incidents.filter(inc => {
    if (filterEnv !== 'ALL' && inc.environment !== filterEnv) return false
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const titleMatch = inc.title.toLowerCase().includes(query)
      const descMatch = inc.description.toLowerCase().includes(query)
      const idMatch = inc.id.toLowerCase().includes(query)
      return titleMatch || descMatch || idMatch
    }
    return true
  })

  return (
    <div className="flex flex-col h-full animate-page-enter custom-scrollbar overflow-y-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Observability & Incident Command Center"
        description="Continuous service telemetry monitoring, live health status, AI incident root-cause analysis, and automated remediation."
        badge={
          <Badge variant="system" size="sm">
            TELEMETRY LIVE
          </Badge>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleCreateMockIncident}>
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              Trigger Incident
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsRegisteringService(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register Service
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border border-l-4 border-l-emerald-500 flex items-center gap-3.5 shadow-command-card hover:border-border transition-all">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-mono">Healthy Services</div>
            <div className="text-lg font-bold text-text-primary mt-0.5 font-mono">{healthyServices}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border border-l-4 border-l-amber-500 flex items-center gap-3.5 shadow-command-card hover:border-border transition-all">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-mono">Degraded Services</div>
            <div className="text-lg font-bold text-text-primary mt-0.5 font-mono">{degradedServices}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border border-l-4 border-l-accent flex items-center gap-3.5 shadow-command-card hover:border-border transition-all">
          <div className="p-2.5 rounded-xl bg-[rgba(179, 68, 30, 0.15)] text-accent">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-mono">Active Alerts</div>
            <div className="text-lg font-bold text-text-primary mt-0.5 font-mono">{activeAlertsCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border border-l-4 border-l-system flex items-center gap-3.5 shadow-command-card hover:border-border transition-all">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-mono">Open Incidents</div>
            <div className="text-lg font-bold text-text-primary mt-0.5 font-mono">{openIncidents}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border border-l-4 border-l-red-500 flex items-center gap-3.5 shadow-command-card hover:border-border transition-all">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider font-mono">Critical (SEV-1)</div>
            <div className="text-lg font-bold text-red-400 mt-0.5 font-mono">{criticalIncidents}</div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono border-b-2 px-1 transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Service Health Dashboard
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono border-b-2 px-1 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'incidents'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Incident Center
          {openIncidents > 0 && <span className="bg-red-500 text-white rounded-full text-[10px] px-1.5 py-0.2 font-bold font-sans">{openIncidents}</span>}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono border-b-2 px-1 transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Alert Rules Config
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(svc => (
              <div
                key={svc.id}
                onClick={() => setSelectedServiceId(svc.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-command-card ${
                  selectedServiceId === svc.id
                    ? 'border-accent bg-[rgba(179, 68, 30, 0.08)] ring-1 ring-accent shadow-command-glow'
                    : 'border-border bg-surface hover:border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold">{svc.service_type} · {svc.environment}</span>
                    <h4 className="font-display text-sm font-bold text-text-primary mt-0.5">{svc.service_name}</h4>
                  </div>
                  <Badge variant={svc.status === 'HEALTHY' ? 'success' : svc.status === 'DEGRADED' ? 'warning' : 'error'} size="xs">
                    {svc.status}
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-text-secondary font-mono truncate">{svc.endpoint || 'Internal Orchestration Cluster'}</div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">Status: {svc.status}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerHealthCheck(svc.id)
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-accent bg-[rgba(179, 68, 30, 0.1)] hover:bg-[rgba(179, 68, 30, 0.2)] border border-[rgba(179, 68, 30, 0.3)] rounded-lg cursor-pointer transition-colors"
                  >
                    Check Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedServiceId && (
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-command-card space-y-4">
              <h4 className="font-display text-sm font-bold text-text-primary">Service Metrics Telemetry</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3.5 bg-surface-secondary border border-border rounded-xl">
                  <span className="text-text-muted block text-[10px] uppercase">Latency</span>
                  <span className="text-base font-bold text-system">{metrics.request_latency[metrics.request_latency.length - 1] || 12}ms</span>
                </div>
                <div className="p-3.5 bg-surface-secondary border border-border rounded-xl">
                  <span className="text-text-muted block text-[10px] uppercase">Error Rate</span>
                  <span className="text-base font-bold text-emerald-400">{metrics.error_rate[metrics.error_rate.length - 1] || 0}%</span>
                </div>
                <div className="p-3.5 bg-surface-secondary border border-border rounded-xl">
                  <span className="text-text-muted block text-[10px] uppercase">Availability</span>
                  <span className="text-base font-bold text-emerald-400">{metrics.availability[metrics.availability.length - 1] || 99.99}%</span>
                </div>
                <div className="p-3.5 bg-surface-secondary border border-border rounded-xl">
                  <span className="text-text-muted block text-[10px] uppercase">Throughput</span>
                  <span className="text-base font-bold text-accent">{metrics.request_count[metrics.request_count.length - 1] || 1420} req/m</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl shadow-command-card overflow-hidden">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-surface-elevated border-b border-border font-mono text-[11px] text-text-secondary">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredIncidents.map(inc => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className="hover:bg-surface-secondary/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] ${inc.severity === 'SEV-1' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-text-primary">{inc.title}</td>
                    <td className="py-3.5 px-4 font-mono text-text-secondary">{inc.environment}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={inc.status === 'RESOLVED' ? 'success' : 'warning'} size="xs">
                        {inc.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="outline" size="xs" onClick={() => setSelectedIncidentId(inc.id)}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedIncidentDetails && (
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-command-card space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <div>
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase">{selectedIncidentDetails.incident.severity} INCIDENT</span>
                  <h3 className="font-display text-base font-bold text-text-primary mt-0.5">{selectedIncidentDetails.incident.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" onClick={() => handleAcknowledge(selectedIncidentDetails.incident.id)}>
                    Acknowledge
                  </Button>
                  <Button variant="primary" size="xs" onClick={() => handleTriggerAIAnalysis(selectedIncidentDetails.incident.id)}>
                    <Brain className="w-3.5 h-3.5 mr-1" />
                    AI Root Cause Analysis
                  </Button>
                  <Button variant="success" size="xs" onClick={() => handleResolve(selectedIncidentDetails.incident.id)}>
                    Resolve Incident
                  </Button>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed font-sans">{selectedIncidentDetails.incident.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-command-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="font-display text-sm font-bold text-text-primary">Configured Telemetry Alert Rules</h4>
            <Button variant="primary" size="sm" onClick={() => setIsAddingRule(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Alert Rule
            </Button>
          </div>
          <p className="text-xs text-text-secondary">Real-time monitors evaluating latency, availability, and error rate thresholds across staging and production.</p>
        </div>
      )}

      {/* Register Service Modal */}
      {isRegisteringService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-command-modal p-6 max-w-md w-full space-y-4 animate-page-enter">
            <h3 className="font-display text-base font-bold text-text-primary">Register Monitored Service</h3>
            <form onSubmit={handleRegisterService} className="space-y-3 font-sans text-left">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={newService.service_name}
                  onChange={e => setNewService({ ...newService, service_name: e.target.value })}
                  placeholder="e.g. Student API Gateway"
                  className="w-full bg-surface-secondary border border-border rounded-xl p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsRegisteringService(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Register
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Alert Rule Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-command-modal p-6 max-w-md w-full space-y-4 animate-page-enter">
            <h3 className="font-display text-base font-bold text-text-primary">Add Telemetry Alert Rule</h3>
            <form onSubmit={handleAddRule} className="space-y-3 font-sans text-left">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Service</label>
                <select
                  value={newRule.service_id}
                  onChange={e => setNewRule({ ...newRule, service_id: e.target.value })}
                  className="w-full bg-surface-secondary border border-border rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="" className="bg-surface-secondary text-text-secondary">Select a service...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id} className="bg-surface-secondary text-text-primary">{s.service_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddingRule(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Add Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
