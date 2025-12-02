import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash, Filter, Search, Info, Calendar, Clock, User, Stethoscope, AlertCircle, CheckCircle, ChevronDown, Check, XCircle, RockingChair } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import ModalConsultas from './ModalConsultas';
import toast, { Toaster } from 'react-hot-toast';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Consulta = {
  id: number;
  id_residente: number;
  data_consulta: string;
  horario: string;
  medico: string;
  motivo_consulta: string | null;
  tratamento_indicado: string | null;
  status: string;
  observacao: string | null;
  criado_em?: string;
  atualizado_em?: string;
  residente?: Residente;
};

/* Constantes */
const COR_STATUS: Record<string, {
  bola: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<any>;
}> = {
  agendada: {
    bola: 'bg-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-odara-dark',
    border: 'border-b border-yellow-200',
    icon: Calendar
  },
  realizada: {
    bola: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-odara-dark',
    border: 'border-b border-green-200',
    icon: CheckCircle
  },
  cancelada: {
    bola: 'bg-gray-500',
    bg: 'bg-gray-50',
    text: 'text-odara-dark',
    border: 'border-b border-gray-200',
    icon: XCircle
  },
};

const STATUS_OPTIONS = [
  { value: 'agendada', label: 'Agendada', icon: Calendar },
  { value: 'realizada', label: 'Realizada', icon: CheckCircle },
  { value: 'cancelada', label: 'Cancelada', icon: AlertCircle }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'agendada', label: 'Agendadas' },
  { value: 'realizada', label: 'Realizadas' },
  { value: 'cancelada', label: 'Canceladas' }
];

