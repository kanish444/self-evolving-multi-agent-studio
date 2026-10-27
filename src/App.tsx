import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

// Seven Main Studio Modules
import Login from './pages/Login'
import Workspace from './pages/Workspace'
import { StudioWorkspace } from './pages/LiveStudio'
function LivePage({view='editor'}: {view?: string}) { return <div className="studio live-embedded"><StudioWorkspace view={view} /></div> }
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'






function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return <Navigate to={isAuthenticated ? '/editor' : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<Login />} />

            {/* Root Redirection Gate */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Studio Routes wrapped in ProtectedRoute & AppShell */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      {/* 1. Overview */}
                      <Route path="/overview" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Navigate to="/overview" replace />} />

                      {/* 2. Projects */}
                      <Route path="/projects" element={<Projects />} />

                      {/* 3. AI Team */}
                      <Route path="/team" element={<LivePage view="agents" />} />
                      <Route path="/agents" element={<Navigate to="/team" replace />} />

                      {/* 4. Editor */}
                      <Route path="/editor" element={<Workspace />} />
                      <Route path="/workspace" element={<Navigate to="/editor" replace />} />

                      {/* 5. Tests & Fixes */}
                      <Route path="/tests" element={<LivePage view="tests" />} />
                      <Route path="/testing" element={<Navigate to="/tests" replace />} />

                      {/* 6. Preview */}
                      <Route path="/preview" element={<LivePage view="preview" />} />

                      {/* 7. Settings */}
                      <Route path="/settings" element={<LivePage view="settings" />} />

                      {/* Legacy Redirects consolidating into the 7 modules */}
                      <Route path="/evolution" element={<Navigate to="/team" replace />} />
                      <Route path="/memory" element={<Navigate to="/projects" replace />} />
                      <Route path="/logs" element={<Navigate to="/overview" replace />} />
                      <Route path="/monitoring" element={<Navigate to="/preview" replace />} />
                      <Route path="/governance" element={<Navigate to="/settings" replace />} />

                      {/* Catch-all */}
                      <Route path="*" element={<Navigate to="/overview" replace />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
