import { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, Search, CheckCircle, Clock, CircleX, Plus, Edit, Trash, Info, ChevronDown, Check, TriangleAlert, Palette, RockingChair } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import ModalAtividades from './ModalAtividades';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  foto: string;
};

type Atividade = {
  id: number;
  residentes: Residente[];
  nome: string;
  categoria: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  local: string;
  observacao: string;
  status: string;
};

type AtividadeResidente = {
  id_atividade: number;
  id_residente: number;
};

/* Constantes */
const CATEGORIAS = {
  "fisica": "Física",
  "cognitiva": "Cognitiva",
  "social": "Social",
  "criativa": "Criativa",
  "lazer": "Lazer",
  "terapeutica": "Terapêutica"
} as const;

const CONFIGS_STATUS = {
  pendente: {
    corBolinha: 'bg-yellow-500',
    corBadge: 'bg-yellow-500 text-white',
    corFundo: 'bg-yellow-50',
    corBorda: 'border-b border-yellow-200',
    texto: 'Pendente'
  },
  concluida: {
    corBolinha: 'bg-green-500',
    corBadge: 'bg-green-500 text-white',
    corFundo: 'bg-green-50',
    corBorda: 'border-b border-green-200',
    texto: 'Concluída'
  },
  cancelada: {
    corBolinha: 'bg-gray-500',
    corBadge: 'bg-gray-500 text-white',
    corFundo: 'bg-gray-50',
    corBorda: 'border-b border-gray-200',
    texto: 'Cancelada'
  },
  atrasada: {
    corBolinha: 'bg-red-500',
    corBadge: 'bg-red-500 text-white',
    corFundo: 'bg-red-50',
    corBorda: 'border-b border-red-200',
    texto: 'Atrasada'
  }
} as const;

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'atrasada', label: 'Atrasada' }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'atrasada', label: 'Atrasada' }
];

const FILTRO_CATEGORIA_OPTIONS = [
  { value: 'todos', label: 'Todas as categorias' },
  { value: 'fisica', label: 'Física' },
  { value: 'cognitiva', label: 'Cognitiva' },
  { value: 'social', label: 'Social' },
  { value: 'criativa', label: 'Criativa' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'terapeutica', label: 'Terapêutica' }
];

/* Utilitários para Status */
const obterIconeStatus = (status: string) => {
  switch (status) {
    case "pendente": return Clock;
    case "concluida": return CheckCircle;
    case "cancelada": return CircleX;
    case "atrasada": return TriangleAlert;
    default: return Clock;
  }
};

