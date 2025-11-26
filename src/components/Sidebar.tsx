"use client"

import { useState } from "react"
import { useUser, type PerfilUsuario } from "../context/UserContext"
import { useLayout } from "../context/LayoutContext"
import { useNavigate } from "react-router-dom"
import { Home, Users, ClipboardList, CheckSquare, Briefcase, RockingChair, LogOut } from "lucide-react"

const COM_SIDEBAR = ["administrador", "funcionario"]

const menuItems = {
  administrador: [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/app/admin" },
    { id: "pacientes", label: "Residentes", icon: RockingChair, path: "/app/admin/residentes" },
    { id: "responsaveis", label: "Responsáveis", icon: Users, path: "/app/admin/responsaveis" },
    { id: "funcionarios", label: "Funcionários", icon: Briefcase, path: "/app/admin/funcionarios" },
    { id: "registros", label: "Registros", icon: ClipboardList, path: "/app/admin/registros" },
  ],
  funcionario: [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/app/funcionario" },
    { id: "residentes", label: "Residentes", icon: RockingChair, path: "/app/funcionario/residentes/funcionario" },
    { id: "checklist", label: "Checklists", icon: CheckSquare, path: "/app/funcionario/checklist" },
    // { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/app/funcionario/relatorios" },
  ],
}

export default function Sidebar() {
  const { usuario, logout } = useUser() as { usuario: PerfilUsuario, logout: () => void }
  const { isSidebarCollapsed } = useLayout()
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
 
  if (!usuario || !COM_SIDEBAR.includes(usuario.papel)) {
    return null
  }

  const items = menuItems[usuario.papel as keyof typeof menuItems] || []
  const expanded = isHovered || !isSidebarCollapsed;

  return (
    <div
      className={`flex flex-col h-screen bg-odara-primary border-r border-odara-contorno/20 shadow-lg transition-all duration-300 ${expanded ? "w-64" : "w-16"} group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-odara-contorno/20">
        <div className="flex items-center gap-2 text-odara-contorno font-bold">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-odara-contorno shadow-lg">
            <img
              src="../images/logo.png"
              alt="Logo Odara Gestão"
              className="w-full h-full object-cover"
            />
          </div>
          {expanded && (
            <span className="text-lg text-odara-white">Odara <span className=" text-odara-name">Gestão</span></span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${expanded ? "" : "justify-center"
              } ${window.location.pathname === item.path
                ? "bg-odara-secondary text-odara-contorno shadow-lg border-2 border-odara-contorno"
                : "text-odara-contorno/90 hover:bg-odara-contorno/10 hover:text-odara-contorno"
              }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {expanded && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-odara-contorno/20">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full p-3 rounded-lg  transform hover:scale-105 font-semibold text-odara-accent hover:bg-odara-contorno/10 hover:text-odara-secondary transition-all ${expanded ? "" : "justify-center"}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {expanded && <span>Fazer logoff</span>}
        </button>
      </div>
    </div>
  )
}