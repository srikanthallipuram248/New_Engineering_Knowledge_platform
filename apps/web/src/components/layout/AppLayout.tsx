import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatDrawer } from '@/components/chat/ChatDrawer'
import { ChatDrawerProvider } from '@/components/chat/ChatDrawerContext'
import { FloatingChatButton } from '@/components/chat/FloatingChatButton'
import { useAuth } from '@/hooks/useAuth'

export function AppLayout() {
  return (
    <ChatDrawerProvider>
      <Shell />
    </ChatDrawerProvider>
  )
}

function Shell() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Minimal top bar — sign out only. The chat button is the second primary action. */}
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between border-b px-6 py-3 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
            <span className="text-[11px] font-bold tracking-tight text-primary-foreground">
              E
            </span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            EKP
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </header>

      <main className="relative flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-12">
          <Outlet />
        </div>
      </main>

      <FloatingChatButton />
      <ChatDrawer />
    </div>
  )
}
