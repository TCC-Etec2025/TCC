import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler } from "react-hook-form";
import { supabase } from "../../../lib/supabaseClient";
import Modal from "../../Modal";
import { useCadastroForm } from "./form";
import { type FormValues } from "./types";
import { Loader2, UserPlus } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [residentes, setResidentes] = useState<Residente[]>([]);
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
  } = useCadastroForm(pertence);

  useEffect(() => {
    const fetchResidentes = async () => {
      try {
        const { data, error } = await supabase
          .from("residente")
          .select("id, nome, foto_url")
          .order("nome", { ascending: true });

        if (error) throw error;

        setResidentes(data);
      } catch (error) {
        console.error("Erro ao buscar residentes:", error);
      }
    };

    fetchResidentes();
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);

    try {
      if (pertence) {
        const { error } = await supabase
          .from("pertence")
          .update({
            nome: data.nome,
            descricao: data.descricao,
            estado: data.estado,
            data_registro: data.data_registro,
            status: data.status,
            data_baixa: data.data_baixa,
            observacoes: data.observacoes,
          })
          .eq("id", pertence.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("pertence").insert({
          nome: data.nome,
          descricao: data.descricao,
          estado: data.estado,
          data_registro: data.data_registro,
          status: data.status,
          data_baixa: data.data_baixa,
          observacoes: data.observacoes,
        });

        if (error) throw error;
      }

      setModalConfig({
        title: "Sucesso!",
        description: `Pertence ${data.nome} ${
          pertence ? "atualizado" : "cadastrado"
        } com sucesso!`,
        actions: [
          {
            label: "Voltar à lista",
            className: "bg-blue-500 text-white hover:bg-blue-600",
            onClick: () => navigate("/app/admin/perteces"),
          },
          ...(!pertence
            ? [
                {
                  label: "Cadastrar outro",
                  className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
                  onClick: () => {
                    reset();
                    setModalOpen(false);
                  },
                },
              ]
            : []),
          {
            label: "Dashboard",
            className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
            onClick: () => navigate("/app/admin"),
          },
        ],
      });
      setModalOpen(true);

      if (!pertence) reset();
    } catch {
      setModalConfig({
        title: "Erro!",
        description: `Erro ao ${
          pertence ? "editar" : "cadastrar"
        } pertence.`,
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
    <div className="p-8 bg-slate-50 rounded-2xl shadow-xl max-w-4xl mx-auto my-12">
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
          {pertence
            ? `Edição de ${pertence.nome}`
            : "Cadastro de Responsável"}
        </h1>
      </div>
      <p className="text-center mb-8 text-gray-600">
        Preencha os dados do pertence.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Dados
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Residente *
            </label>
            <select
              {...register("id_residente")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Selecione um residente</option>
              {residentes.map((residente) => (
                <option key={residente.id} value={residente.id}>
                  {residente.nome}
                </option>
              ))}
            </select>
            {errors.id_residente && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.id_residente.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              {...register("nome")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite o nome"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.nome.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              {...register("descricao")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite a descrição"
            />
            {errors.descricao && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.descricao.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <input
              {...register("estado")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite o estado"
            />
            {errors.estado && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.estado.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Registro *
            </label>
            <input
              type="date"
              {...register("data_registro")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <input
              {...register("status")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite o status"
            />
            {errors.status && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.status.message}
              </p>
            )}
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
              Data de Baixa *
            </label>
            <input
              {...register("data_baixa")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite a data de baixa"
            />
            {errors.data_baixa && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.data_baixa.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <input
              {...register("observacoes")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite suas observações"
            />
            {errors.observacoes && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.observacoes.message}
              </p>
            )}
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
