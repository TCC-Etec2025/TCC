import { useUser } from "../context/UserContext";
import { PerfilForm } from "../components/forms/perfil";

export default function Perfil() {
    const { usuario } = useUser();

    if (!usuario) {
        return (
            <div className="min-h-screen bg-odara-offwhite flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return <PerfilForm usuario={usuario} />;
}