const BASE = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('token')
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function redirectToLogin() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const next = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.replace(`/login?expired=1&next=${next}`)
  }
}

// Prevent multiple concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      // Try to silently refresh the access token before giving up
      const refreshed = await tryRefresh()
      if (refreshed) {
        // Caller will need to retry — signal this with a special error
        throw new _RetryError()
      }
      redirectToLogin()
      throw new Error('Your session has expired — please sign in again.')
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json()
}

class _RetryError extends Error {
  constructor() { super('retry') }
}

// Wraps fetch + handleResponse with one automatic retry after token refresh
async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  try {
    return await handleResponse<T>(res)
  } catch (err) {
    if (err instanceof _RetryError) {
      // Token was refreshed — retry with new token
      const retried = await fetch(input, {
        ...init,
        headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${getToken()}` },
      })
      return handleResponse<T>(retried)
    }
    throw err
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await handleResponse<{ access_token: string; refresh_token?: string }>(res)
  localStorage.setItem('token', data.access_token)
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
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
  localStorage.removeItem('refresh_token')
}

export interface CurrentUser {
  id: number
  name: string | null
  email: string
  role: string
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>(`${BASE}/users/me`, {
    headers: authHeaders(),
  })
}

// ── Analyzer ──────────────────────────────────────────────────────────────

export interface KeyModule    { name: string; role: string }
export interface Feature      { name: string; description: string; evidence: string }
export interface CommandInfo  { command: string; purpose: string }
export interface FileDescription { path: string; description: string }

export interface RepoAnalysisResult {
  repo_name: string
  summary: string
  tech_stack: string[]
  architecture: string
  mermaid_arch_diagram: string
  mermaid_flow_diagram: string
  folder_tree: string
  document_id: number | null
  key_modules: KeyModule[]
  file_descriptions: FileDescription[]
  core_features: Feature[]
  data_flow: string[]
  setup_steps: string[]
  commands: CommandInfo[]
  entry_points: string[]
  notable_design_decisions: string[]
  limitations: string[]
  readme_found: boolean
}

// ── Chat (Agent 2) ──────────────────────────────────────────────────────

/**
 * A source citation returned with each chat answer. `uploaded_by_name`
 * may be null on older backend records — handle both.
 */
export interface ChatSource {
  document_id: number
  filename: string
  uploaded_by?: number | null
  uploaded_by_name?: string | null
  rerank_score: number
  snippet: string
}

export interface ChatApiResponse {
  answer: string
  sources: ChatSource[]
}

/**
 * History row as returned by GET /chat/history. Sources are NOT
 * persisted (they're returned inline on POST /chat) — history rows
 * only carry role + content.
 */
export interface ChatHistoryMessage {
  id: number
  user_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function askChat(question: string, documentIds?: number[]): Promise<ChatApiResponse> {
  return apiFetch<ChatApiResponse>(`${BASE}/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      question,
      ...(documentIds && documentIds.length > 0 ? { document_ids: documentIds } : {}),
    }),
  })
}

export async function getChatHistory(): Promise<ChatHistoryMessage[]> {
  return apiFetch<ChatHistoryMessage[]>(`${BASE}/chat/history`, {
    headers: authHeaders(),
  })
}

export async function analyzeRepo(gitUrl: string): Promise<RepoAnalysisResult> {
  return apiFetch<RepoAnalysisResult>(`${BASE}/analyzer/analyze`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ git_url: gitUrl }),
  })
}

// ── Admin ────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number
  active_users: number
  total_repositories: number
  total_chunks: number
  total_messages: number
  failed_queries: number
}

export interface AdminRepository {
  id: number
  title: string
  file_name: string
  file_type: string
  created_at: string
  uploaded_by: number
  uploaded_by_name: string | null
  uploaded_by_email: string
  chunk_count: number
}

export interface AdminUser {
  id: number
  name: string | null
  email: string
  role: string
  is_active: boolean
}

export interface AdminMessage {
  id: number
  user_id: number
  user_name: string | null
  user_email: string
  role: 'user' | 'assistant' | string
  content: string
  created_at: string
}

export interface AdminFailedQuery {
  id: number
  question: string
  user_id: number
  user_name: string | null
  user_email: string
  repository_id: number | null
  repository_name: string | null
  failure_reason: string
  timestamp: string
}

export interface AdminDashboard {
  stats: AdminStats
  repositories: AdminRepository[]
  users: AdminUser[]
  recent_messages: AdminMessage[]
  failed_queries_list: AdminFailedQuery[]
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>(`${BASE}/admin/dashboard`, {
    headers: authHeaders(),
  })
}

// ── Documents / Library ─────────────────────────────────────────────────

export interface LibraryDocument {
  id: number
  title: string
  file_name: string
  file_type: string
  created_at: string
}

export interface UploadResponse {
  message: string
  document_id?: number
  chunks_saved?: number
  chunks_indexed?: number
}

export interface UploadProgress {
  loaded: number
  total: number
  /** 0..1 */
  ratio: number
}

export async function listDocuments(): Promise<LibraryDocument[]> {
  return apiFetch<LibraryDocument[]>(`${BASE}/documents`, {
    headers: authHeaders(),
  })
}

export async function deleteDocument(id: number): Promise<void> {
  await apiFetch<{ message?: string }>(`${BASE}/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

/**
 * Upload a single file with real progress events via XHR.
 * fetch() doesn't expose upload progress, so we fall back to XHR for this
 * one endpoint. Returns a promise that resolves with the backend response
 * and rejects with an Error.
 */
export function uploadDocument(
  file: File,
  onProgress?: (p: UploadProgress) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    xhr.open('POST', `${BASE}/documents/upload`, true)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          ratio: e.loaded / e.total,
        })
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResponse)
        } catch (err) {
          reject(new Error('Invalid server response'))
        }
      } else if (xhr.status === 401) {
        // Token expired/invalid — same bounce-to-login treatment as
        // handleResponse so the user is never stuck looking at a
        // half-broken page.
        try {
          localStorage.removeItem('token')
        } catch {
          /* ignore */
        }
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login')
        ) {
          const next = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.replace(`/login?expired=1&next=${next}`)
        }
        reject(new Error('Your session has expired — please sign in again.'))
      } else {
        // Try to extract the backend's `detail` field
        let detail = xhr.statusText
        try {
          const body = JSON.parse(xhr.responseText)
          detail = body.detail ?? body.message ?? detail
        } catch {
          /* ignore */
        }
        reject(new Error(detail || `Upload failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload aborted'))

    xhr.send(form)
  })
}
