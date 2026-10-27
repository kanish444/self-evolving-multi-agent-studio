import { apiRequest } from './client'

export interface TestResult {
  id: string
  project_id: string
  task_id?: string
  iteration_id?: string
  name: string
  description?: string
  status: string
  expected_result?: string
  actual_result?: string
  error_message?: string
  duration?: string
  created_at: string
}

export interface TestFailure {
  test_name: string
  traceback: string
}

export interface TestRunResult {
  status: 'PASSED' | 'FAILED' | 'NO_TESTS' | 'ERROR'
  total: number
  passed: number
  failed: number
  duration_seconds: number
  output: string
  error_summary?: string
  failures: TestFailure[]
}

export interface AutoFixResult {
  status: 'FIXED' | 'FAILED_RETEST' | 'BLOCKED'
  analysis: string
  diff: string
  retest_result: TestRunResult
}

export const testsApi = {
  list: (projectId: string) => apiRequest<TestResult[]>(`/projects/${projectId}/tests`),
  get: (id: string) => apiRequest<TestResult>(`/tests/${id}`),
  create: (projectId: string, test: Partial<TestResult>) =>
    apiRequest<TestResult>(`/projects/${projectId}/tests`, {
      method: 'POST',
      body: JSON.stringify(test)
    }),
  runTests: async (projectId: string): Promise<TestRunResult> => {
    const result = await apiRequest<{passed: boolean; test_count: number; failed_count: number; passed_count: number; duration_seconds: number; output: string}>(`/projects/${projectId}/live/tests`, {method:'POST'})
    return {status: result.passed ? 'PASSED' : result.test_count === 0 ? 'NO_TESTS' : 'FAILED', total:result.test_count, passed:result.passed_count, failed:result.failed_count,
      duration_seconds:result.duration_seconds, output:result.output, failures:result.passed ? [] : [{test_name:'Observed runner output', traceback:result.output}]}
  },
  fixIssues: (projectId: string, payload?: { test_id?: string; error_message?: string }) =>
    apiRequest<AutoFixResult>(`/projects/${projectId}/tests/fix`, {
      method: 'POST',
      body: JSON.stringify(payload || {})
    })
}
