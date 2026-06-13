import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { useChatDrawer as useChatDrawerState } from '@/hooks/useChatDrawer'

type ChatDrawerCtx = ReturnType<typeof useChatDrawerState>

const Ctx = createContext<ChatDrawerCtx | null>(null)

export function ChatDrawerProvider({ children }: { children: ReactNode }) {
  const value = useChatDrawerState()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useChatDrawerContext(): ChatDrawerCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error('useChatDrawerContext must be used inside ChatDrawerProvider')
  }
  return ctx
}
