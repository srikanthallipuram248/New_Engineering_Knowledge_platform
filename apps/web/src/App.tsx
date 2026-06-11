import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import AnalyzerPage from './pages/AnalyzerPage'

export default function App() {
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem('token'))

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }

  return <AnalyzerPage onLogout={() => setAuthed(false)} />
}
