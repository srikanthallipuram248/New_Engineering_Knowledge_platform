import { forwardRef, useEffect, useRef, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Trash2,
  BrainCircuit,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fadeInUp } from '@/lib/motion-presets'
import { useChatDrawerContext } from './ChatDrawerContext'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

const STORAGE_KEY = 'ekp.chat.messages'

const examplePrompts = [
  "What's our API design pattern?",
  'Show me recent security decisions',
  'Summarize our testing strategy',
  'What did we decide about caching?',
]

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    /* ignore */
  }
}

export function ChatDrawer() {
  const { open, closeDrawer } = useChatDrawerContext()
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    persistMessages(messages)
  }, [messages])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDrawer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeDrawer])

  function clearHistory() {
    setMessages([])
  }

  function sendMessage(text: string) {
    const content = text.trim()
    if (!content || sending) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    }
    const pendingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      pending: true,
    }
    setMessages((m) => [...m, userMsg, pendingMsg])
    setDraft('')
    setSending(true)

    // Phase 3-prep: echo mock. Real backend wiring in Phase 4.
    setTimeout(() => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingMsg.id
            ? { ...msg, pending: false, content: mockAnswer(content) }
            : msg,
        ),
      )
      setSending(false)
    }, 900)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendMessage(draft)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px]"
            aria-hidden
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Chat with your knowledge base"
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.6 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 38,
              mass: 0.7,
            }}
            className={cn(
              'glass-strong fixed right-0 top-0 z-50 flex h-screen w-full flex-col',
              'sm:w-[440px]',
              'border-l border-foreground/10',
              'shadow-2xl shadow-black/40',
            )}
          >
            <DrawerHeader
              onClear={clearHistory}
              onClose={closeDrawer}
              hasMessages={messages.length > 0}
            />
            <MessageList
              ref={listRef}
              messages={messages}
              onPickPrompt={sendMessage}
            />
            <InputBar
              draft={draft}
              setDraft={setDraft}
              onSubmit={handleSubmit}
              sending={sending}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

interface DrawerHeaderProps {
  onClear: () => void
  onClose: () => void
  hasMessages: boolean
}

function DrawerHeader({ onClear, onClose, hasMessages }: DrawerHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-foreground/[0.06] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
          <BrainCircuit className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Chat with Docs
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Agent 2 · grounded in your library
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {hasMessages && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            aria-label="Clear history"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close chat"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

interface MessageListProps {
  messages: ChatMessage[]
  onPickPrompt: (prompt: string) => void
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList({ messages, onPickPrompt }, ref) {
    return (
      <div ref={ref} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <EmptyState onPick={onPickPrompt} />
        ) : (
          <ul className="space-y-4">
            {messages.map((m) => (
              <li key={m.id}>
                <MessageBubble message={m} />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  },
)

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/20'
            : 'glass rounded-bl-md text-foreground',
        )}
      >
        {message.pending ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
    </motion.div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-foreground/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  )
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-40 blur-2xl" />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
          <MessageSquare className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        Ask your knowledge base
      </h2>
      <p className="mt-1 max-w-[300px] text-xs text-muted-foreground">
        Agent 2 will search your uploaded documents and ground every answer in
        the source material.
      </p>
      <div className="mt-5 w-full space-y-1.5">
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

interface InputBarProps {
  draft: string
  setDraft: (v: string) => void
  onSubmit: (e: FormEvent) => void
  sending: boolean
}

function InputBar({ draft, setDraft, onSubmit, sending }: InputBarProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-foreground/[0.06] p-3">
      <div className="glass flex items-end gap-2 rounded-2xl p-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit(e as unknown as FormEvent)
            }
          }}
          rows={1}
          placeholder="Ask your knowledge base…"
          disabled={sending}
          className={cn(
            'max-h-32 min-h-[40px] flex-1 resize-none rounded-xl bg-transparent px-3 py-2 text-sm text-foreground',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none',
            'disabled:opacity-50',
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className="h-9 w-9 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="mt-1.5 px-2 text-[10px] text-muted-foreground/70">
        <kbd className="rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">Enter</kbd> to send · <kbd className="rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">Shift</kbd>+<kbd className="rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">Enter</kbd> for newline
      </p>
    </form>
  )
}

function mockAnswer(question: string): string {
  return `This is a Phase 3 prep echo. You asked: "${question}".\n\nIn Phase 4 this will call POST /api/v1/chat and stream the RAG-grounded answer back.`
}
