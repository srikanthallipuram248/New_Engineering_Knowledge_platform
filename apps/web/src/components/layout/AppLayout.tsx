import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolSwitcher, type ToolId } from './ToolSwitcher'
import { ViewModeToggle, type ViewMode } from './ViewModeToggle'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

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

/**
 * The app shell — header + main content area.
 *
 * Important: this component does NOT render pages directly. The page
 * content is rendered by a child route via <Outlet />. AppLayout only
 * controls chrome (header, footer) and view-mode preferences
 * (which tool is active, whether to show one or both).
 *
 * The split-view rendering lives inside the route element, not here
 * (see src/pages/SplitViewPage.tsx).
 */
export function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isSplit = location.pathname === '/split'

  const [tool, setToolState] = useState<ToolId>(() =>
    readStored<ToolId>(TOOL_STORAGE_KEY, 'analyzer'),
  )
  const [mode, setModeState] = useState<ViewMode>(() =>
    readStored<ViewMode>(MODE_STORAGE_KEY, 'tab'),
  )

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

  const handleToolChange = (nextTool: ToolId) => {
    setToolState(nextTool)
    const target = mode === 'split' ? '/split' : nextTool === 'analyzer' ? '/analyzer' : '/library'
    navigate(target)
  }

  const handleModeChange = (nextMode: ViewMode) => {
    setModeState(nextMode)
    const target = nextMode === 'split' ? '/split' : tool === 'analyzer' ? '/analyzer' : '/library'
    navigate(target)
  }

  // Keep URL in sync with the active tool/mode — but only for tool pages.
  // Routes like /chats are standalone pages and must not be redirected away.
  useEffect(() => {
    const path = window.location.pathname
    const isToolPage = path === '/analyzer' || path === '/library' || path === '/split' || path === '/'
    if (!isToolPage) return   // leave non-tool pages alone
    const target = mode === 'split' ? '/split' : tool === 'analyzer' ? '/analyzer' : '/library'
    if (path !== target) {
      navigate(target, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, mode])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

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

        {/* Center: big pill switcher. Hidden in split mode (the two tools
            are already visible so the switcher would be redundant). */}
        {mode !== 'split' && (
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <ToolSwitcher value={tool} onChange={handleToolChange} />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Chat history link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chats')}
            className={cn(
              'hidden gap-1.5 text-[11px] font-medium sm:inline-flex',
              location.pathname === '/chats'
                ? 'text-primary hover:text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <History className="h-3.5 w-3.5" />
            History
          </Button>
          <ViewModeToggle value={mode} onChange={handleModeChange} className="hidden sm:inline-flex" />
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

      {/* Single Outlet — the matched child route renders exactly once. */}
      <main className="flex-1 overflow-x-hidden">
        <div
          className={
            isSplit
              ? 'mx-auto w-full max-w-[1920px] px-2 pt-2 pb-1'
              : 'mx-auto w-full max-w-[1600px] px-4 pt-8 pb-6 md:px-8 md:pt-10 md:pb-8'
          }
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
