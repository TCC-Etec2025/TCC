import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaTimes,
  FaInfoCircle,
  FaFilter,
  FaCheck,
  FaAngleDown,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// ===== CONSTANTES =====

// Categorias de comportamento
const CATEGORIAS = {
  POSITIVO: 'positivo',
  NEGATIVO: 'negativo',
  NEUTRO: 'neutro'
};

const ROTULOS_CATEGORIAS = {
  [CATEGORIAS.POSITIVO]: "Positivo",
  [CATEGORIAS.NEGATIVO]: "Negativo",
  [CATEGORIAS.NEUTRO]: "Neutro"
};

const CORES_CATEGORIAS = {
  [CATEGORIAS.POSITIVO]: {
    bg: 'bg-odara-primary/60',
    text: 'text-odara-dark',
    border: 'border-odara-primary',
    badge: 'bg-odara-primary'
  },
  [CATEGORIAS.NEGATIVO]: {
    bg: 'bg-odara-dropdown-accent/80',
    text: 'text-odara-dark',
    border: 'border-odara-dropdown-accent',
    badge: 'bg-odara-dropdown-accent'
  },
  [CATEGORIAS.NEUTRO]: {
    bg: 'bg-odara-secondary/60',
    text: 'text-odara-dark',
    border: 'border-odara-secondary',
    badge: 'bg-odara-secondary'
  }
};

// ===== TIPOS =====
type ResidenteFuncionario = { id: number; nome: string };

type RegistroComportamento = {
  id: number;
  data: Date;
  horario: string;
  titulo: string;
  descricao: string;
  categoria: string;
  residente: ResidenteFuncionario;
  funcionario: ResidenteFuncionario;
  concluido: boolean;
  criado_em?: string | null;
};

type FormValues = {
  id?: number;
  data: string;
  horario: string;
  titulo: string;
  descricao: string;
  categoria: string;
  residente: number;
  funcionario: number;
  concluido?: boolean;
};

// ===== VALIDAÇÃO YUP =====
const schema = yup.object({
  data: yup.string().required("Data é obrigatória"),
  horario: yup.string().required("Horário é obrigatório"),
  titulo: yup.string().required("Título é obrigatório"),
  descricao: yup.string().required("Descrição é obrigatória"),
  categoria: yup.string().required("Categoria é obrigatória"),
  residente: yup.number().required("Residente é obrigatório"),
  funcionario: yup.number().required("Funcionário é obrigatório"),
  concluido: yup.boolean(),
}).required();

