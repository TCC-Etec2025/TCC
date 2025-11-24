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
  funcionario: PerfilUsuario;
};

export default function CadastroFuncionario({ funcionario }: Props) {
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
  } = useCadastroForm(funcionario);

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
        if (error.name === "AbortError") return;
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
        p_papel: data.papel || "funcionario",

        // Endereço
        p_cep: removeFormatting(data.cep),
        p_logradouro: data.logradouro,
        p_numero: data.numero,
        p_complemento: data.complemento || null,
        p_bairro: data.bairro,
        p_cidade: data.cidade,
        p_estado: data.estado,

        // Dados do funcionário
        p_vinculo: data.vinculo,
        p_nome: data.nome,
        p_cpf: removeFormatting(data.cpf),
        p_data_nascimento: data.data_nascimento,
        p_cargo: data.cargo,
        p_registro_profissional: data.registro_profissional || null,
        p_data_admissao: data.data_admissao,
        p_telefone_principal: removeFormatting(data.telefone_principal),
        p_telefone_secundario: removeFormatting(data.telefone_secundario || "") || null,
        p_contato_emergencia_nome: data.contato_emergencia_nome || null,
        p_contato_emergencia_telefone: removeFormatting(data.contato_emergencia_telefone || "") || null,
      };

      let rpcResult;

      if (funcionario) {
        rpcResult = await supabase.rpc("editar_funcionario_com_usuario", {
          p_id_funcionario: funcionario.id,
          ...params,
        });
      } else {
        rpcResult = await supabase.rpc(
          "cadastrar_funcionario_com_usuario",
          params
        );
      }

      if (rpcResult.error) {
        throw rpcResult.error;
      }

      setModalConfig({
        title: "Sucesso!",
        description: `Funcionário ${data.nome} ${funcionario ? "atualizado" : "cadastrado"
          } com sucesso!`,
        actions: [
          {
            label: "Voltar à lista",
            className: "bg-odara-secondary text-white hover:bg-blue-600",
            onClick: () => navigate("/app/admin/funcionarios"),
          },
          ...(!funcionario
            ? [
              {
                label: "Cadastrar outro",
                className: "bg-gray-200 text-odara-dark hover:bg-gray-300",
                onClick: () => {
                  reset();
                  setModalOpen(false);
                },
              },
            ]
            : []),
          {
            label: "Dashboard",
            className: "bg-gray-200 text-odara-dark hover:bg-gray-300",
            onClick: () => navigate("/app/admin"),
          },
        ],
      });
      setModalOpen(true);

      if (!funcionario) reset();
    } catch (error) {
      setModalConfig({
        title: "Erro!",
        description: `Erro ao ${funcionario ? "editar" : "cadastrar"
          } funcionário: ${error.message} `,
        actions: [
          {
            label: "Fechar",
            className: "bg-red-500 text-white hover:bg-red-600",
            onClick: () => setModalOpen(false),
          },
        ],
      });
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-odara-white rounded-2xl shadow-xl max-w-4xl mx-auto my-12">
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        actions={modalConfig.actions}
      />

      <div className="flex items-center justify-center space-x-4 mb-2">
        <UserPlus size={48} className="text-odara-primary" />
        <h1 className="text-3xl font-bold text-odara-accent">
          {funcionario
            ? `Edição de ${funcionario.nome}`
            : "Cadastro de Funcionário"}
        </h1>
      </div>
      <p className="text-center mb-8 text-odara-dark/60">
        Preencha os dados do funcionário.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary">
              Dados Pessoais
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Tipo de Vínculo <span className="text-odara-accent font-bold">*</span>
            </label>
            <select
              {...register("vinculo")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent bg-white"
            >
              <option value="">Selecione o tipo de vínculo</option>
              <option className="hover:bg-odara-primary/10" value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Estagiário">Estagiário</option>
              <option value="Voluntário">Voluntário</option>
              <option value="Outro">Outro</option>
            </select>
            {errors.vinculo && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.vinculo.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Nome Completo <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("nome")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Digite o nome completo"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.nome.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Email <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("email")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Digite o nome completo"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              CPF <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("cpf")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
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
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              {...register("data_nascimento")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              max={(() => {
                const hoje = new Date();
                hoje.setFullYear(hoje.getFullYear() - 18);
                return formatDateNumeric(hoje);
              })()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Telefone <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("telefone_principal")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
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
            <label className="block text-sm font-medium text-odara-secondary mb-2 mt-4">
              Telefone Secundário
            </label>
            <input
              {...register("telefone_secundario")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
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
                setValue("telefone_secundario", value);
              }}
            />
            {errors.telefone_secundario && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.telefone_secundario.message}
              </p>
            )}
          </div>

          {/* Dados Profissionais */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Dados Profissionais
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Cargo <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("cargo")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Cargo/função"
            />
            {errors.cargo && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.cargo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Papel <span className="text-odara-accent font-bold">*</span>
            </label>
            <select
              //{...register("papel")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent bg-white"
            >
              <option value="funcionario" selected>
                Funcionário
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Registro Profissional
            </label>
            <input
              {...register("registro_profissional")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="CRM, COREN, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Data de Admissão <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              type="date"
              {...register("data_admissao")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            />
            {errors.data_admissao && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.data_admissao.message}
              </p>
            )}
          </div>

          {/* Endereço */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Endereço
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
                CEP <span className="text-odara-accent font-bold">*</span>
              </label>
              <input
                {...register("cep")}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
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
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Logradouro <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("logradouro")}
              disabled={isCepAutoFilled}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${isCepAutoFilled
                  ? "bg-gray-200 text-dark-600 cursor-not-allowed"
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

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Número <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("numero")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="123"
              type="number"
            />
            {errors.numero && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.numero.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Complemento
            </label>
            <input
              {...register("complemento")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Apartamento, bloco, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Bairro <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("bairro")}
              disabled={isCepAutoFilled}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${isCepAutoFilled
                  ? "bg-gray-200 text-dark-600 cursor-not-allowed"
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
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Cidade <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("cidade")}
              disabled={isCepAutoFilled}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${isCepAutoFilled
                  ? "bg-gray-200 text-dark-600 cursor-not-allowed"
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
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Estado <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("estado")}
              disabled={isCepAutoFilled}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${isCepAutoFilled
                  ? "bg-gray-200 text-dark-600 cursor-not-allowed"
                  : ""
                }`}
              placeholder="SP"
              maxLength={2}
            />
            {errors.estado && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.estado.message}
              </p>
            )}
          </div>

          {/* Contato de Emergência */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Contato de Emergência
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Nome do Contato
            </label>
            <input
              {...register("contato_emergencia_nome")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Nome do contato de emergência"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Telefone do Contato
            </label>
            <input
              {...register("contato_emergencia_telefone")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
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
                setValue("contato_emergencia_telefone", value);
              }}
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 ">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-odara-accent hover:bg-odara-secondary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {funcionario ? "Salvando" : "Cadastrando"}...
              </>
            ) : funcionario ? (
              "Salvar Alterações"
            ) : (
              "Cadastrar Funcionário"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
