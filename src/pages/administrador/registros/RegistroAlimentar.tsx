import { useEffect, useRef, useState, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaInfoCircle, FaFilter, FaChevronLeft, FaChevronRight, FaUser, FaSync } from "react-icons/fa";
import { supabase } from "../../../lib/supabaseClient";
import ModalAlimentar from "./ModalAlimentar";
import toast from "react-hot-toast";

const refeicoes = {
  "cafe-da-manha": "Café da manhã",
  "lanche-manha": "Lanche manhã",
  "almoco": "Almoço",
  "lanche-tarde": "Lanche tarde",
  "jantar": "Jantar",
  "ceia": "Ceia"
};

const refeicoesOrdenadas = [
  { key: "cafe-da-manha", label: "Café da manhã", icon: "☕" },
  { key: "lanche-manha", label: "Lanche manhã", icon: "🍎" },
  { key: "almoco", label: "Almoço", icon: "🍽️" },
  { key: "lanche-tarde", label: "Lanche tarde", icon: "🍪" },
  { key: "jantar", label: "Jantar", icon: "🌙" },
  { key: "ceia", label: "Ceia", icon: "🥛" }
];

type RegistroAlimentar = {
  id: number;
  data: string;
  horario: string;
  refeicao: string;
  alimento: string;
  id_residente: number;
  id_funcionario: number;
  residente?: Residente;
  funcionario?: Funcionario;
  observacao?: string;
};

type Residente = { id: number; nome: string };
type Funcionario = { id: number; nome: string };

const getWeekDates = (date: Date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    dates.push(current);
  }
  return dates;
};

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
};

