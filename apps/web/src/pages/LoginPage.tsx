import React, { useState } from 'react'
import { login, register } from '../services/api'

interface Props {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, fullName)
        await login(email, password)
      } else {
        await login(email, password)
      }
      onLogin()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    card: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '40px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    title: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 24px' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
    input: {
      width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
      borderRadius: '8px', fontSize: '14px', color: '#111827',
      boxSizing: 'border-box', marginBottom: '16px', outline: 'none',
    },
    btn: {
      width: '100%', padding: '11px', background: '#4f46e5', color: '#fff',
      border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
      cursor: 'pointer', marginTop: '4px',
    },
    toggle: {
      marginTop: '20px', textAlign: 'center' as const, fontSize: '14px', color: '#6b7280',
    },
    link: { color: '#4f46e5', cursor: 'pointer', fontWeight: '600', background: 'none', border: 'none', fontSize: '14px' },
    error: { color: '#dc2626', fontSize: '13px', marginBottom: '12px' },
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h1>

        {error && <p style={s.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label style={s.label}>Full name</label>
              <input
                style={s.input}
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Jane Smith"
              />
            </div>
          )}
          <div>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Register'}
          </button>
        </form>

        <div style={s.toggle}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button style={s.link} onClick={() => { setMode('register'); setError('') }}>
                Register
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button style={s.link} onClick={() => { setMode('login'); setError('') }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
