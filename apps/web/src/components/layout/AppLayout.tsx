import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolSwitcher, type ToolId } from './ToolSwitcher'
import { ViewModeToggle, type ViewMode } from './ViewModeToggle'
import AnalyzerPage from '@/pages/AnalyzerPage'
import LibraryPage from '@/pages/LibraryPage'
import { useAuth } from '@/hooks/useAuth'

const TOOL_STORAGE_KEY = 'ekp.view.tool'
const MODE_STORAGE_KEY = 'ekp.view.mode'

function readStored<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    if (v === 'analyzer' || v === 'library') return v as T
    if (v === 'tab' || v === 'split') return v as T
  } catch {
    /* ignore */
  }
  return fallback
}

export function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [tool, setToolState] = useState<ToolId>(() =>
    readStored<ToolId>(TOOL_STORAGE_KEY, 'analyzer'),
  )
  const [mode, setModeState] = useState<ViewMode>(() =>
    readStored<ViewMode>(MODE_STORAGE_KEY, 'tab'),
  )

  // Persist view prefs
  useEffect(() => {
    try {
      localStorage.setItem(TOOL_STORAGE_KEY, tool)
    } catch {
      /* ignore */
    }
  }, [tool])

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  // Keep URL in sync with the active tool so refreshes and links work
  useEffect(() => {
    const path = tool === 'analyzer' ? '/analyzer' : '/library'
    if (window.location.pathname !== path) {
      navigate(path, { replace: true })
    }
    // We only react when `tool` changes; navigate is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool])

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-6 py-3 md:px-10">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
            <span className="text-[11px] font-bold tracking-tight text-primary-foreground">
              E
            </span>
          </div>
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            Engineering Knowledge Platform
          </span>
        </div>

        {/* Center: the big tool switcher (only when in tab mode; in split
            mode the two tools are visible so the switcher is hidden) */}
        {mode === 'tab' && (
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <ToolSwitcher value={tool} onChange={setToolState} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <ViewModeToggle value={mode} onChange={setModeState} className="hidden sm:inline-flex" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="relative flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-8 md:px-10 md:py-10">
          {/*
            Both tools are always mounted; we toggle visibility via CSS.
            Split mode shows both side-by-side; tab mode shows only the
            active one. This preserves scroll position when switching
            between Tab and Split.
          */}
          {mode === 'tab' ? (
            <div>
              {/* Mobile: a smaller switcher above the active tool */}
              <div className="mb-6 flex justify-center md:hidden">
                <ToolSwitcher value={tool} onChange={setToolState} />
              </div>
              {tool === 'analyzer' ? <AnalyzerPage /> : <LibraryPage />}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ToolPane
                tool="analyzer"
                active={tool === 'analyzer'}
                onFocus={() => setToolState('analyzer')}
              >
                <AnalyzerPage />
              </ToolPane>
              <ToolPane
                tool="library"
                active={tool === 'library'}
                onFocus={() => setToolState('library')}
              >
                <LibraryPage />
              </ToolPane>
            </div>
          )}
        </div>
      </main>

      {/* Router outlet for nested routes (used by /chat redirect etc.) */}
      <Outlet />
    </div>
  )
}

interface ToolPaneProps {
  tool: ToolId
  active: boolean
  onFocus: () => void
  children: React.ReactNode
}

/**
 * Wraps a tool in split view with a glass "active" treatment — the pane
 * the user is currently focused on gets a subtle accent ring + slight
 * dim treatment on the other pane.
 */
function ToolPane({ active, onFocus, children }: ToolPaneProps) {
  return (
    <div
      onMouseDown={onFocus}
      className={
        active
          ? 'relative'
          : 'relative opacity-70 transition-opacity hover:opacity-100'
      }
    >
      {active && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 opacity-60 blur-md"
        />
      )}
      <div
        className={
          'relative h-full overflow-hidden rounded-2xl ring-1 ' +
          (active
            ? 'bg-background/40 ring-primary/30 backdrop-blur-md'
            : 'bg-background/30 ring-foreground/10 backdrop-blur-sm')
        }
      >
        {children}
      </div>
    </div>
  )
}
