import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode, FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Leaf, Folder, Bot, Code2, FlaskConical, Play, Settings, LogOut, Plus, Send, Save, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useProject } from '../../context/ProjectContext'
import { projectsApi } from '../../services/api/projects'
import { liveApi } from '../../services/api/live'
import type { LiveState } from '../../services/api/live'
import './studio.css'

const errorText = (error: unknown) => error instanceof Error ? error.message : 'The operation failed.'
export function StudioShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  return <div className="studio"><aside className={open ? 'studio-nav mobile-open' : 'studio-nav'}>
    <a href="/projects" className="studio-brand"><Leaf /><span>SE-MAESTRO<small>AI engineering studio</small></span></a>
    <nav>{[[Folder, 'Projects', '/projects'], [Bot, 'AI Team', '/agents'], [Code2, 'Editor', '/workspace'], [FlaskConical, 'Tests & Fixes', '/testing'], [Play, 'Preview', '/preview']].map(([Icon, label, to]) => {
      const Mark = Icon as typeof Folder
      return <NavLink key={String(to)} to={String(to)} onClick={() => setOpen(false)}><Mark size={19} />{String(label)}</NavLink>
    })}</nav><NavLink to="/settings"><Settings size={18} />Settings</NavLink>
  </aside><div className="studio-body"><header><button className="studio-mobile" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu /></button><span>Software engineering workspace</span><span>{user?.name} <button onClick={logout} title="Sign out"><LogOut size={17} /></button></span></header>{children}</div></div>
}

export function StudioLogin() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => { if (isAuthenticated) navigate('/projects', { replace: true }) }, [isAuthenticated, navigate])
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return
    const data = new FormData(e.currentTarget); setBusy(true); setError('')
    try { await login(String(data.get('email')), String(data.get('password'))); navigate('/projects') }
    catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }
  return <div className="studio login-screen"><section className="login-story"><div className="studio-brand"><Leaf /><span>SE-MAESTRO<small>Self-Evolving Multi-Agent Software Engineering Studio</small></span></div><h1>Your idea.<br />An AI engineering<br /><em>team.</em></h1><p>Plan, build, test and refine software with an AI engineering team.</p><svg viewBox="0 0 600 160" aria-hidden="true"><g fill="none" stroke="#15bdeb" opacity=".45">{[20,50,80,110,140].map((y,i) => <path key={y} d={`M0 ${y} C180 ${y},250 ${160-y},380 80 S500 ${i*25},600 30`} />)}</g></svg></section><form className="login-form" onSubmit={submit}><h2>Welcome back</h2><p>Sign in to your SE-MAESTRO account.</p><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required /></label><label className="inline"><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />Show password</label>{error && <p role="alert" className="studio-error">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><small>Use your own account. First-time setup is documented in LIVE_SETUP.md.</small></form></div>
}

export function StudioProjects() {
  const { projects, refreshProjects, selectProject, error } = useProject()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  async function create(e: FormEvent) {
    e.preventDefault(); if (busy) return
    setBusy(true); setFailure('')
    try { const project = await projectsApi.create({ name: name.trim(), description: description.trim() }); await refreshProjects(); selectProject(project.id); navigate('/workspace') }
    catch (err) { setFailure(errorText(err)) } finally { setBusy(false) }
  }
  return <main className="project-home"><h1>Build your next idea</h1><p>Describe what you want to build and start your AI engineering workflow.</p><form className="project-brief" onSubmit={create}><label>Project name<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Name your project" /></label><label>Project description<textarea required maxLength={500} value={description} onChange={e => setDescription(e.target.value)} placeholder="What would you like to build?" /></label><button className="primary" disabled={busy}><Plus size={17} />{busy ? 'Creating…' : 'New Project'}</button></form>{(error || failure) && <p className="studio-error" role="alert">{error || failure}</p>}<h2>Your projects</h2>{projects.length === 0 ? <section className="empty-projects"><Folder size={42} /><h3>Your projects start here</h3><p>Create your first project using the form above.</p></section> : <div className="project-list">{projects.map(project => <button key={project.id} onClick={() => { selectProject(project.id); navigate('/workspace') }}><Folder /><span><strong>{project.name}</strong><small>{project.description}</small></span><span>Open project →</span></button>)}</div>}</main>
}

