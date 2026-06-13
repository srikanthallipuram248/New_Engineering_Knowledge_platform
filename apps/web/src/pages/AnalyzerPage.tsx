import { SlideUp } from '@/components/motion/SlideUp'
import { ScanSearch } from 'lucide-react'

export default function AnalyzerPage() {
  return (
    <SlideUp>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Repo Analyzer
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a public GitHub URL and get a full architecture breakdown powered by
          AI.
        </p>
      </div>

      <div className="glass mt-10 flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <ScanSearch className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Analyzer coming next</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Phase 3 will rebuild the GitHub analyzer on this new foundation. The shell
          and shell-only navigation are live.
        </p>
      </div>
    </SlideUp>
  )
}
