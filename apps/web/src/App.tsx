import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuroraBackground } from '@/components/layout/AuroraBackground'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthGate } from '@/components/auth/AuthGate'
import LoginPage from '@/pages/LoginPage'
import AnalyzerPage from '@/pages/AnalyzerPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { useChatDrawerContext } from '@/components/chat/ChatDrawerContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuroraBackground />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<AnalyzerPage />} />
            <Route path="/analyzer" element={<AnalyzerPage />} />
            <Route path="/chat" element={<ChatRedirect />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

/**
 * /chat is kept as a URL for backward compatibility and for shareable links.
 * It simply redirects to /analyzer and opens the chat drawer on arrival.
 */
function ChatRedirect() {
  const { openDrawer } = useChatDrawerContext()

  useEffect(() => {
    openDrawer()
  }, [openDrawer])

  return <Navigate to="/analyzer" replace />
}
