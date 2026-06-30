/**
 * ChatSessionManager — localStorage-backed multi-session store for the
 * Library chat panel.
 *
 * Each session lives entirely in the browser. The backend only exposes
 * a single flat /chat/history, so server history is loaded once on first
 * app load and stored as a session called "Previous conversation". All
 * subsequent sessions are created fresh in the browser.
 */

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
  failed?: boolean
  sources?: SessionSource[]
  answer_source?: 'ai' | 'documents'
  /** Server-side ChatMessage.id for the assistant turn — populated from
   *  the /chat response so thumbs up/down feedback can target the
   *  correct backend row. */
  serverMessageId?: number
}

export interface SessionSource {
  document_id: number
  filename: string
  uploaded_by?: number | null
  uploaded_by_name?: string | null
  rerank_score: number
  snippet: string
}

// export interface ChatSession {
//   id: string
//   /** Derived from first user message, or "New chat" */
//   title: string
//   createdAt: string
//   updatedAt: string
//   messages: SessionMessage[]
//   /** Names of library documents at the time this session was created */
//   docSnapshot: string[]
//   /** IDs of documents scoped to this session for RAG (all docs if empty) */
//   selectedDocIds: number[]
// }
export interface ChatSession {

  // Local frontend ID
  id: string

  // Backend session UUID
  session_uuid: string

  title: string

  createdAt: string
  updatedAt: string

  messages: SessionMessage[]

  docSnapshot: string[]

  selectedDocIds: number[]
}

const ACTIVE_SESSION_KEY = 'ekp.chat.activeSessionId'

function getUserId(): string | null {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload?.sub) return String(payload.sub)
    }
  } catch { /* ignore */ }
  return null
}

function getStorageKey(): string {
  const uid = getUserId()
  return uid ? `ekp.chat.sessions.${uid}` : 'ekp.chat.sessions'
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(getStorageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    // Migration: ensure selectedDocIds always exists (added in a later version)
    return parsed.map((s) => ({
      ...s,
      selectedDocIds: s.selectedDocIds ?? [],
    }))
  } catch {
    return []
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(sessions))
  } catch {
    /* ignore — quota exceeded or private mode */
  }
}

export function clearSessionsForUser(userId: string): void {
  try {
    localStorage.removeItem(`ekp.chat.sessions.${userId}`)
    localStorage.removeItem(ACTIVE_SESSION_KEY)
  } catch { /* ignore */ }
}

export function saveSession(session: ChatSession): void {
  const sessions = loadSessions()
  const idx = sessions.findIndex((s) => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.unshift(session)
  }
  saveSessions(sessions)
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id)
  saveSessions(sessions)
  // Clear active if it was this session
  if (getActiveSessionId() === id) {
    clearActiveSessionId()
  }
}

// export function createNewSession(
//   docSnapshot: string[] = [],
//   selectedDocIds: number[] = [],
// ): ChatSession {
//   return {
//     id: crypto.randomUUID(),
//     title: 'New chat',
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//     messages: [],
//     docSnapshot,
//     selectedDocIds,
//   }
// }
// New code
export function createNewSession(
  //sessionId: string,
  session_uuid: string,
  docSnapshot: string[] = [],
  selectedDocIds: number[] = [],
): ChatSession {
  return {
    id: crypto.randomUUID(),

    session_uuid,

    title: 'New chat',

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),

    messages: [],

    docSnapshot,

    selectedDocIds,
  }
}

/** Derive a title from the first user message in the session. */
export function deriveTitleFromMessages(messages: SessionMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'New chat'
  const text = first.content.trim()
  return text.length > 52 ? text.slice(0, 52).trimEnd() + '…' : text
}

// ── Active session ID ────────────────────────────────────────────────────

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY)
  } catch {
    return null
  }
}

export function setActiveSessionId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, id)
  } catch {
    /* ignore */
  }
}

export function clearActiveSessionId(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
