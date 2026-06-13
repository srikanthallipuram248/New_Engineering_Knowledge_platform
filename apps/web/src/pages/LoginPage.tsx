import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BrainCircuit, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { login, register } from '@/services/api'
import { fadeInUp } from '@/lib/motion-presets'

/**
 * Placeholder LoginPage for Phase 1.
 * Phase 2 will replace this with a fully designed glass card experience.
 */
export default function LoginPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname ?? '/analyzer'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, fullName)
      }
      const token = await login(email, password)
      setToken(token)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="glass-strong w-full max-w-md rounded-2xl p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <BrainCircuit className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Engineering Knowledge Platform
            </p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Phase 1 placeholder · full design in
              Phase 2
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'login'
            ? 'Welcome back. Sign in to continue.'
            : 'Set up your account to get started.'}
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Smith"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => {
                  setMode('register')
                  setError('')
                }}
                className="font-medium text-primary hover:underline"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  )
}
