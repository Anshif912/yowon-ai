import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from '../layout/CommandPalette'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex text-white relative bg-[#05070a] overflow-hidden">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky top bar context switcher */}
        <Topbar />

        {/* Fixed layout content wrapper */}
        <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Command Palette search overlays */}
      <CommandPalette />
    </div>
  )
}
