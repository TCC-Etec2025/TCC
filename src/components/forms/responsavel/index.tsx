import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler } from "react-hook-form";
import { supabase } from "../../../lib/supabaseClient";
import Modal from "../../Modal";
import { useCadastroForm } from "./form";
import { type FormValues } from "./types";
import { Loader2, UserPlus } from "lucide-react";
import { type PerfilUsuario } from "../../../context/UserContext";
import { formatDateNumeric, removeFormatting } from "../../../utils";

type Props = {
  responsavel: PerfilUsuario;
};

export default function CadastroResponsavel({ responsavel }: Props) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCepAutoFilled, setIsCepAutoFilled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    actions: Array<{
      label: string;
      onClick: () => void;
      className: string;
    }>;
  }>({
    title: "",
    description: "",
    actions: [],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useCadastroForm(responsavel);

  const cepValue = watch("cep");

  useEffect(() => {
    const controller = new AbortController();

    const fetchEndereco = async () => {
      if (!cepValue) {
        setIsCepAutoFilled(false);
        return;
      }

      const cepLimpo = String(cepValue).replace(/\D/g, "");
      if (cepLimpo.length !== 8) {
        setIsCepAutoFilled(false);
        return;
      }

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cepLimpo}/json/`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setIsCepAutoFilled(false);
          return;
        }

        const data = await response.json();
        if (data && !data.erro) {
          // Só setamos os campos se o componente ainda estiver montado
          setValue("logradouro", data.logradouro || "");
          setValue("bairro", data.bairro || "");
          setValue("cidade", data.localidade || "");
          setValue("estado", data.uf || "");
          setIsCepAutoFilled(true);
        } else {
          setIsCepAutoFilled(false);
        }
      } catch (err) {
        const error = err as unknown as { name?: string };
        if (error.name === "AbortError") return; // fetch cancelado
        console.log("Erro ao buscar CEP:", err);
        setIsCepAutoFilled(false);
      }
    };

    fetchEndereco();

    return () => controller.abort();
  }, [cepValue, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      const params = {
        // Dados do usuário
        p_email: data.email,
        p_papel: "responsavel",
        // Dados do endereço
        p_cep: removeFormatting(data.cep),
        p_logradouro: data.logradouro,
        p_numero: data.numero,
        p_complemento: data.complemento || null,
        p_bairro: data.bairro,
        p_cidade: data.cidade,
        p_estado: data.estado,
        // Dados do responsável
        p_nome: data.nome,
        p_cpf: removeFormatting(data.cpf),
        p_telefone_principal: removeFormatting(data.telefone_principal),
        p_telefone_secundario: removeFormatting(data.telefone_secundario || "") || null,
        p_data_nascimento: data.data_nascimento || null,
        p_contato_emergencia_nome: data.contato_emergencia_nome || null,
        p_contato_emergencia_telefone: removeFormatting(data.contato_emergencia_telefone || "") || null,
        p_observacoes: data.observacoes || null,
      };

      let error;
      if (responsavel) {
        ({ error } = await supabase
          .schema("public")
          .rpc("editar_responsavel_com_usuario", {
            p_id_responsavel: responsavel.id,
            ...params,
          }));
      } else {
        ({ error } = await supabase
          .schema("public")
          .rpc("cadastrar_responsavel_com_usuario", params));
      }

      if (error) throw new Error(error.message);

      setModalConfig({
        title: "Sucesso!",
        description: `Responsável ${data.nome} ${responsavel ? "atualizado" : "cadastrado"
          } com sucesso!`,
        actions: [
          {
            label: "Voltar à lista",
            onClick: () => navigate("/app/admin/responsaveis"),
            className: "bg-blue-500 text-white hover:bg-blue-600",
          },
          ...(!responsavel
            ? [
              {
                label: "Cadastrar outro",
                onClick: () => {
                  reset();
                  setModalOpen(false);
                },
                className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
              },
            ]
            : []),
          {
            label: "Dashboard",
            onClick: () => navigate("/app/admin"),
            className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
          },
        ],
      });

      setModalOpen(true);
    } catch (error) {
      setModalConfig({
        title: "Erro!",
        description: `Erro ao ${responsavel ? "editar" : "cadastrar"
          } responsável: ${error.message}`,
        actions: [
          {
            label: "Fechar",
            onClick: () => setModalOpen(false),
            className: "bg-red-500 text-white hover:bg-red-600",
          },
        ],
      });
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 rounded-2xl shadow-xl max-w-3xl mx-auto my-12">
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        actions={modalConfig.actions}
      />
      <div className="flex items-center justify-center space-x-4 mb-8">
        <UserPlus size={48} className="text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-800">
          {responsavel
            ? `Edição de ${responsavel.nome}`
            : "Cadastro de Responsável"}
        </h1>
      </div>
      <p className="text-center mb-8 text-gray-600">
        Preencha os dados do responsável.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              {...register("nome")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite o nome completo"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.nome.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF *
            </label>
            <input
              {...register("cpf")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="000.000.000-00"
              maxLength={14}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");
                if (value.length > 3) {
                  value = value.replace(/^(\d{3})(\d{1,3})/, "$1.$2");
                }
                if (value.length > 6) {
                  value = value.replace(
                    /^(\d{3})\.(\d{3})(\d{1,3})/,
                    "$1.$2.$3"
                  );
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
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.cpf.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              {...register("data_nascimento")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="DD/MM/AAAA"
              max={(() => {
                const hoje = new Date();
                hoje.setFullYear(hoje.getFullYear() - 18);
                return formatDateNumeric(hoje);
              })()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail *
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone Principal *
            </label>
            <input
              {...register("telefone_principal")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="(11) 99999-9999"
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
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.telefone_principal.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone Secundário
            </label>
            <input
              {...register("telefone_secundario")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="(11) 88888-8888"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Contato de Emergência
            </label>
            <input
              {...register("contato_emergencia_nome")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Nome do contato"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone do Contato de Emergência
            </label>
            <input
              {...register("contato_emergencia_telefone")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="(11) 88888-8888"
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
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP *
              </label>
              <input
                {...register("cep")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="00000-000"
                maxLength={9}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 5) {
                    value = value.replace(/^(\d{5})(\d{1,3})/, "$1-$2");
                  }
                  e.target.value = value;
                  setValue("cep", value);
                }}
              />
              {errors.cep && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.cep.message}
                </p>
              )}
            </div>
            {isCepAutoFilled && (
              <div className="md:col-span-3 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsCepAutoFilled(false)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  🔓 Editar endereço manualmente
                </button>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logradouro *
                {isCepAutoFilled && (
                  <span className="text-xs text-blue-600 ml-2">
                    (preenchido pelo CEP)
                  </span>
                )}
              </label>
              <input
                {...register("logradouro")}
                disabled={isCepAutoFilled}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isCepAutoFilled
                    ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                    : ""
                  }`}
                placeholder="Rua, Avenida, etc."
              />
              {errors.logradouro && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.logradouro.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número *
            </label>
            <input
              {...register("numero")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="123"
            />
            {errors.numero && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.numero.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complemento
            </label>
            <input
              {...register("complemento")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Apartamento, bloco, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bairro *
              {isCepAutoFilled && (
                <span className="text-xs text-blue-600 ml-2">
                  (preenchido pelo CEP)
                </span>
              )}
            </label>
            <input
              {...register("bairro")}
              disabled={isCepAutoFilled}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isCepAutoFilled
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : ""
                }`}
              placeholder="Bairro"
            />
            {errors.bairro && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.bairro.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade *
              {isCepAutoFilled && (
                <span className="text-xs text-blue-600 ml-2">
                  (preenchido pelo CEP)
                </span>
              )}
            </label>
            <input
              {...register("cidade")}
              disabled={isCepAutoFilled}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isCepAutoFilled
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : ""
                }`}
              placeholder="Cidade"
            />
            {errors.cidade && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.cidade.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
              {isCepAutoFilled && (
                <span className="text-xs text-blue-600 ml-2">
                  (preenchido pelo CEP)
                </span>
              )}
            </label>
            <input
              {...register("estado")}
              disabled={isCepAutoFilled}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isCepAutoFilled
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : ""
                }`}
              placeholder="SP"
            />
            {errors.estado && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.estado.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              {...register("observacoes")}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Observações adicionais sobre o responsável..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {responsavel ? "Salvando" : "Cadastrando"}...
              </>
            ) : responsavel ? (
              "Salvar Alterações"
            ) : (
              "Cadastrar Responsável"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
