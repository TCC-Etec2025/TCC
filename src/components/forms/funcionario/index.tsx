import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler } from "react-hook-form";
import { supabase } from "../../../lib/supabaseClient";
import Modal from "../../Modal";
import { useCadastroForm } from "./form";
import { type FormValues } from "./types";
import { Loader2, UserRoundPlus, LockKeyholeOpen } from "lucide-react";
import { type PerfilUsuario } from "../../../context/UserContext";
import { formatDateNumeric, removeFormatting } from "../../../utils";

type Props = {
  funcionario: PerfilUsuario;
};

export default function CadastroFuncionario({ funcionario }: Props) {
  const navigate = useNavigate();

  // Estados do componente
  const [carregando, setCarregando] = useState(false);
  const [cepPreenchidoAutomaticamente, setCepPreenchidoAutomaticamente] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [configuracaoModal, setConfiguracaoModal] = useState<{
    titulo: string;
    descricao: string;
    acoes: Array<{
      rotulo: string;
      aoClicar: () => void;
      className: string;
    }>;
  }>({
    titulo: "",
    descricao: "",
    acoes: [],
  });

  // Hook do formulário
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useCadastroForm(funcionario);

  const valorCep = watch("cep");

  // Efeito para buscar endereço via CEP
  useEffect(() => {
    const controlador = new AbortController();

    const buscarEndereco = async () => {
      if (!valorCep) {
        setCepPreenchidoAutomaticamente(false);
        return;
      }

      const cepLimpo = String(valorCep).replace(/\D/g, "");
      if (cepLimpo.length !== 8) {
        setCepPreenchidoAutomaticamente(false);
        return;
      }

      try {
        const resposta = await fetch(
          `https://viacep.com.br/ws/${cepLimpo}/json/`,
          { signal: controlador.signal }
        );

        if (!resposta.ok) {
          setCepPreenchidoAutomaticamente(false);
          return;
        }

        const dados = await resposta.json();

        if (dados && !dados.erro) {
          setValue("logradouro", dados.logradouro || "");
          setValue("bairro", dados.bairro || "");
          setValue("cidade", dados.localidade || "");
          setValue("estado", dados.uf || "");
          setCepPreenchidoAutomaticamente(true);
        } else {
          setCepPreenchidoAutomaticamente(false);
        }
      } catch (erro) {
        const error = erro as unknown as { name?: string };
        if (error.name === "AbortError") return;
        console.log("Erro ao buscar CEP:", erro);
        setCepPreenchidoAutomaticamente(false);
      }
    };

    buscarEndereco();

    return () => controlador.abort();
  }, [valorCep, setValue]);

  // Funções auxiliares para formatação
  const formatarCPF = (valor: string): string => {
    let valorFormatado = valor.replace(/\D/g, "");
    if (valorFormatado.length > 3) {
      valorFormatado = valorFormatado.replace(/^(\d{3})(\d{1,3})/, "$1.$2");
    }
    if (valorFormatado.length > 6) {
      valorFormatado = valorFormatado.replace(
        /^(\d{3})\.(\d{3})(\d{1,3})/,
        "$1.$2.$3"
      );
    }
    if (valorFormatado.length > 9) {
      valorFormatado = valorFormatado.replace(
        /^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/,
        "$1.$2.$3-$4"
      );
    }
    return valorFormatado;
  };

  const formatarTelefone = (valor: string): string => {
    let valorFormatado = valor.replace(/\D/g, "");
    if (valorFormatado.length > 2) {
      valorFormatado = valorFormatado.replace(/^(\d{2})(\d)/, "($1) $2");
    }
    if (valorFormatado.length > 7) {
      valorFormatado = valorFormatado.replace(
        /^(\(\d{2}\)\s)(\d{5})(\d{1,4})/,
        "$1$2-$3"
      );
    }
    return valorFormatado;
  };

  const formatarCEP = (valor: string): string => {
    let valorFormatado = valor.replace(/\D/g, "");
    if (valorFormatado.length > 5) {
      valorFormatado = valorFormatado.replace(/^(\d{5})(\d{1,3})/, "$1-$2");
    }
    return valorFormatado;
  };

  // Handler para submissão do formulário
  const aoSubmeter: SubmitHandler<FormValues> = async (dados) => {
    setCarregando(true);

    try {
      const parametros = {
        // Dados do usuário
        p_email: dados.email,
        p_papel: dados.papel || "funcionario",

        // Endereço
        p_cep: removeFormatting(dados.cep),
        p_logradouro: dados.logradouro,
        p_numero: dados.numero,
        p_complemento: dados.complemento || null,
        p_bairro: dados.bairro,
        p_cidade: dados.cidade,
        p_estado: dados.estado,

        // Dados do funcionário
        p_vinculo: dados.vinculo,
        p_nome: dados.nome,
        p_cpf: removeFormatting(dados.cpf),
        p_data_nascimento: dados.data_nascimento,
        p_cargo: dados.cargo,
        p_registro_profissional: dados.registro_profissional || null,
        p_data_admissao: dados.data_admissao,
        p_telefone_principal: removeFormatting(dados.telefone_principal),
        p_telefone_secundario: removeFormatting(dados.telefone_secundario || "") || null,
        p_contato_emergencia_nome: dados.contato_emergencia_nome || null,
        p_contato_emergencia_telefone: removeFormatting(dados.contato_emergencia_telefone || "") || null,
      };

      let resultadoRPC;

      if (funcionario) {
        resultadoRPC = await supabase.rpc("editar_funcionario_com_usuario", {
          p_id_funcionario: funcionario.id,
          ...parametros,
        });
      } else {
        resultadoRPC = await supabase.rpc(
          "cadastrar_funcionario_com_usuario",
          parametros
        );
      }

      if (resultadoRPC.error) {
        throw resultadoRPC.error;
      }

      // Configurar modal de sucesso
      setConfiguracaoModal({
        titulo: "Sucesso!",
        descricao: `Funcionário ${dados.nome} ${funcionario ? "atualizado" : "cadastrado"
          } com sucesso!`,
        acoes: [
          {
            rotulo: "Acessar Lista",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin/funcionarios"),
          },
          {
            rotulo: "Acessar Dashboard",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin"),
          },
          ...(!funcionario
            ? [
              {
                rotulo: "Novo Cadastro",
                className: "bg-odara-accent text-odara-contorno hover:bg-odara-secondary",
                aoClicar: () => {
                  reset();
                  setModalAberto(false);
                }
              },
            ]
            : [
              {
                rotulo: "Continuar Editando",
                className: "bg-odara-accent text-odara-contorno hover:bg-odara-secondary",
                aoClicar: () => {
                  setModalAberto(false);
                }
              }
            ]
          ),
        ],
      });
      setModalAberto(true);

      if (!funcionario) reset();
    } catch (erro) {
      // Extrair mensagem de erro de forma segura
      const mensagemErro = erro instanceof Error
        ? erro.message
        : typeof erro === 'string'
          ? erro
          : 'Erro desconhecido';

      // Configurar modal de erro
      setConfiguracaoModal({
        titulo: "Erro!",
        descricao: `Erro ao ${funcionario ? "editar" : "cadastrar"} funcionário: ${mensagemErro}`,
        acoes: [
          {
            rotulo: "Fechar",
            className: "bg-odara-alerta text-white hover:bg-red-600",
            aoClicar: () => setModalAberto(false),
          },
        ],
      });
      setModalAberto(true);
    } finally {
      setCarregando(false);
    }
  };

  // Calcular data máxima para nascimento (18 anos atrás)
  const calcularDataMaximaNascimento = (): string => {
    const hoje = new Date();
    hoje.setFullYear(hoje.getFullYear() - 18);
    return formatDateNumeric(hoje);
  };

  return (
    <div className="p-8 bg-odara-white rounded-2xl shadow-xl max-w-4xl mx-auto my-12">
      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={configuracaoModal.titulo}
        description={configuracaoModal.descricao}
        actions={configuracaoModal.acoes.map(acao => ({
          label: acao.rotulo,
          onClick: acao.aoClicar,
          className: acao.className
        }))}
      />

      {/* Cabeçalho */}
      <div className="flex items-center justify-center space-x-4 mb-2">
        <UserRoundPlus size={48} className="text-odara-primary" />
        <h1 className="text-3xl font-bold text-odara-accent">
          {funcionario
            ? `Edição de ${funcionario.nome}`
            : "Cadastro de Funcionário"}
        </h1>
      </div>
      <p className="text-center mb-8 text-odara-dark/60">
        Preencha os dados do funcionário.
      </p>

      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Seção: Dados Pessoais */}
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
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
              placeholder="Digite o email"
            />
            {errors.email && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
                const valorFormatado = formatarCPF(e.target.value);
                e.target.value = valorFormatado;
                setValue("cpf", valorFormatado);
              }}
            />
            {errors.cpf && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
              max={calcularDataMaximaNascimento()}
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
                const valorFormatado = formatarTelefone(e.target.value);
                e.target.value = valorFormatado;
                setValue("telefone_principal", valorFormatado);
              }}
            />
            {errors.telefone_principal && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
                const valorFormatado = formatarTelefone(e.target.value);
                e.target.value = valorFormatado;
                setValue("telefone_secundario", valorFormatado);
              }}
            />
            {errors.telefone_secundario && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.telefone_secundario.message}
              </p>
            )}
          </div>

          {/* Seção: Dados Profissionais */}
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
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.cargo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Papel <span className="text-odara-accent font-bold">*</span>
            </label>
            <select
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
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.data_admissao.message}
              </p>
            )}
          </div>

          {/* Seção: Endereço */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Endereço
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              CEP <span className="text-odara-accent font-bold">*</span>
            </label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <input
                  {...register("cep")}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
                  placeholder="00000-000"
                  maxLength={9}
                  onChange={(e) => {
                    const valorFormatado = formatarCEP(e.target.value);
                    e.target.value = valorFormatado;
                    setValue("cep", valorFormatado);
                  }}
                />
              </div>

              {cepPreenchidoAutomaticamente && (
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setCepPreenchidoAutomaticamente(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-odara-dropdown-accent bg-odara-dropdown border border-odara-dropdown-accent rounded-lg hover:bg-odara-dropdown-accent hover:text-odara-dropdown transition-colors whitespace-nowrap"
                  >
                    <LockKeyholeOpen size={15} className="text-odara-secondary" />
                    Editar manualmente
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Logradouro <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("logradouro")}
              disabled={cepPreenchidoAutomaticamente}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${cepPreenchidoAutomaticamente
                ? "bg-gray-200 text-dark-600 cursor-not-allowed"
                : ""
                }`}
              placeholder="Rua, Avenida, etc."
            />
            {errors.logradouro && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
              disabled={cepPreenchidoAutomaticamente}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${cepPreenchidoAutomaticamente
                ? "bg-gray-200 text-dark-600 cursor-not-allowed"
                : ""
                }`}
              placeholder="Bairro"
            />
            {errors.bairro && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
              disabled={cepPreenchidoAutomaticamente}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${cepPreenchidoAutomaticamente
                ? "bg-gray-200 text-dark-600 cursor-not-allowed"
                : ""
                }`}
              placeholder="Cidade"
            />
            {errors.cidade && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
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
              disabled={cepPreenchidoAutomaticamente}
              className={`w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent ${cepPreenchidoAutomaticamente
                ? "bg-gray-200 text-dark-600 cursor-not-allowed"
                : ""
                }`}
              placeholder="SP"
              maxLength={2}
            />
            {errors.estado && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.estado.message}
              </p>
            )}
          </div>

          {/* Seção: Contato de Emergência */}
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
                const valorFormatado = formatarTelefone(e.target.value);
                e.target.value = valorFormatado;
                setValue("contato_emergencia_telefone", valorFormatado);
              }}
            />
          </div>
        </div>

        {/* Botão de Submissão */}
        <div className="flex justify-end pt-6 ">
          <button
            type="submit"
            disabled={carregando}
            className="flex items-center px-6 py-3 bg-odara-accent hover:bg-odara-secondary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {carregando ? (
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