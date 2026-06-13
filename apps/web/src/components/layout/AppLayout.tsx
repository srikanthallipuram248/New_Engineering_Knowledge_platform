import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="relative flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
