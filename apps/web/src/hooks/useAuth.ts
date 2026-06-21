import { useCallback, useState } from 'react'

const TOKEN_KEY = 'token'

/**
 * Lightweight auth state hook.
 * Token is the single source of truth — kept in localStorage and mirrored in state.
 * The login flow (Phase 2) will setToken; the rest of the app reads token / calls logout.
 */
export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )

  const setToken = useCallback((value: string | null) => {
    if (value === null) {
      localStorage.removeItem(TOKEN_KEY)
    } else {
      localStorage.setItem(TOKEN_KEY, value)
    }
    setTokenState(value)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenState(null)
  }, [])

  return { token, setToken, logout }
}
