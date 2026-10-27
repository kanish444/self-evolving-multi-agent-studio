import { useState, useEffect, useCallback } from 'react'
import {
  Cpu,
  Clock,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Save,
  Shield,
  Plus
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { settingsApi, type AIConfig, type ExecutionLimits, type DemoStatus, type StudioUser } from '../../services/api/settings'

export default function Settings() {
  // Section Navigation Tabs
  const [activeTab, setActiveTab] = useState<'ai' | 'limits' | 'users' | 'demo'>('ai')

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')
  const [isSavingAI, setIsSavingAI] = useState(false)
  const [isTestingAI, setIsTestingAI] = useState(false)
  const [testResult, setTestResult] = useState<{ status: 'ok' | 'error'; message: string } | null>(null)

  // Execution Limits State
  const [limits, setLimits] = useState<ExecutionLimits>({
    command_timeout_seconds: 30,
    sandbox_timeout_seconds: 60,
    max_debug_cycles: 3,
    max_agent_retries: 3,
    max_file_size_bytes: 5000000
  })
  const [isSavingLimits, setIsSavingLimits] = useState(false)

  // Demo Data State
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null)
  const [isCleaningDemo, setIsCleaningDemo] = useState(false)

  // User Management State
  const [users, setUsers] = useState<StudioUser[]>([])
  const [isNewUserModal, setIsNewUserModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('DEVELOPER')

  // Feedback notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      const [aiRes, limitsRes, demoRes, usersRes] = await Promise.allSettled([
        settingsApi.getAIConfig(),
        settingsApi.getExecutionLimits(),
        settingsApi.getDemoStatus(),
        settingsApi.listUsers()
      ])

      if (aiRes.status === 'fulfilled') {
        setAiConfig(aiRes.value)
        setSelectedModel(aiRes.value.model)
      }
      if (limitsRes.status === 'fulfilled') {
        setLimits(limitsRes.value)
      }
      if (demoRes.status === 'fulfilled') {
        setDemoStatus(demoRes.value)
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value)
      }
    } catch (err: any) {
      console.warn('Failed to load settings:', err)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Save AI Config
  const handleSaveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingAI(true)
    setNotice(null)
    setTestResult(null)
    try {
      await settingsApi.updateAIConfig({
        provider: 'gemini',
        model: selectedModel,
        api_key: apiKeyInput.trim() ? apiKeyInput.trim() : undefined
      })
      setNotice({ type: 'success', message: 'AI configuration saved successfully.' })
      setApiKeyInput('')
      loadSettings()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update AI config.' })
    } finally {
      setIsSavingAI(false)
    }
  }

  // Test Live AI Connection
  const handleTestAIConnection = async () => {
    setIsTestingAI(true)
    setTestResult(null)
    try {
      const res = await settingsApi.testAIConnection()
      setTestResult({ status: 'ok', message: res.message })
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Connection test failed.' })
    } finally {
      setIsTestingAI(false)
    }
  }

  // Save Execution Limits
  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingLimits(true)
    setNotice(null)
    try {
      await settingsApi.updateExecutionLimits(limits)
      setNotice({ type: 'success', message: 'Execution limits updated successfully.' })
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update limits.' })
    } finally {
      setIsSavingLimits(false)
    }
  }

  // Cleanup Demo Records Explicitly
  const handleCleanupDemo = async () => {
    if (!window.confirm('Are you sure you want to clean up suspected demo projects (P001 to P004)? This will only remove demo records; your user-created projects will remain intact.')) {
      return
    }

    setIsCleaningDemo(true)
    setNotice(null)
    try {
      const res = await settingsApi.cleanupDemoData()
      setNotice({ type: 'success', message: `Cleaned up ${res.deleted_count} demo project(s).` })
      loadSettings()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to clean up demo data.' })
    } finally {
      setIsCleaningDemo(false)
    }
  }

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await settingsApi.createUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        full_name: newFullName.trim(),
        password: newPassword,
        role_id: newRole
      })
      setIsNewUserModal(false)
      setNewUsername('')
      setNewEmail('')
      setNewFullName('')
      setNewPassword('')
      setNotice({ type: 'success', message: 'User account created successfully.' })
      loadSettings()
    } catch (err: any) {
      alert(err.message || 'Failed to create user.')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-hidden">
      {/* Settings Header */}
      <div className="bg-[#111827] border-b border-[#1F2937] px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-slate-100">Settings & Governance</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure AI model providers, secure credentials, runtime execution limits, and team access.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className={`px-8 py-2.5 text-xs flex items-center gap-2 border-b ${
          notice.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Settings Navigation & Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Settings Tabs */}
        <div className="w-64 bg-[#0A0F1D] border-r border-[#1F2937] p-3 space-y-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
              activeTab === 'ai' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-[#111827]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Providers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('limits')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
              activeTab === 'limits' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-[#111827]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Execution Limits</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
              activeTab === 'users' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-[#111827]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
              activeTab === 'demo' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-[#111827]'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Demo Data Cleanup</span>
          </button>
        </div>

        {/* Right Settings Panel Content */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {/* AI Configuration Section */}
          {activeTab === 'ai' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">AI Provider Configuration</h3>
                <p className="text-xs text-slate-400">
                  Configure live AI providers for agent reasoning and code synthesis. API keys are kept strictly backend-side and never exposed in browser bundles.
                </p>
              </div>

              {/* Status Box */}
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200">Current Provider Status</span>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Provider: {aiConfig?.provider || 'gemini'} | Model: {aiConfig?.model || 'gemini-1.5-flash'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${aiConfig?.is_api_key_configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-xs font-mono text-slate-300 font-medium">
                    {aiConfig?.is_api_key_configured ? 'Key Configured' : 'Setup Required'}
                  </span>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveAIConfig} className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Model Selection</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, High-throughput)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning & Synthesis)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    placeholder={aiConfig?.is_api_key_configured ? '•••••••••••••••••••••••• (Leave blank to keep existing)' : 'Enter your GEMINI_API_KEY...'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Saved safely to backend environment. Never substitution-mocked when unconfigured.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTestAIConnection}
                    disabled={isTestingAI}
                    className="border-[#1F2937] text-slate-300 hover:text-white flex items-center gap-1.5"
                  >
                    {isTestingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-blue-400" />}
                    <span>Test Connection</span>
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSavingAI}
                    className="bg-[#2563EB] hover:bg-blue-600 text-white font-medium flex items-center gap-1.5"
                  >
                    {isSavingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Configuration</span>
                  </Button>
                </div>
              </form>

              {/* Test Connection Diagnostics Box */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs ${
                  testResult.status === 'ok'
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {testResult.status === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>{testResult.status === 'ok' ? 'Connection Successful' : 'Connection Failed'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-mono">{testResult.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Execution Limits Section */}
          {activeTab === 'limits' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">Execution Limits & Quotas</h3>
                <p className="text-xs text-slate-400">
                  Enforce hard limits on automated execution, debug retries, and timeouts to protect system stability.
                </p>
              </div>

              <form onSubmit={handleSaveLimits} className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Command Execution Timeout (Seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={limits.command_timeout_seconds}
                    onChange={(e) => setLimits({ ...limits, command_timeout_seconds: parseInt(e.target.value) || 30 })}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Maximum duration for terminal or build commands before automatic process tree termination.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Maximum Debug Cycles</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={limits.max_debug_cycles}
                    onChange={(e) => setLimits({ ...limits, max_debug_cycles: parseInt(e.target.value) || 3 })}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Prevents runaway auto-fix loops when automated tests consistently fail.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Agent Retry Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={limits.max_agent_retries}
                    onChange={(e) => setLimits({ ...limits, max_agent_retries: parseInt(e.target.value) || 3 })}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSavingLimits}
                    className="bg-[#2563EB] hover:bg-blue-600 text-white font-medium flex items-center gap-1.5"
                  >
                    {isSavingLimits ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Limits</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Demo Data Cleanup Section */}
          {activeTab === 'demo' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">Demo Data Management</h3>
                <p className="text-xs text-slate-400">
                  Automatic demo seeding is removed. This tool identifies suspected initial demo records and allows explicit cleanup without deleting real user data.
                </p>
              </div>

              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Suspected Demo Projects</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {demoStatus?.message || 'Scanning database records...'}
                    </p>
                  </div>
                </div>

                {demoStatus && demoStatus.suspected_demo_projects.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1F2937]">
                    {demoStatus.suspected_demo_projects.map(p => (
                      <div key={p.id} className="bg-[#0A0F1D] border border-[#1F2937] rounded-lg p-2.5 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-200">{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 ml-2">({p.id})</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Demo Project
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isCleaningDemo || !demoStatus?.has_demo_data}
                    onClick={handleCleanupDemo}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
                  >
                    {isCleaningDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Clean Up Demo Records</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* User Management Section */}
          {activeTab === 'users' && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">Studio Accounts & Access</h3>
                  <p className="text-xs text-slate-400">
                    Manage studio team members, credential hashes, and RBAC role assignments.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsNewUserModal(true)}
                  className="bg-[#2563EB] hover:bg-blue-600 text-white font-medium flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </Button>
              </div>

              <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0F1D] text-slate-400 border-b border-[#1F2937] font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937] text-slate-300">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-[#162032]">
                        <td className="py-2.5 px-4 font-semibold text-slate-100">
                          {u.full_name || u.username}
                          <span className="text-[10px] text-slate-500 font-mono block">@{u.username}</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-400">{u.email}</td>
                        <td className="py-2.5 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-[10px] font-mono ${u.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Create Studio Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">RBAC Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="TESTER">TESTER</option>
                  <option value="ARCHITECT">ARCHITECT</option>
                  <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNewUserModal(false)}
                  className="text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-[#2563EB] hover:bg-blue-600 text-white font-medium"
                >
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