const RegistroAtividades = () => {
  // Estados
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);

  const [filtros, setFiltros] = useState<{
    status: string | null;
    categoria: string | null;
    residenteId: number | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    status: null,
    categoria: null,
    residenteId: null,
    startDate: null,
    endDate: null
  });

  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);

  const filtroStatusRef = useRef<HTMLDivElement>(null);
  const filtroCategoriaRef = useRef<HTMLDivElement>(null);
  const filtroResidenteRef = useRef<HTMLDivElement>(null);

  /* Efeitos */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroStatusRef.current && !filtroStatusRef.current.contains(event.target as Node)) {
        setFiltroStatusAberto(false);
      }
      if (filtroCategoriaRef.current && !filtroCategoriaRef.current.contains(event.target as Node)) {
        setFiltroCategoriaAberto(false);
      }
      if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(event.target as Node)) {
        setFiltroResidenteAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Operações de Dados */
  const carregarAtividades = useCallback(async () => {
    try {
      // Buscar atividades
      const { data: atividadesData, error: atividadesError } = await supabase
        .from('atividade')
        .select('*');
      if (atividadesError) throw atividadesError;
      const baseAtividades = (atividadesData || []) as Atividade[];

      // Buscar relações com residentes
      const { data: joinsData, error: joinError } = await supabase
        .from('atividade_residente')
        .select('*');
      if (joinError) throw joinError;
      const joins = (joinsData || []) as AtividadeResidente[];

      // Buscar residentes
      const { data: residentesData, error: residentesError } = await supabase
        .from('residente')
        .select('id, nome, foto');
      if (residentesError) throw residentesError;

      setResidentes(residentesData || []);
      const allResidentes = (residentesData || []) as Residente[];

      // Combinar dados
      const atividadesComResidentes: Atividade[] = baseAtividades.map(atv => {
        const relacionados = joins
          .filter(j => j.id_atividade === atv.id)
          .map(j => allResidentes.find(r => r.id === j.id_residente))
          .filter((r): r is Residente => !!r);
        return { ...atv, residentes: relacionados };
      });

      setAtividades(atividadesComResidentes);
    } catch (err) {
      console.error('Erro ao buscar atividades:', err);
    }
  }, []);

  useEffect(() => {
    carregarAtividades();
  }, [carregarAtividades]);

  // Alterar status da atividade
  const alterarStatus = async (id: number, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('atividade')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      setAtividades(prev =>
        prev.map(atividade =>
          atividade.id === id
            ? { ...atividade, status: novoStatus }
            : atividade
        )
      );
      setDropdownAberto(null);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Excluir atividade
  const excluirAtividade = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
      const { error } = await supabase
        .from('atividade')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAtividades(prev => prev.filter(atividade => atividade.id !== id));
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
    }
  };

  /* Handlers de UI */
  const toggleDropdown = (id: number) => {
    setDropdownAberto(dropdownAberto === id ? null : id);
  };

  const abrirModalEdicao = (atividade: Atividade) => {
    setAtividadeSelecionada(atividade);
    setModalAberto(true);
  };

  const abrirModalNova = () => {
    setAtividadeSelecionada(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAtividadeSelecionada(null);
    carregarAtividades();
  };

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarStatus = (status: string | null) => {
    setFiltros(prev => ({ ...prev, status: status === 'todos' ? null : status }));
    setFiltroStatusAberto(false);
  };

  const selecionarCategoria = (categoria: string | null) => {
    setFiltros(prev => ({ ...prev, categoria: categoria === 'todos' ? null : categoria }));
    setFiltroCategoriaAberto(false);
  };

  const selecionarResidente = (residenteId: number | null) => {
    setFiltros(prev => ({ ...prev, residenteId }));
    setFiltroResidenteAberto(false);
  };

  const limparFiltros = () => {
    setFiltros({
      status: null,
      categoria: null,
      residenteId: null,
      startDate: null,
      endDate: null
    });
    setSearchTerm('');
    setFiltroStatusAberto(false);
    setFiltroCategoriaAberto(false);
    setFiltroResidenteAberto(false);
  };

  /* Filtragem e Ordenação */
  const atividadesFiltradas = atividades
    .filter(atividade => {
      // Filtro por busca no nome
      if (searchTerm.trim() &&
        !atividade.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por status
      if (filtros.status && filtros.status !== 'todos' && atividade.status !== filtros.status) {
        return false;
      }

      // Filtro por categoria
      if (filtros.categoria && filtros.categoria !== 'todos' && atividade.categoria !== filtros.categoria) {
        return false;
      }

      // Filtro por residente
      if (filtros.residenteId && !atividade.residentes?.some(r => r.id === filtros.residenteId)) {
        return false;
      }

      // Filtro por data
      const dataAtv = atividade.data.split('T')[0];
      if (filtros.startDate && filtros.endDate) {
        if (dataAtv < filtros.startDate || dataAtv > filtros.endDate) return false;
      } else if (filtros.startDate && !filtros.endDate) {
        if (dataAtv !== filtros.startDate) return false;
      } else if (!filtros.startDate && filtros.endDate) {
        if (dataAtv !== filtros.endDate) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Ordenar por data e horário
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.horario_inicio.localeCompare(b.horario_inicio);
    });

  /* Utilitários */
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarDataParaExibicao = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const calcularDuracao = (horarioInicio: string, horarioFim: string) => {
    const [hi, mi] = horarioInicio.split(':').map(Number);
    const [hf, mf] = horarioFim.split(':').map(Number);

    if ([hi, mi, hf, mf].some(Number.isNaN)) return '—';

    const start = hi * 60 + mi;
    let end = hf * 60 + mf;
    if (end < start) end += 1440;

    const diff = end - start;
    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return `${h > 0 ? `${h}h` : ''}${h > 0 && m > 0 ? ' ' : ''}${m > 0 ? `${m}m` : h === 0 ? '0m' : ''}`;
  };

  /* Componentes de UI */
  const DropdownStatus = ({ atividade }: { atividade: Atividade }) => {
    const IconeStatus = obterIconeStatus(atividade.status);

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(atividade.id)}
          className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconeStatus size={14} className={"text-odara-accent"} />
          <span className="text-odara-dark capitalize">
            {STATUS_OPTIONS.find(opt => opt.value === atividade.status)?.label || atividade.status}
          </span>
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        {dropdownAberto === atividade.id && (
          <>
            {/* CAMADA INVISÍVEL PARA FECHAR AO CLICAR FORA */}
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setDropdownAberto(null)}
            ></div>

            {/* MENU DROPDOWN */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = obterIconeStatus(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      alterarStatus(atividade.id, option.value);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${atividade.status === option.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <OptionIcon size={14} className={"text-odara-accent"} />
                    <span className="capitalize">{option.label}</span>
                    {atividade.status === option.value && (
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
    tipo: 'status' | 'categoria' | 'residente';
  }) => {
    const opcoes = tipo === 'status'
      ? FILTRO_STATUS_OPTIONS
      : tipo === 'categoria'
        ? FILTRO_CATEGORIA_OPTIONS
        : [];

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
                ? opcoes.find(opt => opt.value === valorSelecionado)?.label
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Filtro de Residente */}
          <div>
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

          {/* Filtro de Categoria */}
          <div>
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-sm font-semibold text-odara-secondary">Categoria</label>
            </div>
            <FiltroDropdown
              titulo="Todas as categorias"
              aberto={filtroCategoriaAberto}
              setAberto={setFiltroCategoriaAberto}
              ref={filtroCategoriaRef}
              valorSelecionado={filtros.categoria || 'todos'}
              onSelecionar={selecionarCategoria}
              tipo="categoria"
            />
          </div>

          {/* Filtro de Status */}
          <div>
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

          {/* Botão Limpar Filtros */}
          <div className="flex md:items-end gap-2 pt-1 md:pt-0">
            <button
              onClick={limparFiltros}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-gray-200">
          <div>
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-sm font-semibold text-odara-secondary">A Partir da Data</label>
            </div>
            <input
              type="date"
              value={filtros.startDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value || null }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm text-odara-dark focus:ring-2 focus:ring-odara-primary focus:border-transparent focus:outline-none"
            />
          </div>

          <div>
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={10} className="text-odara-accent" />
              <label className="block text-sm font-semibold text-odara-secondary">Data Final</label>
            </div>
            <input
              type="date"
              value={filtros.endDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value || null }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm text-odara-dark focus:ring-2 focus:ring-odara-primary focus:border-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  };

  const CardAtividade = ({ atividade }: { atividade: Atividade }) => {
    const statusAtual = atividade.status;
    const configStatus = CONFIGS_STATUS[statusAtual as keyof typeof CONFIGS_STATUS] ?? CONFIGS_STATUS.pendente;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex flex-wrap justify-center sm:justify-between gap-2 items-center p-3 rounded-t-lg ${configStatus.corFundo} ${configStatus.corBorda}`}>
          {/* Coluna Esquerda */}
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${configStatus.corBolinha}`}></div>
            <p className="text-sm sm:text-base text-odara-dark">
              <span className='font-semibold'>
                {formatarData(atividade.data)}
              </span>
              {atividade.horario_inicio && (
                <span className="text-odara-accent ml-2">
                  • {atividade.horario_inicio.replace(/:\d{2}$/, '')}
                </span>
              )}
            </p>
          </div>

          {/* Coluna Direita */}
          {/* Botão de Status (altera o status)*/}
          <DropdownStatus atividade={atividade} />
        </div>

        {/* Corpo do Card */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Título do Corpo */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-odara-dark line-clamp-1 flex-1">
              {atividade.nome || 'Sem nome'}
            </h3>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => abrirModalEdicao(atividade)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar atividade"
              >
                <Edit size={14} />
              </button>

              <button
                onClick={() => excluirAtividade(atividade.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir atividade"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          {/* Detalhes do Corpo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Coluna Esquerda */}
            <div className="space-y-3">
              <div>
                <strong className="text-odara-dark text-sm">Categoria:</strong>
                <span className="text-odara-name mt-1 text-sm">
                  {' ' + CATEGORIAS[atividade.categoria as keyof typeof CATEGORIAS] || atividade.categoria}
                </span>
              </div>

              {atividade.observacao && (
                <div>
                  <div>
                    <strong className="text-odara-dark text-sm">Descrição:</strong>
                    <span className="text-odara-name mt-1 text-sm">
                      {' ' + atividade.observacao}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita */}
            <div className="space-y-3">
              {atividade.horario_inicio && atividade.horario_fim && (
                <div>
                  <strong className="text-odara-dark text-sm">Duração:</strong>
                  <span className="text-odara-name mt-1 text-sm">
                    {' ' + calcularDuracao(atividade.horario_inicio, atividade.horario_fim)}
                  </span>
                </div>
              )}

              {atividade.local && (
                <div>
                  <strong className="text-odara-dark text-sm">Local:</strong>
                  <span className="text-odara-name mt-1 text-sm">
                    {' ' + atividade.local}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer do Card */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-wrap justify-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center justify-center sm:justify-start text-sm flex-wrap gap-1">
              {atividade.residentes
                .map(r => r?.nome)
                .filter(Boolean)
                .sort((a, b) => a!.localeCompare(b!))
                .map(residente => (
                  <span key={residente} className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <RockingChair size={12} />
                    {residente}
                  </span>
                ))}
            </div>

            {/* Ciado em */}
            {/* 
              <div className="text-xs text-odara-name flex items-center gap-1">
                <Clock size={10} />
                Criado em: {atividade.criado_em ? new Date(atividade.criado_em).toLocaleDateString('pt-BR') : 'N/A'}
              </div>
             */}
          </div>
        </div>
      </div>
    );
  };

  const ListaAtividades = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-odara-dark">
            {filtros.status ? `Atividades ${filtros.status}` : 'Todas as Atividades'}
          </h2>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            Total: {atividadesFiltradas.length}
          </span>
        </div>

        {/* Filtros ativos */}
        {(filtros.status || filtros.categoria || filtros.residenteId || filtros.startDate || filtros.endDate) && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {searchTerm && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Busca: {searchTerm}
              </span>
            )}

            {filtros.residenteId && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
              </span>
            )}

            {filtros.categoria && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Categoria: {FILTRO_CATEGORIA_OPTIONS.find(opt => opt.value === filtros.categoria)?.label}
              </span>
            )}

            {filtros.status && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Status: {FILTRO_STATUS_OPTIONS.find(opt => opt.value === filtros.status)?.label}
              </span>
            )}

            {(filtros.startDate || filtros.endDate) && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Data: {filtros.startDate ? ` ${formatarDataParaExibicao(filtros.startDate)}` : 'não informada'}
                {filtros.endDate ? ' a' + ` ${formatarDataParaExibicao(filtros.endDate)}` : ''}
              </span>
            )}
          </div>
        )}

        {atividadesFiltradas.length === 0 ? (
          <div className="p-8 rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-lg">
              {atividades.length === 0 ? 'Nenhuma atividade cadastrada' : 'Nenhuma atividade encontrada'}
            </p>
            {atividades.length > 0 && (
              <p className="text-odara-dark/40 text-sm mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[800px] overflow-y-auto p-2">
            {atividadesFiltradas.map(atividade => (
              <CardAtividade
                key={atividade.id}
                atividade={atividade}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const Cabecalho = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-center xl:justify-start items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Palette size={30} className='text-odara-accent mr-2' />
          <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
            Registro de Atividades
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
                <h3 className="font-bold mb-2">Registro de Atividades</h3>
                <p>Documento para controle e planejamento das atividades dos residentes.</p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-odara-dropdown"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BotaoNovaAtividade = () => {
    return (
      <button
        onClick={abrirModalNova}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 mb-6"
      >
        <Plus className="mr-2" /> Nova Atividade
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <ModalAtividades
        atividade={atividadeSelecionada}
        isOpen={modalAberto}
        onClose={fecharModal}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Cabeçalho e Botão Novo */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
          <Cabecalho />
          <div className="flex justify-end">
            <BotaoNovaAtividade />
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
              placeholder="Buscar nome da atividade..."
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

        <SecaoFiltros />
        <ListaAtividades />

        {/* Contador de resultados */}
        <div className="my-4 text-sm text-gray-400">
          Total de {atividadesFiltradas.length} atividade(s) encontrada(s) de {atividades.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroAtividades;