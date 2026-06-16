import { motion } from 'motion/react'
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
  Network,
  Folders,
  ArrowRightLeft,
  FileCode,
} from 'lucide-react'
import type { RepoAnalysisResult } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from './Section'
import { MermaidDiagram } from './MermaidDiagram'
import { FolderTree } from './FolderTree'
import { staggerContainer, fadeInUp } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

interface AnalysisResultCardProps {
  result: RepoAnalysisResult
  onReset: () => void
}

const TECH_COLORS: Record<string, string> = {
  python:     'bg-blue-500/15 text-blue-300 ring-blue-500/20',
  fastapi:    'bg-green-500/15 text-green-300 ring-green-500/20',
  react:      'bg-sky-500/15 text-sky-300 ring-sky-500/20',
  typescript: 'bg-sky-400/15 text-sky-200 ring-sky-400/20',
  javascript: 'bg-yellow-400/15 text-yellow-300 ring-yellow-400/20',
  node:       'bg-green-400/15 text-green-300 ring-green-400/20',
  nodejs:     'bg-green-400/15 text-green-300 ring-green-400/20',
  docker:     'bg-blue-400/15 text-blue-300 ring-blue-400/20',
  postgresql: 'bg-indigo-400/15 text-indigo-300 ring-indigo-400/20',
  postgres:   'bg-indigo-400/15 text-indigo-300 ring-indigo-400/20',
  redis:      'bg-red-400/15 text-red-300 ring-red-400/20',
  graphql:    'bg-pink-400/15 text-pink-300 ring-pink-400/20',
  go:         'bg-cyan-400/15 text-cyan-300 ring-cyan-400/20',
  rust:       'bg-orange-400/15 text-orange-300 ring-orange-400/20',
  java:       'bg-red-300/15 text-red-200 ring-red-300/20',
  next:       'bg-slate-400/15 text-slate-200 ring-slate-400/20',
  nextjs:     'bg-slate-400/15 text-slate-200 ring-slate-400/20',
  tailwind:   'bg-teal-400/15 text-teal-300 ring-teal-400/20',
  vite:       'bg-purple-400/15 text-purple-300 ring-purple-400/20',
  langchain:  'bg-emerald-400/15 text-emerald-300 ring-emerald-400/20',
  langgraph:  'bg-emerald-400/15 text-emerald-300 ring-emerald-400/20',
  groq:       'bg-violet-400/15 text-violet-300 ring-violet-400/20',
  qdrant:     'bg-rose-400/15 text-rose-300 ring-rose-400/20',
  sqlalchemy: 'bg-amber-400/15 text-amber-300 ring-amber-400/20',
}

function techBadgeClass(tech: string): string {
  const key = tech.toLowerCase().replace(/[\s.]/g, '')
  return (
    TECH_COLORS[key] ??
    'bg-foreground/10 text-foreground/70 ring-foreground/10'
  )
}

