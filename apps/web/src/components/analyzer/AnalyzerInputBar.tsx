import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { GitBranch, Loader2, ArrowRight, ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AnalyzerInputBarProps {
  initialUrl?: string
  loading: boolean
  onSubmit: (url: string) => void
  disabled?: boolean
}

export function AnalyzerInputBar({
  initialUrl = '',
  loading,
  onSubmit,
  disabled,
}: AnalyzerInputBarProps) {
  const [url, setUrl] = useState(initialUrl)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="glass flex flex-col gap-2 p-2 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <GitBranch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className={cn(
            'h-11 border-0 bg-transparent pl-10 font-mono text-sm shadow-none',
            'focus-visible:ring-0',
          )}
          disabled={disabled || loading}
          required
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={disabled || loading || !url.trim()}
        className="h-11 w-full shrink-0 sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <ScanSearch className="h-4 w-4" />
            Analyze
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
    </motion.form>
  )
}
