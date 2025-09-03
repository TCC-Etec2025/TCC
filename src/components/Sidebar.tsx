"use client"

import { useState } from "react"
import { useUser } from "../context/UserContext"
import { useNavigate } from "react-router-dom"
import { Home, Users, BarChart3, Settings, LogOut, Building2 } from "lucide-react"

const menuItems = {
  Administrador: [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/app/admin" },
    { id: "pacientes", label: "Pacientes", icon: Users, path: "/app/admin/pacientes" },
    { id: "responsaveis", label: "Responsáveis", icon: Users, path: "/app/admin/responsaveis" },
    { id: "funcionarios", label: "Funcionários", icon: Users, path: "/app/admin/funcionarios" },
    { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/app/admin/relatorios" },
  ],
}

type SidebarProps = {
  estado: boolean;
};

export default function Sidebar({ estado }: SidebarProps) {
  const { usuario, logout } = useUser()
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)


  if (!usuario) return null
  const items = menuItems[usuario.role as keyof typeof menuItems] || []
  const expanded = isHovered || !estado;

  return (
    <div
      className={`flex flex-col h-screen bg-white border-r shadow-lg transition-all duration-300 ${expanded ? "w-48" : "w-16"} group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {expanded && (
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <Building2 className="w-6 h-6" />
            <span>ILPI System</span>
          </div>
        )}
      </div>

      {/* User */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white ring-2 ring-blue-400">
            {usuario.detalhes.nome_completo?.slice(0, 2).toUpperCase() || "??"}
          </div>
          {expanded && (
            <div>
              <p className="font-semibold">{usuario.detalhes.nome_completo}</p>
              <p className="text-sm text-gray-500">{usuario.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition ${expanded ? "" : "justify-center"}`}
          >
            <item.icon className="w-5 h-5" />
            {expanded && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t">
        <button className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 ${expanded ? "" : "justify-center"}`}>
          <Settings className="w-5 h-5" />
          {expanded && <span>Configurações</span>}
        </button>
        <button onClick={logout} className={`flex items-center gap-3 w-full p-2 rounded-lg text-red-600 hover:bg-red-100 ${expanded ? "" : "justify-center"}`}>
          <LogOut className="w-5 h-5" />
          {expanded && <span>Sair</span>}
        </button>
      </div>
    </div>
  )
}