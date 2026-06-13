import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  BrainCircuit,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/ui/loader'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useAuth } from '@/hooks/useAuth'
import { login, register } from '@/services/api'
import { fadeInUp, staggerContainer } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'login', label: 'Sign in' },
  { value: 'register', label: 'Create account' },
]

export default function LoginPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/analyzer'

  const [mode, setMode] = useState<Mode>('login')
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

  function switchMode(next: Mode) {
    if (next === mode) return
    setMode(next)
    setError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="w-full max-w-md"
      >
        {/* Logo + wordmark */}
        <motion.div
          variants={fadeInUp}
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-50 blur-2xl" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30">
              <BrainCircuit className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Engineering Knowledge Platform
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Two agents, one knowledge base
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={fadeInUp}
          className="glass-strong rounded-2xl p-8 shadow-2xl shadow-black/20"
        >
          {/* Mode toggle */}
          <div className="mb-6 flex justify-center">
            <SegmentedControl
              options={modeOptions}
              value={mode}
              onChange={switchMode}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="fullName"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <Field
                    id="fullName"
                    label="Full name"
                    icon={UserIcon}
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Jane Smith"
                    autoComplete="name"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Field
              id="email"
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />

            <Field
              id="password"
              label="Password"
              icon={Lock}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="mt-2 w-full"
            >
              {loading ? (
                <Loader size="sm" className="text-primary-foreground" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          variants={fadeInUp}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          By continuing, you agree to our{' '}
          <Link to="#" className="text-foreground/70 underline-offset-4 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="#" className="text-foreground/70 underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </motion.p>
      </motion.div>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
}

function Field({
  id,
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon
          className={cn(
            'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60',
          )}
        />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="pl-10"
        />
      </div>
    </div>
  )
}
