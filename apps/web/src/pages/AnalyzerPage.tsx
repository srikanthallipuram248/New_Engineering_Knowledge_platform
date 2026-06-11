import React, { useState } from 'react'
import { analyzeRepo, logout } from '../services/api'
import type { RepoAnalysisResult } from '../services/api'

interface Props {
  onLogout: () => void
}

export default function AnalyzerPage({ onLogout }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RepoAnalysisResult | null>(null)
  const [error, setError] = useState('')

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const data = await analyzeRepo(url.trim())
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    onLogout()
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif" },
    nav: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', background: '#fff', borderBottom: '1px solid #e5e7eb',
    },
    navTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 },
    logoutBtn: {
      background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
      padding: '6px 14px', fontSize: '13px', cursor: 'pointer', color: '#374151',
    },
    hero: { maxWidth: '860px', margin: '48px auto 32px', textAlign: 'center', padding: '0 24px' },
    heroTitle: { fontSize: '30px', fontWeight: '700', color: '#111827', margin: '0 0 10px' },
    heroSub: { fontSize: '15px', color: '#6b7280', margin: '0 0 32px' },
    form: { display: 'flex', gap: '10px', justifyContent: 'center' },
    input: {
      flex: 1, maxWidth: '540px', padding: '11px 14px', border: '1px solid #d1d5db',
      borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none',
    },
    analyzeBtn: {
      padding: '11px 24px', background: '#4f46e5', color: '#fff', border: 'none',
      borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    },
    spinner: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      gap: '14px', padding: '60px 0', color: '#6b7280', fontSize: '15px',
    },
    spinnerDot: {
      width: '36px', height: '36px', border: '3px solid #e5e7eb',
      borderTopColor: '#4f46e5', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    error: { textAlign: 'center' as const, color: '#dc2626', fontSize: '14px', padding: '20px' },
    card: {
      maxWidth: '980px', margin: '0 auto 48px', background: '#fff',
      border: '1px solid #e5e7eb', borderRadius: '10px', padding: '36px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    cardTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 6px' },
    badge: (found: boolean): React.CSSProperties => ({
      display: 'inline-block', fontSize: '11px', fontWeight: '600',
      padding: '2px 8px', borderRadius: '999px', marginBottom: '24px',
      background: found ? '#d1fae5' : '#fef3c7',
      color: found ? '#065f46' : '#92400e',
    }),
    section: { marginBottom: '28px' },
    sectionTitle: {
      fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' as const,
      letterSpacing: '0.06em', color: '#6b7280', marginBottom: '10px',
    },
    paragraph: { fontSize: '15px', color: '#374151', lineHeight: '1.65', margin: 0, whiteSpace: 'pre-line' as const },
    tagList: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
    tag: {
      fontSize: '12px', fontWeight: '600', padding: '4px 10px',
      borderRadius: '999px', background: '#ede9fe', color: '#4c1d95',
    },
    list: { margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '1.65' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
    th: {
      textAlign: 'left' as const, padding: '8px 12px', background: '#f3f4f6',
      color: '#374151', fontWeight: '600', fontSize: '12px', borderBottom: '1px solid #e5e7eb',
    },
    td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#374151', verticalAlign: 'top' as const },
    tdMono: {
      padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#4f46e5',
      fontFamily: 'monospace', fontWeight: '600', verticalAlign: 'top' as const, width: '220px',
    },
    featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' },
    featureCard: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', background: '#fff' },
    featureName: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 6px' },
    featureText: { fontSize: '14px', color: '#374151', lineHeight: '1.55', margin: '0 0 8px' },
    evidence: { fontSize: '12px', color: '#6b7280', margin: 0 },
    cmdList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    cmd: {
      fontFamily: 'monospace', fontSize: '13px', color: '#1e40af',
      background: '#eff6ff', padding: '4px 8px', borderRadius: '6px',
      display: 'inline-block', marginRight: '8px',
    },
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <nav style={s.nav}>
        <p style={s.navTitle}>Engineering Knowledge Platform</p>
        <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
      </nav>

      <div style={s.hero}>
        <h1 style={s.heroTitle}>GitHub Repo Analyzer</h1>
        <p style={s.heroSub}>Paste a public GitHub URL and get a full architecture breakdown powered by AI.</p>
        <form style={s.form} onSubmit={handleAnalyze}>
          <input
            style={s.input}
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            required
          />
          <button style={s.analyzeBtn} type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={s.spinner}>
          <div style={s.spinnerDot} />
          <span>Cloning repo and analyzing with AI — this takes ~30 seconds…</span>
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

      {!loading && result && (
        <div style={{ padding: '0 24px' }}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>{result.repo_name}</h2>
            <div style={s.badge(result.readme_found)}>
              {result.readme_found ? 'README found' : 'No README — inferred from structure'}
            </div>

            <div style={s.section}>
              <p style={s.sectionTitle}>Summary</p>
              <p style={s.paragraph}>{result.summary}</p>
            </div>

            {result.detailed_overview && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Detailed Overview</p>
                <p style={s.paragraph}>{result.detailed_overview}</p>
              </div>
            )}

            <div style={s.section}>
              <p style={s.sectionTitle}>Architecture</p>
              <p style={s.paragraph}>{result.architecture}</p>
            </div>

            <div style={s.section}>
              <p style={s.sectionTitle}>Tech Stack</p>
              <div style={s.tagList}>
                {result.tech_stack.map(t => <span key={t} style={s.tag}>{t}</span>)}
              </div>
            </div>

            {result.core_features?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Core Features</p>
                <div style={s.featureGrid}>
                  {result.core_features.map((f, i) => (
                    <div key={i} style={s.featureCard}>
                      <p style={s.featureName}>{f.name}</p>
                      <p style={s.featureText}>{f.description}</p>
                      <p style={s.evidence}>Evidence: {f.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.key_modules?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Key Modules</p>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Module</th>
                      <th style={s.th}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.key_modules.map((m, i) => (
                      <tr key={i}>
                        <td style={s.tdMono}>{m.name}</td>
                        <td style={s.td}>{m.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.data_flow?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Data Flow</p>
                <ol style={s.list}>
                  {result.data_flow.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
            )}

            {result.commands?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Commands</p>
                <ul style={s.cmdList}>
                  {result.commands.map((c, i) => (
                    <li key={i}>
                      <span style={s.cmd}>{c.command}</span>
                      <span style={{ fontSize: '14px', color: '#374151' }}>{c.purpose}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.setup_steps?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Setup Steps</p>
                <ol style={s.list}>
                  {result.setup_steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
            )}

            {result.notable_design_decisions?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Design Decisions</p>
                <ul style={s.list}>
                  {result.notable_design_decisions.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {result.testing && result.testing !== 'Unknown' && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Testing</p>
                <p style={s.paragraph}>{result.testing}</p>
              </div>
            )}

            {result.limitations?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Limitations</p>
                <ul style={s.list}>
                  {result.limitations.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            )}

            {result.entry_points?.length > 0 && (
              <div style={s.section}>
                <p style={s.sectionTitle}>Entry Points</p>
                <ul style={s.list}>
                  {result.entry_points.map((ep, i) => (
                    <li key={i} style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{ep}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
