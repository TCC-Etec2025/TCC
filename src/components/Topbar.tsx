import { useState, useRef, useEffect } from 'react';
import { useUser, type PerfilUsuario } from "../context/UserContext"
import { useLayout } from "../context/LayoutContext"
import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type DropdownItem = {
    label: string;
    icon: React.ReactNode;
    action: () => void;
};

export default function Topbar() {
    const navigate = useNavigate()
    const { usuario, logout } = useUser() as { usuario: PerfilUsuario, logout: () => void }
    const { toggleSidebar } = useLayout()
    const [imageError, setImageError] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getInitials = (name: string) => {
        if (!name) return "??";
        const names = name.trim().split(' ');
        if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    const dropdownItems: DropdownItem[] = [
        {
            label: "Meu Perfil",
            icon: <User className="w-4 h-4 mr-2 text-gray-400" />,
            action: () => navigate("/app/admin/perfil")
        },
        {
            label: "Sair",
            icon: <LogOut className="w-4 h-4 mr-2 text-gray-400" />,
            action: logout
        }
    ];

    return (
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between relative">
            <button onClick={toggleSidebar} className="text-gray-600 hover:text-black">
                ☰
            </button>
            <div className="flex items-center gap-4">
                <div
                    className="relative cursor-pointer"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    ref={dropdownRef}
                >
                    <div className="w-11 h-11 rounded-full bg-green-200 flex items-center justify-center overflow-hidden border-1 border-white shadow-sm">
                        {!imageError ? (
                            <img
                                src="/images/user/owner.jpg"
                                alt="User"
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <span className="text-sm font-medium text-gray-600">
                                {getInitials(usuario.nome)}
                            </span>
                        )}
                    </div>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-gray-800 text-sm font-medium">{usuario.nome}</p>
                                <p className="text-gray-500 text-xs">{usuario.email}</p>
                            </div>

                            {dropdownItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={item.action}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}