import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useState } from "react"

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar estado={isCollapsed}/>
      
      <main className="flex-1 flex flex-col overflow-auto">
        <Topbar onToggleCollapse={toggleCollapse}/>
        
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