const RegistroAlimentar = () => {
  const [registros, setRegistros] = useState<RegistroAlimentar[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [registroSelecionado, setRegistroSelecionado] = useState<RegistroAlimentar | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"semanal" | "lista">("semanal");
  const [residenteSelecionado, setResidenteSelecionado] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filtros, setFiltros] = useState<{
    residenteId: number | null;
    refeicao: string | null;
    dataInicio: string | null;
    dataFim: string | null;
  }>({
    residenteId: null,
    refeicao: null,
    dataInicio: null,
    dataFim: null
  });

  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroAlimentar[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // Função para carregar todos os dados
  const carregarDados = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Carregar residentes
      const { data: residentesData, error: residentesError } = await supabase
        .from("residente")
        .select("id, nome")
        .order("nome");
      if (residentesError) throw residentesError;

      // Carregar funcionários
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from("funcionario")
        .select("id, nome")
        .order("nome");
      if (funcionariosError) throw funcionariosError;

      // Carregar registros alimentares
      const { data: registrosData, error: registrosError } = await supabase
        .from("registro_alimentar")
        .select("*")
        .order("data", { ascending: false })
        .order("horario", { ascending: false });
      if (registrosError) throw registrosError;

      setResidentes(residentesData || []);
      setFuncionarios(funcionariosData || []);

      if (registrosData) {
        setRegistros(
          registrosData.map(r => ({
            ...r,
            residente: residentesData?.find(res => res.id === r.id_residente),
            funcionario: funcionariosData?.find(func => func.id === r.id_funcionario)
          }))
        );
      }
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
      toast.error("Erro ao carregar registros");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Assinar mudanças em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('registro_alimentar_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registro_alimentar'
        },
        () => {
          // Recarregar dados quando houver mudanças
          carregarDados();
        }
      )
      .subscribe();

    // Limpar assinatura ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [carregarDados]);

  // Recarregar dados quando o modal fechar
  useEffect(() => {
    if (!modalAberto) {
      // Recarregar dados quando o modal for fechado (após salvar)
      carregarDados();
    }
  }, [modalAberto, carregarDados]);

  // Filtrar registros
  useEffect(() => {
    if (registros.length === 0) {
      setRegistrosFiltrados([]);
      return;
    }
    const { residenteId, refeicao, dataInicio, dataFim } = filtros;
    const filtrados = registros
      .filter(r => {
        if (residenteId && r.id_residente !== residenteId) return false;
        if (refeicao && r.refeicao !== refeicao) return false;
        if (dataInicio && r.data < dataInicio) return false;
        if (dataFim && r.data > dataFim) return false;
        return true;
      })
      .sort((a, b) => {
        const ta = new Date(a.data + "T" + a.horario).getTime();
        const tb = new Date(b.data + "T" + b.horario).getTime();
        return tb - ta;
      });
    setRegistrosFiltrados(filtrados);
  }, [filtros, registros]);

  const weekDates = getWeekDates(currentWeek);

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate);
  };
  const goToToday = () => setCurrentWeek(new Date());

  const limparFiltros = () => {
    setFiltros({ residenteId: null, refeicao: null, dataInicio: null, dataFim: null });
    formRef.current?.reset();
  };

  const excluirRegistro = async (id: number) => {
    if (!confirm("Excluir este registro?")) return;
    try {
      const { error } = await supabase.from("registro_alimentar").delete().eq("id", id);
      if (error) throw error;
      
      // Atualizar localmente
      setRegistros(prev => prev.filter(r => r.id !== id));
      toast.success("Registro excluído com sucesso");
    } catch (e) {
      console.error("Erro ao excluir:", e);
      toast.error("Erro ao excluir registro");
    }
  };

  const registrosSemanais = residenteSelecionado
    ? registrosFiltrados.filter(r => r.id_residente === residenteSelecionado)
    : [];

  const registrosPorDataERefeicaoSemanal = registrosSemanais.reduce((acc, registro) => {
    const dateKey = registro.data;
    const refeicaoKey = registro.refeicao;
    acc[dateKey] = acc[dateKey] || {};
    acc[dateKey][refeicaoKey] = acc[dateKey][refeicaoKey] || [];
    acc[dateKey][refeicaoKey].push(registro);
    return acc;
  }, {} as Record<string, Record<string, RegistroAlimentar[]>>);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odara-accent mx-auto"></div>
          <p className="mt-4 text-odara-dark">Carregando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <ModalAlimentar
        alimentar={registroSelecionado}
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setRegistroSelecionado(null);
        }}
      />
      <div className="flex-1 p-6 lg:p-10 w-full max-w-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro Alimentar</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={carregarDados}
                disabled={refreshing}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Recarregar dados"
              >
                <FaSync className={`text-odara-accent ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="relative">
                <div className="inline-block group">
                  <button className="text-odara-dark hover:text-odara-secondary transition-colors duration-200">
                    <FaInfoCircle size={20} className="text-odara-accent hover:text-odara-secondary" />
                  </button>
                  <div
                    className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg
                               opacity-0 pointer-events-none transform scale-95 transition-all duration-150
                               group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100"
                    role="tooltip"
                  >
                    <h3 className="font-bold mb-2">Registro Alimentar</h3>
                    <p>Registra as refeições oferecidas aos residentes com horário, tipo, alimentos e responsável.</p>
                    <div className="absolute bottom-full left-8 w-0 h-0 border-8 border-transparent border-b-odara-dropdown"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => {
              setRegistroSelecionado(null);
              setModalAberto(true);
            }}
            className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-200 text-sm sm:text-base shadow-sm"
          >
            <FaPlus className="mr-2 text-odara-white" /> Novo Registro
          </button>

          <div className="flex items-center gap-4">
            <div className="flex bg-odara-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => {
                  setViewMode("semanal");
                  limparFiltros();
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "semanal" ? "bg-odara-accent text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setViewMode("lista")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "lista" ? "bg-odara-accent text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        {viewMode === "lista" && (
          <details className="mb-4 w-full" open>
            <summary
              className="inline-flex items-center px-4 py-2 bg-odara-dark text-white rounded hover:bg-odara-darkgreen cursor-pointer list-none
                [&::-webkit-details-marker]:hidden marker:content-none shadow-sm"
            >
              <FaFilter className="mr-2" />
              Filtrar
            </summary>
            <form
              ref={formRef}
              className="mt-3 bg-white p-4 rounded shadow-sm border"
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const residenteRaw = formData.get("residente") as string;
                const refeicaoRaw = formData.get("refeicao") as string;
                const dataInicioRaw = formData.get("dataInicio") as string;
                const dataFimRaw = formData.get("dataFim") as string;
                setFiltros({
                  residenteId: residenteRaw ? Number(residenteRaw) : null,
                  refeicao: refeicaoRaw && refeicaoRaw !== "todas" ? refeicaoRaw : null,
                  dataInicio: dataInicioRaw || null,
                  dataFim: dataFimRaw || null
                });
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
                  <select name="residente" className="w-full border rounded px-2 py-1">
                    <option value="">Todos</option>
                    {residentes.map(r => (
                      <option key={r.id} value={r.id}>{r.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refeição</label>
                  <select name="refeicao" className="w-full border rounded px-2 py-1" defaultValue="todas">
                    <option value="todas">Todas</option>
                    {Object.entries(refeicoes).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                    <input type="date" name="dataInicio" className="w-full border rounded px-2 py-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                    <input type="date" name="dataFim" className="w-full border rounded px-2 py-1" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-odara-dark rounded hover:bg-odara-darkgreen text-white shadow-sm">
                  Aplicar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 shadow-sm"
                  onClick={limparFiltros}
                >
                  Limpar
                </button>
              </div>
            </form>
          </details>
        )}

        {viewMode === "semanal" ? (
          <div className="bg-odara-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200">
            <div className="mb-6 p-4 bg-odara-accent/10 rounded-xl border border-odara-accent/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <FaUser className="text-odara-accent text-lg" />
                  <label className="text-sm font-semibold text-odara-dark">
                    Selecione um residente para visualizar a semana:
                  </label>
                </div>
                <select
                  value={residenteSelecionado || ""}
                  onChange={e => setResidenteSelecionado(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-odara-accent"
                >
                  <option value="">Selecione um residente...</option>
                  {residentes.map(residente => (
                    <option key={residente.id} value={residente.id}>{residente.nome}</option>
                  ))}
                </select>
                {residenteSelecionado && (
                  <div className="flex items-center gap-2 text-sm text-odara-dark">
                    <span className="font-semibold">
                      Visualizando: {residentes.find(r => r.id === residenteSelecionado)?.nome}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!residenteSelecionado ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Selecione um residente</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Escolha um residente na lista acima para visualizar o calendário semanal de refeições.
                </p>
              </div>
            ) : (
              <>
                <div className="sticky top-0 z-10 bg-odara-white py-2 flex flex-col sm:flex-row justify-between items-center mb-8">
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-odara-accent"
                      type="date"
                      value={formatDateKey(currentWeek)}
                      onChange={e => setCurrentWeek(new Date(e.target.value))}
                    />
                    <button
                      onClick={goToToday}
                      className="px-4 py-2 bg-odara-accent text-white rounded-xl hover:bg-odara-secondary transition text-sm shadow-sm"
                    >
                      Hoje
                    </button>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 shadow-inner">
                      <button onClick={() => navigateWeek("prev")} className="p-2 rounded-full hover:bg-gray-200 transition">
                        <FaChevronLeft className="text-odara-dark" />
                      </button>
                      <span className="text-lg font-semibold text-odara-dark min-w-[150px] text-center">
                        {weekDates[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {weekDates[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <button onClick={() => navigateWeek("next")} className="p-2 rounded-full hover:bg-gray-200 transition">
                        <FaChevronRight className="text-odara-dark" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto pb-4">
                  <div className="min-w-[1100px]">
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div className="w-32"></div>
                      {weekDates.map((date, index) => {
                        const isToday = formatDateKey(date) === formatDateKey(new Date());
                        return (
                          <div
                            key={index}
                            className={`text-center p-3 rounded-xl shadow-sm border ${isToday
                              ? "bg-odara-accent text-white border-odara-accent shadow-md"
                              : "bg-gray-50 text-odara-dark border-gray-200"
                              }`}
                          >
                            <div className="font-semibold text-sm">
                              {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                            </div>
                            <div className="text-lg font-bold">{date.getDate()}</div>
                          </div>
                        );
                      })}
                    </div>

                    {refeicoesOrdenadas.map(ref => (
                      <div key={ref.key} className="grid grid-cols-8 gap-2 mb-3">
                        <div className="w-32 flex items-center justify-center bg-gradient-to-r from-odara-accent/10 to-transparent rounded-xl p-3 border border-odara-accent/20">
                          <div className="text-center">
                            <div className="text-lg mb-1">{ref.icon}</div>
                            <div className="text-sm font-semibold text-odara-dark leading-tight">
                              {ref.label}
                            </div>
                          </div>
                        </div>
                        {weekDates.map((date, i) => {
                          const dateKey = formatDateKey(date);
                          const dayRegistros = registrosPorDataERefeicaoSemanal[dateKey]?.[ref.key] || [];
                          return (
                            <div
                              key={i}
                              className="bg-gray-50 rounded-xl p-2 border border-gray-200 min-h-[100px] hover:bg-gray-100 transition-colors"
                            >
                              <div className="space-y-2">
                                {dayRegistros.map(registro => (
                                  <div
                                    key={registro.id}
                                    className="bg-white rounded-lg p-2 shadow-sm border border-gray-300 hover:shadow-md hover:border-odara-accent/40 transition cursor-pointer group"
                                    onClick={() => {
                                      setRegistroSelecionado(registro);
                                      setModalAberto(true);
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-medium text-odara-accent bg-odara-accent/10 px-1.5 py-0.5 rounded">
                                        {formatTime(registro.horario)}
                                      </span>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            setRegistroSelecionado(registro);
                                            setModalAberto(true);
                                          }}
                                          className="text-odara-secondary hover:text-odara-dropdown-accent transition"
                                          title="Editar"
                                        >
                                          <FaEdit size={11} />
                                        </button>
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            excluirRegistro(registro.id);
                                          }}
                                          className="text-odara-alerta hover:text-red-700 transition"
                                          title="Excluir"
                                        >
                                          <FaTrash size={11} />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-700 line-clamp-2 font-medium">
                                      {registro.alimento}
                                    </p>
                                  </div>
                                ))}
                                {dayRegistros.length === 0 && (
                                  <button
                                    onClick={() => {
                                      const novaData = formatDateKey(date);
                                      const novoRegistro = {
                                        id: 0,
                                        data: novaData,
                                        horario: "12:00",
                                        refeicao: ref.key,
                                        alimento: "",
                                        id_residente: residenteSelecionado || 0,
                                        id_funcionario: 0
                                      };
                                      setRegistroSelecionado(novoRegistro as RegistroAlimentar);
                                      setModalAberto(true);
                                    }}
                                    className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 hover:text-odara-accent hover:bg-white/50 rounded-lg border-2 border-dashed border-gray-300 hover:border-odara-accent transition-colors group"
                                  >
                                    <FaPlus className="text-xs group-hover:scale-110 transition-transform" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-odara-accent rounded"></div>
                      <span>Hoje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-odara-accent/20 rounded"></div>
                      <span>Refeição registrada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded border border-dashed border-gray-400"></div>
                      <span>Disponível para registro</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl lg:text-4xl font-bold text-odara-dark mb-4">Todos os Registros</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {registrosFiltrados.length === 0 ? (
                <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                  <p className="text-odara-dark/60">Nenhum registro encontrado</p>
                </div>
              ) : (
                registrosFiltrados.map(r => (
                  <div key={r.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="flex items-center justify-between p-3 rounded-t-lg bg-gray-50 border-b border-gray-200">
                      <p className="text-sm sm:text-base text-odara-dark font-semibold">
                        {new Date(r.data).toLocaleDateString("pt-BR")} - {r.horario}
                      </p>
                    </div>
                    <div className="p-4">
                      <h6 className="text-xl font-bold mb-3 text-odara-dark">
                        {(refeicoes as Record<string, string>)[r.refeicao] || r.refeicao}
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <strong className="text-odara-dark">Alimento:</strong>
                          <span className="text-odara-name ml-1">{r.alimento}</span>
                        </div>
                        <div>
                          <strong className="text-odara-dark">Residente:</strong>
                          <span className="text-odara-name ml-1">{r.residente?.nome}</span>
                        </div>
                        <div>
                          <strong className="text-odara-dark">Registrado por:</strong>
                          <span className="text-odara-name ml-1">{r.funcionario?.nome || "Não identificado"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 flex items-center justify-between">
                      <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                        {r.residente?.nome}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setRegistroSelecionado(r);
                            setModalAberto(true);
                          }}
                          className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
                          title="Editar registro"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => excluirRegistro(r.id)}
                          className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
                          title="Excluir registro"
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
        )}
      </div>
    </div>
  );
};

export default RegistroAlimentar;