import { Link } from 'react-router-dom'
import { SlideUp } from '@/components/motion/SlideUp'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <SlideUp className="glass-strong w-full max-w-md rounded-2xl p-10 text-center">
        <p className="text-7xl font-semibold tracking-tighter text-gradient">404</p>
        <h1 className="mt-3 text-lg font-semibold text-foreground">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-6">
          <Link to="/analyzer">Back to home</Link>
        </Button>
      </SlideUp>
    </div>
  )
}
