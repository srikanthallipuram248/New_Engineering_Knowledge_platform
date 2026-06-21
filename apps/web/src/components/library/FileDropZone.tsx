import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { UploadCloud, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileDropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  disabled?: boolean
  className?: string
}

/**
 * Drag-and-drop + click-to-pick file upload zone.
 * Visual: glass card with a dashed border that becomes solid + accent glow
 * when files are dragged over it. Animates in from idle.
 */
export function FileDropZone({
  onFiles,
  accept,
  disabled,
  className,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      const files = Array.from(fileList)
      onFiles(files)
    },
    [onFiles],
  )

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setIsDragging(true)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setIsDragging(true)
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    // Only set false if we're leaving the zone, not a child
    if (e.currentTarget === e.target) setIsDragging(false)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files)
    // Reset so the same file can be picked again
    e.target.value = ''
  }

  return (
    <motion.div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Drop files here or click to upload"
      whileHover={disabled ? undefined : { scale: 1.005 }}
      whileTap={disabled ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center justify-center',
        'rounded-2xl border-2 border-dashed px-6 py-12 text-center',
        'transition-colors duration-200',
        isDragging
          ? 'border-primary/60 bg-primary/5'
          : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={onInputChange}
        disabled={disabled}
        className="sr-only"
        aria-hidden
      />

      {/* Accent glow on hover/drag */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{ scale: isDragging ? 1.1 : 1, y: isDragging ? -2 : 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
          'bg-gradient-to-br from-primary/20 to-accent/20',
          'ring-1 ring-primary/20',
          'transition-shadow',
          isDragging && 'shadow-lg shadow-primary/30',
        )}
      >
        <UploadCloud
          className={cn(
            'h-6 w-6 text-primary transition-transform',
            isDragging && 'scale-110',
          )}
        />
      </motion.div>

      <p className="text-sm font-semibold text-foreground">
        {isDragging ? 'Drop to upload' : 'Drop files here or click to upload'}
      </p>
      <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
        PDFs, docs, spreadsheets, text, markdown — anything Agent 2 can read
        and ground answers in.
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        <Sparkles className="h-3 w-3 text-primary/70" />
        Multi-file supported
      </div>

      {/* Hidden helper text for screen readers when not in a drag state */}
      <span className="sr-only">
        <FileText className="hidden" />
        Press Enter or Space to open the file picker
      </span>
    </motion.div>
  )
}
