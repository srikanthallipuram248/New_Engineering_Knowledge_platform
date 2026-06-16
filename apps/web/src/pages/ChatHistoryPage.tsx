import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  BrainCircuit,
  MessageSquare,
  Trash2,
  RotateCcw,
  Plus,
  FileText,
  Clock,
  Search,
  ChevronRight,
  History,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  loadSessions,
  deleteSession,
  formatSessionDate,
  type ChatSession,
} from '@/components/library/ChatSessionManager'

export default function ChatHistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    loadSessions().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  )
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = sessions.filter(
    (s) =>
      !query ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.messages.some((m) => m.content.toLowerCase().includes(query.toLowerCase())),
  )

  function handleResume(session: ChatSession) {
    // Set active session in localStorage then go to library
    try {
      localStorage.setItem('ekp.chat.activeSessionId', session.id)
    } catch {
      /* ignore */
    }
    navigate('/library')
  }

  function handleDelete(id: string) {
    deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setDeletingId(null)
  }

  function handleNewChat() {
    // Clear active session so library opens a fresh chat
    try {
      localStorage.removeItem('ekp.chat.activeSessionId')
    } catch {
      /* ignore */
    }
    navigate('/library')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <History className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Chat History
              </h1>
              <p className="text-sm text-muted-foreground">
                {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleNewChat}
            className="gap-2 shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
      </motion.header>

      {/* Search */}
      {sessions.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className={cn(
              'w-full rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] py-2.5 pl-10 pr-4',
              'text-sm text-foreground placeholder:text-muted-foreground/50',
              'focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20',
              'transition-all duration-150',
            )}
          />
        </motion.div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center rounded-2xl border border-foreground/[0.07] bg-foreground/[0.02] px-8 py-20 text-center"
        >
          <div className="relative mb-5">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/20 opacity-50 blur-3xl" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30">
              <BrainCircuit className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">No conversations yet</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Start your first chat with the Knowledge Library and it'll appear here.
          </p>
          <Button onClick={handleNewChat} className="mt-6 gap-2 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" />
            Start your first chat
          </Button>
        </motion.div>
      )}

      {/* No search results */}
      {sessions.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.02] px-8 py-12 text-center">
          <Search className="mx-auto mb-3 h-7 w-7 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No conversations match "{query}"</p>
        </div>
      )}

      {/* Session list */}
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((session, i) => (
            <HistoryCard
              key={session.id}
              session={session}
              index={i}
              isDeleting={deletingId === session.id}
              onResume={() => handleResume(session)}
              onDeleteRequest={() => setDeletingId(session.id)}
              onDeleteCancel={() => setDeletingId(null)}
              onDeleteConfirm={() => handleDelete(session.id)}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}

// ── History card ──────────────────────────────────────────────────────────

interface HistoryCardProps {
  session: ChatSession
  index: number
  isDeleting: boolean
  onResume: () => void
  onDeleteRequest: () => void
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
}

function HistoryCard({
  session,
  index,
  isDeleting,
  onResume,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: HistoryCardProps) {
  const userMessages = session.messages.filter((m) => m.role === 'user')
  const assistantMessages = session.messages.filter((m) => m.role === 'assistant' && !m.pending)
  const lastMsg = session.messages.filter((m) => !m.pending).at(-1)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <div
        className={cn(
          'group overflow-hidden rounded-2xl border transition-all duration-200',
          isDeleting
            ? 'border-destructive/40 bg-destructive/5'
            : 'border-foreground/[0.08] bg-foreground/[0.02] hover:border-primary/25 hover:bg-foreground/[0.04] hover:shadow-lg hover:shadow-primary/5',
        )}
      >
        {/* Main content */}
        <button
          onClick={onResume}
          className="flex w-full items-start gap-4 px-5 py-4 text-left"
        >
          {/* Icon */}
          <div
            className={cn(
              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-all',
              isDeleting
                ? 'bg-destructive/10 ring-destructive/20'
                : 'bg-primary/10 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/30',
            )}
          >
            <MessageSquare
              className={cn(
                'h-4.5 w-4.5 transition-colors',
                isDeleting ? 'text-destructive' : 'text-primary',
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                {session.title}
              </h2>
              <span className="shrink-0 text-[11px] text-muted-foreground/60 whitespace-nowrap">
                {formatSessionDate(session.updatedAt)}
              </span>
            </div>

            {/* Last message preview */}
            {lastMsg && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                <span className="font-medium text-muted-foreground/80">
                  {lastMsg.role === 'user' ? 'You: ' : 'Agent 2: '}
                </span>
                {lastMsg.content}
              </p>
            )}

            {/* Meta */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <MessageSquare className="h-3 w-3" />
                {userMessages.length} {userMessages.length === 1 ? 'question' : 'questions'} ·{' '}
                {assistantMessages.length} {assistantMessages.length === 1 ? 'answer' : 'answers'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                <Clock className="h-3 w-3" />
                {new Date(session.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Doc snapshot */}
            {session.docSnapshot.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {session.selectedDocIds.length > 0 && session.selectedDocIds.length < session.docSnapshot.length ? (
                  <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    {session.selectedDocIds.length} of {session.docSnapshot.length} files selected
                  </span>
                ) : (
                  session.docSnapshot.slice(0, 5).map((name) => (
                    <span
                      key={name}
                      className="flex items-center gap-1 rounded-lg bg-foreground/[0.05] px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-foreground/[0.07]"
                    >
                      <FileText className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate max-w-[100px]">{name}</span>
                    </span>
                  ))
                )}
                {session.docSnapshot.length > 5 && session.selectedDocIds.length === 0 && (
                  <span className="rounded-lg bg-foreground/[0.05] px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{session.docSnapshot.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>

          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary" />
        </button>

        {/* Action bar */}
        <div
          className={cn(
            'flex items-center justify-between border-t px-4 py-2',
            isDeleting
              ? 'border-destructive/20 bg-destructive/5'
              : 'border-foreground/[0.05] bg-transparent',
          )}
        >
          {!isDeleting ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onResume}
                className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Resume
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-destructive">
                Are you sure? This cannot be undone.
              </p>
            </div>
          )}

          <div className="flex items-center gap-1">
            {!isDeleting ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteRequest()
                }}
                className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteCancel}
                  className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteConfirm}
                  className="h-7 gap-1 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Yes, delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  )
}
