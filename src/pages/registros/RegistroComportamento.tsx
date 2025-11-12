import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaArrowLeft, FaTimes, FaCheck, FaAngleDown } from "react-icons/fa";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// ===== CONSTANTES =====
const CATEGORIAS = {
  POSITIVO: "positivo",
  NEGATIVO: "negativo",
  NEUTRO: "neutro",
};

const ROTULOS_CATEGORIAS = {
  [CATEGORIAS.POSITIVO]: "Positivo",
  [CATEGORIAS.NEGATIVO]: "Negativo",
  [CATEGORIAS.NEUTRO]: "Neutro",
};

const CORES_CATEGORIAS = {
  [CATEGORIAS.POSITIVO]: "bg-odara-primary/60 text-odara-dark border-l-4 border-odara-primary",
  [CATEGORIAS.NEGATIVO]: "bg-odara-dropdown-accent/80 text-odara-dark border-l-4 border-odara-dropdown-accent",
  [CATEGORIAS.NEUTRO]: "bg-odara-secondary/60 text-odara-dark border-l-4 border-odara-secondary",
};

const CORES_PONTOS = {
  [CATEGORIAS.POSITIVO]: "bg-odara-primary",
  [CATEGORIAS.NEGATIVO]: "bg-odara-dropdown-accent",
  [CATEGORIAS.NEUTRO]: "bg-odara-secondary",
};

const FILTROS = [
  { id: "todos", label: "Todos" },
  ...Object.values(CATEGORIAS).map((cat) => ({
    id: cat,
    label: ROTULOS_CATEGORIAS[cat],
  })),
];

const STATUS_OPCOES = [
  { id: "todos", label: "Todos" },
  { id: "pendente", label: "Pendentes" },
  { id: "concluido", label: "Concluídos" },
];

// ===== TIPOS =====
type Residente = {
  id: number;
  nome: string;
  foto?: string;
};

type Comportamento = {
  id: number;
  titulo: string;
  descricao?: string | null;
  data: Date;
  horario: string;
  residente: Residente;
  funcionario: Residente;
  categoria: string;
  concluido: boolean;
  status: string;
  criado_em?: string | null;
};

type FormValues = {
  id?: number;
  titulo: string;
  descricao?: string;
  data: string;
  horario: string;
  residente: number;
  funcionario: number;
  categoria: string;
  concluido?: boolean;
};

// ===== VALIDAÇÃO YUP =====
const schema = yup.object({
  titulo: yup.string().required("Título é obrigatório"),
  data: yup.string().required("Data é obrigatória"),
  horario: yup.string().required("Horário é obrigatório"),
  descricao: yup.string(),
  residente: yup.number().required("Residente é obrigatório"),
  funcionario: yup.number().required("Funcionário é obrigatório"),
  categoria: yup.string().required("Categoria é obrigatória"),
  concluido: yup.boolean(),
}).required();

