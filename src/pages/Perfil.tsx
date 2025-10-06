import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, User, Lock, Shield, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { useUser } from "../context/UserContext";

export default function Perfil() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState("personal");
  const { usuario } = useUser();

  // Dados do usuário baseados no perfil
  const [userData, setUserData] = useState({
    nome: "",
    email: "",
    papel: "",
    telefone: "",
    endereco_completo: "",
    data_nascimento: "",
    cargo: "",
    registro_profissional: "",
    data_admissao: "",
    bio: "",
    avatar: "",
  });

  const [formData, setFormData] = useState(userData);

  // Carregar dados do usuário
  useEffect(() => {
    if (!usuario) return;
    
    const loadUserData = () => {
      if (usuario.papel === "responsavel") {
        // Para responsável
        const responsavel = usuario as any;
        setUserData({
          nome: responsavel.nome || "",
          email: responsavel.email || "",
          papel: usuario.papel,
          telefone: responsavel.telefone_principal || "",
          endereco_completo: "São Paulo, SP",
          data_nascimento: "1985-03-15",
          cargo: "",
          registro_profissional: "",
          data_admissao: "",
          bio: "Responsável por pacientes na instituição.",
          avatar: "/professional-woman-doctor.png",
        });
      } else {
        // Para funcionário
        const funcionario = usuario as any;
        setUserData({
          nome: funcionario.nome || "",
          email: funcionario.email || "",
          papel: usuario.papel,
          telefone: funcionario.telefone || "",
          endereco_completo: "São Paulo, SP",
          data_nascimento: funcionario.data_nascimento || "",
          cargo: funcionario.cargo || "",
          registro_profissional: funcionario.registro_profissional || "",
          data_admissao: funcionario.data_admissao || "",
          bio: "Funcionário da instituição.",
          avatar: "/professional-woman-doctor.png",
        });
      }
    };

    loadUserData();
  }, [usuario]);

  useEffect(() => {
    setFormData(userData);
  }, [userData]);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setUserData(formData);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
  };

  const getRoleBadge = (papel: string) => {
    const roleConfig = {
      admin: { label: "Administrador", className: "bg-blue-100 text-blue-800" },
      funcionario: { label: "Funcionário", className: "bg-gray-100 text-gray-800" },
      responsavel: { label: "Responsável", className: "bg-green-100 text-green-800" },
    };
    return roleConfig[papel as keyof typeof roleConfig] || { label: papel, className: "bg-gray-200 text-gray-800" };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-odara-offwhite text-odara-dark p-6 lg:p-8">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold">Meu Perfil</h1>
              <p className="text-sm text-gray-500">Gerencie suas informações pessoais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2 inline-block" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4 mr-2 inline-block" />
                Editar Perfil
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={formData.avatar || "/placeholder.svg"}
                alt="Avatar"
                className="h-32 w-32 rounded-full object-cover"
              />
              {isEditing && (
                <button
                  className="absolute bottom-0 right-0 p-2 bg-gray-800 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-900"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <h2 className="text-xl font-semibold">{userData.nome}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  getRoleBadge(userData.papel).className
                }`}
              >
                {getRoleBadge(userData.papel).label}
              </span>
              {userData.papel === "funcionario" && userData.cargo && (
                <p className="text-sm text-gray-500">{userData.cargo}</p>
              )}
            </div>
          </div>

          <div className="my-6 h-px bg-gray-200" />

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{userData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{userData.telefone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{userData.endereco_completo}</span>
            </div>
            {userData.papel === "funcionario" && userData.data_admissao && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Desde {formatDate(userData.data_admissao)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 p-2" aria-label="Tabs">
                <button
                  onClick={() => setCurrentTab("personal")}
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                    currentTab === "personal" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Pessoal
                </button>
                <button
                  onClick={() => setCurrentTab("security")}
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                    currentTab === "security" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Segurança
                </button>
                <button
                  onClick={() => setCurrentTab("notifications")}
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                    currentTab === "notifications" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Notificações
                </button>
                <button
                  onClick={() => setCurrentTab("privacy")}
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                    currentTab === "privacy" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Privacidade
                </button>
              </nav>
            </div>

            <div className="p-6 space-y-6">
              {currentTab === "personal" && (
                <div>
                  <h2 className="text-xl font-semibold">Informações Pessoais</h2>
                  <p className="mt-1 text-sm text-gray-500">Atualize suas informações pessoais e de contato</p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                      <input
                        id="nome"
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                      <input
                        id="telefone"
                        type="text"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                      <input
                        id="data_nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    {userData.papel === "funcionario" && (
                      <>
                        <div className="space-y-2">
                          <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">Cargo</label>
                          <input
                            id="cargo"
                            type="text"
                            value={formData.cargo}
                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="registro_profissional" className="block text-sm font-medium text-gray-700">Registro Profissional</label>
                          <input
                            id="registro_profissional"
                            type="text"
                            value={formData.registro_profissional}
                            onChange={(e) => setFormData({ ...formData, registro_profissional: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <label htmlFor="endereco_completo" className="block text-sm font-medium text-gray-700">Endereço</label>
                    <input
                      id="endereco_completo"
                      type="text"
                      value={formData.endereco_completo}
                      onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biografia</label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Restante das abas (security, notifications, privacy) permanecem iguais */}
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
                      <Lock className="h-4 w-4 mr-2" />
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
                      <button className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        <Shield className="h-4 w-4 mr-2" />
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