const BASE = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await handleResponse<{ access_token: string }>(res)
  localStorage.setItem('token', data.access_token)
  return data.access_token
}

export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<void> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  })
  await handleResponse(res)
}

export function logout(): void {
  localStorage.removeItem('token')
}

// ── Analyzer ──────────────────────────────────────────────────────────────

export interface KeyModule { name: string; role: string }
export interface Feature   { name: string; description: string; evidence: string }
export interface CommandInfo { command: string; purpose: string }

export interface RepoAnalysisResult {
  repo_name: string
  summary: string
  detailed_overview: string
  tech_stack: string[]
  architecture: string
  key_modules: KeyModule[]
  core_features: Feature[]
  data_flow: string[]
  setup_steps: string[]
  commands: CommandInfo[]
  testing: string
  notable_design_decisions: string[]
  limitations: string[]
  entry_points: string[]
  readme_found: boolean
}

export async function analyzeRepo(gitUrl: string): Promise<RepoAnalysisResult> {
  const res = await fetch(`${BASE}/analyzer/analyze`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ git_url: gitUrl }),
  })
  return handleResponse<RepoAnalysisResult>(res)
}