export function StudioWorkspace({ view = 'editor' }: { view?: string }) {
  const { activeProjectId: id, activeProject, projects, selectProject } = useProject()
  const [state, setState] = useState<LiveState | null>(null)
  const [failure, setFailure] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [file, setFile] = useState('')
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [configuration, setConfiguration] = useState('')
  const projectRef = useRef(id)
  projectRef.current = id
  const fileRequest = useRef(0)
  const dirty = content !== savedContent
  const refresh = useCallback(async () => { if (id) { try { const next = await liveApi.state(id); if (projectRef.current === id) { setState(next); setFailure('') } } catch (err) { if (projectRef.current === id) setFailure(errorText(err)) } } }, [id])
  useEffect(() => { setState(null); setFile(''); setContent(''); setSavedContent(''); fileRequest.current++; void refresh(); const timer = setInterval(() => { void refresh() }, 2000); return () => clearInterval(timer) }, [refresh])
  const busy = pending || state?.status === 'RUNNING'
  async function action(work: () => Promise<unknown>) {
    if (pending) return; setPending(true); setFailure('')
    try { await work(); await refresh() } catch (err) { setFailure(errorText(err)) } finally { setPending(false) }
  }
  async function openFile(path: string) {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    const request = ++fileRequest.current
    try { const result = await liveApi.file(id, path); if (request !== fileRequest.current) return; setFile(path); setContent(result.content); setSavedContent(result.content) }
    catch (err) { setFailure(errorText(err)) }
  }
  async function send(e: FormEvent) {
    e.preventDefault(); if (!message.trim() || busy) return
    if (dirty) { setFailure('Save your file changes before starting agent work.'); return }
    const text = message; await action(async () => { await liveApi.chat(id, text); setMessage('') })
  }
  if (!id) return <main className="project-home"><h1>No project selected</h1><p>Create or open a project in Projects to start.</p></main>
  const previewUrl = state?.preview?.port ? `http://${window.location.hostname}:${state.preview.port}` : ''
  return <main className="live-workspace"><div className="workspace-heading"><select aria-label="Selected project" value={id} onChange={e => selectProject(e.target.value)}>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><span>{state?.status || 'Loading…'} {state?.status === 'RUNNING' && <button onClick={() => void action(() => liveApi.cancel(id))}>Cancel run</button>}</span></div>{(failure || state?.error) && <p className="studio-error" role="alert">{failure || state?.error}</p>}
    {view === 'settings' ? <section className="workspace-section"><h2>Provider and execution setup</h2><p>Configure GEMINI_API_KEY and an available AI_MODEL in backend/.env. Restart the backend after configuration changes. Generated code runs only inside Docker; no host execution fallback is used.</p><p>Supported first release: Python standard library or Node standard library, with HTML/CSS/JavaScript frontends. External dependencies and arbitrary stack builds are not supported yet.</p><button onClick={() => void action(async () => { setConfiguration(JSON.stringify(await liveApi.configuration(id), null, 2)) })}>Check configuration</button><pre>{configuration}</pre></section> :
    <div className="workspace-columns"><aside className="file-list"><h3>Project files</h3>{state?.files.length ? state.files.map(path => <button className={file === path ? 'selected' : ''} key={path} onClick={() => void openFile(path)}>{path}</button>) : <p>No files created yet. Describe your app in the assistant.</p>}</aside><section className="workspace-center">
      {view === 'agents' ? <section className="workspace-section"><h2>AI team</h2><p>Status comes from recorded execution events. Idle roles are not running.</p>{Object.entries(state?.agents || {}).map(([role, status]) => <div className="agent-row" key={role}><strong>{role.replaceAll('_', ' ')}</strong><span>{status}</span></div>)}</section> : view === 'tests' ? <section className="workspace-section"><h2>Tests & Fixes</h2>{state?.test_result ? <><p>{state.test_result.test_count} tests observed · Exit code {state.test_result.exit_code} · {state.test_result.passed ? 'Passed' : 'Failed'}</p><pre>{state.test_result.output}</pre></> : <p>No test execution recorded yet.</p>}{state?.lessons?.map((lesson, i) => <p key={i}>Lesson {lesson.status.toLowerCase()}: {lesson.proposal.summary}</p>)}</section> : view === 'preview' ? <section className="workspace-section"><h2>Application preview</h2><div className="preview-controls"><button disabled={busy || !state?.test_result?.passed} onClick={() => void action(() => liveApi.restart(id))}>Restart</button><button disabled={busy || !state?.preview} onClick={() => void action(() => liveApi.stop(id))}>Stop</button><button disabled={busy || !state?.preview} onClick={() => void action(() => liveApi.incident(id))}>Analyze runtime</button>{previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer">Open Preview ↗</a>}</div>{previewUrl ? <iframe title={`${activeProject?.name} preview`} src={previewUrl} sandbox="allow-scripts allow-forms allow-same-origin" /> : <p>No running application. Complete planning, implementation and checks first.</p>}</section> : <><div className="editor-toolbar"><span>{file || 'Select a project file'}{dirty ? ' • unsaved' : ''}</span><button disabled={!file || busy || !dirty} onClick={() => void action(async () => { await liveApi.save(id, file, content); setSavedContent(content) })}><Save size={16} />Save</button></div>{file ? <textarea className="source-editor" spellCheck={false} aria-label="Source code" value={content} readOnly={busy} onChange={e => setContent(e.target.value)} /> : <div className="workspace-section"><h2>Your engineering workspace</h2><p>Tell the assistant what to build. Review the architecture, approve the project scope, then follow actual file changes and test results.</p><p>Follow-up requests modify this same project. Agent execution uses a real configured provider and requires Docker for tests and startup.</p></div>}</>}
      <section className="execution-events"><h3>Execution history</h3>{state?.events.slice(-35).map(event => <details key={event.id}><summary><strong>{event.agent.replaceAll('_', ' ')}</strong> · {event.status} · {event.message}</summary>{event.evidence !== undefined && <pre>{JSON.stringify(event.evidence, null, 2)}</pre>}</details>)}</section>
    </section><aside className="assistant-panel"><h3><Bot size={18} />AI Assistant</h3>{state?.messages.map((item, i) => <div className={item.role === 'assistant' ? 'assistant-message' : 'user-message'} key={i}><small>{item.role === 'assistant' ? 'Assistant' : 'You'}</small><p className="message-content">{item.content}</p></div>)}{state?.plan && <section><h3>{state.plan.summary}</h3><p>{state.plan.architecture}</p><h4>Acceptance criteria</h4><ul>{state.plan.acceptance.map(item => <li key={item}>{item}</li>)}</ul>{state.plan.questions.map(question => <p key={question}>Question: {question}</p>)}{!state.approved && !state.plan.questions.length && <><p>Approval allows this project's file changes and isolated Docker test/preview execution. No publishing or paid resources.</p><button className="primary" disabled={busy} onClick={() => void action(() => liveApi.approve(id))}>Approve plan & build</button></>}</section>}<form onSubmit={send}><textarea aria-label="Message to AI assistant" required value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your app, answer the Architect, or request a change…" /><button className="primary" disabled={busy || !message.trim()}><Send size={16} />{busy ? 'Working…' : 'Send'}</button></form></aside></div>}
  </main>
}
