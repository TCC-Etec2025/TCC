// src/components/RegistroExames.tsx
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Filter, Search, CheckCircle, Clock, CircleX, Plus, Edit, Trash, Info, ChevronDown, Check, Calendar, Beaker, AlertTriangle, Download, Microscope } from 'lucide-react';

import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

import ModalExames from './ModalExames';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Consulta = {
  id: number;
  data_consulta: string;
  horario: string;
  medico: string;
  id_residente?: number | null;
};

type Exame = {
  id: number;
  id_consulta: number | null;
  id_residente: number;
  tipo: string;
  laboratorio: string;
  data: string;
  horario: string;
  resultado: string | null;
  arquivo_resultado: string | null;
  status: string;
  observacao: string | null;
  criado_em?: string | null;
  residente?: Residente | null;
  consulta?: Consulta | null;
};

/* Constantes */
const COR_STATUS: Record<string, {
  bola: string;
  bg: string;
  text: string;
  border: string
}> = {
  pendente: {
    bola: 'bg-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-yellow-200'
  },
  realizado: {
    bola: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-green-200'
  },
  cancelado: {
    bola: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-red-200'
  }
};

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' }
];

const RegistroExames: React.FC = () => {
  // Estados principais
  const [exames, setExames] = useState<Exame[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [exameSelecionado, setExameSelecionado] = useState<Exame | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados de exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [exameParaExcluir, setExameParaExcluir] = useState<number | null>(null);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{
    residenteId: number | null;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    residenteId: null,
    status: null,
    startDate: null,
    endDate: null
  });

  // Estados de UI
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);

  // Refs para dropdowns
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroStatusRef = useRef<HTMLDivElement>(null);

  /* Utilitários */
  const obterIconeStatus = (status: string) => {
    switch (status) {
      case "pendente": return Clock;
      case "realizado": return CheckCircle;
      case "cancelado": return CircleX;
      default: return Clock;
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarHora = (hora: string) => {
    return hora.slice(0, 5);
  };

  const formatarDataHora = (data: string, hora: string) => {
    return `${formatarData(data)} às ${formatarHora(hora)}`;
  };

  const baixarArquivo = async (caminhoArquivo: string, nomeExame: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('exames')
        .download(caminhoArquivo);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultado-${nomeExame.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Arquivo baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const obterResidentesUnicos = () => {
    const residentesMap = new Map();
    exames
      .filter(e => e.residente)
      .forEach(e => {
        if (e.residente) {
          residentesMap.set(e.residente.id, e.residente.nome);
        }
      });
    return Array.from(residentesMap.entries());
  };

  /* Efeitos */
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

  /* Carregar Dados */
  const carregarExames = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('exame')
        .select(`
          *,
          residente:residente(id, nome, quarto),
          consulta:consulta(id, data_consulta, horario, medico)
        `)
        .order('data_prevista', { ascending: false })
        .order('horario_previsto', { ascending: true });

      if (error) throw error;
      setExames(data || []);
    } catch (error) {
      console.error('Erro ao buscar exames:', error);
      toast.error('Erro ao carregar exames');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarResidentes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('residente')
        .select('id, nome, quarto')
        .order('nome');

      if (!error) setResidentes(data || []);
    } catch (err) {
      console.error('Erro ao carregar residentes:', err);
    }
  }, []);

  useEffect(() => {
    carregarExames();
    carregarResidentes();
  }, [carregarExames, carregarResidentes]);

  /* Handlers de Exclusão */
  const abrirModalExclusao = (id: number) => {
    setExameParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setExameParaExcluir(null);
  };

  const executarExclusao = async () => {
    if (!exameParaExcluir) return;

    try {
      const { error } = await supabase
        .from("exame")
        .delete()
        .eq("id", exameParaExcluir);

      if (error) throw error;

      // Atualiza a lista localmente
      setExames(prev => prev.filter(e => e.id !== exameParaExcluir));
      toast.success('Exame excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir exame:', err);
      toast.error('Erro ao excluir exame');
    } finally {
      fecharModalExclusao();
    }
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      // Atualizar localmente primeiro para feedback imediato
      setExames(prev => prev.map(exame =>
        exame.id === id
          ? { ...exame, status: novoStatus }
          : exame
      ));

      // Atualiza no banco de dados
      const { error } = await supabase
        .from('exame')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      setDropdownAberto(null);
      toast.success('Status atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Falha ao atualizar status.');
      // Reverter em caso de erro
      carregarExames();
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (exame: Exame) => {
    setExameSelecionado(exame);
    setModalAberto(true);
  };

  const abrirModalNovo = () => {
    setExameSelecionado(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setExameSelecionado(null);
    carregarExames();
  };

  const toggleDropdown = (id: number) => {
    setDropdownAberto(dropdownAberto === id ? null : id);
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
      status: null,
      residenteId: null,
      startDate: null,
      endDate: null
    });
    setSearchTerm('');
    setFiltroStatusAberto(false);
    setFiltroResidenteAberto(false);
  };

  /* Filtragem e Ordenação */
  const examesFiltrados = useMemo(() => {
    return exames
      .filter(exame => {
        // Filtro por texto (busca em tipo, laboratório, resultado)
        if (searchTerm.trim()) {
          const termo = searchTerm.toLowerCase();
          const buscaTipo = exame.tipo.toLowerCase().includes(termo);
          const buscaLaboratorio = exame.laboratorio.toLowerCase().includes(termo);
          const buscaResultado = exame.resultado?.toLowerCase().includes(termo) || false;
          
          if (!buscaTipo && !buscaLaboratorio && !buscaResultado) {
            return false;
          }
        }

        // Filtro por residente
        if (filtros.residenteId && exame.residente?.id !== filtros.residenteId) {
          return false;
        }

        // Filtro por status
        if (filtros.status && filtros.status !== 'todos' && exame.status !== filtros.status) {
          return false;
        }

        // Filtro "Até a data" (endDate)
        if (filtros.endDate && exame.data > filtros.endDate) {
          return false;
        }

        // Filtro "A partir da data" (startDate)
        if (filtros.startDate) {
          if (exame.data >= filtros.startDate) {
            return true;
          }          
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Ordenar por data prevista (mais recente primeiro)
        const dataA = new Date(`${a.data}T${a.horario}`).getTime();
        const dataB = new Date(`${b.data}T${b.horario}`).getTime();

        return dataB - dataA;
      });
  }, [exames, searchTerm, filtros]);

  /* Componentes de UI */
  const DropdownStatus = ({ exame }: { exame: Exame }) => {
    const IconeStatus = obterIconeStatus(exame.status);

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(exame.id)}
          className="flex items-center gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconeStatus size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
          <span className="text-odara-dark capitalize">{exame.status}</span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500" />
        </button>

        {dropdownAberto === exame.id && (
          <>
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setDropdownAberto(null)}
            ></div>

            <div className="absolute top-full sm:right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = obterIconeStatus(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      atualizarStatus(exame.id, option.value);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${exame.status === option.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <OptionIcon size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
                    <span className="capitalize">{option.label}</span>
                    {exame.status === option.value && (
                      <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
    onSelecionar: (value: string | number | null) => void;
    tipo: 'residente' | 'status';
  }) => {
    const residentesUnicos = obterResidentesUnicos();

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex items-center justify-between w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors"
        >
          <span className="text-odara-dark truncate">
            {tipo === 'residente'
              ? valorSelecionado
                ? residentesUnicos.find(([id]) => id === valorSelecionado)?.[1]
                : titulo
              : valorSelecionado
                ? FILTRO_STATUS_OPTIONS.find(opt => opt.value === valorSelecionado)?.label
                : titulo
            }
          </span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500 shrink-0" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
            {tipo === 'residente' ? (
              <>
                <button
                  onClick={() => onSelecionar(null)}
                  className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${!valorSelecionado
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  <span>Todos os residentes</span>
                  {!valorSelecionado && <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                </button>

                {residentesUnicos.map(([id, nome]) => (
                  <button
                    key={id}
                    onClick={() => onSelecionar(id)}
                    className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === id
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <span className="truncate">{nome}</span>
                    {valorSelecionado === id && <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                  </button>
                ))}
              </>
            ) : (
              FILTRO_STATUS_OPTIONS.map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => onSelecionar(opcao.value)}
                  className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${(opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  <span>{opcao.label}</span>
                  {((opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value) && (
                    <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const CardExame = ({ exame }: { exame: Exame }) => {
    const cores = COR_STATUS[exame.status] || COR_STATUS.pendente;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex flex-wrap justify-center sm:justify-between gap-2 items-center p-2 sm:p-3 rounded-t-lg ${cores.border} ${cores.bg}`}>
          {/* Coluna Esquerda */}
          <div className="flex items-center">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 ${cores.bola}`}></div>
            <p className={`text-xs sm:text-sm md:text-base text-odara-dark`}>
              <span className='font-semibold'>
                {`Realizado: ${formatarDataHora(exame.data, exame.horario)}`}
              </span>
            </p>
          </div>

          {/* Coluna Direita - Status */}
          <DropdownStatus exame={exame} />
        </div>

        {/* Corpo do Card */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Título do Corpo */}
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-odara-dark line-clamp-1 flex-1">
              {exame.tipo}
            </h3>

            {/* Botões de ação */}
            <div className="flex items-center gap-1 ml-2">
              {exame.arquivo_resultado && (
                <button
                  onClick={() => baixarArquivo(exame.arquivo_resultado!, exame.tipo)}
                  className="text-odara-primary hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-primary"
                  title="Baixar resultado"
                >
                  <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              )}

              <button
                onClick={() => abrirModalEdicao(exame)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar exame"
              >
                <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>

              <button
                onClick={() => abrirModalExclusao(exame.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir exame"
              >
                <Trash size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Detalhes do Exame */}
          <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 flex-1">
            {/* Coluna Esquerda */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Laboratório:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {exame.laboratorio || 'Não informado'}
                </span>
              </div>

              {exame.consulta && (
                <div>
                  <strong className="text-odara-dark text-xs sm:text-sm">Consulta associada:</strong>
                  <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                    {formatarDataHora(exame.consulta.data_consulta, exame.consulta.horario)} com {exame.consulta.medico}
                  </span>
                </div>
              )}

              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Resultado:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {exame.resultado || 'Aguardando resultado'}
                </span>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Data de Previsão:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {formatarDataHora(exame.data, exame.horario)}
                </span>
              </div>

              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Observações:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {exame.observacao || 'Nenhuma observação'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Card */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-wrap justify-center sm:justify-between gap-1 sm:gap-2 text-xs">
            <div className="flex items-center flex-wrap gap-1 justify-center sm:justify-start">
              <span className="bg-odara-accent text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Beaker size={10} className="sm:w-3 sm:h-3" />
                {exame.residente?.nome || 'Residente'}
              </span>

              {exame.residente?.quarto && (
                <span className="text-xs text-odara-dark">
                  • {exame.residente.quarto}
                </span>
              )}
            </div>

            <div className="text-xs text-odara-name flex items-center gap-1 justify-center sm:justify-start">
              <Calendar size={9} className="sm:w-2.5 sm:h-2.5" />
              Cadastrado: {exame.criado_em ? formatarData(exame.criado_em) : formatarData(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SecaoFiltros = () => {
    if (!filtrosAberto) return null;

    return (
      <div className="mb-6 bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200 animate-fade-in">
        {/* Primeira Linha */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-5 w-full">
          <div className='flex flex-col md:flex-row flex-1 gap-4 sm:gap-5 w-full'>
            {/* Filtro de Residente */}
            <div className="flex-1 min-w-0">
              <div className='flex gap-1 items-center ml-1 mb-1'>
                <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
                <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Residente</label>
              </div>

              <FiltroDropdown
                titulo="Todos os residentes"
                aberto={filtroResidenteAberto}
                setAberto={setFiltroResidenteAberto}
                ref={filtroResidenteRef}
                valorSelecionado={filtros.residenteId}
                onSelecionar={selecionarResidente as (value: string | number | null) => void}
                tipo="residente"
              />
            </div>

            {/* Filtro de Status */}
            <div className="flex-1 min-w-0">
              <div className='flex gap-1 items-center ml-1 mb-1'>
                <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
                <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Status</label>
              </div>

              <FiltroDropdown
                titulo="Todos os status"
                aberto={filtroStatusAberto}
                setAberto={setFiltroStatusAberto}
                ref={filtroStatusRef}
                valorSelecionado={filtros.status || 'todos'}
                onSelecionar={selecionarStatus as (value: string | number | null) => void}
                tipo="status"
              />
            </div>
          </div>

          {/* Botão Limpar Filtros/Busca */}
          <div className="flex md:items-end gap-2 pt-1 md:pt-0 md:shrink-0">
            <button
              onClick={limparFiltros}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full md:w-auto justify-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Segunda Linha (Filtro de Data) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200">
          {/* A Partir da Data */}
          <div>
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">A Partir da Data</label>
            </div>

            <input
              type="date"
              value={filtros.startDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value || null }))}
              className="w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mostra apenas exames realizados ou previstos a partir desta data
            </p>
          </div>

          {/* Até a Data */}
          <div>
            <div className="flex gap-1 items-center ml-1 mb-1">
              <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Até a Data</label>
            </div>

            <input
              type="date"
              value={filtros.endDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value || null }))}
              className="w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mostra apenas exames realizados ou previstos até esta data
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    // Obter o título do exame para exibir no modal
    const exame = exameParaExcluir
      ? exames.find(e => e.id === exameParaExcluir)
      : null;
    const nomeExame = exame?.tipo || '';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full animate-scale-in">
          <div className="text-center">
            {/* Ícone de alerta */}
            <div className="mx-auto flex items-center justify-center h-12 sm:h-14 w-12 sm:w-14 rounded-full bg-odara-alerta/10 mb-3 sm:mb-4">
              <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-odara-alerta" />
            </div>

            {/* Textos do modal */}
            <h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
            <p className="text-odara-name text-sm sm:text-base mb-3 sm:mb-4">
              Tem certeza que deseja excluir este exame?
            </p>

            {/* Detalhes do exame */}
            {nomeExame && (
              <div className="bg-odara-offwhite rounded-lg p-3 mb-3 sm:mb-4 border border-gray-200">
                <p className="text-sm font-medium text-odara-dark">Exame:</p>
                <p className="text-sm font-semibold text-odara-name truncate" title={nomeExame}>
                  {nomeExame}
                </p>
              </div>
            )}

            <p className="text-xs sm:text-sm text-odara-alerta mb-4 sm:mb-6 font-medium">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões de ação */}
            <div className="flex gap-2 sm:gap-3 justify-center">
              <button
                onClick={fecharModalExclusao}
                className="px-4 sm:px-6 py-2 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 flex-1 text-sm"
                autoFocus
              >
                Cancelar
              </button>

              <button
                onClick={executarExclusao}
                className="px-4 sm:px-5 py-2 bg-odara-alerta text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex-1 text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ListaExames = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Exames</h2>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Total: {examesFiltrados.length}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.status || filtros.residenteId || filtros.startDate || filtros.endDate || searchTerm) && (
          <div className="mb-3 flex flex-wrap justify-center sm:justify-start gap-1 text-xs">
            {searchTerm && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Busca: {searchTerm}
              </span>
            )}

            {filtros.residenteId && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
              </span>
            )}

            {filtros.status && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Status: {filtros.status}
              </span>
            )}

            {(filtros.startDate || filtros.endDate) && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Data: {filtros.startDate ? ` ${filtros.startDate.split('-').reverse().join('/')}` : ''}
                {filtros.endDate ? ' até' + ` ${filtros.endDate.split('-').reverse().join('/')}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Lista ou mensagem de vazio */}
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando exames...</p>
          </div>
        ) : examesFiltrados.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              {exames.length === 0 ? 'Nenhum exame cadastrado' : 'Nenhum exame encontrado'}
            </p>

            {exames.length > 0 && (
              <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
            {examesFiltrados.map(exame => (
              <CardExame
                key={exame.id}
                exame={exame}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const Cabecalho = () => {
    const [infoVisivel, setInfoVisivel] = useState(false);

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3 w-full">
          <Microscope size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                Registro de Exames
              </h1>
              
              <button
                onClick={() => setInfoVisivel(!infoVisivel)}
                className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ml-1"
                aria-label="Informações"
              >
                <Info size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-odara-accent" />
              </button>
            </div>
            
            {infoVisivel && (
              <div className="absolute z-10 top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-80 bg-blue-50 border border-blue-100 rounded-lg shadow-lg animate-fade-in">
                <div className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-odara-dark">
                    <strong className="font-semibold">Como usar:</strong> Gerencie os exames dos residentes, acompanhe datas previstas e resultados.
                  </p>
                  <button
                    onClick={() => setInfoVisivel(false)}
                    className="mt-2 text-xs sm:text-sm text-odara-accent hover:text-odara-secondary font-medium"
                  >
                    Entendi
                  </button>
                </div>
                {/* Seta do tooltip para desktop */}
                <div className="hidden sm:block absolute -top-2 right-4 w-4 h-4 bg-blue-50 border-t border-l border-blue-100 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BotaoNovoExame = () => {
    return (
      <button
        onClick={abrirModalNovo}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-max justify-center"
      >
        <Plus className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> Novo Exame
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="min-h-screen bg-odara-offwhite overflow-x-hidden">
      {/* Modal de Exames */}
      <ModalExames
        exame={exameSelecionado}
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

      <div className="p-3 sm:p-6 lg:p-8 max-w-full overflow-hidden">
        {/* Cabeçalho e Botão Novo */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6'>
          <Cabecalho />
          <div className="w-full sm:w-auto">
            <BotaoNovoExame />
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          {/* Barra de Busca */}
          <div className="flex-1 relative min-w-0">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <Search className="text-odara-primary h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por tipo, laboratório ou resultado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-2 bg-white rounded-lg border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent text-xs sm:text-sm"
            />
          </div>

          {/* Botão ativador do modal de filtros */}
          <div className="flex gap-2">
            <button
              onClick={toggleFiltros}
              className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-2 sm:px-4 py-2 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition w-full sm:w-max justify-center text-xs sm:text-sm"
            >
              <Filter size={16} className="sm:w-5 sm:h-5 text-odara-accent" />
              <span>
                {!filtrosAberto ? 'Filtros' : 'Fechar'}
              </span>
            </button>
          </div>
        </div>

        {/* Seção de Filtros */}
        <SecaoFiltros />

        {/* Lista de Exames */}
        <ListaExames />

        {/* Contador de resultados */}
        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {examesFiltrados.length} exame(s) encontrado(s) de {exames.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroExames;