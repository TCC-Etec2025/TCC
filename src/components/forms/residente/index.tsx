import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler } from "react-hook-form";
import { supabase } from "../../../lib/supabaseClient";
import Modal from "../../Modal";
import { useCadastroForm } from "./form";
import { type FormValues } from "./types";
import { Loader2, UserPlus, X, Upload, User, Info } from "lucide-react";
import { type Residente } from "../../../Modelos";
import { formatDateNumeric } from "../../../utils/date";
import { formatCPF, removeFormatting } from "../../../utils";

type Props = {
  residente: Residente;
};
type Responsavel = {
  id: number;
  nome: string;
  cpf: string;
};

export default function CadastroResidente({ residente }: Props) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
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
    setValue,
  } = useCadastroForm(residente);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    // Verificar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `fotos-perfil/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("residentes-fotos")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("residentes-fotos").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        const { data, error } = await supabase
          .from("responsavel")
          .select("id, nome, cpf");

        if (error) {
          throw error;
        }

        setResponsaveis(data);

        if (residente && residente.id_responsavel) {
          setValue("id_responsavel", Number(residente.id_responsavel));
        }
      } catch (error) {
        console.error("Erro ao buscar responsáveis:", error);
      }
    };
    fetchResponsaveis();
  }, [residente, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      let fotoUrl = data.foto;

      // Fazer upload da imagem se uma foi selecionada
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          fotoUrl = uploadedUrl;
        }
      }

      const insertData = {
        id_responsavel: data.id_responsavel,
        nome: data.nome,
        data_nascimento: data.data_nascimento,
        cpf: removeFormatting(data.cpf),
        sexo: data.sexo,
        data_admissao: data.data_admissao,
        estado_civil: data.estado_civil,
        naturalidade: data.naturalidade,
        quarto: data.quarto,
        dependencia: data.dependencia,
        plano_saude: data.plano_saude,
        numero_carteirinha: data.numero_carteirinha,
        observacoes: data.observacoes,
        foto_perfil: fotoUrl,
      };

      if (residente) {
        const { error } = await supabase
          .from("residente")
          .update(insertData)
          .eq("id", residente.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("residente")
          .insert(insertData);
        if (error) throw error;
      }

      setModalConfig({
        title: "Sucesso!",
        description: `Residente ${data.nome} ${residente ? "atualizado" : "cadastrado"
          } com sucesso!`,
        actions: [
          {
            label: "Voltar à lista",
            onClick: () => navigate("/app/admin/residentes"),
            className: "bg-blue-500 text-white hover:bg-blue-600",
          },
          ...(!residente
            ? [
              {
                label: "Cadastrar outro",
                onClick: () => {
                  reset();
                  setModalOpen(false);
                  setPreviewUrl(null);
                  setSelectedFile(null);
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
        description: `Erro ao ${residente ? "atualizar" : "cadastrar"
          } o residente.${JSON.stringify(error)}`,
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
          {residente ? `Edição de ${residente.nome}` : "Cadastro de Residente"}
        </h1>
      </div>
      <p className="text-center mb-8 text-gray-600">
        Preencha os dados do residente.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável Legal *
              </label>
              <select
                {...register("id_responsavel")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                {responsaveis ? (
                  <option value="">Selecione um responsável</option>
                ) : <option value="">Carregando...</option>}
                {responsaveis.map((responsavel) => (
                  <option
                    key={responsavel.id}
                    value={Number(responsavel.id)}
                    title={`${responsavel.nome}\n${formatCPF(responsavel.cpf)}`}
                  >
                    {responsavel.nome} — {formatCPF(responsavel.cpf)}
                  </option>
                ))}
              </select>
            </div>
            <div>
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
                Data de Nascimento *
              </label>
              <input
                type="date"
                {...register("data_nascimento")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                max={(() => {
                  const hoje = new Date();
                  hoje.setFullYear(hoje.getFullYear() - 59);
                  return formatDateNumeric(hoje);
                })()}
                title="Data deve ser, no mínimo, 59 anos atrás"
              />
              {errors.data_nascimento && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.data_nascimento.message}
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
                Sexo
              </label>
              <select
                {...register("sexo")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Selecione o sexo...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Admissão *
              </label>
              <input
                type="date"
                {...register("data_admissao")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.data_admissao && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.data_admissao.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Civil
              </label>
              <select
                {...register("estado_civil")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Selecione o estado civil...</option>
                <option value="Solteiro">Solteiro</option>
                <option value="Casado">Casado</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viúvo">Viúvo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Naturalidade
              </label>
              <input
                {...register("naturalidade")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Cidade de nascimento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização do Quarto
              </label>
              <input
                {...register("quarto")}
                placeholder="Ex: Quarto 12A, Ala B"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-1">
                Nível de Dependência
                <span
                  title="Indica o grau de autonomia do residente"
                  className="text-blue-500 cursor-pointer relative group"
                >
                  <Info size={16} />
                  <span className="absolute left-6 top-1 z-10 hidden group-hover:block bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-xs text-gray-700 w-56">
                    <b>Grau de Dependência I:</b> idosos independentes, mesmo
                    que requeiram uso de equipamentos de auto-ajuda
                    <br />
                    <b>Grau de Dependência II:</b> idosos com dependência em até
                    três atividades de autocuidado para a vida diária tais como:
                    alimentação, mobilidade, higiene; sem comprometimento
                    cognitivo ou com alteração cognitiva controlada;
                    <br />
                    <b>Grau de Dependência III:</b> idosos com dependência que
                    requeiram assistência em todas as atividades de autocuidado
                    para a vida diária e ou com comprometimento cognitivo.
                  </span>
                </span>
              </label>
              <select
                {...register("dependencia")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Selecione o nível...</option>
                <option value="Grau I">Grau de Dependência I</option>
                <option value="Grau II">Grau de Dependência II</option>
                <option value="Grau III">Grau de Dependência III</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plano de Saúde
              </label>
              <input
                {...register("plano_saude")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nome do plano de saúde"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da Carteirinha
              </label>
              <input
                {...register("numero_carteirinha")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Número da carteirinha do plano"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de Perfil
            </label>
            <div className="flex items-center space-x-4">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setValue("foto", "");
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={24} className="text-gray-500" />
                </div>
              )}

              <div className="flex-1">
                <label className="flex flex-col items-center px-4 py-2 bg-white text-blue-500 rounded-lg border border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors">
                  <Upload size={18} className="mb-1" />
                  <span className="text-sm font-medium">Selecionar imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
              </div>
            </div>
            <input type="hidden" {...register("foto")} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              {...register("observacoes")}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Observações adicionais sobre o residente..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading || isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {isUploading
                  ? "Enviando imagem..."
                  : residente
                    ? "Salvando"
                    : "Cadastrando"}
                ...
              </>
            ) : residente ? (
              "Salvar Alterações"
            ) : (
              "Cadastrar Residente"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
