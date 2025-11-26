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
  responsavel: PerfilUsuario;
};

export default function CadastroResponsavel({ responsavel }: Props) {
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
  } = useCadastroForm(responsavel);

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

  // Handler para submissão do formulário - CORRIGIDO
  const aoSubmeter: SubmitHandler<FormValues> = async (dados) => {
    setCarregando(true);

    try {
      console.log("Dados do formulário:", dados);

      // Preparar parâmetros garantindo que campos opcionais sejam null quando vazios
      const parametros = {
        // Dados do usuário
        p_email: dados.email,
        p_papel: "responsavel",

        // Endereço
        p_cep: removeFormatting(dados.cep),
        p_logradouro: dados.logradouro,
        p_numero: dados.numero,
        p_complemento: dados.complemento?.trim() || null,
        p_bairro: dados.bairro,
        p_cidade: dados.cidade,
        p_estado: dados.estado,

        // Dados do responsável
        p_nome: dados.nome,
        p_cpf: removeFormatting(dados.cpf),
        p_telefone_principal: removeFormatting(dados.telefone_principal),
        p_telefone_secundario: dados.telefone_secundario ? removeFormatting(dados.telefone_secundario) : null,
        p_data_nascimento: dados.data_nascimento || null,
        p_contato_emergencia_nome: dados.contato_emergencia_nome?.trim() || null,
        p_contato_emergencia_telefone: dados.contato_emergencia_telefone ? removeFormatting(dados.contato_emergencia_telefone) : null,
        p_observacoes: dados.observacoes?.trim() || null,
      };

      console.log("Parâmetros para RPC:", parametros);

      let resultadoRPC;

      // CORREÇÃO: Usar a mesma estrutura do funcionário
      if (responsavel) {
        console.log("Editando responsável:", responsavel.id);
        resultadoRPC = await supabase
          .schema("public")
          .rpc("editar_responsavel_com_usuario", {
            p_id_responsavel: responsavel.id,
            ...parametros,
          });
      } else {
        console.log("Cadastrando novo responsável");
        resultadoRPC = await supabase
          .schema("public")
          .rpc("cadastrar_responsavel_com_usuario", parametros);
      }

      console.log("Resultado RPC:", resultadoRPC);

      // CORREÇÃO: Verificar erro corretamente
      if (resultadoRPC.error) {
        console.error("Erro RPC:", resultadoRPC.error);
        throw new Error(resultadoRPC.error.message || "Erro desconhecido do banco de dados");
      }

      // Configurar modal de sucesso
      setConfiguracaoModal({
        titulo: "Sucesso!",
        descricao: `Responsável ${dados.nome} ${responsavel ? "atualizado" : "cadastrado"
          } com sucesso!`,
        acoes: [
          {
            rotulo: "Acessar Lista",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin/responsaveis"),
          },
          {
            rotulo: "Acessar Dashboard",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin"),
          },
          ...(!responsavel
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

      if (!responsavel) reset();
    } catch (erro) {
      console.error("Erro completo:", erro);
      
      // CORREÇÃO: Extrair mensagem de erro de forma mais robusta
      let mensagemErro = "Erro desconhecido";
      
      if (erro instanceof Error) {
        mensagemErro = erro.message;
      } else if (typeof erro === 'string') {
        mensagemErro = erro;
      } else if (erro && typeof erro === 'object') {
        // Tentar extrair mensagem de objetos de erro do Supabase
        const errorObj = erro as any;
        if (errorObj.message) {
          mensagemErro = errorObj.message;
        } else if (errorObj.error && errorObj.error.message) {
          mensagemErro = errorObj.error.message;
        }
      }

      // Configurar modal de erro
      setConfiguracaoModal({
        titulo: "Erro!",
        descricao: `Erro ao ${responsavel ? "editar" : "cadastrar"} responsável: ${mensagemErro}`,
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
          {responsavel
            ? `Edição de ${responsavel.nome}`
            : "Cadastro de Responsável"}
        </h1>
      </div>
      <p className="text-center mb-8 text-odara-dark/60">
        Preencha os dados do responsável.
      </p>

      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Seção: Dados Pessoais */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary">
              Dados Pessoais
            </h3>
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Email <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Telefone Principal <span className="text-odara-accent font-bold">*</span>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Telefone Secundário
            </label>
            <input
              {...register("telefone_secundario")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="(11) 88888-8888"
              maxLength={15}
              onChange={(e) => {
                const valorFormatado = formatarTelefone(e.target.value);
                e.target.value = valorFormatado;
                setValue("telefone_secundario", valorFormatado);
              }}
            />
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
              placeholder="Nome do contato"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Telefone do Contato
            </label>
            <input
              {...register("contato_emergencia_telefone")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="(11) 88888-8888"
              maxLength={15}
              onChange={(e) => {
                const valorFormatado = formatarTelefone(e.target.value);
                e.target.value = valorFormatado;
                setValue("contato_emergencia_telefone", valorFormatado);
              }}
            />
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
            {errors.cep && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.cep.message}
              </p>
            )}
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

          {/* Seção: Observações */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Observações
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Observações Adicionais
            </label>
            <textarea
              {...register("observacoes")}
              rows={3}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Observações adicionais sobre o responsável..."
            />
          </div>
        </div>

        {/* Botão de Submissão */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={carregando}
            className="flex items-center px-6 py-3 bg-odara-accent hover:bg-odara-secondary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {carregando ? (
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