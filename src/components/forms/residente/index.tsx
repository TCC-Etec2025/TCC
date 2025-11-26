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

  // Estados do componente
  const [carregando, setCarregando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
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
    setValue,
  } = useCadastroForm(residente);

  // Função para selecionar arquivo
  const selecionarArquivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    // Verificar se é uma imagem
    if (!arquivo.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    // Verificar tamanho do arquivo (máximo 5MB)
    if (arquivo.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setArquivoSelecionado(arquivo);

    // Criar preview
    const leitor = new FileReader();
    leitor.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    leitor.readAsDataURL(arquivo);
  };

  // Função para upload de imagem
  const enviarImagem = async (arquivo: File): Promise<string | null> => {
    setEnviandoImagem(true);
    try {
      const extensaoArquivo = arquivo.name.split(".").pop();
      const nomeArquivo = `${Math.random()}.${extensaoArquivo}`;
      const caminhoArquivo = `fotos-perfil/${nomeArquivo}`;

      const { error: erroUpload } = await supabase.storage
        .from("residentes-fotos")
        .upload(caminhoArquivo, arquivo);

      if (erroUpload) {
        throw erroUpload;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("residentes-fotos")
        .getPublicUrl(caminhoArquivo);

      return publicUrl;
    } catch (erro) {
      console.error("Erro ao fazer upload:", erro);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
      return null;
    } finally {
      setEnviandoImagem(false);
    }
  };

  // Buscar responsáveis
  useEffect(() => {
    const buscarResponsaveis = async () => {
      try {
        const { data, error } = await supabase
          .from("responsavel")
          .select("id, nome, cpf");

        if (error) {
          throw error;
        }

        setResponsaveis(data || []);

        // Preencher responsável atual se estiver editando
        if (residente && residente.id_responsavel) {
          setValue("id_responsavel", Number(residente.id_responsavel));
        }
      } catch (erro) {
        console.error("Erro ao buscar responsáveis:", erro);
      }
    };
    
    buscarResponsaveis();
  }, [residente, setValue]);

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

  // Handler para submissão do formulário
  const aoSubmeter: SubmitHandler<FormValues> = async (dados) => {
    setCarregando(true);

    try {
      let urlFoto = dados.foto;

      // Fazer upload da imagem se uma foi selecionada
      if (arquivoSelecionado) {
        const urlEnviada = await enviarImagem(arquivoSelecionado);
        if (urlEnviada) {
          urlFoto = urlEnviada;
        }
      }

      const dadosParaInserir = {
        id_responsavel: dados.id_responsavel,
        nome: dados.nome,
        data_nascimento: dados.data_nascimento,
        cpf: removeFormatting(dados.cpf),
        sexo: dados.sexo,
        data_admissao: dados.data_admissao,
        estado_civil: dados.estado_civil,
        naturalidade: dados.naturalidade,
        quarto: dados.quarto,
        dependencia: dados.dependencia,
        plano_saude: dados.plano_saude,
        numero_carteirinha: dados.numero_carteirinha,
        observacoes: dados.observacoes,
        foto: urlFoto,
      };

      let resultado;

      if (residente) {
        resultado = await supabase
          .from("residente")
          .update(dadosParaInserir)
          .eq("id", residente.id);
      } else {
        resultado = await supabase
          .from("residente")
          .insert(dadosParaInserir);
      }

      if (resultado.error) {
        throw resultado.error;
      }

      // Configurar modal de sucesso
      setConfiguracaoModal({
        titulo: "Sucesso!",
        descricao: `Residente ${dados.nome} ${residente ? "atualizado" : "cadastrado"} com sucesso!`,
        acoes: [
          {
            rotulo: "Acessar Lista",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin/residentes"),
          },
          {
            rotulo: "Acessar Dashboard",
            className: "bg-odara-white text-odara-primary hover:bg-odara-primary hover:text-white border border-odara-primary",
            aoClicar: () => navigate("/app/admin"),
          },
          ...(!residente
            ? [
                {
                  rotulo: "Novo Cadastro",
                  className: "bg-odara-accent text-odara-contorno hover:bg-odara-secondary",
                  aoClicar: () => {
                    reset();
                    setModalAberto(false);
                    setPreviewUrl(null);
                    setArquivoSelecionado(null);
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

      if (!residente) reset();
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
        descricao: `Erro ao ${residente ? "editar" : "cadastrar"} residente: ${mensagemErro}`,
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

  // Calcular data máxima para nascimento (59 anos atrás)
  const calcularDataMaximaNascimento = (): string => {
    const hoje = new Date();
    hoje.setFullYear(hoje.getFullYear() - 59);
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
        <UserPlus size={48} className="text-odara-primary" />
        <h1 className="text-3xl font-bold text-odara-accent">
          {residente
            ? `Edição de ${residente.nome}`
            : "Cadastro de Residente"}
        </h1>
      </div>
      <p className="text-center mb-8 text-odara-dark/60">
        Preencha os dados do residente.
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
              Responsável Legal <span className="text-odara-accent font-bold">*</span>
            </label>
            <select
              {...register("id_responsavel")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            >
              <option value="">Selecione um responsável</option>
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
            {errors.id_responsavel && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.id_responsavel.message}
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

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Data de Nascimento <span className="text-odara-accent font-bold">*</span>
            </label>
            <input
              type="date"
              {...register("data_nascimento")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              max={calcularDataMaximaNascimento()}
              title="Data deve ser, no mínimo, 59 anos atrás"
            />
            {errors.data_nascimento && (
              <p className="text-odara-alerta text-sm mt-2 font-medium">
                {errors.data_nascimento.message}
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
              Sexo
            </label>
            <select
              {...register("sexo")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            >
              <option value="">Selecione o sexo...</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
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

          {/* Seção: Informações Adicionais */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Informações Adicionais
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Estado Civil
            </label>
            <select
              {...register("estado_civil")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            >
              <option value="">Selecione o estado civil...</option>
              <option value="Solteiro">Solteiro</option>
              <option value="Casado">Casado</option>
              <option value="Divorciado">Divorciado</option>
              <option value="Viúvo">Viúvo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Naturalidade
            </label>
            <input
              {...register("naturalidade")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Cidade de nascimento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Localização do Quarto
            </label>
            <input
              {...register("quarto")}
              placeholder="Ex: Quarto 12A, Ala B"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex text-sm font-medium text-odara-secondary mb-2 items-center gap-1">
              Nível de Dependência
              <span
                title="Indica o grau de autonomia do residente"
                className="text-odara-primary cursor-pointer relative group"
              >
                <Info size={16} />
                <span className="absolute left-6 top-1 z-10 hidden group-hover:block bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-xs text-odara-dark w-56">
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
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
            >
              <option value="">Selecione o nível...</option>
              <option value="Grau I">Grau de Dependência I</option>
              <option value="Grau II">Grau de Dependência II</option>
              <option value="Grau III">Grau de Dependência III</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Plano de Saúde
            </label>
            <input
              {...register("plano_saude")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Nome do plano de saúde"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Número da Carteirinha
            </label>
            <input
              {...register("numero_carteirinha")}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-secondary focus:border-transparent"
              placeholder="Número da carteirinha do plano"
            />
          </div>

          {/* Seção: Foto de Perfil */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-odara-primary mt-6">
              Foto de Perfil
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-odara-secondary mb-2">
              Foto do Residente
            </label>
            <div className="flex items-start space-x-4">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-odara-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setArquivoSelecionado(null);
                      setValue("foto", "");
                    }}
                    className="absolute -top-1 -right-1 bg-odara-alerta text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                  <div className="w-16 h-16 rounded-full bg-odara-primary/10 flex items-center justify-center">
                    <User size={24} className="text-odara-primary" />
                  </div>
              )}

              <div className="flex-1">
                <label className="flex flex-col items-center px-4 py-2 bg-odara-white text-odara-primary rounded-xl border border-odara-primary cursor-pointer hover:bg-odara-primary/10 transition-colors">
                  <Upload size={18} className="mb-1" />
                  <span className="text-sm font-medium">Selecionar imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={selecionarArquivo}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-odara-dark/60 mt-1">PNG, JPG até 5MB</p>
              </div>
            </div>
            <input type="hidden" {...register("foto")} />
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
              placeholder="Observações adicionais sobre o residente..."
            />
          </div>
        </div>

        {/* Botão de Submissão */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={carregando || enviandoImagem}
            className="flex items-center px-6 py-3 bg-odara-accent hover:bg-odara-secondary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {carregando || enviandoImagem ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {enviandoImagem
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