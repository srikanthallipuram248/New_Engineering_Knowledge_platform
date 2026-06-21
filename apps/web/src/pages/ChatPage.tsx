import { SlideUp } from '@/components/motion/SlideUp'
import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  return (
    <SlideUp>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Chat with Docs
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask questions grounded in your uploaded engineering knowledge base.
        </p>
      </div>

      <div className="glass mt-10 flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
          <MessageSquare className="h-6 w-6 text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Chat coming in Phase 4</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The RAG-backed chat surface (Agent 2) will land in the final phase.
        </p>
      </div>
    </SlideUp>
  )
}
