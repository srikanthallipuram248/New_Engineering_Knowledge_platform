import {
  GitBranch,
  Sparkles,
  Boxes,
  Terminal,
  ListChecks,
  Lightbulb,
  AlertTriangle,
  DoorOpen,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react'
import type { RepoAnalysisResult } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from './Section'

interface AnalysisResultCardProps {
  result: RepoAnalysisResult
  onReset: () => void
}

export function AnalysisResultCard({ result, onReset }: AnalysisResultCardProps) {
  const has = (v: unknown) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v && v !== 'Unknown')

  return (
    <article className="glass-flat overflow-hidden">
      {/* Header */}
      <header className="border-b border-foreground/[0.06] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/20">
                <GitBranch className="h-4 w-4 text-primary" />
              </div>
              <h2 className="truncate font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {result.repo_name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {result.readme_found ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  README found
                </Badge>
              ) : (
                <Badge variant="warning">
                  <AlertOctagon className="h-3 w-3" />
                  No README — inferred from structure
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            New analysis
          </Button>
        </div>
      </header>

      {/* Sections */}
      <div className="space-y-8 p-6 sm:p-8">
        <Section title="Summary" description="What the project does, at a glance">
          <p className="text-[15px] leading-relaxed text-foreground/90">
            {result.summary}
          </p>
        </Section>

        {has(result.detailed_overview) && (
          <Section title="Detailed Overview">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {result.detailed_overview}
            </p>
          </Section>
        )}

        <Section title="Architecture">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {result.architecture}
          </p>
        </Section>

        {has(result.tech_stack) && (
          <Section title="Tech Stack">
            <div className="flex flex-wrap gap-2">
              {result.tech_stack.map((t) => (
                <Badge key={t} variant="info" size="lg">
                  <Sparkles className="h-3 w-3" />
                  {t}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {has(result.core_features) && (
          <Section title="Core Features">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.core_features.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="glass-flat rounded-xl p-4"
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="h-3.5 w-3.5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      {f.name}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {f.description}
                  </p>
                  {f.evidence && (
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
                      <span className="font-semibold uppercase tracking-wider">
                        Evidence:
                      </span>{' '}
                      {f.evidence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {has(result.key_modules) && (
          <Section title="Key Modules">
            <div className="glass-flat overflow-hidden rounded-xl">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-foreground/[0.06] bg-foreground/[0.02] text-left">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Module
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.key_modules.map((m, i) => (
                    <tr
                      key={`${m.name}-${i}`}
                      className="border-b border-foreground/[0.04] last:border-0"
                    >
                      <td className="px-4 py-3 align-top font-mono text-[13px] font-semibold text-primary">
                        {m.name}
                      </td>
                      <td className="px-4 py-3 align-top text-[13px] leading-relaxed text-foreground/85">
                        {m.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {has(result.data_flow) && (
          <Section title="Data Flow">
            <ol className="space-y-2">
              {result.data_flow.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed text-foreground/85">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {has(result.commands) && (
          <Section title="Commands">
            <ul className="space-y-2">
              {result.commands.map((c, i) => (
                <li
                  key={i}
                  className="glass-flat flex flex-col gap-1 rounded-xl p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <code className="inline-flex items-center gap-2 rounded-lg bg-foreground/[0.05] px-2.5 py-1.5 font-mono text-[12px] font-semibold text-primary ring-1 ring-foreground/5">
                    <Terminal className="h-3 w-3" />
                    {c.command}
                  </code>
                  <span className="text-[13px] leading-relaxed text-foreground/80">
                    {c.purpose}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {has(result.setup_steps) && (
          <Section title="Setup Steps">
            <ol className="space-y-2">
              {result.setup_steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/20">
                    <ListChecks className="h-3 w-3 text-accent" />
                  </span>
                  <span className="flex-1 text-sm leading-relaxed text-foreground/85">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {has(result.notable_design_decisions) && (
          <Section title="Notable Design Decisions">
            <ul className="space-y-2">
              {result.notable_design_decisions.map((d, i) => (
                <li
                  key={i}
                  className="flex gap-3"
                >
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span className="flex-1 text-sm leading-relaxed text-foreground/85">
                    {d}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {has(result.testing) && (
          <Section title="Testing">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {result.testing}
            </p>
          </Section>
        )}

        {has(result.limitations) && (
          <Section title="Limitations">
            <ul className="space-y-2">
              {result.limitations.map((l, i) => (
                <li
                  key={i}
                  className="flex gap-3"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span className="flex-1 text-sm leading-relaxed text-foreground/85">
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {has(result.entry_points) && (
          <Section title="Entry Points">
            <ul className="space-y-1.5">
              {result.entry_points.map((ep, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5"
                >
                  <DoorOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <code className="font-mono text-[13px] font-semibold text-primary">
                    {ep}
                  </code>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </article>
  )
}
