import { useEffect, useId, useRef } from 'react'
import mermaid from 'mermaid'
import { cn } from '@/lib/utils'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#4f46e5',
    primaryTextColor: '#f1f5f9',
    primaryBorderColor: '#6366f1',
    lineColor: '#475569',
    secondaryColor: '#1e1b4b',
    tertiaryColor: '#0f0e1a',
    background: '#0a0914',
    mainBkg: '#1a1830',
    nodeBorder: '#4f46e5',
    clusterBkg: '#1a1830',
    titleColor: '#f1f5f9',
    edgeLabelBackground: '#1e1b4b',
    fontFamily: 'Inter Variable, Inter, ui-sans-serif, sans-serif',
    fontSize: '13px',
  },
})

interface MermaidDiagramProps {
  chart: string
  className?: string
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rawId = useId()
  // Mermaid IDs must be alphanumeric — strip React's colon separators
  const id = `mmd${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    if (!ref.current || !chart?.trim()) return

    mermaid
      .render(id, chart.trim())
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg
          // Make the SVG responsive
          const svgEl = ref.current.querySelector('svg')
          if (svgEl) {
            svgEl.removeAttribute('height')
            svgEl.style.maxWidth = '100%'
          }
        }
      })
      .catch(() => {
        if (ref.current) {
          ref.current.innerHTML = `
            <pre class="text-xs text-muted-foreground/60 whitespace-pre-wrap p-4 leading-relaxed">${chart}</pre>
          `
        }
      })
  }, [chart, id])

  return (
    <div
      ref={ref}
      className={cn(
        'flex min-h-[180px] w-full items-center justify-center overflow-x-auto',
        className,
      )}
    />
  )
}