// ===== COMPONENTE =====
const RegistroComportamento = () => {
  // ===== ESTADOS =====
  const [comportamentos, setComportamentos] = useState<Comportamento[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Residente[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de filtro
  const [filtroAtivo, setFiltroAtivo] = useState("todos");
  const [filtroResidente, setFiltroResidente] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Estados de dropdown
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [comportamentoSelecionado, setComportamentoSelecionado] = useState<Comportamento | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data: new Date().toISOString().split('T')[0],
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      residente: 0,
      funcionario: 0,
      categoria: CATEGORIAS.POSITIVO,
      concluido: false,
    },
  });

  // === BUSCA DE DADOS ===
  useEffect(() => {
    fetchComportamentos();
    fetchResidentes();
    fetchFuncionarios();
  }, []);

  const fetchComportamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comportamento")
        .select(`
          id,
          titulo,
          descricao,
          data,
          horario,
          categoria,
          concluido,
          criado_em,
          residente: residente!id_residente(id, nome, foto),
          funcionario: funcionario!id_funcionario(id, nome)
        `)
        .order("data", { ascending: false });

      if (error) {
        console.error("Erro ao buscar comportamentos:", error);
        setLoading(false);
        return;
      }

      if (data) {
        const formatted = (data as any[]).map((d) => {
          const getEntity = (raw: any): Residente => {
            if (Array.isArray(raw) && raw.length > 0) return {
              id: raw[0].id,
              nome: raw[0].nome,
              foto: raw[0].foto
            };
            if (typeof raw === "object" && raw !== null) return {
              id: raw.id ?? -1,
              nome: raw.nome ?? "N/A",
              foto: raw.foto
            };
            return { id: -1, nome: "N/A" };
          };

          return {
            id: d.id,
            titulo: d.titulo,
            descricao: d.descricao,
            data: new Date(d.data),
            horario: d.horario,
            categoria: d.categoria,
            concluido: d.concluido,
            status: d.concluido ? "concluido" : "pendente",
            criado_em: d.criado_em,
            residente: getEntity(d.residente),
            funcionario: getEntity(d.funcionario),
          } as Comportamento;
        });

        setComportamentos(formatted);
      }
    } catch (err) {
      console.error("Erro ao buscar comportamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResidentes = async () => {
    try {
      const { data, error } = await supabase
        .from("residente")
        .select("id, nome, foto")
        .order("nome");

      if (error) throw error;
      if (data) setResidentes(data as Residente[]);
    } catch (err) {
      console.error("Erro ao buscar residentes:", err);
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from("funcionario")
        .select("id, nome")
        .order("nome");

      if (error) throw error;
      if (data) setFuncionarios(data as Residente[]);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
    }
  };

  // ===== FUNÇÕES DO MODAL =====
  const abrirModalNovo = () => {
    reset({
      titulo: "",
      descricao: "",
      data: new Date().toISOString().split('T')[0],
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      residente: 0,
      funcionario: 0,
      categoria: CATEGORIAS.POSITIVO,
      concluido: false,
    });
    setEditando(false);
    setModalAberto(true);
  };

  const abrirModalEditar = (id: number) => {
    const comportamentoParaEditar = comportamentos.find(comportamento => comportamento.id === id);
    if (comportamentoParaEditar) {
      reset({
        id: comportamentoParaEditar.id,
        titulo: comportamentoParaEditar.titulo,
        descricao: comportamentoParaEditar.descricao || "",
        data: comportamentoParaEditar.data.toISOString().split('T')[0],
        horario: comportamentoParaEditar.horario,
        residente: comportamentoParaEditar.residente.id,
        funcionario: comportamentoParaEditar.funcionario.id,
        categoria: comportamentoParaEditar.categoria,
        concluido: comportamentoParaEditar.concluido,
      });
      setEditando(true);
      setModalAberto(true);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(false);
  };

  const onSubmit = async (formData: FormValues) => {
    setLoading(true);
    try {
      const payload: any = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data: formData.data,
        horario: formData.horario,
        categoria: formData.categoria,
        concluido: formData.concluido || false,
        id_residente: Number(formData.residente),
        id_funcionario: Number(formData.funcionario),
      };

      if (editando && formData.id) {
        const { error } = await supabase
          .from("comportamento")
          .update(payload)
          .eq("id", formData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comportamento")
          .insert([payload]);

        if (error) throw error;
      }

      await fetchComportamentos();
      setModalAberto(false);
    } catch (err) {
      console.error("Erro ao salvar comportamento:", err);
      alert("Erro ao salvar comportamento. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNÇÕES CRUD =====
  const excluirComportamento = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de comportamento?')) return;

    try {
      const { error } = await supabase
        .from("comportamento")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setComportamentos(anterior => anterior.filter(comportamento => comportamento.id !== id));
      if (comportamentoSelecionado?.id === id) {
        setComportamentoSelecionado(null);
      }
    } catch (err) {
      console.error("Erro ao excluir comportamento:", err);
      alert("Erro ao excluir comportamento. Verifique o console.");
    }
  };

  const alternarConclusao = async (id: number) => {
    try {
      const comportamento = comportamentos.find(c => c.id === id);
      if (!comportamento) return;

      const novoStatus = !comportamento.concluido;

      // Atualização otimista
      setComportamentos(anterior => anterior.map(c =>
        c.id === id
          ? { ...c, concluido: novoStatus, status: novoStatus ? "concluido" : "pendente" }
          : c
      ));

      const { error } = await supabase
        .from("comportamento")
        .update({ concluido: novoStatus })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      // Revert em caso de erro
      fetchComportamentos();
    }
  };

  const selecionarComportamento = (comportamento: Comportamento) => {
    setComportamentoSelecionado(comportamento);
  };

  // ===== CÁLCULOS E FILTROS =====
  const residentesUnicos = [...new Set(comportamentos.map(c => c.residente.nome))].filter(Boolean);

  const comportamentosFiltrados = comportamentos.filter(comportamento => {
    // Filtro por categoria
    const passaCategoria = filtroAtivo === "todos" || comportamento.categoria === filtroAtivo;

    // Filtro por residente
    const passaResidente = filtroResidente === "todos" || comportamento.residente.nome === filtroResidente;

    // Filtro por status
    const passaStatus = filtroStatus === "todos" ||
      (filtroStatus === "concluido" && comportamento.concluido) ||
      (filtroStatus === "pendente" && !comportamento.concluido);

    return passaCategoria && passaResidente && passaStatus;
  });

  const limparFiltros = () => {
    setFiltroAtivo("todos");
    setFiltroResidente("todos");
    setFiltroStatus("todos");
  };

  const temFiltrosAtivos = filtroAtivo !== "todos" || filtroResidente !== "todos" || filtroStatus !== "todos";

  // Contadores para o header
  const contadorPendentes = comportamentos.filter(c => !c.concluido).length;
  const contadorConcluidos = comportamentos.filter(c => c.concluido).length;

  // ===== RENDER =====
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-10">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="flex items-center mb-1">
              <Link
                to="/gestao/PaginaRegistros"
                className="text-odara-accent hover:text-odara-secondary transition-colors duration-200 flex items-center"
              >
                <FaArrowLeft className="mr-1" />
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Comportamento</h1>
            <div className="relative">
              <button
                onMouseEnter={() => setInfoVisivel(true)}
                onMouseLeave={() => setInfoVisivel(false)}
                className="text-odara-dark hover:text-odara-secondary transition-colors duration-200"
              >
                <FaInfoCircle size={20} className='text-odara-accent hover:text-odara-secondary' />
              </button>
              {infoVisivel && (
                <div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
                  <h3 className="font-bold mb-2">Registro de Comportamento</h3>
                  <p>
                    O registro de comportamento serve para documentar e acompanhar
                    os comportamentos dos residentes, identificando padrões positivos,
                    negativos e neutros para melhor atendimento e cuidado.
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>

          {/* Contador de Status */}
          <div className="text-sm text-odara-dark">
            <strong>{contadorPendentes}</strong> pendentes / <strong>{contadorConcluidos}</strong> concluídos
          </div>
        </div>

        {/* Botão Novo Registro */}
        <div className="relative flex items-center gap-4 mb-6">
          <button
            onClick={abrirModalNovo}
            className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-200 text-sm sm:text-base"
          >
            <FaPlus className="mr-2 text-odara-white" /> Novo Registro
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="relative flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
          {/* Filtro por Categoria */}
          <div className="relative dropdown-container">
            <button
              className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroAberto
                  ? 'border-odara-primary text-gray-700'
                  : 'border-odara-primary/40 text-gray-700'} 
                `}
              onClick={() => {
                setFiltroAberto(!filtroAberto);
                setFiltroResidenteAberto(false);
                setFiltroStatusAberto(false);
              }}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Categoria
            </button>
            {filtroAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                {FILTROS.map((filtro) => (
                  <button
                    key={filtro.id}
                    onClick={() => {
                      setFiltroAtivo(filtro.id);
                      setFiltroAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroAtivo === filtro.id
                      ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                      : 'text-odara-dark'
                      }`}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro por Residente */}
          <div className="relative dropdown-container">
            <button
              className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroResidenteAberto
                  ? 'border-odara-primary text-gray-700'
                  : 'border-odara-primary/40 text-gray-700'} 
                `}
              onClick={() => {
                setFiltroResidenteAberto(!filtroResidenteAberto);
                setFiltroAberto(false);
                setFiltroStatusAberto(false);
              }}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Residentes
            </button>
            {filtroResidenteAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setFiltroResidente("todos");
                    setFiltroResidenteAberto(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroResidente === "todos"
                    ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                    : 'text-odara-dark'
                    }`}
                >
                  Todos
                </button>
                {residentesUnicos.map(residente => (
                  <button
                    key={residente}
                    onClick={() => {
                      setFiltroResidente(residente);
                      setFiltroResidenteAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroResidente === residente
                      ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                      : 'text-odara-dark'
                      }`}
                  >
                    {residente}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro por Status */}
          <div className="relative dropdown-container">
            <button
              className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 
                ${filtroStatusAberto
                  ? 'border-odara-primary text-gray-700'
                  : 'border-odara-primary/40 text-gray-700'} 
                font-medium hover:border-2 hover:border-odara-primary transition text-sm`}
              onClick={() => {
                setFiltroStatusAberto(!filtroStatusAberto);
                setFiltroResidenteAberto(false);
                setFiltroAberto(false);
              }}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Status
            </button>
            {filtroStatusAberto && (
              <div className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                {STATUS_OPCOES.map((filtro) => (
                  <button
                    key={filtro.id}
                    onClick={() => {
                      setFiltroStatus(filtro.id);
                      setFiltroStatusAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroStatus === filtro.id
                      ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                      : 'text-odara-dark'
                      }`}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão Limpar Filtros */}
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="flex items-center bg-odara-accent text-odara-white rounded-full px-4 py-2 shadow-sm font-medium hover:bg-odara-secondary transition"
            >
              <FaTimes className="mr-1" /> Limpar Filtros
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odara-accent"></div>
          </div>
        )}

        {/* Grid Principal */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COLUNA ESQUERDA - LISTA DE COMPORTAMENTOS */}
            <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
                Lista de Comportamentos
                <span className="text-sm font-normal text-odara-name/60 ml-2">
                  ({comportamentosFiltrados.length} registros)
                </span>
              </h2>

              {/* Filtros ativos */}
              {temFiltrosAtivos && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filtroAtivo !== "todos" && (
                    <span className="text-sm bg-odara-primary text-odara-white px-2 py-1 rounded-full">
                      Categoria: {ROTULOS_CATEGORIAS[filtroAtivo]}
                    </span>
                  )}
                  {filtroResidente !== "todos" && (
                    <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
                      Residente: {filtroResidente}
                    </span>
                  )}
                  {filtroStatus !== "todos" && (
                    <span className="text-sm bg-odara-dropdown-accent text-odara-white px-2 py-1 rounded-full">
                      Status: {filtroStatus === 'concluido' ? 'Concluídos' : 'Pendentes'}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {comportamentosFiltrados.length === 0 ? (
                  <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                    <p className="text-odara-dark/60">
                      Nenhum comportamento encontrado com os filtros atuais
                    </p>
                  </div>
                ) : (
                  comportamentosFiltrados.map((comportamento) => (
                    <div
                      key={comportamento.id}
                      className={`p-4 rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer ${CORES_CATEGORIAS[comportamento.categoria]
                        } ${comportamentoSelecionado?.id === comportamento.id ? "ring-2 ring-odara-primary" : ""
                        }`}
                      onClick={() => selecionarComportamento(comportamento)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${CORES_PONTOS[comportamento.categoria]}`}></span>
                          <p className="text-base font-semibold">
                            {comportamento.data.getDate().toString().padStart(2, '0')}/
                            {(comportamento.data.getMonth() + 1).toString().padStart(2, '0')}/
                            {comportamento.data.getFullYear()}
                            {comportamento.horario && ` - ${comportamento.horario}`}
                          </p>
                        </div>

                        {/* Checkbox de Conclusão */}
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comportamento.concluido}
                              onChange={(e) => {
                                e.stopPropagation();
                                alternarConclusao(comportamento.id);
                              }}
                              className="rounded border-odara-primary text-odara-accent focus:ring-odara-accent"
                            />
                            <span className={comportamento.concluido ? 'text-green-600 font-semibold' : 'text-odara-dark'}>
                              {comportamento.concluido ? 'Concluído' : 'Pendente'}
                            </span>
                          </label>
                        </div>
                      </div>

                      <h6 className="text-xl font-bold mb-1 flex items-center">
                        {comportamento.concluido && (
                          <span className="text-green-500 mr-2">
                            <FaCheck className="h-4 w-4" />
                          </span>
                        )}
                        {comportamento.titulo}
                      </h6>

                      <p className="text-base mb-2">{comportamento.descricao}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">
                            {ROTULOS_CATEGORIAS[comportamento.categoria]}
                          </span>

                          {comportamento.residente && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-odara-name">{comportamento.residente.nome}</span>
                            </>
                          )}

                          {comportamento.funcionario && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-odara-name">Registrado por: {comportamento.funcionario.nome}</span>
                            </>
                          )}
                        </div>

                        {/* Botões de editar e excluir */}
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalEditar(comportamento.id);
                            }}
                            className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
                            title="Editar comportamento"
                          >
                            <FaEdit size={14} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              excluirComportamento(comportamento.id);
                            }}
                            className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
                            title="Excluir comportamento"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUNA DIREITA - DETALHES DO COMPORTAMENTO */}
            <div className="bg-odara-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
              <div className="flex flex-col items-center justify-center text-center">
                {comportamentoSelecionado ? (
                  <>
                    <h2 className="text-2xl font-bold text-odara-dark mb-4">Detalhes do Comportamento</h2>

                    {/* Foto do Residente */}
                    <div className="w-32 h-32 bg-odara-offwhite rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-odara-primary">
                      {comportamentoSelecionado.residente.foto ? (
                        <img
                          src={comportamentoSelecionado.residente.foto}
                          alt={comportamentoSelecionado.residente.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback para avatar padrão
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-4xl text-odara-primary font-bold">
                          {comportamentoSelecionado.residente.nome.charAt(0)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-odara-dark mb-2">
                      {comportamentoSelecionado.residente.nome}
                    </h3>

                    {/* Informações do comportamento atual */}
                    <div className="w-full bg-odara-offwhite rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-odara-dark mb-2">Comportamento Registrado</h4>
                      <p className="text-odara-name font-medium mb-1">{comportamentoSelecionado.titulo}</p>
                      <p className="text-sm text-odara-name/70">{comportamentoSelecionado.descricao}</p>
                      <div className="flex justify-center mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${CORES_CATEGORIAS[comportamentoSelecionado.categoria]}`}>
                          {ROTULOS_CATEGORIAS[comportamentoSelecionado.categoria]}
                        </span>
                      </div>
                    </div>

                    {/* Informações adicionais */}
                    <div className="w-full mt-4 space-y-2 text-sm text-left">
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Data:</span>
                        <span className="font-medium">
                          {comportamentoSelecionado.data.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Horário:</span>
                        <span className="font-medium">{comportamentoSelecionado.horario}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Status:</span>
                        <span className={`font-medium ${comportamentoSelecionado.concluido ? 'text-green-600' : 'text-odara-accent'}`}>
                          {comportamentoSelecionado.concluido ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Registrado por:</span>
                        <span className="font-medium">{comportamentoSelecionado.funcionario.nome}</span>
                      </div>
                    </div>

                    {/* Histórico de comportamentos do residente */}
                    <div className="w-full mt-6">
                      <h4 className="font-semibold text-odara-dark mb-3 text-left">Histórico Recente</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {comportamentos
                          .filter(c => c.residente.id === comportamentoSelecionado.residente.id && c.id !== comportamentoSelecionado.id)
                          .slice(0, 3)
                          .map(comportamento => (
                            <div
                              key={comportamento.id}
                              className="bg-white border border-odara-primary/20 rounded-lg p-3 text-left hover:bg-odara-offwhite cursor-pointer"
                              onClick={() => setComportamentoSelecionado(comportamento)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-odara-dark">{comportamento.titulo}</p>
                                  <p className="text-xs text-odara-name/60">
                                    {comportamento.data.toLocaleDateString('pt-BR')} - {comportamento.horario}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${CORES_CATEGORIAS[comportamento.categoria]}`}>
                                  {ROTULOS_CATEGORIAS[comportamento.categoria].charAt(0)}
                                </span>
                              </div>
                            </div>
                          ))
                        }
                        {comportamentos.filter(c => c.residente.id === comportamentoSelecionado.residente.id && c.id !== comportamentoSelecionado.id).length === 0 && (
                          <p className="text-odara-name/60 text-sm text-center py-2">Nenhum outro registro</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-odara-offwhite rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaInfoCircle className="text-odara-primary text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-odara-dark mb-2">Nenhum comportamento selecionado</h3>
                    <p className="text-odara-name/60 text-sm">
                      Clique em um registro da lista para visualizar os detalhes
                    </p>
                  </div>
                )}
              </div>

              {/* Legenda das Categorias */}
              <div className="mt-6 pt-6 border-t border-odara-primary/20">
                <h6 className="font-semibold text-odara-dark mb-3 text-center">Legenda das Categorias</h6>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(ROTULOS_CATEGORIAS).map(([categoria, rotulo]) => (
                    <div key={categoria} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${CORES_PONTOS[categoria]}`}></div>
                      <span className="text-odara-name">{rotulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Modal para adicionar/editar comportamento */}
        {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
        {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white text-odara-dark border-4 border-odara-primary rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
              {/* Botão de Fechar */}
              <button
                onClick={fecharModal}
                className="absolute top-3 right-3 text-odara-dark hover:text-odara-accent transition-colors"
              >
                <FaTimes size={22} />
              </button>

              {/* Título */}
              <h2 className="text-2xl font-bold mb-6 text-center border-b border-odara-primary/30 pb-2">
                {editando ? "Editar Registro de Comportamento" : "Novo Registro de Comportamento"}
              </h2>

              {/* Formulário */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">


                {/* Campo Título */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-odara-dark">
                    Título
                  </label>
                  <input
                    {...register("titulo")}
                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                    placeholder="Ex: Comportamento cooperativo"
                  />
                  {errors.titulo && (
                    <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>
                  )}
                </div>

                {/* Campo Descrição */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-odara-dark">
                    Descrição
                  </label>
                  <textarea
                    {...register("descricao")}
                    rows={3}
                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                    placeholder="Descreva o comportamento observado..."
                  />
                </div>

                {/* Linha Data + Horário */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-odara-dark">
                      Data
                    </label>
                    <input
                      type="date"
                      {...register("data")}
                      className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-odara-dark">
                      Horário
                    </label>
                    <input
                      type="time"
                      {...register("horario")}
                      className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                    />
                  </div>
                </div>

                 {/* Campo Residente */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-odara-dark">
                    Residente
                  </label>
                  <select
                    {...register("residente")}
                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                  >
                    <option value="">Selecione o residente...</option>
                    {residentes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}
                      </option>
                    ))}
                  </select>
                  {errors.residente && (
                    <p className="text-red-500 text-xs mt-1">{errors.residente.message}</p>
                  )}
                </div>

                {/* Campo Funcionário */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-odara-dark">
                    Funcionário
                  </label>
                  <select
                    {...register("funcionario")}
                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                  >
                    <option value="">Selecione o funcionário responsável...</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                  {errors.funcionario && (
                    <p className="text-red-500 text-xs mt-1">{errors.funcionario.message}</p>
                  )}
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-odara-dark">
                    Categoria
                  </label>
                  <select
                    {...register("categoria")}
                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                  >
                    <option value="">Selecione...</option>
                    <option value="positivo">Positivo</option>
                    <option value="negativo">Negativo</option>
                    <option value="neutro">Neutro</option>
                  </select>
                  {errors.categoria && (
                    <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>
                  )}
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t border-odara-primary/30">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="px-4 py-2 rounded-lg  border border-odara-primary bg-odara-white hover:bg-odara-primary text-odara-primary hover:text-odara-white font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-odara-accent hover:bg-odara-secondary text-white text-sm font-medium transition"
                  >
                    {editando ? "Salvar Alterações" : "Registrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



      </div>
    </div>
  );
};

export default RegistroComportamento;