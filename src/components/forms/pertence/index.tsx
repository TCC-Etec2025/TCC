import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler } from "react-hook-form";
import { supabase } from "../../../lib/supabaseClient";
import Modal from "../../Modal";
import { useCadastroForm } from "./form";
import { type FormValues } from "./types";
import { Loader2, Package } from "lucide-react";
import type { Pertence } from "../../../Modelos";

type Props = {
  pertence: Pertence;
};

type Residente = {
  id: number;
  nome: string;
  foto_url: string | null;
};

export default function CadastroPertence({ pertence }: Props) {
  const navigate = useNavigate();

  // Estados do componente
  const [carregando, setCarregando] = useState(false);
  const [residentes, setResidentes] = useState<Residente[]>([]);
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
  } = useCadastroForm(pertence);

  // Buscar residentes disponíveis
  useEffect(() => {
    const buscarResidentes = async () => {
      try {
        const { data, error } = await supabase
          .from("residente")
          .select("id, nome, foto_url")
          .order("nome", { ascending: true });

        if (error) {
          throw error;
        }

        setResidentes(data || []);
      } catch (erro) {
        console.error("Erro ao buscar residentes:", erro);
      }
    };

    buscarResidentes();
  }, []);

  // Handler para submissão do formulário
  const aoSubmeter: SubmitHandler<FormValues> = async (dados) => {
    setCarregando(true);

    try {
      const dadosParaInserir = {
        id_residente: dados.id_residente,
        nome: dados.nome,
        descricao: dados.descricao,
        estado: dados.estado,
        data_registro: dados.data_registro,
        status: dados.status,
        data_baixa: dados.data_baixa,
        observacoes: dados.observacoes,
      };

      let resultado;

      if (pertence) {
        resultado = await supabase
          .from("pertence")
          .update(dadosParaInserir)
          .eq("id", pertence.id);
      } else {
        resultado = await supabase
          .from("pertence")
          .insert(dadosParaInserir);
      }

      if (resultado.error) {
        throw resultado.error;
      }

      // Configurar modal de sucesso
      setConfiguracaoModal({
        titulo: "Sucesso!",
        descricao: `Pertence ${dados.nome} ${pertence ? "atualizado" : "cadastrado"} com sucesso!`,
        acoes: [
          {
            rotulo: "Acessar Lista",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin/pertences"),
          },
          {
            rotulo: "Acessar Dashboard",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin"),
          },
          ...(!pertence
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

      if (!pertence) reset();
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
        descricao: `Erro ao ${pertence ? "editar" : "cadastrar"} pertence: ${mensagemErro}`,
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
        <Package size={48} className="text-odara-primary" />
        <h1 className="text-3xl font-bold text-odara-accent">
          {pertence
            ? `Edição de ${pertence.nome}`
            : "Cadastro de Pertence"}
        </h1>
      </div>
      <p className="text-center mb-8 text-odara-dark/60">
        Preencha os dados do pertence.
      </p>

      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Seção: Dados do Pertence */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary">
              Dados do Pertence
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Residente <span className="text-odara-accent font-bold">*</span>
            </label>
            <select
              {...register("id_residente")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            >
              <option value="">Selecione um residente</option>
              {residentes.map((residente) => (
                <option key={residente.id} value={residente.id}>
                  {residente.nome}
                </option>
              ))}
            </select>
            {errors.id_residente && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.id_residente.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Nome do Pertence <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              {...register("nome")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Digite o nome do pertence"
            />
            {errors.nome && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.nome.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Descrição <span className="text-odara-accent font-bold">*</span>
            </label>
            <textarea
              {...register("descricao")}
              rows={3}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Descreva o pertence em detalhes..."
            />
            {errors.descricao && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.descricao.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Estado de Conservação <span className="text-odara-accent font-bold">*</span>
            </label>
            <select
              {...register("estado")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            >
              <option value="">Selecione o estado...</option>
              <option value="Novo">Novo</option>
              <option value="Bom">Bom</option>
              <option value="Regular">Regular</option>
              <option value="Ruim">Ruim</option>
              <option value="Precisa de Reparo">Precisa de Reparo</option>
            </select>
            {errors.estado && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.estado.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Data de Registro <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              type="date"
              {...register("data_registro")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            />
            {errors.data_registro && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.data_registro.message}
              </p>
            )}
          </div>

          {/* Seção: Status e Controle */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Status e Controle
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Status <span className="text-odara-accent font-bold">*</span>
            </label>
            <select
              {...register("status")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            >
              <option value="">Selecione o status...</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Em Manutenção">Em Manutenção</option>
              <option value="Descartado">Descartado</option>
              <option value="Extraviado">Extraviado</option>
            </select>
            {errors.status && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.status.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Data de Baixa
            </label>
            <input
              type="date"
              {...register("data_baixa")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            />
            {errors.data_baixa && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.data_baixa.message}
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
              placeholder="Observações adicionais sobre o pertence..."
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
                {pertence ? "Salvando" : "Cadastrando"}...
              </>
            ) : pertence ? (
              "Salvar Alterações"
            ) : (
              "Cadastrar Pertence"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}