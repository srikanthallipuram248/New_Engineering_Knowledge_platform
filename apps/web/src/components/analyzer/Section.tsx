import { cn } from '@/lib/utils'

interface SectionProps {
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}

/**
 * Plain semantic section with a header. No motion — keeps the result
 * card's content stable across re-renders and avoids the
 * "re-cascade on scroll" perception in split view.
 */
export function Section({ title, description, className, children }: SectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground/70">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </section>
  )
}
