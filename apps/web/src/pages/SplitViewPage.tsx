import AnalyzerPage from './AnalyzerPage'
import LibraryPage from './LibraryPage'
import { cn } from '@/lib/utils'

/**
 * Split-view page: renders both tools side by side, 50/50 on desktop.
 * Each pane is a glass card with its own scroll. Active state is driven
 * by CSS :hover (and :focus-within) — no React state, so re-renders
 * from one pane don't propagate to the other.
 */
export default function SplitViewPage() {
  return (
    <div className="grid h-[calc(100vh-4.5rem)] grid-cols-1 gap-3 lg:grid-cols-2">
      <SplitPane>
        <AnalyzerPage />
      </SplitPane>

      <SplitPane>
        <LibraryPage />
      </SplitPane>
    </div>
  )
}

interface SplitPaneProps {
  children: React.ReactNode
}

function SplitPane({ children }: SplitPaneProps) {
  return (
    <div
      className={cn(
        'group/pane relative flex min-h-0 flex-col overflow-hidden rounded-2xl',
        'bg-background/30 ring-2 ring-foreground/10',
        'transition-all duration-150',
        // Hover and focus-within both promote the pane to "active"
        'hover:bg-background/50 hover:ring-primary/60 hover:shadow-[0_0_32px_-8px_hsl(248_90%_60%/0.55)]',
        'focus-within:bg-background/50 focus-within:ring-primary/60 focus-within:shadow-[0_0_32px_-8px_hsl(248_90%_60%/0.55)]',
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="p-4 md:p-5">{children}</div>
      </div>
    </div>
  )
}
