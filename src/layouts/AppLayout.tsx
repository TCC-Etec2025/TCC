import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { LayoutProvider } from "../context/LayoutContext"

export default function AppLayout() {
  return (
    <LayoutProvider>
      <div className="flex h-screen bg-odara-primary bg-opacity-10 relative">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-auto ">
          <Topbar />
          
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </LayoutProvider>
  )
}
