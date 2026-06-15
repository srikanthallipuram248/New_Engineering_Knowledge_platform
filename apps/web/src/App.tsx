import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuroraBackground } from '@/components/layout/AuroraBackground'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthGate } from '@/components/auth/AuthGate'
import LoginPage from '@/pages/LoginPage'
import AnalyzerPage from '@/pages/AnalyzerPage'
import LibraryPage from '@/pages/LibraryPage'
import SplitViewPage from '@/pages/SplitViewPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ChatHistoryPage from '@/pages/ChatHistoryPage'

/**
 * Routing strategy:
 * - /login        → LoginPage (unprotected)
 * - /analyzer     → AnalyzerPage (in tab mode, the active tool)
 * - /library      → LibraryPage  (in tab mode, the active tool)
 * - /split        → SplitViewPage (renders both tools in a 2-pane layout)
 * - anything else → NotFoundPage
 *
 * Each page is rendered EXACTLY ONCE — AppLayout contains a single
 * <Outlet /> and the matched route provides the content. This avoids
 * the double-mount bug that occurred when AppLayout rendered pages
 * both via the router Outlet AND directly in its own JSX.
 */
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
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/split" element={<SplitViewPage />} />
            <Route path="/chats" element={<ChatHistoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
