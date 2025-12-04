import { useEffect, useRef, useState, useCallback } from "react";
import { Plus, Edit, Trash, Filter, Search, Info, Clock, Utensils, RockingChair, Apple, ChevronDown, Check, AlertTriangle, ChevronLeft, ChevronRight, GlassWater, Coffee, Banana, CookingPot, Cookie, Soup } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import ModalAlimentar from "./ModalAlimentar";
import toast, { Toaster } from "react-hot-toast";

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Funcionario = {
  id: number;
  nome: string;
};

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

/* Constantes */
const REFEICOES = {
  "cafe-da-manha": "Café da Manhã",
  "lanche-manha": "Lanche da Manhã",
  "almoco": "Almoço",
  "lanche-tarde": "Lanche da Tarde",
  "jantar": "Jantar",
  "ceia": "Ceia"
} as const;

const REFEICOES_ORDENADAS = [
  { key: "cafe-da-manha", label: "Café da Manhã", icon: Coffee },
  { key: "lanche-manha", label: "Lanche da Manhã", icon: Banana },
  { key: "almoco", label: "Almoço", icon: CookingPot },
  { key: "lanche-tarde", label: "Lanche da Tarde", icon: Cookie },
  { key: "jantar", label: "Jantar", icon: Soup },
  { key: "ceia", label: "Ceia", icon: GlassWater }
];

const FILTRO_REFEICAO_OPTIONS = [
  { value: "todas", label: "Todas as refeições" },
  { value: "cafe-da-manha", label: "Café da Manhã" },
  { value: "lanche-manha", label: "Lanche da Manhã" },
  { value: "almoco", label: "Almoço" },
  { value: "lanche-tarde", label: "Lanche da Tarde" },
  { value: "jantar", label: "Jantar" },
  { value: "ceia", label: "Ceia" }
];

/* Funções auxiliares */
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
const formatTime = (time: string) => time.substring(0, 5);

