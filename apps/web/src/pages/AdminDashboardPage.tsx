import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  FileCode2,
  FileText,
  Layers,
  MessageSquareText,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
  Activity,
  XCircle,
  ArrowUpRight,
  Circle,
} from 'lucide-react'
import { getAdminDashboard } from '@/services/api'
import type {
  AdminDashboard,
  AdminFailedQuery,
  AdminMessage,
  AdminRepository,
  AdminUser,
} from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Utility helpers ───────────────────────────────────────────────────────

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function timeAgo(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function shortText(value: string, length = 110) {
  return value.length > length ? `${value.slice(0, length).trim()}…` : value
}

function initials(name: string | null, email: string) {
  const src = name ?? email
  return src
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function avatarColor(str: string) {
  const colors = [
    'from-violet-500 to-purple-700',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-700',
    'from-cyan-500 to-sky-600',
    'from-fuchsia-500 to-violet-600',
  ]
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return colors[h % colors.length]
}

// ── Tab ids ───────────────────────────────────────────────────────────────

type Tab = 'overview' | 'users' | 'repos' | 'activity'

// ── Main page ─────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  async function loadDashboard(mode: 'initial' | 'refresh' = 'initial') {
    if (mode === 'refresh') setRefreshing(true)
    if (mode === 'initial') setLoading(true)
    setError('')
    try {
      const data = await getAdminDashboard()
      setDashboard(data)
      setLastRefreshed(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const topUploaders = useMemo(() => {
    const totals = new Map<string, { name: string; email: string; count: number }>()
    for (const repo of dashboard?.repositories ?? []) {
      const key = repo.uploaded_by_email
      const current = totals.get(key) ?? {
        name: repo.uploaded_by_name || repo.uploaded_by_email,
        email: repo.uploaded_by_email,
        count: 0,
      }
      current.count += 1
      totals.set(key, current)
    }
    return [...totals.values()].sort((a, b) => b.count - a.count).slice(0, 6)
  }, [dashboard?.repositories])

  const maxUploads = useMemo(
    () => Math.max(1, ...topUploaders.map((u) => u.count)),
    [topUploaders],
  )

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      count: dashboard?.users.length,
    },
    {
      id: 'repos',
      label: 'Repositories',
      icon: FileCode2,
      count: dashboard?.repositories.length,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
      count: dashboard?.recent_messages.length,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* Icon badge */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Engineering Knowledge Platform · Control Centre
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastRefreshed && (
            <span className="text-xs text-muted-foreground">
              Updated {timeAgo(lastRefreshed.toISOString())}
            </span>
          )}
          <Button
            variant="glass"
            size="sm"
            onClick={() => void loadDashboard('refresh')}
            disabled={loading || refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </motion.header>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading skeleton ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : dashboard ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* ── Stats ── */}
          <StatsGrid dashboard={dashboard} />

          {/* ── Tabs ── */}
          <div>
            {/* Tab bar */}
            <div className="mb-5 flex items-center gap-1 overflow-x-auto rounded-xl border border-foreground/8 bg-card/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/25'
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        activeTab === tab.id
                          ? 'bg-primary/20 text-primary'
                          : 'bg-foreground/8 text-muted-foreground',
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {activeTab === 'overview' && (
                  <OverviewTab
                    dashboard={dashboard}
                    topUploaders={topUploaders}
                    maxUploads={maxUploads}
                  />
                )}
                {activeTab === 'users' && <UsersTab users={dashboard.users} />}
                {activeTab === 'repos' && (
                  <ReposTab repositories={dashboard.repositories} />
                )}
                {activeTab === 'activity' && (
                  <ActivityTab
                    messages={dashboard.recent_messages}
                    queries={dashboard.failed_queries_list}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="glass h-12 animate-pulse rounded-xl" />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="glass h-72 animate-pulse rounded-2xl" />
        <div className="glass h-72 animate-pulse rounded-2xl" />
      </div>
    </div>
  )
}

// ── Stats grid ────────────────────────────────────────────────────────────

function StatsGrid({ dashboard }: { dashboard: AdminDashboard }) {
  const { stats } = dashboard

  const items = [
    {
      label: 'Repositories',
      value: stats.total_repositories,
      icon: FileCode2,
      gradient: 'from-violet-500/20 to-primary/10',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/15',
      trend: '+2',
      trendUp: true,
    },
    {
      label: 'Vector Chunks',
      value: stats.total_chunks,
      icon: Database,
      gradient: 'from-cyan-500/15 to-accent/10',
      iconColor: 'text-accent',
      iconBg: 'bg-accent/15',
      trend: null,
      trendUp: true,
    },
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: Users,
      gradient: 'from-emerald-500/15 to-teal-500/10',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-400/15',
      sub: `${stats.active_users} active`,
      trend: null,
      trendUp: true,
    },
    {
      label: 'Messages Sent',
      value: stats.total_messages,
      icon: MessageSquareText,
      gradient: 'from-sky-500/15 to-blue-500/10',
      iconColor: 'text-sky-300',
      iconBg: 'bg-sky-400/15',
      trend: null,
      trendUp: true,
    },
    {
      label: 'Failed Queries',
      value: stats.failed_queries,
      icon: stats.failed_queries ? AlertTriangle : CheckCircle2,
      gradient: stats.failed_queries
        ? 'from-amber-500/15 to-orange-500/10'
        : 'from-emerald-500/15 to-green-500/10',
      iconColor: stats.failed_queries ? 'text-amber-300' : 'text-emerald-400',
      iconBg: stats.failed_queries ? 'bg-amber-400/15' : 'bg-emerald-400/15',
      sub: stats.failed_queries ? 'needs attention' : 'all good',
      trend: null,
      trendUp: false,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.06, ease: 'easeOut' }}
        >
          <Card
            className={cn(
              'group relative overflow-hidden rounded-xl transition-shadow hover:shadow-lg hover:shadow-black/20',
            )}
          >
            {/* Gradient tint */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-80',
                item.gradient,
              )}
            />
            <CardContent className="relative flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    item.iconBg,
                  )}
                >
                  <item.icon className={cn('h-4 w-4', item.iconColor)} />
                </div>
                {item.trend && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-400">
                    <ArrowUpRight className="h-3 w-3" />
                    {item.trend}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {item.value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                {item.sub && (
                  <p className={cn('mt-0.5 text-[10px]', item.iconColor)}>{item.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────

function OverviewTab({
  dashboard,
  topUploaders,
  maxUploads,
}: {
  dashboard: AdminDashboard
  topUploaders: { name: string; email: string; count: number }[]
  maxUploads: number
}) {
  return (
    <div className="space-y-5">
      {/* Row 1: System health + Upload leaderboard */}
      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <SystemHealthCard dashboard={dashboard} />
        <UploaderLeaderboard uploaders={topUploaders} maxUploads={maxUploads} />
      </div>

      {/* Row 2: Recent activity timeline + Failed queries */}
      <div className="grid gap-5 xl:grid-cols-2">
        <MiniActivityFeed messages={dashboard.recent_messages} />
        <FailedQueriesMini queries={dashboard.failed_queries_list} />
      </div>
    </div>
  )
}

// ── System health card ────────────────────────────────────────────────────

function SystemHealthCard({ dashboard }: { dashboard: AdminDashboard }) {
  const { stats } = dashboard
  const health =
    stats.failed_queries === 0
      ? 'Excellent'
      : stats.failed_queries <= 3
        ? 'Good'
        : 'Needs attention'
  const healthColor =
    health === 'Excellent'
      ? 'text-emerald-400'
      : health === 'Good'
        ? 'text-amber-300'
        : 'text-red-400'
  const healthBg =
    health === 'Excellent'
      ? 'bg-emerald-400/15'
      : health === 'Good'
        ? 'bg-amber-400/15'
        : 'bg-red-400/15'

  const avgChunksPerRepo =
    stats.total_repositories > 0
      ? Math.round(stats.total_chunks / stats.total_repositories)
      : 0
  const activeRatio =
    stats.total_users > 0
      ? Math.round((stats.active_users / stats.total_users) * 100)
      : 0

  const metrics = [
    {
      label: 'Active User Rate',
      value: `${activeRatio}%`,
      subtext: `${stats.active_users} of ${stats.total_users} users`,
      icon: Users,
      fill: activeRatio,
      color: 'bg-emerald-400',
    },
    {
      label: 'Avg Chunks / Repo',
      value: avgChunksPerRepo.toLocaleString(),
      subtext: 'vector embeddings',
      icon: Layers,
      fill: Math.min(100, avgChunksPerRepo / 10),
      color: 'bg-accent',
    },
    {
      label: 'Query Success Rate',
      value:
        stats.total_messages > 0
          ? `${Math.round(((stats.total_messages - stats.failed_queries) / stats.total_messages) * 100)}%`
          : '—',
      subtext: `${stats.failed_queries} failed of ${stats.total_messages}`,
      icon: Zap,
      fill:
        stats.total_messages > 0
          ? Math.round(
              ((stats.total_messages - stats.failed_queries) / stats.total_messages) * 100,
            )
          : 100,
      color: stats.failed_queries === 0 ? 'bg-emerald-400' : 'bg-amber-400',
    },
  ]

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <Server className="h-3.5 w-3.5 text-primary" />
          </div>
          System Health
        </CardTitle>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
            healthBg,
            healthColor,
            health === 'Excellent'
              ? 'ring-emerald-400/25'
              : health === 'Good'
                ? 'ring-amber-400/25'
                : 'ring-red-400/25',
          )}
        >
          {health}
        </span>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-1">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <m.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-foreground">{m.label}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="font-semibold text-foreground">{m.value}</span>
                <span className="text-[10px] text-muted-foreground">{m.subtext}</span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8">
              <motion.div
                className={cn('h-full rounded-full', m.color)}
                initial={{ width: 0 }}
                animate={{ width: `${m.fill}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>
        ))}

        {/* Quick stats row */}
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-foreground/8 pt-3">
          {[
            { label: 'Repos', val: stats.total_repositories, icon: FileCode2 },
            { label: 'Chunks', val: stats.total_chunks, icon: Database },
            { label: 'Messages', val: stats.total_messages, icon: MessageSquareText },
          ].map((s) => (
            <div key={s.label} className="glass-flat rounded-lg p-2 text-center">
              <s.icon className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">{s.val.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Uploader leaderboard ──────────────────────────────────────────────────

function UploaderLeaderboard({
  uploaders,
  maxUploads,
}: {
  uploaders: { name: string; email: string; count: number }[]
  maxUploads: number
}) {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
          </div>
          Upload Leaderboard
        </CardTitle>
        <Badge variant="muted">{uploaders.length} contributors</Badge>
      </CardHeader>
      <CardContent className="space-y-2.5 p-4 pt-1">
        {uploaders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upload activity yet.</p>
        ) : (
          uploaders.map((u, idx) => (
            <div key={u.email} className="flex items-center gap-3">
              {/* Rank */}
              <span className="w-6 shrink-0 text-center text-sm">
                {idx < 3 ? medals[idx] : <span className="text-muted-foreground">{idx + 1}</span>}
              </span>
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white',
                  avatarColor(u.email),
                )}
              >
                {initials(u.name, u.email)}
              </div>
              {/* Name + bar */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-foreground">{u.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-foreground">
                    {u.count}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-foreground/8">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-accent' : 'bg-foreground/30',
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${(u.count / maxUploads) * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 + idx * 0.05 }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Mini activity feed ────────────────────────────────────────────────────

function MiniActivityFeed({ messages }: { messages: AdminMessage[] }) {
  const latest = messages.slice(0, 6)
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-400/15">
            <MessageSquareText className="h-3.5 w-3.5 text-sky-300" />
          </div>
          Recent Chat Activity
        </CardTitle>
        <Badge variant="muted">{messages.length} msgs</Badge>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-1">
        {latest.length === 0 ? (
          <EmptyState icon={MessageSquareText} text="No chat activity yet." />
        ) : (
          latest.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex gap-2.5"
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white',
                  avatarColor(msg.user_email),
                )}
              >
                {initials(msg.user_name, msg.user_email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {msg.user_name || msg.user_email}
                  </span>
                  <Badge
                    variant={msg.role === 'user' ? 'info' : 'default'}
                    size="sm"
                    className="text-[9px]"
                  >
                    {msg.role}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(msg.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {shortText(msg.content, 80)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Failed queries mini ───────────────────────────────────────────────────

function FailedQueriesMini({ queries }: { queries: AdminFailedQuery[] }) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/15">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
          </div>
          Failed Queries
        </CardTitle>
        <Badge variant={queries.length ? 'warning' : 'success'}>
          {queries.length ? `${queries.length} issues` : 'All clear'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-1">
        {queries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-foreground">No failed queries</p>
            <p className="text-xs text-muted-foreground">The system is running smoothly.</p>
          </div>
        ) : (
          queries.slice(0, 6).map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass-flat rounded-lg p-2.5"
            >
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="warning" size="sm">
                  {q.failure_reason}
                </Badge>
                {q.repository_name && (
                  <span className="text-[10px] text-muted-foreground">{q.repository_name}</span>
                )}
                <span className="text-[10px] text-muted-foreground">{timeAgo(q.timestamp)}</span>
              </div>
              <p className="text-xs text-foreground/80">{shortText(q.question, 90)}</p>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────

function UsersTab({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'engineer'>('all')

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        (u.name ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && ['admin', 'administrator'].includes(u.role?.toLowerCase() ?? '')) ||
        (roleFilter === 'engineer' &&
          !['admin', 'administrator'].includes(u.role?.toLowerCase() ?? ''))
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const adminCount = users.filter((u) =>
    ['admin', 'administrator'].includes(u.role?.toLowerCase() ?? ''),
  ).length
  const activeCount = users.filter((u) => u.is_active).length

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Users', value: users.length, color: 'text-foreground', icon: Users },
          {
            label: 'Active',
            value: activeCount,
            color: 'text-emerald-400',
            icon: CheckCircle2,
          },
          { label: 'Admins', value: adminCount, color: 'text-primary', icon: ShieldCheck },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <s.icon className={cn('mx-auto mb-1 h-4 w-4', s.color)} />
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="h-8 w-full rounded-lg border border-foreground/10 bg-foreground/4 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'admin', 'engineer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize',
                    roleFilter === r
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No users match your filters.</p>
              ) : (
                filtered.map((user, idx) => {
                  const isAdmin = ['admin', 'administrator'].includes(
                    user.role?.toLowerCase() ?? '',
                  )
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="glass-flat flex items-center gap-3 rounded-xl px-3 py-2.5"
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white',
                          avatarColor(user.email),
                        )}
                      >
                        {initials(user.name, user.email)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.name || 'Unnamed user'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>

                      {/* Badges */}
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant={isAdmin ? 'default' : 'muted'}
                          size="sm"
                        >
                          {isAdmin ? '🛡️ Admin' : 'Engineer'}
                        </Badge>
                        <div
                          className={cn(
                            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                            user.is_active
                              ? 'bg-emerald-400/15 text-emerald-400'
                              : 'bg-muted-foreground/10 text-muted-foreground',
                          )}
                        >
                          <Circle
                            className={cn(
                              'h-1.5 w-1.5 fill-current',
                              user.is_active ? 'text-emerald-400' : 'text-muted-foreground',
                            )}
                          />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Repos tab ─────────────────────────────────────────────────────────────

function ReposTab({ repositories }: { repositories: AdminRepository[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const types = useMemo(() => {
    const set = new Set(repositories.map((r) => r.file_type || 'repo'))
    return ['all', ...Array.from(set)]
  }, [repositories])

  const filtered = useMemo(() => {
    return repositories.filter((r) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        r.file_name.toLowerCase().includes(q) ||
        (r.title ?? '').toLowerCase().includes(q) ||
        (r.uploaded_by_name ?? '').toLowerCase().includes(q)
      const matchesType =
        typeFilter === 'all' || (r.file_type || 'repo') === typeFilter
      return matchesSearch && matchesType
    })
  }, [repositories, search, typeFilter])

  const totalChunks = repositories.reduce((s, r) => s + r.chunk_count, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Repos', value: repositories.length, icon: FileCode2, color: 'text-primary' },
          {
            label: 'Total Chunks',
            value: totalChunks.toLocaleString(),
            icon: Database,
            color: 'text-accent',
          },
          {
            label: 'File Types',
            value: types.length - 1,
            icon: FileText,
            color: 'text-sky-300',
          },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <s.icon className={cn('mx-auto mb-1 h-4 w-4', s.color)} />
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repos, titles, owners…"
                className="h-8 w-full rounded-lg border border-foreground/10 bg-foreground/4 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all capitalize',
                    typeFilter === t
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-lg border border-foreground/8">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-foreground/8 bg-foreground/3 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Repository</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Chunks</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No repositories match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((repo, idx) => (
                    <motion.tr
                      key={repo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-foreground/5 transition-colors hover:bg-foreground/[0.02]"
                    >
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="truncate font-medium text-foreground">{repo.file_name}</p>
                        {repo.title && (
                          <p className="truncate text-[10px] text-muted-foreground">{repo.title}</p>
                        )}
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white',
                              avatarColor(repo.uploaded_by_email),
                            )}
                          >
                            {initials(repo.uploaded_by_name, repo.uploaded_by_email)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-foreground">
                              {repo.uploaded_by_name || 'Unknown'}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {repo.uploaded_by_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info" size="sm">
                          {repo.file_type || 'repo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {repo.chunk_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(repo.created_at)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Activity tab ──────────────────────────────────────────────────────────

function ActivityTab({
  messages,
  queries,
}: {
  messages: AdminMessage[]
  queries: AdminFailedQuery[]
}) {
  const [view, setView] = useState<'messages' | 'failed'>('messages')

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('messages')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all',
            view === 'messages'
              ? 'bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/25'
              : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
          )}
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          Chat Messages
          {messages.length > 0 && (
            <span className="rounded-full bg-sky-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
              {messages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('failed')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all',
            view === 'failed'
              ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25'
              : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Failed Queries
          {queries.length > 0 && (
            <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              {queries.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === 'messages' ? (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="rounded-xl">
              <CardContent className="p-4">
                {messages.length === 0 ? (
                  <EmptyState icon={MessageSquareText} text="No chat messages logged yet." />
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="glass-flat rounded-xl p-3"
                      >
                        <div className="mb-2 flex items-start gap-2.5">
                          <div
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white',
                              avatarColor(msg.user_email),
                            )}
                          >
                            {initials(msg.user_name, msg.user_email)}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">
                                {msg.user_name || msg.user_email}
                              </span>
                              <Badge
                                variant={msg.role === 'user' ? 'info' : 'default'}
                                size="sm"
                              >
                                {msg.role === 'user' ? '👤 User' : '🤖 Assistant'}
                              </Badge>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                {timeAgo(msg.created_at)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">
                              {shortText(msg.content, 200)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="rounded-xl">
              <CardContent className="p-4">
                {queries.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Zero failed queries</p>
                      <p className="text-xs text-muted-foreground">
                        The AI is responding successfully to all questions.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queries.map((q, idx) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="glass-flat rounded-xl border border-amber-400/10 p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-300" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {q.user_name || q.user_email}
                          </span>
                          <Badge variant="warning" size="sm">
                            {q.failure_reason}
                          </Badge>
                          {q.repository_name && (
                            <Badge variant="muted" size="sm">
                              {q.repository_name}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(q.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/80">
                          <span className="font-medium text-muted-foreground">Q: </span>
                          {q.question}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Shared empty state ────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ElementType
  text: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
