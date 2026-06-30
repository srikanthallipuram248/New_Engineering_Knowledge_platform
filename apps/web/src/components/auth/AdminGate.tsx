import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/services/api'
import type { CurrentUser } from '@/services/api'

function isAdmin(user: CurrentUser | null) {
  const role = user?.role?.trim().toLowerCase()
  return role === 'admin' || role === 'administrator'
}

export function AdminGate() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!cancelled) setUser(currentUser)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Checking access
        </div>
      </div>
    )
  }

  if (!isAdmin(user)) {
    return <Navigate to="/analyzer" replace />
  }

  return <Outlet />
}
