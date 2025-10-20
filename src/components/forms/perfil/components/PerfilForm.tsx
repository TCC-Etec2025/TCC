import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type PerfilUsuario } from "../../../../context/UserContext";
import { usePerfilForm } from "../hooks/usePerfilForm";
import ProfileTabs from "./ProfileTabs";
import UsuarioForm from "./UsuarioForm";
import EnderecoForm from "./EnderecoForm";
import PerfilCard from "./PerfilCard";

type Props = {
    usuario: PerfilUsuario;
};

export default function PerfilForm({ usuario }: Props) {
    const navigate = useNavigate();
    const {
        isEditing,
        currentTab,
        setCurrentTab,
        handleCancel,
        startEditing,
    } = usePerfilForm(usuario);

    return (
        <div className="min-h-screen bg-odara-offwhite text-odara-dark p-6 lg:p-8">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white shadow-sm p-4 rounded-xl mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold">Meu Perfil</h1>
                            <p className="text-sm text-gray-500">Gerencie suas informações pessoais</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={startEditing}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <User className="h-4 w-4 mr-2 inline-block" />
                                Editar Perfil
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="xl:col-span-1">
                    <PerfilCard usuario={usuario} />
                </div>

                {/* Main Content */}
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm">
                        <ProfileTabs currentTab={currentTab} onTabChange={setCurrentTab} />

                        <div className="p-6 space-y-6">
                            {currentTab === "personal" && (
                                <div id="usuario-form">
                                    <h2 className="text-xl font-semibold">Informações Pessoais</h2>
                                    <p className="mt-1 text-sm text-gray-500">Atualize suas informações pessoais e de contato</p>
                                    
                                    <div className="mt-6">
                                        <UsuarioForm 
                                            usuario={usuario} 
                                            isEditing={isEditing}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentTab === "address" && (
                                <div id="endereco-form">
                                    <h2 className="text-xl font-semibold">Endereço</h2>
                                    <p className="mt-1 text-sm text-gray-500">Gerencie suas informações de endereço</p>
                                    
                                    <div className="mt-6">
                                        <EnderecoForm 
                                            usuario={usuario}
                                            isEditing={isEditing}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentTab === "security" && (
                                <div>
                                    <h2 className="text-xl font-semibold">Segurança</h2>
                                    <p className="mt-1 text-sm text-gray-500">Gerencie sua senha e configurações de segurança</p>
                                    <div className="mt-6 space-y-4">
                                        <div className="space-y-2">
                                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Senha Atual</label>
                                            <input id="currentPassword" type="password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nova Senha</label>
                                            <input id="newPassword" type="password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                                            <input id="confirmPassword" type="password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors">
                                            Alterar Senha
                                        </button>
                                    </div>
                                </div>
                            )}

                            {currentTab === "notifications" && (
                                <div>
                                    <h2 className="text-xl font-semibold">Notificações</h2>
                                    <p className="mt-1 text-sm text-gray-500">Configure como você deseja receber notificações</p>
                                    <div className="mt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Notificações por Email</p>
                                                <p className="text-sm text-gray-500">Receba atualizações importantes por email</p>
                                            </div>
                                            <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                                Configurar
                                            </button>
                                        </div>
                                        <div className="h-px bg-gray-200" />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Notificações Push</p>
                                                <p className="text-sm text-gray-500">Receba notificações em tempo real</p>
                                            </div>
                                            <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                                Configurar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentTab === "privacy" && (
                                <div>
                                    <h2 className="text-xl font-semibold">Privacidade</h2>
                                    <p className="mt-1 text-sm text-gray-500">Controle suas configurações de privacidade</p>
                                    <div className="mt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Visibilidade do Perfil</p>
                                                <p className="text-sm text-gray-500">Controle quem pode ver suas informações</p>
                                            </div>
                                            <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                                Configurar
                                            </button>
                                        </div>
                                        <div className="h-px bg-gray-200" />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Dados de Atividade</p>
                                                <p className="text-sm text-gray-500">Gerencie como seus dados são utilizados</p>
                                            </div>
                                            <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                                Gerenciar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}