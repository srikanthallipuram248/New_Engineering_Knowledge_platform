import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BrainCircuit,
  MessageSquare,
  Trash2,
  RotateCcw,
  Plus,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  type ChatSession,
  formatSessionDate,
} from './ChatSessionManager'

interface ChatWelcomeScreenProps {
  sessions: ChatSession[]
  onNewChat: () => void
  onResumeSession: (session: ChatSession) => void
  onDeleteSession: (sessionId: string) => void
}

export function ChatWelcomeScreen({
  sessions,
  onNewChat,
  onResumeSession,
  onDeleteSession,
}: ChatWelcomeScreenProps) {
  const hasSessions = sessions.length > 0

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
      {/* Brand header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center"
      >
        <div className="relative mb-4">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/40 to-accent/30 opacity-50 blur-3xl" />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30">
            <BrainCircuit className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Chat with your Library
        </h2>
        <p className="mt-1.5 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
          Agent 2 searches your documents and grounds every answer in the source material.
        </p>
      </motion.div>

      {/* New chat CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="mt-6"
      >
        <button
          onClick={onNewChat}
          className={cn(
            'group flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5',
            'bg-gradient-to-r from-primary/20 to-accent/10',
            'border border-primary/30 hover:border-primary/50',
            'ring-1 ring-primary/10 hover:ring-primary/20',
            'transition-all duration-200 hover:shadow-lg hover:shadow-primary/10',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30 group-hover:bg-primary/30 transition-colors">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">New chat</p>
              <p className="text-[11px] text-muted-foreground">Start a fresh conversation</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </motion.div>

      {/* Previous sessions */}
      {hasSessions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-6 flex-1"
        >
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" />
            Previous chats
            <span className="ml-1 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px]">
              {sessions.length}
            </span>
          </p>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {sessions.map((session, i) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={i}
                  onResume={() => onResumeSession(session)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      )}

      {!hasSessions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/[0.04] ring-1 ring-foreground/10">
            <MessageSquare className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">No previous chats</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Your conversations will appear here
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ── Session card ─────────────────────────────────────────────────────────

interface SessionCardProps {
  session: ChatSession
  index: number
  onResume: () => void
  onDelete: () => void
}

function SessionCard({ session, onResume, onDelete }: SessionCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const userMessages = session.messages.filter((m) => m.role === 'user')
  const msgCount = session.messages.filter((m) => !m.pending).length
  const preview = userMessages[0]?.content ?? ''
  const previewShort = preview.length > 60 ? preview.slice(0, 60).trimEnd() + '…' : preview

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDelete(true)
  }

  function handleConfirmDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete()
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDelete(false)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22 }}
    >
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl border border-foreground/[0.07]',
          'bg-foreground/[0.02] hover:bg-foreground/[0.04]',
          'transition-all duration-150',
        )}
      >
        {/* Main content — clickable to resume */}
        <button
          onClick={onResume}
          className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
        >
          {/* Icon */}
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-foreground">
              {session.title}
            </p>
            {previewShort && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {previewShort}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                <Clock className="h-2.5 w-2.5" />
                {formatSessionDate(session.updatedAt)}
              </span>
              {msgCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <MessageSquare className="h-2.5 w-2.5" />
                  {msgCount} {msgCount === 1 ? 'message' : 'messages'}
                </span>
              )}
            </div>

            {/* Doc snapshot */}
            {session.docSnapshot.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {session.docSnapshot.slice(0, 4).map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1 rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-foreground/[0.06]"
                  >
                    <FileText className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate max-w-[80px]">{name}</span>
                  </span>
                ))}
                {session.docSnapshot.length > 4 && (
                  <span className="flex items-center rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-foreground/[0.06]">
                    +{session.docSnapshot.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Resume arrow */}
          <RotateCcw className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
        </button>

        {/* Action bar */}
        <div className="flex items-center justify-end gap-1 border-t border-foreground/[0.05] px-3 py-1.5">
          {!confirmDelete ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResume}
                className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Resume
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Delete this chat?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelDelete}
                className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleConfirmDelete}
                className="h-7 gap-1 text-[11px] text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                Yes, delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  )
}

// ── Example prompts for a fresh session ─────────────────────────────────

interface FreshSessionPromptsProps {
  onPick: (prompt: string) => void
}

const examplePrompts = [
  'What are our API design patterns?',
  'Summarize the architecture decisions',
  "What's the testing strategy?",
  'What did we decide about caching?',
]

export function FreshSessionPrompts({ onPick }: FreshSessionPromptsProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-40 blur-2xl" />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">New chat</h2>
      <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
        Ask anything about the documents in your library.
      </p>
      <div className="mt-4 w-full space-y-1.5">
        {examplePrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPick(prompt)}
            className={cn(
              'group flex w-full items-center gap-2 rounded-xl border border-foreground/5 bg-foreground/[0.02] px-3 py-2 text-left text-xs text-foreground/80',
              'transition-colors hover:border-foreground/10 hover:bg-foreground/[0.05] hover:text-foreground',
            )}
          >
            <Sparkles className="h-3 w-3 shrink-0 text-primary/70 transition-colors group-hover:text-primary" />
            <span className="flex-1">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
