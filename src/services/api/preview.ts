import { apiRequest } from './client'

export interface PreviewStatus {
  status: 'NOT_STARTED' | 'STARTING' | 'RUNNING' | 'FAILED' | 'STOPPED'
  port: number | null
  url: string | null
  logs: string[]
  uptime_seconds: number
  error: string | null
}

async function start(projectId: string) {
  const result = await apiRequest<{status:string;port:number}>(`/projects/${projectId}/live/preview/restart`, {method:'POST'})
  return {status:result.status === 'HEALTHY' ? 'RUNNING' : result.status, port:result.port, url:`http://${window.location.hostname}:${result.port}`, message:'Application passed HTTP health check'}
}
export const previewApi = {
  getStatus: async (projectId: string) => {
    const result = await apiRequest<PreviewStatus>(`/projects/${projectId}/live/preview/status`)
    if (result.port && result.url) result.url = `http://${window.location.hostname}:${result.port}`
    return result
  },
  start,
  stop: async (projectId: string) => { await apiRequest(`/projects/${projectId}/live/preview/stop`,{method:'POST'}); return {status:'STOPPED',message:'Application stopped'} },
  restart:start,
}
