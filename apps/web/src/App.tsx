import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuroraBackground } from '@/components/layout/AuroraBackground'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthGate } from '@/components/auth/AuthGate'
import LoginPage from '@/pages/LoginPage'
import AnalyzerPage from '@/pages/AnalyzerPage'
import LibraryPage from '@/pages/LibraryPage'
import NotFoundPage from '@/pages/NotFoundPage'

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
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
