import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BookOpen,
  Library as LibraryIcon,
  Sparkles,
  FileText,
} from 'lucide-react'
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
} from '@/services/api'
import type { LibraryDocument, UploadResponse } from '@/services/api'
import { FileDropZone } from '@/components/library/FileDropZone'
import {
  FileRow,
  LibraryFileRow,
  type UploadItemState,
} from '@/components/library/FileRow'
import { cn } from '@/lib/utils'

export default function LibraryPage() {
  const [docs, setDocs] = useState<LibraryDocument[]>([])
  const [uploads, setUploads] = useState<UploadItemState[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await listDocuments()
        if (!cancelled) setDocs(list)
      } catch (err: unknown) {
        if (!cancelled)
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load library',
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const updateUpload = useCallback(
    (id: string, updater: (s: UploadItemState) => UploadItemState) => {
      setUploads((prev) => prev.map((u) => (isUploadWithId(u, id) ? updater(u) : u)))
    },
    [],
  )

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Push all files into the queue as 'queued', then start uploading one by one
      const newUploads: { id: string; state: UploadItemState }[] = files.map(
        (file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          state: { kind: 'queued', file },
        }),
      )
      setUploads((prev) => [...newUploads.map((n) => n.state), ...prev])

      // Kick off each upload in parallel — backend handles concurrency
      for (const { id, state } of newUploads) {
        void runUpload(id, state.file, updateUpload, setDocs)
      }
    },
    [updateUpload],
  )

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => !isUploadWithId(u, id)))
  }, [])

  const dismissError = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => !(isUploadWithId(u, id) && u.kind === 'failed')))
  }, [])

  const handleDeleteDoc = useCallback(async (doc: LibraryDocument) => {
    // Optimistic remove
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    try {
      await deleteDocument(doc.id)
    } catch (err: unknown) {
      // Roll back on failure
      setDocs((prev) => [...prev, doc].sort((a, b) => a.id - b.id))
      setUploads((prev) => [
        {
          kind: 'failed',
          file: new File([], doc.file_name),
          error: err instanceof Error ? err.message : 'Delete failed',
        },
        ...prev,
      ])
    }
  }, [])

  const totalCount = docs.length
  const isUploading = uploads.some(
    (u) => u.kind === 'uploading' || u.kind === 'processing' || u.kind === 'queued',
  )

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-1.5"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
            <LibraryIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[32px]">
            Knowledge Library
          </h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-[15px]">
          Upload documents that Agent 2 will read from when you chat. The
          bigger your library, the better its answers.
        </p>
      </motion.header>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3">
        <StatChip
          icon={BookOpen}
          label="Documents"
          value={totalCount.toString()}
          tone="primary"
        />
        <StatChip
          icon={Sparkles}
          label="In flight"
          value={uploads.filter((u) => !u.kind.match(/done|failed/)).length.toString()}
          tone={isUploading ? 'accent' : 'muted'}
        />
      </div>

      {/* Drop zone */}
      <FileDropZone onFiles={handleFiles} disabled={isUploading && false} />

      {/* In-flight uploads */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Activity
            </h2>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {uploads.map((u) => (
                  <li key={getUploadId(u)}>
                    <FileRow
                      state={u}
                      onRemove={
                        u.kind === 'uploading' || u.kind === 'queued'
                          ? () => removeUpload(getUploadId(u))
                          : undefined
                      }
                      onDismissError={
                        u.kind === 'failed'
                          ? () => dismissError(getUploadId(u))
                          : undefined
                      }
                    />
                  </li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Library list */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3 w-3" />
          Your library
          <span className="ml-1 rounded-full bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {totalCount}
          </span>
        </h2>

        {loading ? (
          <SkeletonRows count={3} />
        ) : loadError ? (
          <div className="glass flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {loadError}
          </div>
        ) : docs.length === 0 ? (
          <EmptyLibrary />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {docs.map((doc) => (
                <li key={doc.id}>
                  <LibraryFileRow doc={doc} onDelete={() => handleDeleteDoc(doc)} />
                </li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}

interface StatChipProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: 'primary' | 'accent' | 'muted'
}

function StatChip({ icon: Icon, label, value, tone }: StatChipProps) {
  return (
    <div
      className={cn(
        'glass-flat inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        tone === 'primary' && 'ring-1 ring-primary/20',
        tone === 'accent' && 'ring-1 ring-accent/30',
      )}
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          tone === 'primary' && 'text-primary',
          tone === 'accent' && 'text-accent',
          tone === 'muted' && 'text-muted-foreground',
        )}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  )
}

function EmptyLibrary() {
  return (
    <div className="glass flex flex-col items-center px-6 py-14 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 opacity-40 blur-2xl" />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/20">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">Your library is empty</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Drop a few files above to get started. PDFs, docs, spreadsheets,
        markdown — Agent 2 will read them all.
      </p>
    </div>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="glass-flat flex animate-pulse items-center gap-3 rounded-xl p-3"
        >
          <div className="h-10 w-10 rounded-lg bg-foreground/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-foreground/[0.06]" />
            <div className="h-2 w-1/4 rounded bg-foreground/[0.06]" />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────

/**
 * Each upload item has a unique id we generate when we receive the file.
 * We need to keep that id across state transitions (queued -> uploading
 * -> processing -> done). Since the state object is recreated at every
 * transition, we keep the id in a closure map. For our purposes (in-flight
 * upload list), the file reference is unique enough.
 */
function isUploadWithId(
  u: UploadItemState,
  id: string,
): boolean {
  return getUploadId(u) === id
}

function getUploadId(u: UploadItemState): string {
  return `${u.file.name}-${u.file.size}-${u.file.lastModified}`
}

/**
 * Runs a single upload through the full lifecycle:
 * queued -> uploading (with progress) -> processing (server-side) -> done/failed
 * Side-effects: updateUpload() to mutate state, setDocs() to append on success.
 */
async function runUpload(
  id: string,
  file: File,
  updateUpload: (id: string, updater: (s: UploadItemState) => UploadItemState) => void,
  setDocs: React.Dispatch<React.SetStateAction<LibraryDocument[]>>,
) {
  updateUpload(id, () => ({ kind: 'uploading', file, loaded: 0, total: file.size }))

  try {
    const res: UploadResponse = await uploadDocument(file, (p) => {
      updateUpload(id, () => ({
        kind: 'uploading',
        file,
        loaded: p.loaded,
        total: p.total,
      }))
    })

    // Backend returns 200 with one of:
    //  { message: "Uploaded and indexed successfully", document_id, chunks_saved, chunks_indexed }
    //  { message: "File already uploaded", document_id }
    //  { message: "No content extracted from document" }
    //  { detail: "..." } on error
    const success = res.message?.toLowerCase().includes('uploaded') ||
      res.message?.toLowerCase().includes('indexed')
    const duplicate = res.message?.toLowerCase().includes('already uploaded')
    const empty = res.message?.toLowerCase().includes('no content')

    if (res.document_id && (success || duplicate)) {
      // Move to processing state momentarily so the user sees the transition
      updateUpload(id, () => ({
        kind: 'processing',
        file,
        documentId: res.document_id,
      }))
      // Tiny delay so the "Indexing…" state is visible
      await new Promise((r) => setTimeout(r, 400))
      updateUpload(id, () => ({
        kind: 'done',
        file,
        documentId: res.document_id!,
        chunks: res.chunks_indexed ?? 0,
      }))
      // Add the doc to the library list optimistically
      setDocs((prev) => {
        if (prev.some((d) => d.id === res.document_id)) return prev
        const next: LibraryDocument = {
          id: res.document_id!,
          title: file.name,
          file_name: file.name,
          file_type: file.name.split('.').pop()?.toLowerCase() ?? '',
          created_at: new Date().toISOString(),
        }
        return [next, ...prev]
      })
    } else if (empty) {
      updateUpload(id, () => ({
        kind: 'failed',
        file,
        error: 'No content could be extracted from this file (scanned PDF or empty?)',
      }))
    } else {
      updateUpload(id, () => ({
        kind: 'failed',
        file,
        error: res.message || 'Upload failed',
      }))
    }
  } catch (err: unknown) {
    updateUpload(id, () => ({
      kind: 'failed',
      file,
      error: err instanceof Error ? err.message : 'Upload failed',
    }))
  }
}
