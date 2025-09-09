"use client"

import { useState } from "react"
import { useUser } from "../context/UserContext"
import { useNavigate } from "react-router-dom"
import { Home, Users, BarChart3, Settings, LogOut } from "lucide-react"

const menuItems = {
  Administrador: [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/app/admin" },
    { id: "pacientes", label: "Pacientes", icon: Users, path: "/app/admin/pacientes" },
    { id: "responsaveis", label: "Responsáveis", icon: Users, path: "/app/admin/familiares" },
    { id: "funcionarios", label: "Funcionários", icon: Users, path: "/app/admin/funcionarios" },
    { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/app/admin/relatorios" },
  ],
}

type SidebarProps = {
  estado: boolean;
};

type UsuarioDetalhes = {
  nome_completo?: string;
};

type Usuario = {
  role: string;
  detalhes: UsuarioDetalhes;
};

export default function Sidebar({ estado }: SidebarProps) {
  const { usuario, logout } = useUser() as { usuario: Usuario, logout: () => void }
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  if (!usuario) return null
  const items = menuItems[usuario.role as keyof typeof menuItems] || []
  const expanded = isHovered || !estado;

  return (
    <div
      className={`flex flex-col h-screen bg-odara-primary border-r border-odara-contorno/20 shadow-lg transition-all duration-300 ${expanded ? "w-64" : "w-16"} group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-odara-contorno/20">
        <div className="flex items-center gap-2 text-odara-contorno font-bold">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-odara-contorno shadow-lg">
            <img
              src="/logo.png"
              alt="Logo Odara Gestão"
              className="w-full h-full object-cover"
            />
          </div>
          {expanded && (
            <span className="text-lg">Odara Gestão</span>
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
        <button className={`flex items-center gap-3 w-full p-3 rounded-lg text-odara-contorno/90 hover:bg-odara-contorno/10 hover:text-odara-contorno transition-all ${expanded ? "" : "justify-center"}`}>
          <Settings className="w-5 h-5 flex-shrink-0" />
          {expanded && <span>Configurações</span>}
        </button>
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full p-3 rounded-lg text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all ${expanded ? "" : "justify-center"}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {expanded && <span>Sair</span>}
        </button>
      </div>
    </div>
  )
}