import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, Lock, Shield, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { useUser, type PerfilUsuario } from "../context/UserContext";
import type { Funcionario, Responsavel } from "../Modelos";

// Componente para formulário de endereço
function FormularioEndereco({ formData, setFormData, isEditing }: {
  formData: any;
  setFormData: (data: any) => void;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
          <input
            id="cep"
            type="text"
            value={formData?.cep || ""}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700">Logradouro</label>
          <input
            id="logradouro"
            type="text"
            value={formData?.logradouro || ""}
            onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
          <input
            id="numero"
            type="text"
            value={formData?.numero || ""}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">Complemento</label>
          <input
            id="complemento"
            type="text"
            value={formData?.complemento || ""}
            onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
          <input
            id="bairro"
            type="text"
            value={formData?.bairro || ""}
            onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
          <input
            id="cidade"
            type="text"
            value={formData?.cidade || ""}
            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            id="estado"
            value={formData?.estado || ""}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          >
            <option value="">Selecione...</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
            {/* Adicione outros estados conforme necessário */}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function Perfil() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState("personal");
  const { usuario } = useUser() as { usuario: PerfilUsuario };

  const [formData, setFormData] = useState<any>(usuario);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setFormData(usuario);
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
            <div className="mt-4 space-y-2">
              <h2 className="text-xl font-semibold">{usuario.nome}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(usuario.papel).className
                  }`}
              >
                {getRoleBadge(usuario.papel).label}
              </span>
              {usuario.papel.toLowerCase() !== "responsavel" && (
                <p className="text-sm text-gray-500">{(usuario as Funcionario & { papel: string }).cargo}</p>
              )}
            </div>
          </div>

          <div className="my-6 h-px bg-gray-200" />

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{usuario.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>
                {usuario.papel.toLowerCase() !== "responsavel" 
                  ? (usuario as Funcionario & { papel: string }).telefone
                  : (usuario as Responsavel & { papel: string }).telefone_principal
                }
              </span>
              {usuario.papel.toLowerCase() === "responsavel" && (usuario as Responsavel & { papel: string }).telefone_secundario && (
                <span className="text-gray-400">• {(usuario as Responsavel & { papel: string }).telefone_secundario}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{usuario.logradouro}, {usuario.numero} - {usuario.bairro}, {usuario.cidade} - {usuario.estado}</span>
            </div>
            {usuario.papel.toLowerCase() !== "responsavel" && (usuario as Funcionario & { papel: string }).data_admissao && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Desde {formatDate((usuario as Funcionario & { papel: string }).data_admissao)}</span>
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
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "personal" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Pessoal
                </button>
                <button
                  onClick={() => setCurrentTab("security")}
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "security" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Segurança
                </button>
                <button
                  onClick={() => setCurrentTab("notifications")}
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "notifications" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Notificações
                </button>
                <button
                  onClick={() => setCurrentTab("privacy")}
                  className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "privacy" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
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
                    {/* Campos comuns */}
                    <div className="space-y-2">
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                      <input
                        id="nome"
                        type="text"
                        value={formData?.nome || ""}
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
                        value={formData?.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                      <input
                        id="cpf"
                        type="text"
                        value={formData?.cpf || ""}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>

                    {/* Campos específicos para funcionário */}
                    {usuario.papel.toLowerCase() !== "responsavel" && (
                      <>
                        <div className="space-y-2">
                          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                          <input
                            id="telefone"
                            type="text"
                            value={formData?.telefone || ""}
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
                            value={formData?.data_nascimento || ""}
                            onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">Cargo</label>
                          <input
                            id="cargo"
                            type="text"
                            value={formData?.cargo || ""}
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
                            value={formData?.registro_profissional || ""}
                            onChange={(e) => setFormData({ ...formData, registro_profissional: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="vinculo" className="block text-sm font-medium text-gray-700">Vínculo</label>
                          <select
                            id="vinculo"
                            value={formData?.vinculo || ""}
                            onChange={(e) => setFormData({ ...formData, vinculo: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          >
                            <option value="">Selecione...</option>
                            <option value="CLT">CLT</option>
                            <option value="Terceirizado">Terceirizado</option>
                            <option value="Voluntário">Voluntário</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="contato_emergencia_nome" className="block text-sm font-medium text-gray-700">Contato de Emergência - Nome</label>
                          <input
                            id="contato_emergencia_nome"
                            type="text"
                            value={formData?.contato_emergencia_nome || ""}
                            onChange={(e) => setFormData({ ...formData, contato_emergencia_nome: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="contato_emergencia_telefone" className="block text-sm font-medium text-gray-700">Contato de Emergência - Telefone</label>
                          <input
                            id="contato_emergencia_telefone"
                            type="text"
                            value={formData?.contato_emergencia_telefone || ""}
                            onChange={(e) => setFormData({ ...formData, contato_emergencia_telefone: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                      </>
                    )}

                    {/* Campos específicos para responsável */}
                    {usuario.papel.toLowerCase() === "responsavel" && (
                      <>
                        <div className="space-y-2">
                          <label htmlFor="telefone_principal" className="block text-sm font-medium text-gray-700">Telefone Principal</label>
                          <input
                            id="telefone_principal"
                            type="text"
                            value={formData?.telefone_principal || ""}
                            onChange={(e) => setFormData({ ...formData, telefone_principal: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="telefone_secundario" className="block text-sm font-medium text-gray-700">Telefone Secundário</label>
                          <input
                            id="telefone_secundario"
                            type="text"
                            value={formData?.telefone_secundario || ""}
                            onChange={(e) => setFormData({ ...formData, telefone_secundario: e.target.value })}
                            disabled={!isEditing}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Formulário de Endereço */}
                  <div className="mt-8">
                    <FormularioEndereco formData={formData} setFormData={setFormData} isEditing={isEditing} />
                  </div>

                  {/* Observações para responsáveis */}
                  {usuario.papel.toLowerCase() === "responsavel" && (
                    <div className="mt-6 space-y-2">
                      <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">Observações</label>
                      <textarea
                        id="observacoes"
                        value={formData?.observacoes || ""}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        disabled={!isEditing}
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  )}
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