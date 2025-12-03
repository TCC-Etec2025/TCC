import { useState, useEffect, useMemo, useRef} from 'react';
import { 
  Pill, Filter, Search, Info, ChevronDown, ChevronRight, 
  Calendar, Clock, User, CheckCircle, XCircle, MinusCircle,
  Edit, Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../context/UserContext';
import { useObservacaoModal } from '../../../hooks/useObservacaoModal';

type Administracao = {
  id: number;
  id_medicamento: number;
  data_prevista: string;
  horario_previsto: string;
  data_administracao: string | null;
  horario_administracao: string | null;
  status: string;
  id_funcionario: number;
  observacao: string | null;
};

type Medicamento = {
  id: number;
  nome: string;
  dosagem: string;
  id_residente: number;
};

type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type AdministracaoComDetalhes = Administracao & {
  medicamento: Medicamento;
  residente: Residente;
};

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const COR_STATUS: Record<string, { 
  bola: string; 
  bg: string; 
  text: string; 
  border: string; 
  icon: any 
}> = {
  administrado: { 
    bola: 'bg-green-500', 
    bg: 'bg-green-50', 
    text: 'text-green-700', 
    border: 'border-b border-green-200',
    icon: CheckCircle
  },
  parcial: { 
    bola: 'bg-yellow-500', 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-700', 
    border: 'border-b border-yellow-200',
    icon: MinusCircle
  },
  nao_administrado: { 
    bola: 'bg-red-500', 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-b border-red-200',
    icon: XCircle
  },
  pendente: { 
    bola: 'bg-gray-400', 
    bg: 'bg-gray-50', 
    text: 'text-gray-700', 
    border: 'border-b border-gray-200',
    icon: Clock
  }
};

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente', icon: Clock },
  { value: 'administrado', label: 'Administrado', icon: CheckCircle },
  { value: 'parcial', label: 'Parcial', icon: MinusCircle },
  { value: 'nao_administrado', label: 'Não Administrado', icon: XCircle }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'administrado', label: 'Administrado' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'nao_administrado', label: 'Não Administrado' }
];