const RegistroConsultas = () => {
  // Estados principais
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{
    status: string | null;
    residenteId: number | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    status: null,
    residenteId: null,
    startDate: null,
    endDate: null
  });

  // Estados de UI
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);

  // Refs para dropdowns
  const filtroStatusRef = useRef<HTMLDivElement>(null);
  const filtroResidenteRef = useRef<HTMLDivElement>(null);

  /* Efeitos */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroStatusRef.current && !filtroStatusRef.current.contains(event.target as Node)) {
        setFiltroStatusAberto(false);
      }
      if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(event.target as Node)) {
        setFiltroResidenteAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Carregar Dados */
  const carregarConsultas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consulta')
        .select(`*, residente:residente(id, nome, quarto)`)
        .order('data_consulta', { ascending: false })
        .order('horario', { ascending: true });

      if (error) throw error;
      setConsultas(data || []);
    } catch (err) {
      console.error('Erro ao carregar consultas:', err);
      toast.error('Erro ao carregar consultas.');
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
    carregarConsultas();
    carregarResidentes();
  }, [carregarConsultas, carregarResidentes]);

  /* Operações */
  const excluirConsulta = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta consulta?')) return;

    try {
      const { error } = await supabase
        .from('consulta')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConsultas(prev => prev.filter(c => c.id !== id));
      toast.success('Consulta excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir consulta:', err);
      toast.error('Erro ao excluir consulta.');
    }
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      // Atualizar localmente primeiro para feedback imediato
      setConsultas(prev => prev.map(c =>
        c.id === id ? { ...c, status: novoStatus } : c
      ));

      const { error } = await supabase
        .from('consulta')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Falha ao atualizar status.');
      // Reverter em caso de erro
      carregarConsultas();
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (consulta: Consulta) => {
    setConsultaSelecionada(consulta);
    setModalAberto(true);
  };

  const abrirModalNova = () => {
    setConsultaSelecionada(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setConsultaSelecionada(null);
    carregarConsultas();
  };

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarStatus = (status: string | null) => {
    setFiltros(prev => ({ ...prev, status: status === 'todos' ? null : status }));
    setFiltroStatusAberto(false);
  };

  const selecionarResidente = (residenteId: number | null) => {
    setFiltros(prev => ({ ...prev, residenteId }));
    setFiltroResidenteAberto(false);
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

  const toggleDropdown = (id: number) => {
    setDropdownAberto(dropdownAberto === id ? null : id);
  };

  /* Filtragem */
  const consultasFiltradas = consultas.filter(consulta => {
    // Filtro por texto (busca em médico, motivo, nome do residente)
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      const buscaMedico = consulta.medico.toLowerCase().includes(termo);
      const buscaMotivo = consulta.motivo_consulta?.toLowerCase().includes(termo) || false;
      const buscaResidente = consulta.residente?.nome.toLowerCase().includes(termo) || false;

      if (!buscaMedico && !buscaMotivo && !buscaResidente) {
        return false;
      }
    }

    // Filtro por status
    if (filtros.status && consulta.status !== filtros.status) {
      return false;
    }

    // Filtro por residente
    if (filtros.residenteId && consulta.residente?.id !== filtros.residenteId) {
      return false;
    }

    // Filtro por data
    if (filtros.startDate || filtros.endDate) {
      if (filtros.startDate && consulta.data_consulta < filtros.startDate) return false;
      if (filtros.endDate && consulta.data_consulta > filtros.endDate) return false;
    }

    return true;
  }).sort((a, b) => {
    if (a.data_consulta !== b.data_consulta) return a.data_consulta.localeCompare(b.data_consulta);
    return a.horario.localeCompare(b.horario);
  });

  /* Componentes de UI */
  const DropdownStatus = ({ consulta }: { consulta: Consulta }) => {
    const IconeStatus = COR_STATUS[consulta.status]?.icon || Calendar;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(consulta.id)}
          className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconeStatus size={14} className="text-odara-accent" />
          <span className="text-odara-dark capitalize">
            {STATUS_OPTIONS.find(opt => opt.value === consulta.status)?.label || consulta.status}
          </span>
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        {dropdownAberto === consulta.id && (
          <>
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setDropdownAberto(null)}
            ></div>

            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      atualizarStatus(consulta.id, option.value);
                      setDropdownAberto(null);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${consulta.status === option.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <OptionIcon size={14} className="text-odara-accent" />
                    <span className="capitalize">{option.label}</span>
                    {consulta.status === option.value && (
                      <Check className="ml-auto text-odara-primary" size={14} />
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
    tipo: 'status' | 'residente';
  }) => {
    const opcoes = tipo === 'status' ? FILTRO_STATUS_OPTIONS : [];

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
                ? FILTRO_STATUS_OPTIONS.find(opt => opt.value === valorSelecionado)?.label
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
                    <span>{residente.nome} {residente.quarto ? `(Q ${residente.quarto})` : ''}</span>
                    {valorSelecionado === residente.id && <Check className="ml-auto text-odara-primary" size={14} />}
                  </button>
                ))}
              </>
            ) : (
              opcoes.map(opcao => (
                <button
                  key={opcao.value}
                  onClick={() => onSelecionar(opcao.value)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${(opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  <span>{opcao.label}</span>
                  {((opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value) && (
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

  const SecaoFiltros = () => {
    if (!filtrosAberto) return null;

    return (
      <div className="mb-8 bg-white p-5 rounded-xl shadow border border-gray-200 animate-fade-in">
        {/* Primeira Linha */}
        <div className="flex flex-col md:flex-row gap-5 w-full">
          <div className='flex flex-col md:flex-row flex-1 gap-5'>
            {/* Filtro de Residente */}
            <div className="flex-1">
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

            {/* Filtro de Status */}
            <div className="flex-1">
              <div className='flex gap-1 items-center ml-1 mb-1'>
                <Filter size={10} className="text-odara-accent" />
                <label className="block text-sm font-semibold text-odara-secondary">Status</label>
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
          </div>

          {/* Botões de ação */}
          <div className="flex md:items-end gap-2 pt-1 md:pt-0 md:w-auto w-full">
            <button
              onClick={limparFiltros}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 md:w-auto w-full justify-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        {/* Segunda Linha */}
        {/* Filtro de Data */}
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

  const CardConsulta = ({ consulta }: { consulta: Consulta }) => {
    const coresStatus = COR_STATUS[consulta.status] || COR_STATUS.agendada;
    const IconeStatus = coresStatus.icon;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex items-center justify-between p-3 rounded-t-lg ${coresStatus.border} ${coresStatus.bg}`}>
          {/* Coluna Esquerda */}
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${coresStatus.bola}`}></div>
            <p className="text-sm sm:text-base text-odara-dark">
              <span className='font-semibold'>
                {consulta.data_consulta.split('-').reverse().join('/')}
              </span>
              <span className="text-odara-accent ml-2">
                • {consulta.horario.slice(0, 5)}
              </span>
            </p>
          </div>

          {/* Coluna Direita - Status */}
          <DropdownStatus consulta={consulta} />
        </div>

        {/* Corpo do Card */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Título e Botões de Ação */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-1">
                {consulta.residente?.nome || 'Residente não informado'}
              </h3>
              <p className="text-sm text-odara-name flex items-center gap-1">
                <Stethoscope size={14} className="text-odara-accent" />
                Dr(a). {consulta.medico}
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => abrirModalEdicao(consulta)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar consulta"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => excluirConsulta(consulta.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir consulta"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          {/* Detalhes da Consulta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {/* Coluna Esquerda */}
            <div className="space-y-3">
              {consulta.motivo_consulta && (
                <div>
                  <strong className="text-odara-dark text-sm">Motivo:</strong>
                  <span className="text-odara-name mt-1 text-sm">
                    {' ' + consulta.motivo_consulta}
                  </span>
                </div>
              )}
              {consulta.tratamento_indicado && (
                <div>
                  <strong className="text-odara-dark text-sm">Tratamento:</strong>
                  <span className="text-odara-name mt-1 text-sm">
                    {' ' + consulta.tratamento_indicado}
                  </span>
                </div>
              )}
            </div>

            {/* Coluna Direita */}
            <div className="space-y-3">
              {consulta.observacao && (
                <div>
                  <strong className="text-odara-dark text-sm">Observações:</strong>
                  <span className="text-odara-name mt-1 text-sm">
                    {' ' + consulta.observacao}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer do Card */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-1">
              <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <RockingChair size={12} />
                {consulta.residente?.nome || 'Sem residente'}
                {consulta.residente?.quarto && (
                  <span className="ml-1 bg-white/20 px-1 rounded">Q {consulta.residente.quarto}</span>
                )}
              </span>
            </div>

            <div className="text-xs text-odara-name flex items-center gap-1">
              <Clock size={10} />
              Criado em: {consulta.criado_em ? new Date(consulta.criado_em).toLocaleDateString('pt-BR') : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ListaConsultas = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-odara-dark">Consultas</h2>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            Total: {consultasFiltradas.length} de {consultas.length}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.status || filtros.residenteId || filtros.startDate || filtros.endDate || searchTerm) && (
          <div className="mb-4 flex flex-wrap justify-center gap-2 text-xs">
            {searchTerm && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Busca: "{searchTerm}"
              </span>
            )}
            {filtros.status && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Status: {FILTRO_STATUS_OPTIONS.find(opt => opt.value === filtros.status)?.label}
              </span>
            )}
            {filtros.residenteId && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
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
            <p className="text-odara-dark/60 text-lg">Carregando consultas...</p>
          </div>
        ) : consultasFiltradas.length === 0 ? (
          <div className="p-8 rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-lg">
              {consultas.length === 0 ? 'Nenhuma consulta registrada' : 'Nenhuma consulta encontrada'}
            </p>
            {consultas.length > 0 && (
              <p className="text-odara-dark/40 text-sm mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[800px] overflow-y-auto p-2">
            {consultasFiltradas.map(consulta => (
              <CardConsulta
                key={consulta.id}
                consulta={consulta}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const Cabecalho = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Stethoscope size={30} className='text-odara-accent mr-2' />
          <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
            Registro de Consultas Médicas
          </h1>
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
                <h3 className="font-bold mb-2">Registro de Consultas Médicas</h3>
                <p>Registro de consultas médicas realizadas pelos residentes. Você pode adicionar, editar ou excluir consultas conforme necessário.</p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-odara-dropdown"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BotaoNovaConsulta = () => {
    return (
      <button
        onClick={abrirModalNova}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 mb-6"
      >
        <Plus className="mr-2" /> Nova Consulta
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      {/* Modal de Consultas */}
      <ModalConsultas
        consulta={consultaSelecionada}
        isOpen={modalAberto}
        onClose={fecharModal}
      />

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
            <BotaoNovaConsulta />
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Barra de Busca */}
          <div className="flex-1 relative min-w-[300px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-odara-primary h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por médico, motivo ou residente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent"
            />
          </div>

          {/* Botão ativador do modal de filtros */}
          <div className="flex gap-2">
            <button
              onClick={toggleFiltros}
              className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition w-max justify-between"
            >
              <Filter size={20} className="text-odara-accent" />
              <span>
                {!filtrosAberto ? 'Abrir ' : 'Fechar '} Filtros
              </span>
            </button>
          </div>
        </div>

        {/* Seção de Filtros */}
        <SecaoFiltros />

        {/* Lista de Consultas */}
        <ListaConsultas />

        {/* Contador de resultados */}
        <div className="my-4 text-sm text-gray-400">
          Total de {consultasFiltradas.length} consulta(s) encontrada(s) de {consultas.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroConsultas;