import type { SubmitHandler } from "react-hook-form";
import { type PerfilUsuario, useUser } from "../../../../context/UserContext";
import { useUsuarioForm } from "../usuarioForm";
import type { FormUsuarioValues } from "../types";
import { removeFormatting } from "../../../../utils";
import { supabase } from "../../../../lib/supabaseClient";
import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  usuario: PerfilUsuario;
  isEditing: boolean;
};

export default function UsuarioForm({ usuario, isEditing }: Props) {
  const { atualizarUsuario } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useUsuarioForm(usuario);

  const onSubmit: SubmitHandler<FormUsuarioValues> = async (formData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { data, error } = await supabase.rpc('atualizar_perfil_usuario', {
        p_id_usuario: usuario.id_usuario,
        p_tipo_usuario: usuario.papel.toLocaleLowerCase() === 'responsavel' ? 'responsavel' : 'funcionario',
        p_email: formData.email,
        p_nome: formData.nome,
        p_cpf: removeFormatting(formData.cpf),
        p_telefone_principal: removeFormatting(formData.telefone_principal),
        p_telefone_secundario: removeFormatting(formData.telefone_secundario || ''),
        p_data_nascimento: formData.data_nascimento,
        p_contato_emergencia_nome: formData.contato_emergencia_nome,
        p_contato_emergencia_telefone: removeFormatting(formData.contato_emergencia_telefone || ''),
      });

      if (error) {
        setMessage({ type: 'error', text: 'Erro ao atualizar informações pessoais' });
        console.error("Erro ao atualizar usuário:", error.message);
        alert(`Erro ao atualizar usuário: ${error.message}`);
      } else {
        setMessage({ type: 'success', text: 'Informações pessoais atualizadas com sucesso!' });
        console.log("Usuário atualizado com sucesso:", data);
        
        await atualizarUsuario();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro inesperado ao atualizar informações' });
      console.error("Erro inesperado ao atualizar usuário:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Informações Pessoais
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Campos comuns */}
        <div className="space-y-2">
          <label
            htmlFor="nome"
            className="block text-sm font-medium text-gray-700"
          >
            Nome Completo
          </label>
          <input
            id="nome"
            type="text"
            {...register("nome")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errors.nome && (
            <p className="text-sm text-red-600">
              {String(errors.nome?.message || "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errors.email && (
            <p className="text-sm text-red-600">
              {String(errors.email?.message || "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="cpf"
            className="block text-sm font-medium text-gray-700"
          >
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            {...register("cpf")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            placeholder="000.000.000-00"
            maxLength={14}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, "");
              if (value.length > 3) {
                value = value.replace(/^(\d{3})(\d{1,3})/, "$1.$2");
              }
              if (value.length > 6) {
                value = value.replace(/^(\d{3})\.(\d{3})(\d{1,3})/, "$1.$2.$3");
              }
              if (value.length > 9) {
                value = value.replace(
                  /^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/,
                  "$1.$2.$3-$4"
                );
              }
              e.target.value = value;
              setValue("cpf", value);
            }}
          />
          {errors.cpf && (
            <p className="text-sm text-red-600">
              {String(errors.cpf?.message || "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="data_nascimento"
            className="block text-sm font-medium text-gray-700"
          >
            Data de Nascimento
          </label>
          <input
            id="data_nascimento"
            type="date"
            {...register("data_nascimento")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
          {errors.data_nascimento && (
            <p className="text-sm text-red-600">
              {String(errors.data_nascimento?.message || "")}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="telefone_principal"
            className="block text-sm font-medium text-gray-700"
          >
            Telefone Principal
          </label>
          <input
            id="telefone_principal"
            type="text"
            {...register("telefone_principal")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            placeholder={isEditing ? `(11) 99999-9999` : ''}
            maxLength={15}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, "");
              if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d)/, "($1) $2");
              }
              if (value.length > 7) {
                value = value.replace(
                  /^(\(\d{2}\)\s)(\d{5})(\d{1,4})/,
                  "$1$2-$3"
                );
              }
              e.target.value = value;
              setValue("telefone_principal", value);
            }}
          />
          {errors.telefone_principal && (
            <p className="text-sm text-red-600">
              {String(errors.telefone_principal?.message || "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="telefone_secundario"
            className="block text-sm font-medium text-gray-700"
          >
            Telefone Secundário
          </label>
          <input
            id="telefone_secundario"
            type="text"
            {...register("telefone_secundario")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            placeholder={isEditing ? `(11) 99999-9999` : ''}
            maxLength={15}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, "");
              if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d)/, "($1) $2");
              }
              if (value.length > 7) {
                value = value.replace(
                  /^(\(\d{2}\)\s)(\d{5})(\d{1,4})/,
                  "$1$2-$3"
                );
              }
              e.target.value = value;
              setValue("telefone_secundario", value);
            }}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="contato_emergencia_nome"
            className="block text-sm font-medium text-gray-700"
          >
            Contato de Emergência - Nome
          </label>
          <input
            id="contato_emergencia_nome"
            type="text"
            {...register("contato_emergencia_nome")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="contato_emergencia_telefone"
            className="block text-sm font-medium text-gray-700"
          >
            Contato de Emergência - Telefone
          </label>
          <input
            id="contato_emergencia_telefone"
            type="text"
            {...register("contato_emergencia_telefone")}
            disabled={!isEditing}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            placeholder={isEditing ? `(11) 99999-9999` : ''}
            maxLength={15}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, "");
              if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d)/, "($1) $2");
              }
              if (value.length > 7) {
                value = value.replace(
                  /^(\(\d{2}\)\s)(\d{5})(\d{1,4})/,
                  "$1$2-$3"
                );
              }
              e.target.value = value;
              setValue("contato_emergencia_telefone", value);
            }}
          />
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {isEditing && (
        <button 
          type="submit" 
          disabled={isLoading}
          className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-odara-primary border border-transparent rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Informações Pessoais'
          )}
        </button>
      )}
    </form>
  );
}