const Medicamentos = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [administracoes, setAdministracoes] = useState<Administracao[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  
  const [datesExpanded, setDatesExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [loading, setLoading] = useState(false);

  const { usuario } = useUser();
  const { openModal, ObservacaoModal } = useObservacaoModal();

  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroStatusRef = useRef<HTMLDivElement>(null);

  // CORREÇÃO: Remover o valor padrão das datas no filtro inicial
  const [filtros, setFiltros] = useState({
    residenteId: null as number | null,
    status: null as string | null,
    startDate: null as string | null, // Remover valor padrão
    endDate: null as string | null,   // Remover valor padrão
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: adminData, error: adminErr } = await supabase
          .from("administracao_medicamento")
          .select("*")
          .order('data_prevista', { ascending: true });

        if (adminErr) throw adminErr;
        setAdministracoes(adminData || []);

        const medicamentoIds = [...new Set(adminData?.map(a => a.id_medicamento) || [])];

        if (medicamentoIds.length > 0) {
          const { data: medsData, error: medsErr } = await supabase
            .from("medicamento")
            .select("*")
            .in("id", medicamentoIds);

          if (medsErr) throw medsErr;
          setMedicamentos(medsData || []);
        }

        const { data: resData, error: resErr } = await supabase
          .from("residente")
          .select("id, nome, quarto")
          .order('nome');

        if (resErr) throw resErr;
        setResidentes(resData || []);

      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const listaCompleta = useMemo(() => {
    if (!administracoes.length || !medicamentos.length || !residentes.length) return [];

    return administracoes.map(admin => {
      const medicamento = medicamentos.find(m => m.id === admin.id_medicamento);
      if (!medicamento) return null;
      
      const residente = residentes.find(r => r.id === medicamento.id_residente);
      if (!residente) return null;

      return { ...admin, medicamento, residente };
    }).filter((item): item is AdministracaoComDetalhes => item !== null);
  }, [administracoes, medicamentos, residentes]);

  const gruposRenderizaveis = useMemo(() => {
    const { residenteId, status, startDate, endDate } = filtros;

    const filtradas = listaCompleta.filter(admin => {
      // Filtro por nome do medicamento ou residente
      if (searchTerm.trim()) {
        const busca = searchTerm.toLowerCase();
        const nomeMed = admin.medicamento.nome.toLowerCase();
        const nomeRes = admin.residente.nome.toLowerCase();
        if (!nomeMed.includes(busca) && !nomeRes.includes(busca)) {
          return false;
        }
      }

      // Filtro por residente
      if (residenteId && admin.residente.id !== residenteId) return false;
      
      // Filtro por status
      if (status && status !== 'todos' && admin.status !== status) return false;

      // CORREÇÃO: Filtro por data - apenas filtrar se ambas as datas estiverem preenchidas
      if (startDate && endDate) {
        // Filtra por intervalo de datas
        if (admin.data_prevista < startDate || admin.data_prevista > endDate) return false;
      } else if (startDate) {
        // Filtra apenas por data inicial
        if (admin.data_prevista < startDate) return false;
      } else if (endDate) {
        // Filtra apenas por data final
        if (admin.data_prevista > endDate) return false;
      }
      // Se nenhuma data for selecionada, mostra todos

      return true;
    });

    filtradas.sort((a, b) => {
      if (a.data_prevista !== b.data_prevista) return a.data_prevista.localeCompare(b.data_prevista);
      return a.horario_previsto.localeCompare(b.horario_previsto);
    });

    const grupos: Record<string, AdministracaoComDetalhes[]> = {};
    filtradas.forEach(item => {
      if (!grupos[item.data_prevista]) grupos[item.data_prevista] = [];
      grupos[item.data_prevista].push(item);
    });

    return Object.keys(grupos).sort().map(data => ({
      dataFormatada: data,
      itens: grupos[data],
      isExpandido: datesExpanded[data] !== false 
    }));

  }, [listaCompleta, filtros, datesExpanded, searchTerm]);

  const updateStatus = async (adminId: number, newStatus: string, observacao?: string) => {
    try {
      const now = new Date();
      const dataHoje = getTodayString();
      const horarioAgora = now.toTimeString().substring(0, 5);

      const { error } = await supabase
        .from("administracao_medicamento")
        .update({
          status: newStatus,
          id_funcionario: usuario?.id,
          observacao: observacao ?? null,
          data_administracao: dataHoje,
          horario_administracao: horarioAgora
        })
        .eq("id", adminId);

      if (error) throw error;

      setAdministracoes(prev =>
        prev.map(a =>
          a.id === adminId
            ? { ...a, status: newStatus, observacao: observacao ?? null, data_administracao: dataHoje, horario_administracao: horarioAgora }
            : a
        )
      );

    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const handleStatusClick = async (adminId: number, status: string) => {
    try {
      if (status === "administrado") {
        updateStatus(adminId, status);
      } else {
        const obs = await openModal("");
        if (obs !== null) {
          updateStatus(adminId, status, obs);
        }
      }
    } catch {
      // cancelado
    }
  };

  const handleEditObservation = async (admin: AdministracaoComDetalhes) => {
    try {
      const novaObs = await openModal(admin.observacao || "");
      if (novaObs !== null && novaObs !== admin.observacao) {
        updateStatus(admin.id, admin.status, novaObs);
      }
    } catch {
      // cancelado
    }
  };

  const toggleDate = (date: string) => {
    setDatesExpanded(prev => {
        const isCurrentlyExpanded = prev[date] !== false; 
        return { ...prev, [date]: !isCurrentlyExpanded };
    });
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const obterResidentesUnicos = () => {
    const residentesMap = new Map<number, string>();
    listaCompleta
      .forEach(m => {
        residentesMap.set(m.residente.id, m.residente.nome);
      });
    return Array.from(residentesMap.entries());
  };

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarResidente = (residenteId: number | null) => {
    setFiltros(prev => ({ ...prev, residenteId }));
    setFiltroResidenteAberto(false);
  };

  const selecionarStatus = (status: string | null) => {
    setFiltros(prev => ({ ...prev, status: status === 'todos' ? null : status }));
    setFiltroStatusAberto(false);
  };

  const limparFiltros = () => {
    setFiltros({ 
      residenteId: null, 
      status: null, 
      startDate: null,  // Não definir data padrão ao limpar
      endDate: null     // Não definir data padrão ao limpar
    });
    setSearchTerm('');
    setFiltroResidenteAberto(false);
    setFiltroStatusAberto(false);
  };

  const toggleDropdown = (id: number) => {
    setDropdownAberto(dropdownAberto === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(event.target as Node)) {
        setFiltroResidenteAberto(false);
      }
      if (filtroStatusRef.current && !filtroStatusRef.current.contains(event.target as Node)) {
        setFiltroStatusAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DropdownStatus = ({ admin }: { admin: AdministracaoComDetalhes }) => {
    const cores = COR_STATUS[admin.status] || COR_STATUS.pendente;
    const IconeStatus = cores.icon;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(admin.id)}
          className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconeStatus size={12} className="text-odara-accent" />
          <span className="text-odara-dark capitalize hidden xs:inline">
            {admin.status.replace('_', ' ')}
          </span>
          <ChevronDown size={10} className="text-gray-500" />
        </button>

        {dropdownAberto === admin.id && (
          <>
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setDropdownAberto(null)}
            ></div>

            <div className="absolute top-full left-0 right-0 sm:right-auto sm:left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusClick(admin.id, option.value);
                      setDropdownAberto(null);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${
                      admin.status === option.value
                        ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    <OptionIcon size={12} className="text-odara-accent" />
                    <span className="capitalize">{option.label}</span>
                    {admin.status === option.value && (
                      <Check className="ml-auto text-odara-primary" size={12} />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

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
    tipo: 'residente' | 'status';
  }) => {
    const residentesUnicos = obterResidentesUnicos();

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex items-center justify-between w-full h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors"
        >
          <span className="text-odara-dark truncate text-left">
            {tipo === 'residente'
              ? valorSelecionado
                ? residentesUnicos.find(([id]) => id === valorSelecionado)?.[1]
                : titulo
              : valorSelecionado
                ? FILTRO_STATUS_OPTIONS.find(opt => opt.value === valorSelecionado)?.label
                : titulo
            }
          </span>
          <ChevronDown size={12} className="text-gray-500 flex-shrink-0 ml-1" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-60 overflow-y-auto">
            {tipo === 'residente' ? (
              <>
                <button
                  onClick={() => onSelecionar(null)}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${
                    !valorSelecionado
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  <span>Todos os residentes</span>
                  {!valorSelecionado && <Check className="text-odara-primary" size={12} />}
                </button>
                {residentesUnicos.map(([id, nome]) => (
                  <button
                    key={id}
                    onClick={() => onSelecionar(id)}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${
                      valorSelecionado === id
                        ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="truncate">{nome}</span>
                    {valorSelecionado === id && <Check className="text-odara-primary" size={12} />}
                  </button>
                ))}
              </>
            ) : (
              FILTRO_STATUS_OPTIONS.map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => onSelecionar(opcao.value)}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${
                    (opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  <span>{opcao.label}</span>
                  {((opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value) && (
                    <Check className="text-odara-primary" size={12} />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const CardAdministracao = ({ admin }: { admin: AdministracaoComDetalhes }) => {
    const cores = COR_STATUS[admin.status] || COR_STATUS.pendente;
    const IconeStatus = cores.icon;

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between p-2 sm:p-3 ${cores.border} ${cores.bg}`}>
          <div className="flex items-center flex-1 min-w-0">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 flex-shrink-0 ${cores.bola}`}></div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <Calendar size={10} className="text-gray-500 flex-shrink-0" />
              <span className={`text-xs sm:text-sm ${cores.text} truncate`}>
                {formatarData(admin.data_prevista)}
              </span>
              <span className="text-gray-400 mx-1 hidden sm:inline">•</span>
              <Clock size={10} className="text-gray-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">
                {admin.horario_previsto.slice(0, 5)}
              </span>
            </div>
          </div>
          
          <DropdownStatus admin={admin} />
        </div>

        {/* Corpo do Card */}
        <div className="p-2 sm:p-3">
          <h3 className="text-sm sm:text-base font-semibold text-odara-dark line-clamp-2 mb-1 sm:mb-2">
            {admin.medicamento.nome}
          </h3>

          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-600">Dosagem:</span>
                <span className="text-gray-800 truncate max-w-[120px] sm:max-w-none">
                  {admin.medicamento.dosagem || 'Não informado'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <User size={10} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-800 truncate max-w-[100px] sm:max-w-[150px]">
                  {admin.residente.nome}
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-600">Obs:</span>
                <span className="text-gray-800 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 ml-1">
                  {admin.observacao || 'Nenhuma'}
                </span>
              </div>
              <button
                onClick={() => handleEditObservation(admin)}
                className="text-odara-accent hover:text-odara-secondary transition-colors flex-shrink-0 ml-2"
                title="Editar observação"
              >
                <Edit size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <button
              onClick={() => handleStatusClick(admin.id, "administrado")}
              className={`flex items-center justify-center gap-1 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                admin.status === "administrado" 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
              }`}
            >
              <CheckCircle size={10} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Ok</span>
              <span className="xs:hidden sm:hidden xs:inline">✓</span>
            </button>
            
            <button
              onClick={() => handleStatusClick(admin.id, "parcial")}
              className={`flex items-center justify-center gap-1 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                admin.status === "parcial" 
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200'
              }`}
            >
              <MinusCircle size={10} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Parcial</span>
              <span className="xs:hidden sm:hidden xs:inline">~</span>
            </button>
            
            <button
              onClick={() => handleStatusClick(admin.id, "nao_administrado")}
              className={`flex items-center justify-center gap-1 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                admin.status === "nao_administrado" 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
              }`}
            >
              <XCircle size={10} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Não</span>
              <span className="xs:hidden sm:hidden xs:inline">✗</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SecaoFiltros = () => {
    if (!filtrosAberto) return null;

    return (
      <div className="mb-4 bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Filtro de Residente */}
          <div>
            <div className='flex gap-1 items-center mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Residente</label>
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

          {/* Filtro de Status */}
          <div>
            <div className='flex gap-1 items-center mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Status</label>
            </div>
            <FiltroDropdown
              titulo="Todos os status"
              aberto={filtroStatusAberto}
              setAberto={setFiltroStatusAberto}
              ref={filtroStatusRef}
              valorSelecionado={filtros.status || 'todos'}
              onSelecionar={selecionarStatus}
              tipo="status"
            />
          </div>

          {/* Data Inicial */}
          <div>
            <div className='flex gap-1 items-center mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Data Inicial</label>
            </div>
            <input
              type="date"
              value={filtros.startDate || ''}
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, startDate: e.target.value || null }));
              }}
              className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-odara-primary border-gray-300"
            />
          </div>

          {/* Data Final */}
          <div>
            <div className='flex gap-1 items-center mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Data Final</label>
            </div>
            <input
              type="date"
              value={filtros.endDate || ''}
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, endDate: e.target.value || null }));
              }}
              className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-odara-primary border-gray-300"
            />
          </div>
        </div>

        <div className="mt-3 sm:mt-4 flex justify-end">
          <button
            onClick={limparFiltros}
            className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    );
  };

  const Cabecalho = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Pill size={24} className='text-odara-accent sm:w-8 sm:h-8' />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-odara-dark">
              Checklist de Medicamentos
            </h1>
            <p className="text-[10px] sm:text-sm text-gray-600">
              Controle diário de administrações
            </p>
          </div>
        </div>
        
        <div className="bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-gray-200">
          <div className="flex items-center gap-1 sm:gap-2">
            <Pill className="text-odara-accent" size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium text-odara-dark">
              {listaCompleta.length} administrações
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-odara-offwhite">
      <div className="p-2 sm:p-4 md:p-6 lg:p-8">
        <Cabecalho />

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
          {/* Barra de Busca */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <Search className="text-odara-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar medicamento ou residente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-odara-primary text-sm sm:text-base"
            />
          </div>

          {/* Botão ativador do modal de filtros */}
          <button
            onClick={toggleFiltros}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition text-sm min-w-[90px] sm:min-w-[120px]"
          >
            <Filter size={14} className="text-odara-accent sm:w-5 sm:h-5" />
            <span className="hidden xs:inline sm:inline">{!filtrosAberto ? 'Filtros' : 'Fechar'}</span>
            <span className="xs:hidden sm:hidden">{!filtrosAberto ? 'Filtros' : 'X'}</span>
          </button>
        </div>

        <SecaoFiltros />

        {/* Lista de Medicamentos */}
        <div className="bg-white border-l-2 sm:border-l-4 border-odara-primary rounded-lg sm:rounded-xl shadow p-2 sm:p-4 md:p-6">
          {(filtros.residenteId || filtros.status || searchTerm || filtros.startDate || filtros.endDate) && (
            <div className="mb-2 sm:mb-3 flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
              {searchTerm && (
                <span className="bg-odara-accent text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
                  <Search size={8} className="sm:w-3 sm:h-3" />
                  <span className="truncate max-w-[80px] sm:max-w-none">"{searchTerm}"</span>
                </span>
              )}
              {filtros.residenteId && (
                <span className="bg-odara-secondary text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
                  <User size={8} className="sm:w-3 sm:h-3" />
                  <span className="truncate max-w-[100px] sm:max-w-[150px]">
                    {residentes.find(r => r.id === filtros.residenteId)?.nome}
                  </span>
                </span>
              )}
              {filtros.status && filtros.status !== 'todos' && (
                <span className="bg-odara-secondary text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full truncate">
                  Status: {filtros.status}
                </span>
              )}
              {(filtros.startDate || filtros.endDate) && (
                <span className="bg-odara-primary/20 text-odara-primary px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
                  <Calendar size={8} className="sm:w-3 sm:h-3" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {filtros.startDate && formatarData(filtros.startDate)}
                    {filtros.endDate && ` - ${formatarData(filtros.endDate)}`}
                  </span>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="p-4 sm:p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
              <p className="text-odara-dark/60 text-sm sm:text-base">Carregando administrações...</p>
            </div>
          ) : gruposRenderizaveis.length === 0 ? (
            <div className="p-4 sm:p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
              <Pill className="mx-auto text-gray-300 mb-2 sm:mb-3" size={24} className="sm:w-12 sm:h-12" />
              <p className="text-odara-dark/60 text-sm sm:text-base">
                Nenhuma administração encontrada
              </p>
              <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {gruposRenderizaveis.map(grupo => {
                const pendentes = grupo.itens.filter(item => item.status === 'pendente').length;
                
                return (
                  <div key={`group-${grupo.dataFormatada}`} className="bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200">
                    {/* Cabeçalho da Data */}
                    <div 
                      className="bg-gradient-to-r from-odara-primary/10 to-odara-accent/10 p-2 sm:p-3 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleDate(grupo.dataFormatada)}
                    >
                      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                        {grupo.isExpandido ? 
                          <ChevronDown className="text-odara-accent flex-shrink-0" size={12} className="sm:w-5 sm:h-5" /> : 
                          <ChevronRight className="text-odara-accent flex-shrink-0" size={12} className="sm:w-5 sm:h-5" />
                        }
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 overflow-hidden">
                          <h2 className="text-sm sm:text-lg font-bold text-odara-dark truncate">
                            {formatarData(grupo.dataFormatada)}
                          </h2>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="bg-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-medium">
                              {grupo.itens.length} item{grupo.itens.length !== 1 ? 's' : ''}
                            </span>
                            {pendentes > 0 && (
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-amber-200 text-[10px] sm:text-xs font-medium">
                                {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Medicamentos */}
                    {grupo.isExpandido && (
                      <div className="p-2 sm:p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                          {grupo.itens.map(admin => (
                            <CardAdministracao key={admin.id} admin={admin} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-400 px-1 sm:px-2">
          Mostrando {gruposRenderizaveis.reduce((acc, grupo) => acc + grupo.itens.length, 0)} de {listaCompleta.length} administrações
          {(searchTerm || filtros.residenteId || filtros.status) && ' com filtros aplicados'}
        </div>

        {ObservacaoModal}
      </div>
    </div>
  );
};

export default Medicamentos;