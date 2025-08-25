"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Home, Users, UserPlus, BarChart3, Settings, LogOut, Building2 } from "lucide-react"

const menuItems = {
  Admin: [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/app/admin" },
    { id: "pacientes", label: "Pacientes", icon: Users, path: "/app/admin/pacientes" },
    { id: "responsaveis", label: "Responsáveis", icon: Users, path: "/app/admin/responsaveis" },
    { id: "funcionarios", label: "Funcionários", icon: Users, path: "/app/admin/funcionarios" },
    { id: "cad-paciente", label: "Cadastrar Paciente", icon: UserPlus, path: "/app/admin/pacientes/cadastrar" },
    { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/app/admin/relatorios" },
  ],
}

export default function Sidebar() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!perfil) return null
  const items = menuItems[perfil.role as keyof typeof menuItems] || []

  return (
    <div className={`flex flex-col h-screen bg-white border-r shadow-lg transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <Building2 className="w-6 h-6" />
            <span>ILPI System</span>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded hover:bg-gray-100">
          <Building2 className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* User */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white ring-2 ring-blue-400">
            {perfil.nome_completo?.slice(0, 2).toUpperCase() || "??"}
          </div>
          {!isCollapsed && (
            <div>
              <p className="font-semibold">{perfil.nome_completo}</p>
              <p className="text-sm text-gray-500">{perfil.role}</p>
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
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition"
          >
            <item.icon className="w-5 h-5" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t">
        <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100">
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span>Configurações</span>}
        </button>
        <button onClick={logout} className="flex items-center gap-3 w-full p-2 rounded-lg text-red-600 hover:bg-red-100">
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  )
}
