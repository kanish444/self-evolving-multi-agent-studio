import { apiRequest } from './client'
import { liveApi } from './live'
export interface FileItem { name: string; path: string; isFolder: boolean; size?: number; children?: FileItem[] }
export interface ExecuteResult { exit_code: number; stdout: string; stderr: string; timed_out: boolean }
function tree(paths: string[]): FileItem[] {
  const root: FileItem[] = []
  for (const path of paths) {
    let children = root
    const parts = path.split('/')
    parts.forEach((name, index) => {
      const partial = parts.slice(0, index + 1).join('/')
      let item = children.find(entry => entry.path === partial)
      if (!item) { item = { name, path: partial, isFolder: index < parts.length - 1, children: [] }; children.push(item) }
      children = item.children || []
    })
  }
  return root
}
export const workspaceApi = {
  listFiles: async (id: string) => tree((await liveApi.state(id)).files),
  getFileContent: async (id: string, path: string) => ({path, ...(await liveApi.file(id, path))}),
  saveFile: async (id: string, path: string, content: string) => { await liveApi.save(id, path, content); return { status: 'saved', path, bytes: new TextEncoder().encode(content).length } },
  deleteFile: async (_id: string, _path: string): Promise<{ status: string; path: string }> => { throw new Error('File deletion requires a separately implemented destructive-action approval; it is disabled.') },
  getDiff: (id: string) => apiRequest<{ has_git: boolean; status: string; diff: string }>(`/projects/${id}/live/diff`),
  executeCommand: async (id: string, command: string, _timeoutSeconds = 30): Promise<ExecuteResult> => {
    if (command.trim() === 'ls') return { exit_code: 0, stdout: (await liveApi.state(id)).files.join('\n'), stderr: '', timed_out: false }
    if (['test', 'node --test', 'python -m unittest discover -s tests -v'].includes(command.trim())) {
      const result = await apiRequest<{exit_code: number; output: string}>(`/projects/${id}/live/tests`, {method:'POST'})
      return {exit_code:result.exit_code, stdout:result.output, stderr:'', timed_out:false}
    }
    throw new Error('Supported commands: ls, test. Use the assistant for code changes and Preview controls for startup. Arbitrary host shell commands are disabled.')
  },
  stopCommand: async (id: string) => { await liveApi.cancel(id); return {status:'Cancellation requested at next execution checkpoint'} },
}
