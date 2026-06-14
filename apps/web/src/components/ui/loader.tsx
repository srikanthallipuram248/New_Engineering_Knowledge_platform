import { cn } from '@/lib/utils'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-3 w-3 border-[2px]',
  md: 'h-4 w-4 border-2',
  lg: 'h-5 w-5 border-2',
}

export function Loader({ size = 'md', className }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeMap[size],
        className,
      )}
    />
  )
}
