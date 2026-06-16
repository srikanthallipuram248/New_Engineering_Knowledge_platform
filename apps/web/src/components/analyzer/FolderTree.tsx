import { cn } from '@/lib/utils'

interface FolderTreeProps {
  tree: string
  className?: string
}

const EXT_COLOR: Record<string, string> = {
  py:   'text-blue-400',
  js:   'text-yellow-400',
  ts:   'text-sky-300',
  tsx:  'text-sky-300',
  jsx:  'text-yellow-300',
  json: 'text-amber-300',
  md:   'text-slate-300',
  yml:  'text-pink-300',
  yaml: 'text-pink-300',
  toml: 'text-orange-300',
  env:  'text-green-300',
  go:   'text-cyan-400',
  rs:   'text-orange-400',
  java: 'text-red-300',
  css:  'text-purple-300',
  scss: 'text-purple-300',
  html: 'text-orange-300',
  sh:   'text-green-400',
  dockerfile: 'text-blue-300',
}

function fileColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) return EXT_COLOR['dockerfile']
  const ext = lower.split('.').pop() ?? ''
  return EXT_COLOR[ext] ?? 'text-foreground/55'
}

export function FolderTree({ tree, className }: FolderTreeProps) {
  if (!tree) return null

  const lines = tree.split('\n').filter(Boolean)

  return (
    <div
      className={cn(
        'overflow-auto rounded-xl bg-foreground/[0.03] p-4 ring-1 ring-foreground/[0.06]',
        className,
      )}
    >
      {lines.map((line, i) => {
        // Split connector chars from the actual name
        const match = line.match(/^((?:[│├└─ ])*)([\w\-. ]+\/?)$/)

        if (!match) {
          return (
            <div key={i} className="font-mono text-[12px] leading-relaxed text-muted-foreground/20">
              {line}
            </div>
          )
        }

        const prefix = match[1]
        const name   = match[2].trim()
        const isDir  = name.endsWith('/')

        return (
          <div key={i} className="flex items-baseline leading-relaxed">
            <span className="select-none whitespace-pre font-mono text-[12px] text-muted-foreground/20">
              {prefix}
            </span>
            <span
              className={cn(
                'font-mono text-[12px]',
                isDir ? 'font-semibold text-accent/80' : fileColor(name),
              )}
            >
              {name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
