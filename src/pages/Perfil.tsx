import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { ArrowLeft, Save, User, Lock, Shield, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { useUser, type PerfilUsuario } from "../context/UserContext";
import type { Funcionario, Responsavel } from "../Modelos";

// Funções de validação customizadas
const validarCPF = (cpf: string): boolean => {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
};

const validarEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validarTelefone = (telefone: string): boolean => {
  return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(telefone);
};

const validarCEP = (cep: string): boolean => {
  return /^\d{5}-\d{3}$/.test(cep);
};

// Schema Yup para dados pessoais (condicional baseado no papel)
const createDadosPessoaisSchema = (papel: string) => {
  const baseSchema: any = {
    nome: Yup.string().required("Nome é obrigatório").min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: Yup.string().email("Email deve ser válido").required("Email é obrigatório"),
    cpf: Yup.string()
      .required("CPF é obrigatório")
      .test("cpf-valido", "CPF deve estar no formato 000.000.000-00", validarCPF),
  };

  // Campos específicos para funcionários
  if (papel !== 'responsavel') {
    baseSchema.telefone = Yup.string()
      .required("Telefone é obrigatório")
      .test("telefone-valido", "Telefone deve estar no formato (00) 00000-0000", validarTelefone);
    baseSchema.data_nascimento = Yup.date().required("Data de nascimento é obrigatória");
    baseSchema.cargo = Yup.string().required("Cargo é obrigatório");
    baseSchema.vinculo = Yup.string().required("Vínculo é obrigatório");
    baseSchema.contato_emergencia_nome = Yup.string().required("Nome do contato de emergência é obrigatório");
    baseSchema.contato_emergencia_telefone = Yup.string()
      .required("Telefone do contato de emergência é obrigatório")
      .test("telefone-valido", "Telefone deve estar no formato (00) 00000-0000", validarTelefone);
  } else {
    // Campos específicos para responsáveis
    baseSchema.telefone_principal = Yup.string()
      .required("Telefone principal é obrigatório")
      .test("telefone-valido", "Telefone deve estar no formato (00) 00000-0000", validarTelefone);
    baseSchema.telefone_secundario = Yup.string()
      .nullable()
      .test("telefone-valido", "Telefone deve estar no formato (00) 00000-0000", function(value) {
        if (!value) return true; // Campo opcional
        return validarTelefone(value);
      });
  }

  return Yup.object().shape(baseSchema);
};

// Schema Yup para endereço
const enderecoSchema = Yup.object().shape({
  cep: Yup.string()
    .required("CEP é obrigatório")
    .test("cep-valido", "CEP deve estar no formato 00000-000", validarCEP),
  logradouro: Yup.string().required("Logradouro é obrigatório"),
  numero: Yup.string().required("Número é obrigatório"),
  complemento: Yup.string().nullable(),
  bairro: Yup.string().required("Bairro é obrigatório"),
  cidade: Yup.string().required("Cidade é obrigatória"),
  estado: Yup.string().required("Estado é obrigatório"),
});

// Interface para erros de validação


// Componente para informações pessoais
function FormularioInformacoesPessoais({ usuario, formData, setFormData, isEditing }: {
  usuario: PerfilUsuario;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isEditing: boolean;
}) {
  // Hook form para dados pessoais
  const dadosPessoaisForm = useForm({
    resolver: yupResolver(createDadosPessoaisSchema(usuario.papel)),
    defaultValues: formData,
    mode: 'onChange'
  });

  const { register: registerPessoais, formState: { errors: errorsPessoais } } = dadosPessoaisForm;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Campos comuns */}
        <div className="space-y-2">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input
            id="nome"
            type="text"
            {...registerPessoais("nome")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errorsPessoais.nome && (
            <p className="text-sm text-red-600">{String(errorsPessoais.nome?.message || '')}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            {...registerPessoais("email")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errorsPessoais.email && (
            <p className="text-sm text-red-600">{String(errorsPessoais.email?.message || '')}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
          <input
            id="cpf"
            type="text"
            {...registerPessoais("cpf")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errorsPessoais.cpf && (
            <p className="text-sm text-red-600">{String(errorsPessoais.cpf?.message || '')}</p>
          )}
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
  );
}

// Componente para formulário de endereço
function FormularioEndereco({ formData, setFormData, isEditing }: {
  formData: PerfilUsuario;
  setFormData: (data: PerfilUsuario) => void;
  isEditing: boolean;
}) {
  // Hook form para endereço apenas com os campos específicos
  const enderecoForm = useForm({
    resolver: yupResolver(enderecoSchema),
    defaultValues: {
      cep: formData?.endereco?.cep || '',
      logradouro: formData?.endereco?.logradouro || '',
      numero: formData?.endereco?.numero || '',
      complemento: formData?.endereco?.complemento || '',
      bairro: formData?.endereco?.bairro || '',
      cidade: formData?.endereco?.cidade || '',
      estado: formData?.endereco?.estado || '',
    },
    mode: 'onChange'
  });

  const { register: registerEndereco, formState: { errors: errorsEndereco } } = enderecoForm;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
          <input
            id="cep"
            type="text"
            {...registerEndereco("cep")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errorsEndereco.cep && (
            <p className="text-sm text-red-600">{String(errorsEndereco.cep?.message || '')}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700">Logradouro</label>
          <input
            id="logradouro"
            type="text"
            {...registerEndereco("logradouro")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errorsEndereco.logradouro && (
            <p className="text-sm text-red-600">{String(errorsEndereco.logradouro?.message || '')}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
          <input
            id="numero"
            type="text"
            value={formData.endereco.numero}
            onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, numero: e.target.value } })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">Complemento</label>
          <input
            id="complemento"
            type="text"
            value={formData?.endereco.complemento || ""}
            onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, complemento: e.target.value } })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
          <input
            id="bairro"
            type="text"
            value={formData.endereco.bairro}
            onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, bairro: e.target.value } })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
          <input
            id="cidade"
            type="text"
            value={formData.endereco.cidade}
            onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, cidade: e.target.value } })}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            id="estado"
            value={formData.endereco.estado}
            onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, estado: e.target.value } })}
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
    
    // Validação dos dados
    const errors = validateFormData(formData, usuario.papel);
    
    if (errors.length > 0) {
      alert('Erros encontrados:\n' + errors.join('\n'));
      setIsSaving(false);
      return;
    }

    try {
      // Aqui faria a chamada para API
      console.log('Dados válidos:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
    
    setIsSaving(false);
  };

  // Função de validação customizada
  const validateFormData = (data: any, papel: string): string[] => {
    const errors: string[] = [];

    // Validações básicas
    if (!data.nome?.trim()) errors.push('Nome é obrigatório');
    if (!validarEmail(data.email || '')) errors.push('Email deve ser válido');
    if (!validarCPF(data.cpf || '')) errors.push('CPF deve estar no formato 000.000.000-00');

    // Validações de endereço
    if (!validarCEP(data.cep || '')) errors.push('CEP deve estar no formato 00000-000');
    if (!data.logradouro?.trim()) errors.push('Logradouro é obrigatório');
    if (!data.numero?.trim()) errors.push('Número é obrigatório');
    if (!data.bairro?.trim()) errors.push('Bairro é obrigatório');
    if (!data.cidade?.trim()) errors.push('Cidade é obrigatória');
    if (!data.estado?.trim()) errors.push('Estado é obrigatório');

    // Validações condicionais para funcionários
    if (papel !== 'responsavel') {
      if (!validarTelefone(data.telefone || '')) errors.push('Telefone deve estar no formato (00) 00000-0000');
      if (!data.data_nascimento) errors.push('Data de nascimento é obrigatória');
      if (!data.cargo?.trim()) errors.push('Cargo é obrigatório');
      if (!data.vinculo) errors.push('Vínculo é obrigatório');
      if (!data.contato_emergencia_nome?.trim()) errors.push('Nome do contato de emergência é obrigatório');
      if (!validarTelefone(data.contato_emergencia_telefone || '')) errors.push('Telefone do contato de emergência deve estar no formato (00) 00000-0000');
    }

    // Validações condicionais para responsáveis
    if (papel === 'responsavel') {
      if (!validarTelefone(data.telefone_principal || '')) errors.push('Telefone principal deve estar no formato (00) 00000-0000');
      if (data.telefone_secundario && !validarTelefone(data.telefone_secundario)) errors.push('Telefone secundário deve estar no formato (00) 00000-0000');
    }

    return errors;
  };

  const handleCancel = () => {
    setFormData(usuario);
    setIsEditing(false);
    alert(JSON.stringify(formData));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

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
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2 inline-block" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
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
        <div className="xl:col-span-1 bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mt-4 space-y-2">
              <h2 className="text-xl font-semibold">{usuario.nome}</h2>
              {usuario.papel.toLowerCase() !== "responsavel" && (
                <p className="text-sm text-gray-500">{(usuario as Funcionario).cargo}</p>
              )}
            </div>
          </div>

          <div className="my-6 h-px bg-gray-200" />

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="break-all">{usuario.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>
                {usuario.papel.toLowerCase() !== "responsavel" 
                  ? (usuario as Funcionario).telefone
                  : (usuario as Responsavel).telefone_principal
                }
              </span>
              {usuario.papel.toLowerCase() === "responsavel" && (usuario as Responsavel).telefone_secundario && (
                <span className="text-gray-400">• {(usuario as Responsavel).telefone_secundario}</span>
              )}
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="break-words">{usuario.endereco.logradouro}, {usuario.endereco.numero} - {usuario.endereco.bairro}, {usuario.endereco.cidade} - {usuario.endereco.estado}</span>
            </div>
            {usuario.papel.toLowerCase() !== "responsavel" && (usuario as Funcionario).data_admissao && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>Desde {formatDate((usuario as Funcionario).data_admissao)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              {/* Tabs com scroll horizontal responsivo */}
              <div className="overflow-x-auto">
                <nav className="flex space-x-4 p-2 min-w-max" aria-label="Tabs">
                  <button
                    onClick={() => setCurrentTab("personal")}
                    className={`flex-shrink-0 px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "personal" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Pessoal
                  </button>
                  <button
                    onClick={() => setCurrentTab("address")}
                    className={`flex-shrink-0 px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "address" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Endereço
                  </button>
                  <button
                    onClick={() => setCurrentTab("security")}
                    className={`flex-shrink-0 px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "security" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Segurança
                  </button>
                  <button
                    onClick={() => setCurrentTab("notifications")}
                    className={`flex-shrink-0 px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "notifications" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Notificações
                  </button>
                  <button
                    onClick={() => setCurrentTab("privacy")}
                    className={`flex-shrink-0 px-3 py-2 font-medium text-sm rounded-md transition-colors ${currentTab === "privacy" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Privacidade
                  </button>
                </nav>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {currentTab === "personal" && (
                <div>
                  <h2 className="text-xl font-semibold">Informações Pessoais</h2>
                  <p className="mt-1 text-sm text-gray-500">Atualize suas informações pessoais e de contato</p>
                  
                  <div className="mt-6">
                    <FormularioInformacoesPessoais 
                      usuario={usuario} 
                      formData={formData} 
                      setFormData={setFormData} 
                      isEditing={isEditing} 
                    />
                  </div>
                </div>
              )}

              {currentTab === "address" && (
                <div>
                  <h2 className="text-xl font-semibold">Endereço</h2>
                  <p className="mt-1 text-sm text-gray-500">Gerencie suas informações de endereço</p>
                  
                  <div className="mt-6">
                    <FormularioEndereco 
                      formData={formData} 
                      setFormData={setFormData} 
                      isEditing={isEditing} 
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