import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FaExclamationCircle,
  FaFilter,
  FaChevronDown,
  FaChevronRight,
  FaRegCommentAlt,
  FaClock,
  FaUser,
  FaPills,
  FaCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaMinusCircle,
  FaCalendarAlt,
  FaSearch,
  FaTrash,
  FaEdit,
  FaInfoCircle,
  FaSyringe
} from 'react-icons/fa';
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

const COR_STATUS: Record<string, { bola: string; bg: string; text: string; border: string; icon: any }> = {
  administrado: { 
    bola: 'bg-green-500', 
    bg: 'bg-green-50', 
    text: 'text-odara-dark font-semibold', 
    border: 'border-b border-green-200',
    icon: FaCheckCircle
  },
  parcial: { 
    bola: 'bg-yellow-500', 
    bg: 'bg-yellow-50', 
    text: 'text-odara-dark font-semibold', 
    border: 'border-b border-yellow-200',
    icon: FaMinusCircle
  },
  nao_administrado: { 
    bola: 'bg-red-500', 
    bg: 'bg-red-50', 
    text: 'text-odara-dark font-semibold', 
    border: 'border-b border-red-200',
    icon: FaTimesCircle
  },
  pendente: { 
    bola: 'bg-gray-400', 
    bg: 'bg-gray-50', 
    text: 'text-odara-dark font-semibold', 
    border: 'border-b border-gray-200',
    icon: FaClock
  }
};

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'administrado', label: 'Administrado' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'nao_administrado', label: 'Não Administrado' }
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
  const [dateError, setDateError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);
  const [infoVisivel, setInfoVisivel] = useState(false);

  const { usuario } = useUser();
  const { openModal, ObservacaoModal } = useObservacaoModal();

  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroStatusRef = useRef<HTMLDivElement>(null);

  const [filtros, setFiltros] = useState({
    residenteId: null as number | null,
    status: null as string | null,
    startDate: getTodayString() as string | null,
    endDate: getTodayString() as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: adminData, error: adminErr } = await supabase
          .from("administracao_medicamento")
          .select("*");

        if (adminErr) throw adminErr;
        setAdministracoes(adminData || []);

        const medicamentoIds = [...new Set(adminData.map(a => a.id_medicamento))];

        const { data: medsData, error: medsErr } = await supabase
          .from("medicamento")
          .select("*")
          .in("id", medicamentoIds);

        if (medsErr) throw medsErr;

        setMedicamentos(medsData || []);

        const { data: resData, error: resErr } = await supabase
          .from("residente")
          .select("id, nome, quarto");

        if (resErr) throw resErr;
        setResidentes(resData || []);

      } catch (err) {
        console.error("Erro ao buscar dados:", err);
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
      // Filtro por nome do medicamento
      if (searchTerm.trim() &&
        !admin.medicamento.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por residente
      if (residenteId && admin.residente.id !== residenteId) return false;
      
      // Filtro por status
      if (status && status !== 'todos' && admin.status !== status) return false;

      // Filtro por data
      if (startDate && endDate) {
        if (admin.data_prevista < startDate || admin.data_prevista > endDate) return false;
      } else if (startDate) {
        if (admin.data_prevista < startDate) return false;
      } else if (endDate) {
        if (admin.data_prevista > endDate) return false;
      }

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
      const obs = await openModal("");
      if (obs) updateStatus(adminId, status, obs);
      else if (status === "administrado") updateStatus(adminId, status);
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
    return data.split('-').reverse().join('/');
  };

  const obterResidentesUnicos = () => {
    const residentesMap = new Map();
    listaCompleta
      .filter(m => m.residente)
      .forEach(m => {
        if (m.residente) {
          residentesMap.set(m.residente.id, m.residente.nome);
        }
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
    setFiltros({ residenteId: null, status: null, startDate: null, endDate: null });
    setSearchTerm('');
    setFiltroResidenteAberto(false);
    setFiltroStatusAberto(false);
  };

  const toggleDropdown = (id: number) => {
    setDropdownAberto(dropdownAberto === id ? null : id);
  };

  const DropdownStatus = ({ admin }: { admin: AdministracaoComDetalhes }) => {
    const cores = COR_STATUS[admin.status] || COR_STATUS.pendente;
    const IconeStatus = cores.icon;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(admin.id)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
        >
          <IconeStatus size={14} className={"text-odara-accent"} />
          <span className="text-odara-dark capitalize">{admin.status.replace('_', ' ')}</span>
          <FaChevronDown size={12} className="text-gray-500" />
        </button>

        {dropdownAberto === admin.id && (
          <>
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setDropdownAberto(null)}
            ></div>

            <div className="absolute top-full left-0 right-0 sm:right-auto sm:left-0 mt-1 w-full sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = COR_STATUS[option.value].icon;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusClick(admin.id, option.value);
                      setDropdownAberto(null);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${
                      admin.status === option.value
                        ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    <OptionIcon size={14} className={"text-odara-accent"} />
                    <span className="capitalize">{option.label}</span>
                    {admin.status === option.value && (
                      <FaCheck className="ml-auto text-odara-primary" size={14} />
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
    const residentes = obterResidentesUnicos();

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex items-center justify-between w-full h-11 border border-gray-300 rounded-lg px-3 text-sm hover:bg-gray-50 transition-colors"
        >
          <span className="text-odara-dark truncate">
            {tipo === 'residente'
              ? valorSelecionado
                ? residentes.find(([id]) => id === valorSelecionado)?.[1]
                : titulo
              : valorSelecionado
                ? FILTRO_STATUS_OPTIONS.find(opt => opt.value === valorSelecionado)?.label
                : titulo
            }
          </span>
          <FaChevronDown size={12} className="text-gray-500 flex-shrink-0" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-60 overflow-y-auto">
            {tipo === 'residente' ? (
              <>
                <button
                  onClick={() => onSelecionar(null)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${
                    !valorSelecionado
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  <span>Todos os residentes</span>
                  {!valorSelecionado && <FaCheck className="ml-auto text-odara-primary" size={14} />}
                </button>
                {residentes.map(([id, nome]) => (
                  <button
                    key={id}
                    onClick={() => onSelecionar(id)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${
                      valorSelecionado === id
                        ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="truncate">{nome}</span>
                    {valorSelecionado === id && <FaCheck className="ml-auto text-odara-primary" size={14} />}
                  </button>
                ))}
              </>
            ) : (
              FILTRO_STATUS_OPTIONS.map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => onSelecionar(opcao.value)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${
                    (opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  <span>{opcao.label}</span>
                  {((opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value) && (
                    <FaCheck className="ml-auto text-odara-primary" size={14} />
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

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex items-center justify-between p-3 rounded-t-lg ${cores.border} ${cores.bg}`}>
          <div className="flex items-center flex-1 min-w-0">
            <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${cores.bola}`}></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 overflow-hidden">
              <p className={`text-sm ${cores.text} truncate`}>
                <FaCalendarAlt className="inline mr-1" size={12} />
                {formatarData(admin.data_prevista)}
              </p>
              <span className="hidden sm:inline text-gray-400">•</span>
              <p className="text-sm text-gray-600 truncate">
                <FaClock className="inline mr-1" size={12} />
                {admin.horario_previsto.slice(0, 5)}
              </p>
            </div>
          </div>

          {/* Botão de Status Mobile */}
          <div className="sm:hidden">
            <DropdownStatus admin={admin} />
          </div>
          
          {/* Status Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <DropdownStatus admin={admin} />
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Título do Corpo */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold text-odara-dark line-clamp-2 flex-1">
              {admin.medicamento.nome}
            </h3>
          </div>

          {/* Detalhes do Corpo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
            {/* Coluna Esquerda */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm block">Dosagem:</strong>
                <span className="text-odara-name text-xs sm:text-sm mt-0.5 block">
                  {admin.medicamento.dosagem || 'Não informado'}
                </span>
              </div>

              <div>
                <strong className="text-odara-dark text-xs sm:text-sm block">Residente:</strong>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FaUser className="text-gray-400" size={12} />
                  <span className="text-odara-name text-xs sm:text-sm">{admin.residente.nome}</span>
                </div>
                {admin.residente.quarto && (
                  <span className="text-xs text-odara-dark bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                    Quarto: {admin.residente.quarto}
                  </span>
                )}
              </div>
            </div>
            
            {/* Coluna Direita */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm block">Status atual:</strong>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {cores.icon({ size: 12, className: "text-odara-accent" })}
                  <span className="text-odara-name text-xs sm:text-sm capitalize">
                    {admin.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm block">Observação:</strong>
                <div className="flex items-start gap-1.5 mt-0.5">
                  <FaRegCommentAlt className="text-gray-400 mt-0.5 flex-shrink-0" size={12} />
                  <span className="text-odara-name text-xs sm:text-sm flex-1 line-clamp-2">
                    {admin.observacao || 'Nenhuma observação'}
                  </span>
                  {admin.observacao && (
                    <button
                      onClick={() => handleEditObservation(admin)}
                      className="text-odara-accent hover:text-odara-secondary transition-colors flex-shrink-0"
                      title="Editar observação"
                    >
                      <FaEdit size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Card - Botões de ação */}
        <div className="px-3 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 mt-auto">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleStatusClick(admin.id, "administrado")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${
                  admin.status === "administrado" 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                }`}
              >
                <FaCheckCircle size={14} className="mb-1" />
                <span className="hidden xs:inline">Ok</span>
              </button>
              
              <button
                onClick={() => handleStatusClick(admin.id, "parcial")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${
                  admin.status === "parcial" 
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200'
                }`}
              >
                <FaMinusCircle size={14} className="mb-1" />
                <span className="hidden xs:inline">Parcial</span>
              </button>
              
              <button
                onClick={() => handleStatusClick(admin.id, "nao_administrado")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${
                  admin.status === "nao_administrado" 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                }`}
              >
                <FaTimesCircle size={14} className="mb-1" />
                <span className="hidden xs:inline">Não</span>
              </button>
            </div>
            
            <button
              onClick={() => handleEditObservation(admin)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                admin.observacao 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              <FaRegCommentAlt size={12} />
              {admin.observacao ? 'Editar Observação' : 'Adicionar Observação'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SecaoFiltros = () => {
    if (!filtrosAberto) return null;

    return (
      <div className="mb-6 bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro de Residente */}
          <div>
            <div className='flex gap-1 items-center mb-1'>
              <FaFilter size={10} className="text-odara-accent" />
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
              <FaFilter size={10} className="text-odara-accent" />
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

          {/* Filtro de Datas */}
          <div>
            <div className='flex gap-1 items-center mb-1'>
              <FaFilter size={10} className="text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Período</label>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={filtros.startDate || ''}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, startDate: e.target.value || null }));
                  setDateError(null);
                }}
                className={`flex-1 border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent ${
                  dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <input
                type="date"
                value={filtros.endDate || ''}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, endDate: e.target.value || null }));
                  setDateError(null);
                }}
                className={`flex-1 border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent ${
                  dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {dateError && (
              <div className="flex items-center mt-1 text-red-600 text-xs">
                <FaExclamationCircle className="mr-1" />
                {dateError}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={limparFiltros}
            className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition text-xs sm:text-sm"
          >
            <FaTrash size={12} />
            Limpar Filtros
          </button>
        </div>
      </div>
    );
  };

  const Cabecalho = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <FaPills size={28} className='text-odara-accent'/>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-odara-dark">
              Checklist de Medicamentos
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Controle diário de administrações
            </p>
          </div>
          <div className="relative">
            <button
              onMouseEnter={() => setInfoVisivel(true)}
              onMouseLeave={() => setInfoVisivel(false)}
              onTouchStart={() => setInfoVisivel(!infoVisivel)}
              className="transition-colors duration-200"
            >
              <FaInfoCircle size={16} className="text-odara-accent hover:text-odara-secondary" />
            </button>
            {infoVisivel && (
              <div className="absolute z-10 left-0 top-full mt-2 w-64 p-3 bg-odara-dropdown text-odara-name text-xs sm:text-sm rounded-lg shadow-lg">
                <h3 className="font-bold mb-1">Checklist de Medicamentos</h3>
                <p>Controle diário das administrações de medicamentos dos residentes.</p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-odara-dropdown"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <FaSyringe className="text-odara-accent" size={14} />
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
      <div className="p-3 sm:p-4 md:p-6">
        <Cabecalho />

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Barra de Busca */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-odara-primary h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar medicamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Botão ativador do modal de filtros */}
          <div className="flex gap-2">
            <button
              onClick={toggleFiltros}
              className="flex items-center gap-2 bg-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition text-sm"
            >
              <FaFilter size={16} className="text-odara-accent" />
              <span className="hidden sm:inline">
                {!filtrosAberto ? 'Abrir ' : 'Fechar '} Filtros
              </span>
              <span className="sm:hidden">Filtros</span>
            </button>
          </div>
        </div>

        <SecaoFiltros />

        {/* Lista de Medicamentos */}
        <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
          {(filtros.residenteId || filtros.status || searchTerm || filtros.startDate || filtros.endDate) && (
            <div className="mb-4 flex flex-wrap gap-1.5 sm:gap-2 text-xs">
              {filtros.residenteId && (
                <span className="bg-odara-secondary text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1">
                  <FaUser size={10} />
                  {residentes.find(r => r.id === filtros.residenteId)?.nome}
                </span>
              )}
              {filtros.status && filtros.status !== 'todos' && (
                <span className="bg-odara-secondary text-white px-2 sm:px-3 py-1 rounded-full">
                  Status: {filtros.status}
                </span>
              )}
              {searchTerm && (
                <span className="bg-odara-accent text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1">
                  <FaSearch size={10} />
                  "{searchTerm}"
                </span>
              )}
              {(filtros.startDate || filtros.endDate) && (
                <span className="bg-odara-primary/20 text-odara-primary px-2 sm:px-3 py-1 rounded-full flex items-center gap-1">
                  <FaCalendarAlt size={10} />
                  {filtros.startDate && formatarData(filtros.startDate)}
                  {filtros.endDate && ` - ${formatarData(filtros.endDate)}`}
                </span>
              )}
            </div>
          )}

          {gruposRenderizaveis.length === 0 ? (
            <div className="p-6 sm:p-8 rounded-xl bg-odara-name/10 text-center">
              <FaPills className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-odara-dark/60 text-base sm:text-lg">
                Nenhuma administração encontrada
              </p>
              <p className="text-odara-dark/40 text-xs sm:text-sm mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {gruposRenderizaveis.map(grupo => {
                const pendentes = grupo.itens.filter(item => item.status === 'pendente').length;
                
                return (
                  <div key={`group-${grupo.dataFormatada}`} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                    {/* Cabeçalho da Data */}
                    <div 
                      className="bg-gradient-to-r from-odara-primary/10 to-odara-accent/10 p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer select-none"
                      onClick={() => toggleDate(grupo.dataFormatada)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {grupo.isExpandido ? 
                          <FaChevronDown className="text-odara-accent flex-shrink-0" size={16} /> : 
                          <FaChevronRight className="text-odara-accent flex-shrink-0" size={16} />
                        }
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
                          <h2 className="text-lg sm:text-xl font-bold text-odara-dark truncate">
                            {formatarData(grupo.dataFormatada)}
                          </h2>
                          <div className="flex items-center gap-2">
                            <span className="bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-xs font-medium">
                              {grupo.itens.length} item{grupo.itens.length !== 1 ? 's' : ''}
                            </span>
                            {pendentes > 0 && (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-amber-200 text-xs font-medium">
                                {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Medicamentos */}
                    {grupo.isExpandido && (
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
        <div className="mt-4 text-xs sm:text-sm text-gray-400 px-2">
          Mostrando {gruposRenderizaveis.reduce((acc, grupo) => acc + grupo.itens.length, 0)} de {listaCompleta.length} administrações
          {(searchTerm || filtros.residenteId || filtros.status) && ' com filtros aplicados'}
        </div>

        {ObservacaoModal}
      </div>
    </div>
  );
};

export default Medicamentos;