const RegistroAlimentar = () => {
  /* Estados principais */
  const [registros, setRegistros] = useState<RegistroAlimentar[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [registroSelecionado, setRegistroSelecionado] = useState<RegistroAlimentar | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"semanal" | "lista">("semanal");

  // Estado compartilhado para residente selecionado
  const [residenteSelecionadoFiltro, setResidenteSelecionadoFiltro] = useState<number | null>(null);

  /* Estados de exclusão */
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [registroParaExcluir, setRegistroParaExcluir] = useState<number | null>(null);

  /* Estados de busca e filtros */
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{
    residenteId: number | null;
    refeicao: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    residenteId: null,
    refeicao: null,
    startDate: null,
    endDate: null
  });

  /* Estados de UI */
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroRefeicaoAberto, setFiltroRefeicaoAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);

  /* Refs para dropdowns */
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroRefeicaoRef = useRef<HTMLDivElement>(null);

  /* Efeitos para fechar dropdowns ao clicar fora */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(event.target as Node)) {
        setFiltroResidenteAberto(false);
      }
      if (filtroRefeicaoRef.current && !filtroRefeicaoRef.current.contains(event.target as Node)) {
        setFiltroRefeicaoAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Função para carregar dados */
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

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
        .select(`*, residente:residente(id, nome), funcionario:funcionario(id, nome)`)
        .order("data", { ascending: false })
        .order("horario", { ascending: false });

      if (registrosError) throw registrosError;

      setResidentes(residentesData || []);
      setFuncionarios(funcionariosData || []);
      setRegistros(registrosData || []);
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
      toast.error("Erro ao carregar registros");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Carregar dados iniciais */
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  /* Assinar mudanças em tempo real */
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
          carregarDados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [carregarDados]);

  /* Handlers de Exclusão */
  const abrirModalExclusao = (id: number) => {
    setRegistroParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setRegistroParaExcluir(null);
  };

  const executarExclusao = async () => {
    if (!registroParaExcluir) return;

    try {
      const { error } = await supabase
        .from("registro_alimentar")
        .delete()
        .eq("id", registroParaExcluir);

      if (error) throw error;

      // Atualiza a lista localmente
      setRegistros(prev => prev.filter(r => r.id !== registroParaExcluir));
      toast.success('Registro excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
      toast.error('Erro ao excluir registro');
    } finally {
      fecharModalExclusao();
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (registro: RegistroAlimentar) => {
    setRegistroSelecionado(registro);
    setModalAberto(true);
  };

  const abrirModalNovo = () => {
    setRegistroSelecionado(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setRegistroSelecionado(null);
    carregarDados();
  };

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarResidente = (residenteId: number | null) => {
    // Atualiza ambos os estados de uma vez
    setResidenteSelecionadoFiltro(residenteId);

    // Se estiver no modo lista, também atualiza os filtros
    if (viewMode === "lista") {
      setFiltros(prev => ({ ...prev, residenteId }));
    }
    setFiltroResidenteAberto(false);
  };

  // Função para mudar o modo de visualização - agora sincroniza o residente
  const mudarViewMode = (novoMode: "semanal" | "lista") => {
    if (novoMode === "lista") {
      // Ao mudar para lista, sincroniza o residente selecionado com os filtros
      setFiltros(prev => ({ ...prev, residenteId: residenteSelecionadoFiltro }));
    }

    setViewMode(novoMode);
    setFiltrosAberto(false);
  };

  const selecionarRefeicao = (refeicao: string | null) => {
    setFiltros(prev => ({ ...prev, refeicao: refeicao === 'todas' ? null : refeicao }));
    setFiltroRefeicaoAberto(false);
  };

  const limparFiltros = () => {
    setResidenteSelecionadoFiltro(null);
    setFiltros({
      residenteId: null,
      refeicao: null,
      startDate: null,
      endDate: null
    });
    setSearchTerm('');
    setFiltroRefeicaoAberto(false);
    setFiltroResidenteAberto(false);
  };

  /* Navegação semanal */
  const weekDates = getWeekDates(currentWeek);
  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate);
  };
  const goToToday = () => setCurrentWeek(new Date());

  /* Filtragem e ordenação - simplificada */
  const registrosFiltrados = registros
    .filter(registro => {
      // Filtro por texto (busca em alimento, nome do residente)
      if (searchTerm.trim()) {
        const termo = searchTerm.toLowerCase();
        const buscaAlimento = registro.alimento.toLowerCase().includes(termo);
        const buscaResidente = registro.residente?.nome.toLowerCase().includes(termo) || false;

        if (!buscaAlimento && !buscaResidente) {
          return false;
        }
      }

      // Para modo semanal, usa residenteSelecionadoFiltro diretamente
      // Para modo lista, usa filtros.residenteId
      const filtroResidente = viewMode === "semanal"
        ? (residenteSelecionadoFiltro ? registro.residente?.id !== residenteSelecionadoFiltro : false)
        : (filtros.residenteId && registro.residente?.id !== filtros.residenteId);

      if (filtroResidente) {
        return false;
      }

      // Filtro por refeição (apenas modo lista)
      if (viewMode === "lista" && filtros.refeicao && registro.refeicao !== filtros.refeicao) {
        return false;
      }

      // Filtro por data (apenas modo lista)
      if (viewMode === "lista" && (filtros.startDate || filtros.endDate)) {
        if (filtros.startDate && registro.data < filtros.startDate) return false;
        if (filtros.endDate && registro.data > filtros.endDate) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.data + "T" + a.horario).getTime();
      const tb = new Date(b.data + "T" + b.horario).getTime();
      return tb - ta;
    });

  /* Componente: Dropdown de Filtro */
  const FiltroDropdown = ({
    titulo,
    aberto,
    setAberto,
    ref,
    valorSelecionado,
    onSelecionar,
    tipo
  }: {
    titulo: string;
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
    ref: React.RefObject<HTMLDivElement>;
    valorSelecionado: string | number | null;
    onSelecionar: (value: any) => void;
    tipo: 'refeicao' | 'residente';
  }) => {
    const opcoes = tipo === 'refeicao' ? FILTRO_REFEICAO_OPTIONS : [];

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex items-center justify-between w-full h-10 border border-gray-300 rounded-lg px-3 text-sm hover:bg-gray-50 transition-colors"
        >
          <span className="text-odara-dark">
            {tipo === 'residente'
              ? valorSelecionado
                ? residentes.find(r => r.id === valorSelecionado)?.nome
                : titulo
              : valorSelecionado
                ? FILTRO_REFEICAO_OPTIONS.find(opt => opt.value === valorSelecionado)?.label
                : titulo
            }
          </span>
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
            {tipo === 'residente' ? (
              <>
                <button
                  onClick={() => onSelecionar(null)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${!valorSelecionado
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  <span>Todos os residentes</span>
                  {!valorSelecionado && <Check className="ml-auto text-odara-primary" size={14} />}
                </button>

                {residentes.map(residente => (
                  <button
                    key={residente.id}
                    onClick={() => onSelecionar(residente.id)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === residente.id
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <span>{residente.nome}</span>
                    {valorSelecionado === residente.id && <Check className="ml-auto text-odara-primary" size={14} />}
                  </button>
                ))}
              </>
            ) : (
              opcoes.map(opcao => (
                <button
                  key={opcao.value}
                  onClick={() => onSelecionar(opcao.value)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${(opcao.value === 'todas' && !valorSelecionado) || valorSelecionado === opcao.value
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  <span>{opcao.label}</span>
                  {((opcao.value === 'todas' && !valorSelecionado) || valorSelecionado === opcao.value) && (
                    <Check className="ml-auto text-odara-primary" size={14} />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  /* Componente: Seção de Filtros */
  const SecaoFiltros = () => {
    if (!filtrosAberto) return null;

    return (
      <div className="mb-8 bg-white p-5 rounded-xl shadow border border-gray-200 animate-fade-in">
        {/* Primeira Linha */}
        <div className="flex flex-col md:flex-row gap-5 w-full">
          <div className='flex flex-col md:flex-row flex-1 gap-5'>
            {/* Filtro de Residente */}
            <div className="flex-1 min-w-0">
              <div className='flex gap-1 items-center ml-1 mb-1'>
                <Filter size={10} className="text-odara-accent" />
                <label className="block text-sm font-semibold text-odara-secondary">Residente</label>
              </div>

              <FiltroDropdown
                titulo="Todos os residentes"
                aberto={filtroResidenteAberto}
                setAberto={setFiltroResidenteAberto}
                ref={filtroResidenteRef}
                valorSelecionado={filtros.residenteId}
                onSelecionar={selecionarResidente}
                tipo="residente"
              />
            </div>

            {/* Filtro de Refeição */}
            <div className="flex-1 min-w-0">
              <div className='flex gap-1 items-center ml-1 mb-1'>
                <Filter size={10} className="text-odara-accent" />
                <label className="block text-sm font-semibold text-odara-secondary">Refeição</label>
              </div>

              <FiltroDropdown
                titulo="Todas as refeições"
                aberto={filtroRefeicaoAberto}
                setAberto={setFiltroRefeicaoAberto}
                ref={filtroRefeicaoRef}
                valorSelecionado={filtros.refeicao || 'todas'}
                onSelecionar={selecionarRefeicao}
                tipo="refeicao"
              />
            </div>
          </div>

          {/* Botão Limpar Filtros/Busca */}
          <div className="flex md:items-end gap-2 pt-1 md:pt-0 md:flex-shrink-0">
            <button
              onClick={limparFiltros}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 w-full md:w-auto justify-center"
            >
              Limpar Filtros/Busca
            </button>
          </div>
        </div>

        {/* Segunda Linha (Filtro de Data) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-gray-200">
          {/* A Partir da Data */}
          <div>
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-sm font-semibold text-odara-secondary">A Partir da Data</label>
            </div>

            <input
              type="date"
              value={filtros.startDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value || null }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
            />
          </div>

          {/* Até a Data */}
          <div>
            <div className="flex gap-1 items-center ml-1 mb-1">
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-sm font-semibold text-odara-secondary">Até a Data</label>
            </div>

            <input
              type="date"
              value={filtros.endDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value || null }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  };

  /* Componente: Modal de Confirmação de Exclusão */
  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    const registro = registroParaExcluir
      ? registros.find(r => r.id === registroParaExcluir)
      : null;
    const tituloRegistro = registro?.alimento || '';
    const residenteNome = registro?.residente?.nome || '';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full animate-scale-in">
          <div className="text-center">
            {/* Ícone de alerta */}
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-odara-alerta/10 mb-4">
              <AlertTriangle className="h-7 w-7 text-odara-alerta" />
            </div>

            {/* Textos do modal */}
            <h3 className="text-xl font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
            <p className="text-odara-name mb-4">
              Tem certeza que deseja excluir este registro alimentar?
            </p>

            {/* Detalhes do registro */}
            <div className="bg-odara-offwhite rounded-lg p-3 mb-4 border border-gray-200">
              {tituloRegistro && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-odara-dark">Alimento:</p>
                  <p className="text-sm font-semibold text-odara-name truncate" title={tituloRegistro}>
                    {tituloRegistro}
                  </p>
                </div>
              )}
              {residenteNome && (
                <div>
                  <p className="text-sm font-medium text-odara-dark">Residente:</p>
                  <p className="text-sm font-semibold text-odara-name">{residenteNome}</p>
                </div>
              )}
            </div>

            <p className="text-sm text-odara-alerta mb-6 font-medium">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões de ação */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={fecharModalExclusao}
                className="px-6 py-2 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 flex-1"
                autoFocus
              >
                Cancelar
              </button>
              <button
                onClick={executarExclusao}
                className="px-5 py-2.5 bg-odara-alerta text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex-1"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* Componente: Card de Registro (para visualização em lista) */
  const CardRegistro = ({ registro }: { registro: RegistroAlimentar }) => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className="flex flex-wrap justify-center sm:justify-between gap-2 items-center p-3 rounded-t-lg bg-gray-50 border-b border-gray-200">
          {/* Coluna Esquerda */}
          <div className="flex items-center">
            <div className="bg-odara-accent w-3 h-3 rounded-full mr-3"></div>

            <p className="text-sm sm:text-base text-odara-dark">
              <span className='font-semibold'>
                {registro.data.split('-').reverse().join('/')}
              </span>

              <span className="text-odara-accent ml-2">
                • {formatTime(registro.horario)}
              </span>
            </p>
          </div>

          {/* Coluna Direita - Tipo de Refeição */}
          <div className="flex items-center gap-2 px-3 py-1 bg-odara-accent/10 rounded-lg">
            {(() => {
              const refeicaoInfo = REFEICOES_ORDENADAS.find(opt => opt.key === registro.refeicao);
              const IconeComponente = refeicaoInfo?.icon || Utensils;
              return <IconeComponente size={12} className="text-odara-accent" />;
            })()}

            <span className="text-xs font-medium text-odara-dark capitalize">
              {REFEICOES[registro.refeicao as keyof typeof REFEICOES] || registro.refeicao}
            </span>
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Título e Botões de Ação */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-odara-dark line-clamp-1 flex-1">
              {REFEICOES[registro.refeicao as keyof typeof REFEICOES] || registro.refeicao}
            </h3>

            {/* Botões de ação */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => abrirModalEdicao(registro)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar registro"
              >
                <Edit size={14} />
              </button>

              <button
                onClick={() => abrirModalExclusao(registro.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir registro"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          {/* Detalhes do Registro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Coluna Esquerda */}
            <div className="flex flex-wrap">
              <span className="text-odara-name text-sm ml-1 inline-block align-center">
                <strong className="text-odara-dark">Alimentos:</strong> {' ' + registro.alimento}
              </span>
            </div>

            {/* Coluna Direita */}
            <div className="flex flex-wrap">
              <span className="text-odara-name text-sm ml-1 inline-block align-center">
                <strong className="text-odara-dark">Observações:</strong> {registro.observacao || 'Nenhuma'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer do Card */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-wrap justify-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <RockingChair size={12} />
                {registro.residente?.nome || 'Sem residente'}
              </span>
            </div>

            <div className="text-xs text-odara-name flex items-center gap-1">
              <Clock size={10} />
              {registro.data.split('-').reverse().join('/')} • {formatTime(registro.horario)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* Componente: Visualização em Lista */
  const ListaRegistros = () => {
    // Filtrar registros para a visualização em lista
    const registrosFiltradosLista = registros
      .filter(registro => {
        // Filtro por texto (busca em alimento, nome do residente)
        if (searchTerm.trim()) {
          const termo = searchTerm.toLowerCase();
          const buscaAlimento = registro.alimento.toLowerCase().includes(termo);
          const buscaResidente = registro.residente?.nome.toLowerCase().includes(termo) || false;

          if (!buscaAlimento && !buscaResidente) {
            return false;
          }
        }

        // Filtro por residente
        if (filtros.residenteId && registro.residente?.id !== filtros.residenteId) {
          return false;
        }

        // Filtro por refeição
        if (filtros.refeicao && registro.refeicao !== filtros.refeicao) {
          return false;
        }

        // Filtro por data
        if (filtros.startDate || filtros.endDate) {
          if (filtros.startDate && registro.data < filtros.startDate) return false;
          if (filtros.endDate && registro.data > filtros.endDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const ta = new Date(a.data + "T" + a.horario).getTime();
        const tb = new Date(b.data + "T" + b.horario).getTime();
        return tb - ta;
      });

    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-odara-dark">Todos os Registros</h2>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            Total: {registrosFiltradosLista.length} de {registros.length}
          </span>
        </div>

        {/* Tags de filtros ativos - incluindo residente selecionado se houver */}
        {(filtros.residenteId || filtros.refeicao || filtros.startDate || filtros.endDate || searchTerm) && (
          <div className="mb-4 flex flex-wrap justify-center sm:justify-start gap-2 text-xs">
            {searchTerm && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Busca: {searchTerm}
              </span>
            )}

            {filtros.residenteId && (
              <span className="bg-odara-secondary text-white px-3 py-1.5 rounded-full flex items-center gap-1">
                <RockingChair size={10} />
                Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
              </span>
            )}

            {filtros.refeicao && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Refeição: {REFEICOES[filtros.refeicao as keyof typeof REFEICOES]}
              </span>
            )}

            {(filtros.startDate || filtros.endDate) && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Data: {filtros.startDate ? ` ${filtros.startDate.split('-').reverse().join('/')}` : ''}
                {filtros.endDate ? ' até' + ` ${filtros.endDate.split('-').reverse().join('/')}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Lista ou mensagem de vazio */}
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-odara-dark/60 text-lg">Carregando registros...</p>
          </div>
        ) : registrosFiltradosLista.length === 0 ? (
          <div className="p-8 rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-lg">
              {registros.length === 0 ? 'Nenhum registro alimentar' : 'Nenhum registro encontrado'}
            </p>
            {registros.length > 0 && (
              <p className="text-odara-dark/40 text-sm mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[800px] overflow-y-auto p-2">
            {registrosFiltradosLista.map(registro => (
              <CardRegistro
                key={registro.id}
                registro={registro}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  /* Componente: Visualização Semanal */
  const VisualizacaoSemanal = () => {
    const [filtroSemanalResidenteAberto, setFiltroSemanalResidenteAberto] = useState(false);
    const filtroSemanalResidenteRef = useRef<HTMLDivElement>(null);

    // Efeito para fechar dropdown ao clicar fora
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (filtroSemanalResidenteRef.current && !filtroSemanalResidenteRef.current.contains(event.target as Node)) {
          setFiltroSemanalResidenteAberto(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const registrosSemanais = residenteSelecionadoFiltro
      ? registrosFiltrados.filter(r => r.id_residente === residenteSelecionadoFiltro)
      : [];

    const getIconeRefeicao = (refeicaoKey: string) => {
      const refeicaoInfo = REFEICOES_ORDENADAS.find(opt => opt.key === refeicaoKey);
      return refeicaoInfo?.icon || Utensils;
    };

    const registrosPorDataERefeicaoSemanal = registrosSemanais.reduce((acc, registro) => {
      const dateKey = registro.data;
      const refeicaoKey = registro.refeicao;
      acc[dateKey] = acc[dateKey] || {};
      acc[dateKey][refeicaoKey] = acc[dateKey][refeicaoKey] || [];
      acc[dateKey][refeicaoKey].push(registro);
      return acc;
    }, {} as Record<string, Record<string, RegistroAlimentar[]>>);

    return (
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-l-4 border-odara-primary">
        {/* Seletor de residente - estilizado igual ao da lista */}
        <div className="mb-8 bg-white p-5 rounded-xl shadow border border-gray-200 animate-fade-in shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <RockingChair size={14} className="text-odara-accent text-lg" />
              <label className="block text-sm font-semibold text-odara-secondary">
                Selecione um residente para visualizar a semana:
              </label>
            </div>

            {/* Filtro de Residente estilizado igual ao da lista */}
            <div className="relative flex-1 z-30" ref={filtroSemanalResidenteRef}>
              <button
                type="button"
                onClick={() => setFiltroSemanalResidenteAberto(!filtroSemanalResidenteAberto)}
                className="flex items-center justify-between w-full h-10 border border-gray-300 rounded-lg px-3 text-sm hover:bg-gray-50 transition-colors"
              >
                <span className="text-odara-dark">
                  {residenteSelecionadoFiltro
                    ? residentes.find(r => r.id === residenteSelecionadoFiltro)?.nome
                    : "Selecione um residente..."}
                </span>
                <ChevronDown size={12} className="text-gray-500" />
              </button>

              {filtroSemanalResidenteAberto && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-40 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setResidenteSelecionadoFiltro(null);
                      setFiltroSemanalResidenteAberto(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${!residenteSelecionadoFiltro
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <span>Selecione um residente...</span>
                    {!residenteSelecionadoFiltro && <Check className="ml-auto text-odara-primary" size={14} />}
                  </button>

                  {residentes.map(residente => (
                    <button
                      key={residente.id}
                      onClick={() => {
                        setResidenteSelecionadoFiltro(residente.id);
                        setFiltroSemanalResidenteAberto(false);
                      }}
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${residenteSelecionadoFiltro === residente.id
                        ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                        : 'text-gray-700'
                        }`}
                    >
                      <span>{residente.nome}</span>
                      {residenteSelecionadoFiltro === residente.id && <Check className="ml-auto text-odara-primary" size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {!residenteSelecionadoFiltro ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <RockingChair className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Selecione um residente</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Escolha um residente na lista acima para visualizar o calendário semanal de refeições.
            </p>
          </div>
        ) : (
          <>
            {/* Tags de filtros ativos */}
            <div className="mb-4 flex flex-wrap gap-2 text-xs justify-center">
              {/* Tag do residente selecionado */}
              {residenteSelecionadoFiltro && (
                <span className="bg-odara-secondary text-white px-3 py-1.5 rounded-full flex items-center gap-1">
                  <RockingChair size={10} />
                  Residente: {residentes.find(r => r.id === residenteSelecionadoFiltro)?.nome}
                </span>
              )}

              {/* Tag de busca se houver */}
              {searchTerm && (
                <span className="bg-odara-secondary text-white px-3 py-1.5 rounded-full">
                  Busca: {searchTerm}
                </span>
              )}

              {/* Outras tags apenas se houverem filtros ativos */}
              {(filtros.refeicao || filtros.startDate || filtros.endDate) && (
                <>
                  {filtros.refeicao && (
                    <span className="bg-odara-accent text-white px-3 py-1.5 rounded-full">
                      Refeição: {REFEICOES[filtros.refeicao as keyof typeof REFEICOES]}
                    </span>
                  )}

                  {(filtros.startDate || filtros.endDate) && (
                    <span className="bg-odara-accent text-white px-3 py-1.5 rounded-full">
                      Data: {filtros.startDate ? ` ${filtros.startDate.split('-').reverse().join('/')}` : ''}
                      {filtros.endDate ? ' até' + ` ${filtros.endDate.split('-').reverse().join('/')}` : ''}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Controles de navegação */}
            <div className="sticky top-0 z-10 bg-odara-white py-2 flex flex-col justify-between items-center mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <input
                  className="flex items-center gap-2 border border-odara-primary rounded-lg focus:outline-none focus:border-none focus:ring-2 focus:ring-odara-secondary shadow-sm px-3 py-2 text-odara-dark"
                  type="date"
                  value={formatDateKey(currentWeek)}
                  onChange={e => setCurrentWeek(new Date(e.target.value))}
                />

                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-odara-accent text-white rounded-xl hover:bg-odara-secondary transition text-sm shadow-sm"
                >
                  Ir para Hoje
                </button>

                <div className="flex items-center gap-2 border border-odara-primary rounded-lg focus:outline-none focus:border-none focus:ring-2 focus:ring-odara-secondary shadow-sm">
                  <button onClick={() => navigateWeek("prev")} className="p-2 rounded-full transition">
                    <ChevronLeft size={25} className="text-odara-primary hover:text-odara-secondary" />
                  </button>

                  <span className="text-odara-dark min-w-[100px] text-center">
                    {weekDates[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {weekDates[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>

                  <button onClick={() => navigateWeek("next")} className="p-2 rounded-full transition">
                    <ChevronRight size={25} className="text-odara-primary hover:text-odara-secondary" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grade semanal */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[1100px]">
                {/* Cabeçalho dos dias */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="w-32"></div>
                  {weekDates.map((date, index) => {
                    const isToday = formatDateKey(date) === formatDateKey(new Date());
                    return (
                      <div
                        key={index}
                        className={`text-center shadow-sm border rounded-xl p-3 ${isToday
                          ? "bg-odara-accent text-white border-odara-accent shadow-md"
                          : "bg-transparent border border-odara-primary text-odara-primary"
                          }`}
                      >
                        <div className="font-semibold text-md capitalize">
                          {date.toLocaleDateString("pt-BR", { weekday: "long" })}
                        </div>
                        <div className="text-lg font-bold">{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Linhas de refeições */}
                {REFEICOES_ORDENADAS.map(ref => (
                  <div key={ref.key} className="grid grid-cols-8 gap-2 mb-3">
                    {/* Célula do tipo de refeição */}
                    <div className="w-full flex items-center justify-center bg-transparent border border-odara-primary rounded-xl p-3 text-odara-primary shadow-sm">
                      <div className="flex justify-center items-center gap-2 text-center">
                        {/* Icone */}
                        {(() => {
                          const IconeComponente = getIconeRefeicao(ref.key);
                          return <IconeComponente size={25} />;
                        })()}

                        <div className="text-md font-semibold">
                          {ref.label}
                        </div>
                      </div>
                    </div>

                    {/* Células dos dias */}
                    {weekDates.map((date, i) => {
                      const dateKey = formatDateKey(date);
                      const dayRegistros = registrosPorDataERefeicaoSemanal[dateKey]?.[ref.key] || [];
                      return (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-xl p-2 border border-gray-200 min-h-max hover:bg-gray-100 transition-colors"
                        >
                          <div className="space-y-2">
                            {dayRegistros.map(registro => (
                              <div
                                key={registro.id}
                                className="bg-white rounded-lg p-2 shadow-sm border border-gray-300 hover:shadow-md hover:border-odara-accent/40 transition cursor-pointer group"
                                onClick={() => abrirModalEdicao(registro)}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="flex text-xs font-medium text-odara-accent bg-odara-accent/10 px-1.5 py-0.5 rounded gap-2">
                                    <Clock size={15} />
                                    {formatTime(registro.horario)}
                                  </span>

                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        abrirModalEdicao(registro);
                                      }}
                                      className="text-odara-secondary hover:text-odara-dropdown-accent transition"
                                      title="Editar"
                                    >
                                      <Edit size={11} />
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        abrirModalExclusao(registro.id);
                                      }}
                                      className="text-odara-alerta hover:text-red-700 transition"
                                      title="Excluir"
                                    >
                                      <Trash size={11} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-odara-dark line-clamp-2 font-medium">
                                  {registro.alimento}
                                </p>
                              </div>
                            ))}
                            {dayRegistros.length === 0 && (
                              <button
                                onClick={() => {
                                  const novoRegistro: Partial<RegistroAlimentar> = {
                                    id: 0,
                                    data: formatDateKey(date),
                                    horario: "12:00",
                                    refeicao: ref.key,
                                    alimento: "",
                                    id_residente: residenteSelecionadoFiltro || 0,
                                    id_funcionario: 0
                                  };
                                  setRegistroSelecionado(novoRegistro as RegistroAlimentar);
                                  setModalAberto(true);
                                }}
                                className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 hover:text-odara-accent hover:bg-white/50 rounded-lg border-2 border-dashed border-gray-300 hover:border-odara-accent transition-colors group"
                              >
                                <Plus className="text-xs group-hover:scale-110 transition-transform" />
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

            {/* Legenda */}
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
    );
  };

  /* Componente: Cabeçalho */
  const Cabecalho = () => {
    return (
      <div className="flex items-center mb-6">
        <Apple size={30} className='text-odara-accent mr-2' />
        <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
          Registro Alimentar
        </h1>

        {/* Tooltip de informações */}
        <div className="relative">
          <button
            onMouseEnter={() => setInfoVisivel(true)}
            onMouseLeave={() => setInfoVisivel(false)}
            className="transition-colors duration-200"
          >
            <Info size={20} className="text-odara-accent hover:text-odara-secondary" />
          </button>
          {infoVisivel && (
            <div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
              <h3 className="font-bold mb-2">Registro Alimentar</h3>
              <p>Registra as refeições oferecidas aos residentes com horário, tipo, alimentos e responsável.</p>
              <div className="absolute bottom-full left-4 border-4 border-transparent border-b-odara-dropdown"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* Componente: Botão Novo Registro */
  const BotaoNovoRegistro = () => {
    return (
      <button
        onClick={abrirModalNovo}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 w-max"
      >
        <Plus className="mr-2" /> Novo Registro
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      {/* Modal de Registro Alimentar */}
      <ModalAlimentar
        alimentar={registroSelecionado}
        isOpen={modalAberto}
        onClose={fecharModal}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ModalConfirmacaoExclusao />

      {/* Toaster para notificações */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#e4edfdff',
            color: '#52323a',
            border: '1px solid #0036caff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#52323a',
              border: '1px solid #00c950',
            },
          },
          error: {
            style: {
              background: '#fce7e7ff',
              color: '#52323a',
              border: '1px solid #c90d00ff',
            },
          },
        }}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Cabeçalho e Botão Novo */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
          <Cabecalho />
          <div className="flex justify-end">
            <BotaoNovoRegistro />
          </div>
        </div>

        {/* Controles de visualização */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Barra de Busca */}
          <div className="flex-1 relative min-w-[300px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-odara-primary h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por alimento ou residente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent"
            />
          </div>

          {/* Botões de modo de visualização e filtros */}
          <div className="flex gap-4">

            {/* Botão de filtros (apenas para modo lista) */}
            {viewMode === "lista" && (
              <button
                onClick={toggleFiltros}
                className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition w-max justify-between"
              >
                <Filter size={20} className="text-odara-accent" />
                <span>
                  {!filtrosAberto ? 'Abrir ' : 'Fechar '} Filtros
                </span>
              </button>
            )}

            {/* Botões de visualização - usando mudarViewMode */}
            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden items-center shadow-sm h-max">
              <div>
                <button
                  onClick={() => mudarViewMode("semanal")}
                  className={`px-6 py-4 text-md font-medium transition-colors ${viewMode === "semanal" ? "bg-odara-accent text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  Semanal
                </button>

                <button
                  onClick={() => mudarViewMode("lista")}
                  className={`px-6 py-4 text-md font-medium transition-colors ${viewMode === "lista" ? "bg-odara-accent text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Filtros (apenas para modo lista) */}
        {viewMode === "lista" && <SecaoFiltros />}

        {/* Conteúdo principal */}
        {viewMode === "semanal" ? <VisualizacaoSemanal /> : <ListaRegistros />}

        {/* Contador de resultados - ajustado */}
        <div className="my-4 text-sm text-gray-400">
          Total de {registrosFiltrados.length} registro(s) encontrado(s) de {registros.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroAlimentar;