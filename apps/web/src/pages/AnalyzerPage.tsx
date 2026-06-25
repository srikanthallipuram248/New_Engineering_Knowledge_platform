import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ScanSearch, AlertCircle } from 'lucide-react'
import { analyzeRepo } from '@/services/api'
import type { RepoAnalysisResult } from '@/services/api'
import { AnalyzerInputBar } from '@/components/analyzer/AnalyzerInputBar'
import { AnalyzerEmptyState } from '@/components/analyzer/AnalyzerEmptyState'
import { AnalyzerLoadingState } from '@/components/analyzer/AnalyzerLoadingState'
import { AnalysisResultCard } from '@/components/analyzer/AnalysisResultCard'

type State =
  | { kind: 'idle' }
  | { kind: 'loading'; url: string }
  | { kind: 'error'; message: string; lastUrl: string }
  | { kind: 'result'; data: RepoAnalysisResult; url: string }

// Scope the storage key per user so different accounts on the same
// browser don't share each other's analysis results.
function getStorageKey(): string {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload?.sub) return `ekp.analyzer.state.${payload.sub}`
    }
  } catch { /* ignore */ }
  return 'ekp.analyzer.state'
}

// Initial load from storage
let globalState: State = (() => {
  try {
    const saved = localStorage.getItem(getStorageKey())
    if (saved) {
      const parsed = JSON.parse(saved) as State
      // If it was left in loading, reset to idle on hard reload since the network request is gone
      if (parsed.kind === 'loading') {
        return { kind: 'idle' }
      }
      return parsed
    }
  } catch {
    // ignore
  }
  return { kind: 'idle' }
})()

const listeners = new Set<(state: State) => void>()

function updateGlobalState(nextState: State) {
  globalState = nextState
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(nextState))
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener(globalState))
}

export default function AnalyzerPage() {
  // Lazy initializer reads from localStorage with the CURRENT user's key,
  // not from the stale module-level globalState, so switching users always
  // shows a clean slate on the very first render.
  const [state, setState] = useState<State>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey())
      if (saved) {
        const parsed = JSON.parse(saved) as State
        if (parsed.kind !== 'loading') {
          globalState = parsed
          return parsed
        }
      }
    } catch { /* ignore */ }
    globalState = { kind: 'idle' }
    return { kind: 'idle' }
  })

  useEffect(() => {
    const listener = (next: State) => setState(next)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  async function handleAnalyze(url: string) {
    updateGlobalState({ kind: 'loading', url })
    try {
      const data = await analyzeRepo(url)
      // Only update if we are still the loading request for this URL
      if (globalState.kind === 'loading' && globalState.url === url) {
        updateGlobalState({ kind: 'result', data, url })
      }
    } catch (err: unknown) {
      if (globalState.kind === 'loading' && globalState.url === url) {
        updateGlobalState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Analysis failed',
          lastUrl: url,
        })
      }
    }
  }

  function handleReset() {
    updateGlobalState({ kind: 'idle' })
  }

  const currentUrl =
    state.kind === 'result' || state.kind === 'loading'
      ? state.url
      : state.kind === 'error'
        ? state.lastUrl
        : ''

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-1.5"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
            <ScanSearch className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[32px]">
            Repo Analyzer
          </h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-[15px]">
          Paste a public GitHub URL and get a full architecture breakdown
          powered by AI.
        </p>
      </motion.header>

      {/* Input bar — always visible, sticky to the page flow */}
      <AnalyzerInputBar
        initialUrl={currentUrl}
        loading={state.kind === 'loading'}
        onSubmit={handleAnalyze}
        disabled={state.kind === 'loading'}
      />

      {/* Body — switches between states */}
      <AnimatePresence mode="wait">
        {state.kind === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnalyzerEmptyState onPick={handleAnalyze} />
          </motion.div>
        )}

        {state.kind === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnalyzerLoadingState url={state.url} />
          </motion.div>
        )}

        {state.kind === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="glass flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                Analysis failed
              </p>
              <p className="mt-0.5 text-sm text-foreground/80">{state.message}</p>
            </div>
          </motion.div>
        )}

        {state.kind === 'result' && (
          <motion.div
            key={`result-${state.data.repo_name}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <AnalysisResultCard result={state.data} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
