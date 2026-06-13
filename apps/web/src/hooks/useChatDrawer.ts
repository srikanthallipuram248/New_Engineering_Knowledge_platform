import { useCallback, useEffect, useState } from 'react'

const KEY = 'ekp.chat.open'

/**
 * Controls the open/closed state of the global chat drawer.
 * Persists across navigation (drawer stays open if you reload).
 * The actual drawer UI is mounted by AppLayout, not by this hook.
 */
export function useChatDrawer() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, open ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [open])

  const toggle = useCallback(() => setOpen((v) => !v), [])
  const openDrawer = useCallback(() => setOpen(true), [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  return { open, toggle, openDrawer, closeDrawer, setOpen }
}
