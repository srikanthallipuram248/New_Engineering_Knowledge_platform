import { motion } from 'motion/react'
import {
  FileText,
  CheckCircle2,
  AlertOctagon,
  Loader2,
  X,
  FileSpreadsheet,
  FileCode,
  FileType,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LibraryDocument } from '@/services/api'

export type UploadItemState =
  | { kind: 'queued'; file: File }
  | {
      kind: 'uploading'
      file: File
      loaded: number
      total: number
    }
  | { kind: 'processing'; file: File; documentId?: number }
  | { kind: 'done'; file: File; documentId: number; chunks: number }
  | {
      kind: 'failed'
      file: File
      error: string
    }

interface FileRowProps {
  state: UploadItemState
  onRemove?: () => void
  onDismissError?: () => void
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet
  if (['md', 'txt', 'json', 'yaml', 'yml', 'xml'].includes(ext)) return FileCode
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) return FileType
  return FileText
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileRow({ state, onRemove, onDismissError }: FileRowProps) {
  const Icon = getFileIcon(state.file.name)
  const isUploading = state.kind === 'uploading'
  const isProcessing = state.kind === 'processing'
  const isDone = state.kind === 'done'
  const isFailed = state.kind === 'failed'
  const isTerminal = isDone || isFailed

  const progressRatio =
    state.kind === 'uploading' && state.total > 0
      ? state.loaded / state.total
      : state.kind === 'processing'
        ? 1
        : state.kind === 'done'
          ? 1
          : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'glass-flat flex items-center gap-3 rounded-xl p-3',
        isFailed && 'border-destructive/30 bg-destructive/5',
        isDone && 'border-emerald-500/20',
      )}
    >
      {/* File type icon disc */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          isFailed
            ? 'bg-destructive/10 text-destructive'
            : isDone
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      {/* Filename + meta + progress */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm font-medium',
              isFailed ? 'text-destructive' : 'text-foreground',
            )}
          >
            {state.file.name}
          </p>
          <p className="shrink-0 text-[11px] text-muted-foreground">
            {formatBytes(state.file.size)}
          </p>
        </div>

        {/* Progress bar OR status line */}
        {isUploading ? (
          <div className="space-y-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressRatio * 100}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Uploading… {Math.round(progressRatio * 100)}%
            </p>
          </div>
        ) : isProcessing ? (
          <div className="space-y-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/5">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
            </div>
            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Indexing…
            </p>
          </div>
        ) : isDone ? (
          <p className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Indexed
            {state.chunks > 0 && ` · ${state.chunks} chunks`}
          </p>
        ) : isFailed ? (
          <div className="flex items-start gap-1.5">
            <AlertOctagon className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
            <p className="text-[10px] leading-relaxed text-destructive">
              {state.error}
              {onDismissError && (
                <>
                  {' · '}
                  <button
                    onClick={onDismissError}
                    className="underline-offset-2 hover:underline"
                  >
                    dismiss
                  </button>
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Queued</p>
        )}
      </div>

      {/* Trailing action: dismiss terminal states, or remove in-flight ones */}
      {(onRemove || onDismissError) && (
        <button
          type="button"
          aria-label={
            isTerminal ? 'Dismiss from list' : 'Cancel upload'
          }
          onClick={(e) => {
            e.stopPropagation()
            if (isTerminal && onDismissError) onDismissError()
            else if (onRemove) onRemove()
          }}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground',
            'transition-colors hover:bg-foreground/[0.06] hover:text-foreground',
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  )
}

/**
 * Convert a LibraryDocument (from the list endpoint) into a display-ready shape
 * matching the FileRow's idle appearance. Used to show existing files in the
 * library alongside any in-flight uploads.
 */
export function LibraryFileRow({
  doc,
  onDelete,
}: {
  doc: LibraryDocument
  onDelete?: () => void
}) {
  const Icon = getFileIcon(doc.file_name)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="glass-flat flex items-center gap-3 rounded-xl p-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {doc.title}
        </p>
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="rounded-full bg-foreground/[0.04] px-1.5 py-0.5 font-mono uppercase">
            {doc.file_type}
          </span>
          <span>
            Added {new Date(doc.created_at).toLocaleDateString()}
          </span>
        </p>
      </div>
      {onDelete && (
        <button
          type="button"
          aria-label="Delete document"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  )
}
