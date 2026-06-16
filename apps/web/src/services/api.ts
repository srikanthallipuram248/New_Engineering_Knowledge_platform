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
    // 401 = token expired/invalid. Clear it and bounce to /login so
    // the user gets a clear "session expired" flow instead of being
    // stuck on a half-broken page.
    if (res.status === 401) {
      try {
        localStorage.removeItem('token')
      } catch {
        /* ignore */
      }
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.replace(`/login?expired=1&next=${next}`)
      }
      throw new Error('Your session has expired — please sign in again.')
    }
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
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      question,
      ...(documentIds && documentIds.length > 0 ? { document_ids: documentIds } : {}),
    }),
  })
  return handleResponse<ChatApiResponse>(res)
}

export async function getChatHistory(): Promise<ChatHistoryMessage[]> {
  const res = await fetch(`${BASE}/chat/history`, {
    headers: authHeaders(),
  })
  return handleResponse<ChatHistoryMessage[]>(res)
}

export async function analyzeRepo(gitUrl: string): Promise<RepoAnalysisResult> {
  const res = await fetch(`${BASE}/analyzer/analyze`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ git_url: gitUrl }),
  })
  return handleResponse<RepoAnalysisResult>(res)
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
  const res = await fetch(`${BASE}/documents`, {
    headers: authHeaders(),
  })
  return handleResponse<LibraryDocument[]>(res)
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${BASE}/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  await handleResponse<{ message?: string }>(res)
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