export function AnalysisResultCard({ result, onReset }: AnalysisResultCardProps) {
  const has = (v: unknown) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v && v !== 'Unknown')

  return (
    <motion.article
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="glass overflow-hidden"
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.header
        variants={fadeInUp}
        className="border-b border-foreground/[0.06] p-6 sm:p-8"
      >
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

            {has(result.summary) && (
              <p className="text-[14px] leading-relaxed text-foreground/80 sm:text-[15px]">
                {result.summary}
              </p>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onReset} className="shrink-0">
            New analysis
          </Button>
        </div>
      </motion.header>

      <div className="space-y-8 p-6 sm:p-8">

        {/* ── Tech Stack ───────────────────────────────────────────── */}
        {has(result.tech_stack) && (
          <Section title="Tech Stack">
            <div className="flex flex-wrap gap-2">
              {result.tech_stack.map((t) => (
                <span
                  key={t}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1',
                    techBadgeClass(t),
                  )}
                >
                  <Sparkles className="h-3 w-3 opacity-70" />
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Architecture Diagram + Folder Tree (side by side) ───── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {has(result.mermaid_arch_diagram) && (
            <Section title="Architecture Diagram">
              <div className="glass rounded-xl p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Network className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    System Components
                  </span>
                </div>
                <MermaidDiagram chart={result.mermaid_arch_diagram} />
              </div>
            </Section>
          )}

          {has(result.folder_tree) && (
            <Section title="Folder Structure">
              <div className="glass rounded-xl p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Folders className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Layout
                  </span>
                </div>
                <FolderTree tree={result.folder_tree} className="max-h-72" />
              </div>
            </Section>
          )}
        </div>

        {/* ── Key Modules ──────────────────────────────────────────── */}
        {has(result.key_modules) && (
          <Section title="Key Modules" description="Core folders and files that make up this project">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.key_modules.map((m, i) => (
                <motion.div
                  key={`${m.name}-${i}`}
                  variants={fadeInUp}
                  className="glass rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <code className="truncate font-mono text-[12px] font-semibold text-primary">
                      {m.name}
                    </code>
                  </div>
                  <p className="text-[12px] leading-relaxed text-foreground/75">
                    {m.role}
                  </p>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Data Flow Diagram ────────────────────────────────────── */}
        {has(result.mermaid_flow_diagram) && (
          <Section title="Data Flow Diagram">
            <div className="glass rounded-xl p-4">
              <div className="mb-2 flex items-center gap-2">
                <ArrowRightLeft className="h-3.5 w-3.5 text-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Request / Data Flow
                </span>
              </div>
              <MermaidDiagram chart={result.mermaid_flow_diagram} />
            </div>
          </Section>
        )}

        {/* ── File Descriptions ────────────────────────────────────── */}
        {has(result.file_descriptions) && (
          <Section title="Key Files" description="Important files and what they do">
            <div className="glass overflow-hidden rounded-xl">
              {result.file_descriptions.map((f, i) => (
                <motion.div
                  key={`${f.path}-${i}`}
                  variants={fadeInUp}
                  className="flex items-start gap-3 border-b border-foreground/[0.05] px-4 py-3 last:border-0"
                >
                  <FileCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <div className="min-w-0 flex-1">
                    <code className="block font-mono text-[12px] font-semibold text-primary truncate">
                      {f.path}
                    </code>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/70">
                      {f.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Core Features ────────────────────────────────────────── */}
        {has(result.core_features) && (
          <Section title="Core Features">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.core_features.map((f, i) => (
                <motion.div
                  key={`${f.name}-${i}`}
                  variants={fadeInUp}
                  className="glass rounded-xl p-4 space-y-1.5"
                >
                  <p className="text-sm font-semibold text-foreground">{f.name}</p>
                  <p className="text-[12px] leading-relaxed text-foreground/75">
                    {f.description}
                  </p>
                  {f.evidence && (
                    <p className="text-[11px] text-muted-foreground/60">
                      <span className="font-semibold uppercase tracking-wider">Evidence: </span>
                      {f.evidence}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Data Flow Steps + Commands side by side ──────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {has(result.data_flow) && (
            <Section title="Data Flow Steps">
              <ol className="space-y-2">
                {result.data_flow.map((step, i) => (
                  <motion.li key={i} variants={fadeInUp} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary ring-1 ring-primary/20">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[13px] leading-relaxed text-foreground/80">
                      {step}
                    </span>
                  </motion.li>
                ))}
              </ol>
            </Section>
          )}

          {has(result.commands) && (
            <Section title="Commands">
              <ul className="space-y-2">
                {result.commands.map((c, i) => (
                  <motion.li
                    key={i}
                    variants={fadeInUp}
                    className="glass flex flex-col gap-1 rounded-xl p-3"
                  >
                    <code className="inline-flex items-center gap-2 font-mono text-[12px] font-semibold text-primary">
                      <Terminal className="h-3 w-3 shrink-0" />
                      {c.command}
                    </code>
                    <span className="text-[12px] leading-relaxed text-foreground/70 pl-5">
                      {c.purpose}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* ── Entry Points + Setup Steps side by side ──────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {has(result.entry_points) && (
            <Section title="Entry Points">
              <ul className="space-y-1.5">
                {result.entry_points.map((ep, i) => (
                  <motion.li key={i} variants={fadeInUp} className="flex items-center gap-2.5">
                    <DoorOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <code className="font-mono text-[13px] font-semibold text-primary">{ep}</code>
                  </motion.li>
                ))}
              </ul>
            </Section>
          )}

          {has(result.setup_steps) && (
            <Section title="Setup Steps">
              <ol className="space-y-2">
                {result.setup_steps.map((step, i) => (
                  <motion.li key={i} variants={fadeInUp} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/20">
                      <ListChecks className="h-3 w-3 text-accent" />
                    </span>
                    <span className="flex-1 text-[13px] leading-relaxed text-foreground/80">
                      {step}
                    </span>
                  </motion.li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        {/* ── Design Decisions + Limitations side by side ──────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {has(result.notable_design_decisions) && (
            <Section title="Design Decisions">
              <ul className="space-y-2">
                {result.notable_design_decisions.map((d, i) => (
                  <motion.li key={i} variants={fadeInUp} className="flex gap-2.5">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span className="flex-1 text-[13px] leading-relaxed text-foreground/80">{d}</span>
                  </motion.li>
                ))}
              </ul>
            </Section>
          )}

          {has(result.limitations) && (
            <Section title="Limitations">
              <ul className="space-y-2">
                {result.limitations.map((l, i) => (
                  <motion.li key={i} variants={fadeInUp} className="flex gap-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/80" />
                    <span className="flex-1 text-[13px] leading-relaxed text-foreground/80">{l}</span>
                  </motion.li>
                ))}
              </ul>
            </Section>
          )}
        </div>

      </div>
    </motion.article>
  )
}
