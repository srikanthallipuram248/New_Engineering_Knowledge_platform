import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { BrainCircuit, MessageSquare, ScanSearch, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/analyzer',
    label: 'Repo Analyzer',
    icon: ScanSearch,
    description: 'Agent 1',
  },
  {
    to: '/chat',
    label: 'Chat with Docs',
    icon: MessageSquare,
    description: 'Agent 2',
  },
] as const

export function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="glass-nav sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <BrainCircuit className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            EKP
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Knowledge Platform
          </span>
        </div>
      </div>

      <div className="mx-4 mb-2 h-px bg-border" />

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-foreground/[0.04] ring-1 ring-foreground/10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'relative h-4 w-4 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="relative flex-1 truncate">{item.label}</span>
                <span
                  className={cn(
                    'relative text-[10px] font-semibold uppercase tracking-wider',
                    isActive
                      ? 'text-primary/80'
                      : 'text-muted-foreground/60',
                  )}
                >
                  {item.description}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: feature hint + logout */}
      <div className="space-y-3 p-4">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground/90">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Two agents online</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Architecture breakdown &amp; document-grounded Q&amp;A.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