// ===== COMPONENTE =====
const RegistroComportamento: React.FC = () => {
  // ===== ESTADOS =====
  const [registros, setRegistros] = useState<RegistroComportamento[]>([]);
  const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
  const [funcionarios, setFuncionarios] = useState<ResidenteFuncionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [residenteSelecionado, setResidenteSelecionado] = useState<RegistroComportamento | null>(null);

  // Estados para filtros
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      horario: "",
      titulo: "",
      descricao: "",
      categoria: CATEGORIAS.POSITIVO,
      residente: 0,
      funcionario: 0,
      concluido: false,
    },
  });

  // === BUSCA ===
  useEffect(() => {
    fetchRegistros();
    fetchResidentes();
    fetchFuncionarios();
  }, []);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registro_comportamento")
        .select(`
          id,
          data,
          horario,
          titulo,
          descricao,
          categoria,
          concluido,
          criado_em,
          residente: residente!id_residente(id, nome),
          funcionario: funcionario!id_funcionario(id, nome)
        `)
        .order("data", { ascending: false })
        .order("horario", { ascending: false });

      if (error) {
        console.error("Erro ao buscar registros:", error);
        setLoading(false);
        return;
      }

      if (data) {
        const formatted = (data as any[]).map((d) => {
          const getEntity = (raw: any): ResidenteFuncionario => {
            if (Array.isArray(raw) && raw.length > 0) return { id: raw[0].id, nome: raw[0].nome };
            if (typeof raw === "object" && raw !== null) return { id: raw.id ?? -1, nome: raw.nome ?? "N/A" };
            return { id: -1, nome: "N/A" };
          };

          return {
            id: d.id,
            data: new Date(d.data),
            horario: d.horario,
            titulo: d.titulo,
            descricao: d.descricao,
            categoria: d.categoria,
            concluido: d.concluido,
            criado_em: d.criado_em,
            residente: getEntity(d.residente),
            funcionario: getEntity(d.funcionario),
          } as RegistroComportamento;
        });

        setRegistros(formatted);
      }
    } catch (err) {
      console.error("Erro ao buscar registros:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResidentes = async () => {
    try {
      const { data, error } = await supabase.from("residente").select("id, nome").order("nome");
      if (error) throw error;
      if (data) setResidentes(data as ResidenteFuncionario[]);
    } catch (err) {
      console.error("Erro ao buscar residentes:", err);
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase.from("funcionario").select("id, nome").order("nome");
      if (error) throw error;
      if (data) setFuncionarios(data as ResidenteFuncionario[]);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
    }
  };

  // ===== FUNÇÕES DO MODAL =====
  const abrirModalAdicionar = () => {
    reset({
      data: new Date().toISOString().split('T')[0],
      horario: "",
      titulo: "",
      descricao: "",
      categoria: CATEGORIAS.POSITIVO,
      residente: 0,
      funcionario: 0,
      concluido: false,
    });
    setEditando(false);
    setModalAberto(true);
  };

  const abrirModalEditar = (id: number) => {
    const registroParaEditar = registros.find(registro => registro.id === id);
    if (registroParaEditar) {
      reset({
        id: registroParaEditar.id,
        data: registroParaEditar.data.toISOString().split('T')[0],
        horario: registroParaEditar.horario,
        titulo: registroParaEditar.titulo,
        descricao: registroParaEditar.descricao,
        categoria: registroParaEditar.categoria,
        residente: registroParaEditar.residente.id,
        funcionario: registroParaEditar.funcionario.id,
        concluido: registroParaEditar.concluido,
      });
      setEditando(true);
      setModalAberto(true);
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setLoading(true);
    try {
      // Combina data e horário
      const combined = new Date(`${formData.data}T${formData.horario}:00`);
      
      const payload: any = {
        data: combined.toISOString(),
        horario: formData.horario,
        titulo: formData.titulo,
        descricao: formData.descricao,
        categoria: formData.categoria,
        concluido: formData.concluido || false,
        id_residente: Number(formData.residente),
        id_funcionario: Number(formData.funcionario),
      };

      if (editando && formData.id) {
        const { error } = await supabase
          .from("registro_comportamento")
          .update(payload)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("registro_comportamento")
          .insert([payload]);
        if (error) throw error;
      }

      await fetchRegistros();
      setModalAberto(false);
    } catch (err) {
      console.error("Erro ao salvar registro:", err);
      alert("Erro ao salvar registro. Veja o console.");
    } finally {
      setLoading(false);
    }
  };

  // deletar
  const excluirRegistro = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      const { error } = await supabase
        .from("registro_comportamento")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setRegistros(anterior => anterior.filter(registro => registro.id !== id));
      if (residenteSelecionado?.id === id) setResidenteSelecionado(null);
    } catch (err) {
      console.error("Erro ao excluir registro:", err);
      alert("Erro ao excluir registro. Verifique o console.");
    }
  };

  // alternar conclusão
  const alternarConclusao = async (id: number) => {
    try {
      const registro = registros.find(r => r.id === id);
      if (!registro) return;

      const novoConcluido = !registro.concluido;
      
      // Atualização otimista
      setRegistros(anterior => anterior.map(r => 
        r.id === id ? { ...r, concluido: novoConcluido } : r
      ));

      const { error } = await supabase
        .from("registro_comportamento")
        .update({ concluido: novoConcluido })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao alternar conclusão:", err);
      // Revert em caso de erro
      fetchRegistros();
    }
  };

  // ===== FUNÇÕES AUXILIARES =====
  // Calcular residentes únicos a partir dos registros
  const residentesUnicos = [...new Set(registros.map(registro => registro.residente.nome))].filter(Boolean);

  // Sistema de fotos por residente
  const FOTOS_RESIDENTES = {
    "João Santos": "../images/foto-idoso-joao.jpg",
    "Maria Oliveira": "../images/foto-idosa-maria.jpg",
    "Carlos Silva": "../images/foto-idoso-carlos.jpg",
    "Ana Costa": "../images/foto-idosa-ana.jpg",
    "Pedro Almeida": "../images/foto-idoso-pedro.jpg",
  };

  // ===== FILTROS =====
  const registrosFiltrados = registros
    .filter((r) => {
      // Filtro por residente
      const passaFiltroResidente = !residenteSelecionado || r.residente.nome === residenteSelecionado.residente.nome;

      // Filtro por categoria
      const passaFiltroCategoria = filtroCategoria === "todos" || r.categoria === filtroCategoria;

      // Filtro por status (concluído/pendente)
      const passaFiltroStatus = mostrarConcluidos ? r.concluido : !r.concluido;

      return passaFiltroResidente && passaFiltroCategoria && passaFiltroStatus;
    })
    .sort((a, b) => a.data.getTime() - b.data.getTime() || a.horario.localeCompare(b.horario));

  // === RENDER ===
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
        </div>

        {/* Botão Novo Registro */}
        <div className="relative flex items-center gap-4 mb-6">
          <button
            onClick={abrirModalAdicionar}
            className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-200 text-sm sm:text-base"
          >
            <FaPlus className="mr-2 text-odara-white" /> Novo Registro
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="relative flex flex-wrap items-center gap-2 sm:gap-4 mb-6">

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
                setFiltroCategoriaAberto(false);
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
                    setResidenteSelecionado(null);
                    setFiltroResidenteAberto(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${!residenteSelecionado
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
                      // Encontrar o primeiro registro desse residente para selecionar
                      const registroResidente = registros.find(r => r.residente.nome === residente);
                      if (registroResidente) {
                        setResidenteSelecionado(registroResidente);
                      }
                      setFiltroResidenteAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${residenteSelecionado?.residente.nome === residente
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

          {/* Filtro por Categoria */}
          <div className="relative dropdown-container">
            <button
              className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroCategoriaAberto
                  ? 'border-odara-primary text-gray-700'
                  : 'border-odara-primary/40 text-gray-700'} 
                `}
              onClick={() => {
                setFiltroCategoriaAberto(!filtroCategoriaAberto);
                setFiltroResidenteAberto(false);
                setFiltroStatusAberto(false);
              }}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Categoria
            </button>
            {filtroCategoriaAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                <button
                  onClick={() => {
                    setFiltroCategoria("todos");
                    setFiltroCategoriaAberto(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroCategoria === "todos"
                    ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                    : 'text-odara-dark'
                    }`}
                >
                  Todos
                </button>
                {Object.entries(ROTULOS_CATEGORIAS).map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    onClick={() => {
                      setFiltroCategoria(valor);
                      setFiltroCategoriaAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroCategoria === valor
                        ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                        : 'text-odara-dark'
                      }`}
                  >
                    {rotulo}
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
                setFiltroCategoriaAberto(false);
              }}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Status
            </button>
            {filtroStatusAberto && (
              <div className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                <button
                  onClick={() => {
                    setMostrarConcluidos(false);
                    setFiltroStatusAberto(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${!mostrarConcluidos
                    ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                    : 'text-odara-dark'
                    }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => {
                    setMostrarConcluidos(true);
                    setFiltroStatusAberto(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${mostrarConcluidos
                    ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                    : 'text-odara-dark'
                    }`}
                >
                  Concluídos
                </button>
              </div>
            )}
          </div>

          {/* Botão Limpar Filtros */}
          {(filtroCategoria !== "todos" || residenteSelecionado || mostrarConcluidos) && (
            <button
              onClick={() => {
                setFiltroCategoria('todos');
                setResidenteSelecionado(null);
                setMostrarConcluidos(false);
              }}
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
                {mostrarConcluidos ? 'Comportamentos Concluídos' : 'Comportamentos Pendentes'}
              </h2>

              {/* Filtros ativos */}
              <div className="flex flex-wrap gap-2 mb-4">
                {filtroCategoria !== 'todos' && (
                  <span className="text-sm bg-odara-primary text-odara-white px-2 py-1 rounded-full">
                    Categoria: {ROTULOS_CATEGORIAS[filtroCategoria]}
                  </span>
                )}
                {residenteSelecionado && (
                  <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
                    Residente: {residenteSelecionado.residente.nome}
                  </span>
                )}
                {mostrarConcluidos && (
                  <span className="text-sm bg-odara-dropdown-accent text-odara-white px-2 py-1 rounded-full">
                    Status: Concluído
                  </span>
                )}
              </div>

              <p className="text-odara-name/60 mb-6">
                {mostrarConcluidos
                  ? 'Registros de comportamento que foram concluídos e arquivados'
                  : 'Registros de comportamento que precisam de atenção e acompanhamento'
                }
              </p>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {registrosFiltrados.length === 0 ? (
                  <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                    <p className="text-odara-dark/60">
                      {mostrarConcluidos
                        ? 'Nenhum comportamento concluído encontrado'
                        : 'Nenhum comportamento pendente encontrado'
                      }
                    </p>
                  </div>
                ) : (
                  registrosFiltrados.map((comportamento) => {
                    const classesCategoria = CORES_CATEGORIAS[comportamento.categoria];

                    return (
                      <div
                        key={comportamento.id}
                        className={`p-4 rounded-xl hover:shadow-md transition-shadow duration-200 ${classesCategoria.bg} cursor-pointer`}
                        onClick={() => setResidenteSelecionado(comportamento)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${classesCategoria.badge}`}></span>
                            <p className="text-base font-semibold">
                              {comportamento.data.getDate().toString().padStart(2, '0')}/
                              {(comportamento.data.getMonth() + 1).toString().padStart(2, '0')}/
                              {comportamento.data.getFullYear()}
                              {comportamento.horario && ` - ${comportamento.horario}`}
                            </p>
                          </div>

                          {/* Checkbox de Conclusão */}
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={comportamento.concluido}
                                onChange={() => alternarConclusao(comportamento.id)}
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
                              <FaCheck size={16} />
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

                            {comportamento.residente.nome && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="text-odara-name">{comportamento.residente.nome}</span>
                              </>
                            )}
                          </div>

                          {/* Botões de editar e excluir */}
                          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => abrirModalEditar(comportamento.id)}
                              className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
                              title="Editar comportamento"
                            >
                              <FaEdit size={14} />
                            </button>

                            <button
                              onClick={() => excluirRegistro(comportamento.id)}
                              className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
                              title="Excluir comportamento"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUNA DIREITA - DETALHES DO RESIDENTE */}
            <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
              <div className="flex flex-col items-center justify-center text-center">
                {residenteSelecionado ? (
                  <>
                    <h2 className="text-2xl font-bold text-odara-dark mb-4">Detalhes do Residente</h2>

                    {/* Sistema de fotos por residente */}
                    {(() => {
                      const fotoResidente = FOTOS_RESIDENTES[residenteSelecionado.residente.nome] || "../images/avatar-default.jpg";

                      return (
                        <img
                          src={fotoResidente}
                          alt={residenteSelecionado.residente.nome}
                          className="w-32 h-32 rounded-full object-cover mb-4 shadow-md border-4 border-odara-primary"
                          onError={(e) => {
                            // Fallback caso a imagem não carregue
                            e.currentTarget.src = "../images/avatar-default.jpg";
                          }}
                        />
                      );
                    })()}

                    <h3 className="text-xl font-bold text-odara-dark mb-2">{residenteSelecionado.residente.nome}</h3>

                    {/* Informações do comportamento atual */}
                    <div className="w-full bg-odara-offwhite rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-odara-dark mb-2">Comportamento Registrado</h4>
                      <p className="text-odara-name font-medium mb-1">{residenteSelecionado.titulo}</p>
                      <p className="text-sm text-odara-name/70">{residenteSelecionado.descricao}</p>
                      <div className="flex justify-center mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${CORES_CATEGORIAS[residenteSelecionado.categoria].bg} ${CORES_CATEGORIAS[residenteSelecionado.categoria].text}`}>
                          {ROTULOS_CATEGORIAS[residenteSelecionado.categoria]}
                        </span>
                      </div>
                    </div>

                    {/* Histórico de comportamentos do residente */}
                    <div className="w-full mt-6">
                      <h4 className="font-semibold text-odara-dark mb-3 text-left">Histórico Recente</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {registros
                          .filter(c => c.residente.nome === residenteSelecionado.residente.nome && c.id !== residenteSelecionado.id)
                          .slice(0, 3) // Mostra apenas os 3 mais recentes
                          .map(comportamento => (
                            <div
                              key={comportamento.id}
                              className="bg-white border border-odara-primary/20 rounded-lg p-3 text-left hover:bg-odara-offwhite cursor-pointer"
                              onClick={() => setResidenteSelecionado(comportamento)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-odara-dark">{comportamento.titulo}</p>
                                  <p className="text-xs text-odara-name/60">
                                    {comportamento.data.getDate().toString().padStart(2, '0')}/
                                    {(comportamento.data.getMonth() + 1).toString().padStart(2, '0')}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${CORES_CATEGORIAS[comportamento.categoria].bg} ${CORES_CATEGORIAS[comportamento.categoria].text}`}>
                                  {ROTULOS_CATEGORIAS[comportamento.categoria].charAt(0)}
                                </span>
                              </div>
                            </div>
                          ))
                        }
                        {registros.filter(c => c.residente.nome === residenteSelecionado.residente.nome && c.id !== residenteSelecionado.id).length === 0 && (
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
                    <h3 className="text-lg font-semibold text-odara-dark mb-2">Nenhum residente selecionado</h3>
                    <p className="text-odara-name/60 text-sm">
                      Clique em um registro da lista para visualizar os detalhes do residente
                    </p>
                  </div>
                )}
              </div>

              {/* Legenda das Categorias */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h6 className="font-semibold text-odara-dark mb-3 text-center">Legenda das Categorias</h6>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(ROTULOS_CATEGORIAS).map(([categoria, rotulo]) => (
                    <div key={categoria} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${CORES_CATEGORIAS[categoria].badge}`}></div>
                      <span className="text-odara-name">{rotulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para adicionar/editar registro */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white text-odara-dark border-4 border-odara-primary rounded-lg py-2 p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">{editando ? "Editar Comportamento" : "Novo Comportamento"}</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    className={`border-odara-primary border rounded-lg px-3 py-2 flex-1 ${errors.data ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("data")} 
                  />
                  <input 
                    type="time" 
                    className={`border-odara-primary border rounded-lg px-3 py-2 flex-1 ${errors.horario ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("horario")} 
                  />
                </div>
                {(errors.data || errors.horario) && (
                  <p className="text-red-500 text-sm">{errors.data?.message || errors.horario?.message}</p>
                )}

                <input 
                  type="text" 
                  placeholder="Título do comportamento" 
                  className={`w-full border-odara-primary border rounded-lg px-3 py-2 ${errors.titulo ? 'border-red-500' : 'border-odara-primary'}`} 
                  {...register("titulo")} 
                />
                {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo.message}</p>}

                <textarea 
                  placeholder="Descrição detalhada do comportamento" 
                  rows={3}
                  className={`w-full border-odara-primary border rounded-lg px-3 py-2 ${errors.descricao ? 'border-red-500' : 'border-odara-primary'}`} 
                  {...register("descricao")} 
                />
                {errors.descricao && <p className="text-red-500 text-sm">{errors.descricao.message}</p>}

                <select 
                  className={`w-full border-odara-primary text-odara-dark border rounded-lg px-3 py-2 ${errors.categoria ? 'border-red-500' : 'border-odara-primary'}`} 
                  {...register("categoria")}
                >
                  <option value="">Selecionar Categoria</option>
                  <option value={CATEGORIAS.POSITIVO}>Positivo</option>
                  <option value={CATEGORIAS.NEGATIVO}>Negativo</option>
                  <option value={CATEGORIAS.NEUTRO}>Neutro</option>
                </select>
                {errors.categoria && <p className="text-red-500 text-sm">{errors.categoria.message}</p>}

                <div className="flex flex-col gap-2">
                  <select 
                    className={`flex-1 border-odara-primary border rounded-lg px-3 py-2 ${errors.residente ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("residente")}
                  >
                    <option value="">Selecionar Residente</option>
                    {residentes.map((r) => <option key={String(r.id)} value={String(r.id)}>{r.nome}</option>)}
                  </select>
                  {errors.residente && <p className="text-red-500 text-sm">{errors.residente.message}</p>}

                  <select 
                    className={`flex-1 border-odara-primary border rounded-lg px-3 py-2 ${errors.funcionario ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("funcionario")}
                  >
                    <option value="">Selecionar Funcionário</option>
                    {funcionarios.map((f) => <option key={String(f.id)} value={String(f.id)}>{f.nome}</option>)}
                  </select>
                  {errors.funcionario && <p className="text-red-500 text-sm">{errors.funcionario.message}</p>}
                </div>

                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-odara-accent border-gray-300 rounded" {...register("concluido")} />
                  Registro Concluído
                </label>

                <div className="mt-4 flex justify-end gap-2">
                  <button 
                    type="button" 
                    className="px-4 border-odara-primary border py-2 rounded-lg text-odara-primary hover:text-odara-white hover:bg-odara-primary" 
                    onClick={() => setModalAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-odara-accent hover:bg-odara-secondary text-odara-white rounded-lg" 
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? "Salvando..." : "Salvar"}
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