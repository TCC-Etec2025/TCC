// src/components/RegistroPreferencias.tsx
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Filter, Search, CheckCircle, Clock, CircleX, Plus, Edit, Trash, Info, ChevronDown, Check, Heart, Utensils, Activity, Users } from 'lucide-react';

import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

import ModalPreferencias from './ModalPreferencias';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
  foto_url?: string | null;
};

type Preferencia = {
  id: number;
  titulo: string;
  descricao: string;
  tipo_preferencia: string;
  prioridade: string;
  data_registro: string;
  data_ultima_atualizacao: string;
  id_residente: number;
  observacoes?: string | null;
  foto_url?: string | null;
  status: string;
  criado_em?: string;
  residente?: Residente | null;
};

/* Constantes */
const COR_STATUS: Record<string, {
  bola: string;
  bg: string;
  text: string;
  border: string
}> = {
  ativo: {
    bola: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-green-200'
  },
  inativo: {
    bola: 'bg-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-yellow-200'
  },
  atendido: {
    bola: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-blue-200'
  }
};

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'atendido', label: 'Atendido' }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'atendido', label: 'Atendido' }
];

const CATEGORIAS = {
  alimentacao: 'Alimentação',
  atividades: 'Atividades',
  cuidados: 'Cuidados',
  rotina: 'Rotina',
  outros: 'Outros'
};

const CATEGORIA_OPTIONS = [
  { value: 'todos', label: 'Todas categorias' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'atividades', label: 'Atividades' },
  { value: 'cuidados', label: 'Cuidados' },
  { value: 'rotina', label: 'Rotina' },
  { value: 'outros', label: 'Outros' }
];

const PRIORIDADE_OPTIONS = [
  { value: 'alta', label: 'Alta', cor: 'bg-red-500' },
  { value: 'media', label: 'Média', cor: 'bg-yellow-500' },
  { value: 'baixa', label: 'Baixa', cor: 'bg-green-500' }
];

const RegistroPreferencias: React.FC = () => {
  // Estados principais
  const [preferencias, setPreferencias] = useState<Preferencia[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [preferenciaSelecionada, setPreferenciaSelecionada] = useState<Preferencia | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados de exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [preferenciaParaExcluir, setPreferenciaParaExcluir] = useState<number | null>(null);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{
    residenteId: number | null;
    status: string | null;
    categoria: string | null;
    prioridade: string | null;
  }>({
    residenteId: null,
    status: null,
    categoria: null,
    prioridade: null
  });

  // Estados de UI
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [filtroPrioridadeAberto, setFiltroPrioridadeAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);

  // Refs para dropdowns
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroStatusRef = useRef<HTMLDivElement>(null);
  const filtroCategoriaRef = useRef<HTMLDivElement>(null);
  const filtroPrioridadeRef = useRef<HTMLDivElement>(null);

  /* Utilitários */
  const obterIconeCategoria = (categoria: string) => {
    switch (categoria) {
      case "alimentacao": return Utensils;
      case "atividades": return Activity;
      case "cuidados": return Users;
      default: return Heart;
    }
  };

  const obterIconeStatus = (status: string) => {
    switch (status) {
      case "ativo": return CheckCircle;
      case "inativo": return Clock;
      case "atendido": return CircleX;
      default: return Clock;
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
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
      if (filtroCategoriaRef.current && !filtroCategoriaRef.current.contains(event.target as Node)) {
        setFiltroCategoriaAberto(false);
      }
      if (filtroPrioridadeRef.current && !filtroPrioridadeRef.current.contains(event.target as Node)) {
        setFiltroPrioridadeAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Carregar Dados */
  const carregarPreferencias = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('preferencia')
        .select(`
          *,
          residente:residente(id, nome, quarto, foto_url)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setPreferencias(data || []);
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      toast.error('Erro ao carregar preferências');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarResidentes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('residente')
        .select('id, nome, quarto, foto_url')
        .order('nome');

      if (!error) setResidentes(data || []);
    } catch (err) {
      console.error('Erro ao carregar residentes:', err);
    }
  }, []);

  useEffect(() => {
    carregarPreferencias();
    carregarResidentes();
  }, [carregarPreferencias, carregarResidentes]);

  /* Handlers de Exclusão */
  const abrirModalExclusao = (id: number) => {
    setPreferenciaParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setPreferenciaParaExcluir(null);
  };

  const executarExclusao = async () => {
    if (!preferenciaParaExcluir) return;

    try {
      const { error } = await supabase
        .from("preferencia")
        .delete()
        .eq("id", preferenciaParaExcluir);

      if (error) throw error;

      // Atualiza a lista localmente
      setPreferencias(prev => prev.filter(o => o.id !== preferenciaParaExcluir));
      toast.success('Preferência excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir preferência:', err);
      toast.error('Erro ao excluir preferência');
    } finally {
      fecharModalExclusao();
    }
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      // Atualizar localmente primeiro para feedback imediato
      setPreferencias(prev => prev.map(preferencia =>
        preferencia.id === id
          ? { ...preferencia, status: novoStatus, data_ultima_atualizacao: new Date().toISOString() }
          : preferencia
      ));

      // Atualiza no banco de dados
      const { error } = await supabase
        .from('preferencia')
        .update({ 
          status: novoStatus,
          data_ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setDropdownAberto(null);
      toast.success('Status atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Falha ao atualizar status.');
      // Reverter em caso de erro
      carregarPreferencias();
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (preferencia: Preferencia) => {
    setPreferenciaSelecionada(preferencia);
    setModalAberto(true);
  };

  const abrirModalNovo = () => {
    setPreferenciaSelecionada(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPreferenciaSelecionada(null);
    carregarPreferencias();
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

  const selecionarCategoria = (categoria: string | null) => {
    setFiltros(prev => ({ ...prev, categoria: categoria === 'todos' ? null : categoria }));
    setFiltroCategoriaAberto(false);
  };

  const selecionarPrioridade = (prioridade: string | null) => {
    setFiltros(prev => ({ ...prev, prioridade: prioridade === 'todos' ? null : prioridade }));
    setFiltroPrioridadeAberto(false);
  };

  const limparFiltros = () => {
    setFiltros({
      status: null,
      residenteId: null,
      categoria: null,
      prioridade: null
    });
    setSearchTerm('');
    setFiltroStatusAberto(false);
    setFiltroResidenteAberto(false);
    setFiltroCategoriaAberto(false);
    setFiltroPrioridadeAberto(false);
  };

  /* Filtragem e Ordenação */
  const preferenciasFiltradas = useMemo(() => {
    return preferencias
      .filter(preferencia => {
        // Filtro por texto (busca em título, descrição, nome do residente)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitulo = preferencia.titulo.toLowerCase().includes(term);
          const matchDescricao = preferencia.descricao.toLowerCase().includes(term);
          const matchResidente = preferencia.residente?.nome.toLowerCase().includes(term);
          const matchObservacoes = preferencia.observacoes?.toLowerCase().includes(term);
          
          if (!matchTitulo && !matchDescricao && !matchResidente && !matchObservacoes) {
            return false;
          }
        }

        // Filtro por residente
        if (filtros.residenteId && preferencia.residente?.id !== filtros.residenteId) {
          return false;
        }

        // Filtro por status
        if (filtros.status && filtros.status !== 'todos' && preferencia.status !== filtros.status) {
          return false;
        }

        // Filtro por categoria
        if (filtros.categoria && filtros.categoria !== 'todos' && preferencia.tipo_preferencia !== filtros.categoria) {
          return false;
        }

        // Filtro por prioridade
        if (filtros.prioridade && preferencia.prioridade !== filtros.prioridade) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Ordena por prioridade (alta > média > baixa)
        const prioridadeOrder = { alta: 1, media: 2, baixa: 3 };
        const prioridadeDiff = prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] - 
                              prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder];
        
        if (prioridadeDiff !== 0) return prioridadeDiff;
        
        // Se mesma prioridade, ordena por data de registro
        const dataA = new Date(a.data_registro).getTime();
        const dataB = new Date(b.data_registro).getTime();
        
        return dataB - dataA; // Mais recente primeiro
      });
  }, [preferencias, searchTerm, filtros]);

  /* Componentes de UI */
  const DropdownStatus = ({ preferencia }: { preferencia: Preferencia }) => {
    const IconeStatus = obterIconeStatus(preferencia.status);

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(preferencia.id)}
          className="flex items-center gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconeStatus size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
          <span className="text-odara-dark capitalize">{preferencia.status}</span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500" />
        </button>

        {dropdownAberto === preferencia.id && (
          <>
            {/* CAMADA INVISÍVEL PARA FECHAR AO CLICAR FORA */}
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setDropdownAberto(null)}
            ></div>

            {/* MENU DROPDOWN */}
            <div className="absolute top-full sm:right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = obterIconeStatus(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      atualizarStatus(preferencia.id, option.value);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${preferencia.status === option.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <OptionIcon size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
                    <span className="capitalize">{option.label}</span>
                    {preferencia.status === option.value && (
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
    tipo,
    opcoes
  }: {
    titulo: string;
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
    ref: React.RefObject<HTMLDivElement>;
    valorSelecionado: string | number | null;
    onSelecionar: (value: any) => void;
    tipo: 'residente' | 'status' | 'categoria' | 'prioridade';
    opcoes: Array<{ value: string; label: string; cor?: string }>;
  }) => {
    const residentesUnicos = Array.from(new Map(
      preferencias
        .filter(p => p.residente)
        .map(p => [p.residente!.id, p.residente!.nome])
    ));

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
                ? residentes.find(r => r.id === valorSelecionado)?.nome
                : titulo
              : tipo === 'prioridade' && valorSelecionado
                ? opcoes.find(opt => opt.value === valorSelecionado)?.label
                : valorSelecionado
                  ? opcoes.find(opt => opt.value === valorSelecionado)?.label
                  : titulo
            }
          </span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500 flex-shrink-0" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
            <button
              onClick={() => onSelecionar(tipo === 'prioridade' ? null : tipo === 'categoria' ? 'todos' : null)}
              className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${!valorSelecionado || (tipo === 'categoria' && valorSelecionado === 'todos')
                ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                : 'text-gray-700'
                }`}
            >
              <span>{tipo === 'categoria' ? 'Todas categorias' : 
                    tipo === 'prioridade' ? 'Todas prioridades' : 
                    tipo === 'residente' ? 'Todos os residentes' : 
                    'Todos os status'}</span>
              {(!valorSelecionado || (tipo === 'categoria' && valorSelecionado === 'todos')) && 
                <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>

            {tipo === 'residente' ? (
              residentes.map((residente) => (
                <button
                  key={residente.id}
                  onClick={() => onSelecionar(residente.id)}
                  className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === residente.id
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  <span className="truncate">
                    {residente.nome} {residente.quarto ? `(Q ${residente.quarto})` : ''}
                  </span>
                  {valorSelecionado === residente.id && 
                    <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                </button>
              ))
            ) : (
              opcoes.map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => onSelecionar(opcao.value)}
                  className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === opcao.value
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  {tipo === 'prioridade' && opcao.cor && (
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${opcao.cor}`}></div>
                  )}
                  <span>{opcao.label}</span>
                  {valorSelecionado === opcao.value && (
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

  const CardPreferencia = ({ preferencia }: { preferencia: Preferencia }) => {
    const cores = COR_STATUS[preferencia.status] || COR_STATUS.ativo;
    const IconeCategoria = obterIconeCategoria(preferencia.tipo_preferencia);
    const prioridadeCor = PRIORIDADE_OPTIONS.find(p => p.value === preferencia.prioridade)?.cor || 'bg-gray-500';

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex flex-wrap justify-center sm:justify-between gap-2 items-center p-2 sm:p-3 rounded-t-lg ${cores.border} ${cores.bg}`}>
          {/* Coluna Esquerda */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${cores.bola}`}></div>
            <IconeCategoria size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
            <p className={`text-xs sm:text-sm md:text-base ${cores.text}`}>
              {CATEGORIAS[preferencia.tipo_preferencia as keyof typeof CATEGORIAS] || preferencia.tipo_preferencia}
            </p>
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${prioridadeCor}`}></div>
            <span className="text-xs font-medium capitalize">{preferencia.prioridade}</span>
          </div>

          {/* Coluna Direita - Status */}
          <DropdownStatus preferencia={preferencia} />
        </div>

        {/* Corpo do Card */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Título do Corpo */}
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-odara-dark line-clamp-1 flex-1">
              {preferencia.titulo}
            </h3>

            {/* Botões de ação */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => abrirModalEdicao(preferencia)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar preferência"
              >
                <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>

              <button
                onClick={() => abrirModalExclusao(preferencia.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir preferência"
              >
                <Trash size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div className="mb-3 sm:mb-4">
            <p className="text-sm text-odara-dark line-clamp-3">
              {preferencia.descricao}
            </p>
          </div>

          {/* Detalhes da Preferência */}
          <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 flex-1">
            {/* Coluna Esquerda */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Data de Registro:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {formatarData(preferencia.data_registro)}
                </span>
              </div>

              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Última Atualização:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {formatarData(preferencia.data_ultima_atualizacao)}
                </span>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-2 sm:space-y-3">
              {preferencia.observacoes && (
                <div>
                  <strong className="text-odara-dark text-xs sm:text-sm">Observações:</strong>
                  <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block line-clamp-2">
                    {preferencia.observacoes}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer do Card */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-wrap justify-center sm:justify-between gap-1 sm:gap-2 text-xs">
            <div className="flex items-center flex-wrap gap-1 justify-center sm:justify-start">
              <div className="flex items-center gap-1">
                {/* Foto do residente */}
                <div className="w-6 h-6 rounded-full bg-odara-offwhite overflow-hidden border border-odara-primary flex items-center justify-center">
                  {preferencia.residente?.foto_url ? (
                    <img
                      src={preferencia.residente.foto_url}
                      alt={preferencia.residente.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-odara-primary text-xs font-semibold">
                      {preferencia.residente?.nome?.charAt(0) || 'R'}
                    </span>
                  )}
                </div>
                <span className="bg-odara-accent text-white px-2 py-1 rounded-full text-xs font-medium">
                  {preferencia.residente?.nome || 'Residente'}
                </span>
              </div>

              {preferencia.residente?.quarto && (
                <span className="text-xs text-odara-dark">
                  • {preferencia.residente.quarto}
                </span>
              )}
            </div>

            <div className="text-xs text-odara-name flex items-center gap-1 justify-center sm:justify-start">
              <Clock size={9} className="sm:w-2.5 sm:h-2.5" />
              ID: {preferencia.id}
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
        {/* Primeira Linha - Filtros principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
          {/* Filtro de Residente */}
          <div className="min-w-0">
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
              onSelecionar={selecionarResidente}
              tipo="residente"
              opcoes={[]}
            />
          </div>

          {/* Filtro de Status */}
          <div className="min-w-0">
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
              onSelecionar={selecionarStatus}
              tipo="status"
              opcoes={FILTRO_STATUS_OPTIONS}
            />
          </div>

          {/* Filtro de Categoria */}
          <div className="min-w-0">
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Categoria</label>
            </div>

            <FiltroDropdown
              titulo="Todas categorias"
              aberto={filtroCategoriaAberto}
              setAberto={setFiltroCategoriaAberto}
              ref={filtroCategoriaRef}
              valorSelecionado={filtros.categoria || 'todos'}
              onSelecionar={selecionarCategoria}
              tipo="categoria"
              opcoes={CATEGORIA_OPTIONS}
            />
          </div>

          {/* Filtro de Prioridade */}
          <div className="min-w-0">
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Prioridade</label>
            </div>

            <FiltroDropdown
              titulo="Todas prioridades"
              aberto={filtroPrioridadeAberto}
              setAberto={setFiltroPrioridadeAberto}
              ref={filtroPrioridadeRef}
              valorSelecionado={filtros.prioridade}
              onSelecionar={selecionarPrioridade}
              tipo="prioridade"
              opcoes={PRIORIDADE_OPTIONS}
            />
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        <div className="flex justify-end gap-2 pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-gray-200">
          <button
            onClick={limparFiltros}
            className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    );
  };

  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    // Obter o título da preferência para exibir no modal
    const preferencia = preferenciaParaExcluir
      ? preferencias.find(p => p.id === preferenciaParaExcluir)
      : null;
    const tituloPreferencia = preferencia?.titulo || '';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full animate-scale-in">
          <div className="text-center">
            {/* Ícone de alerta */}
            <div className="mx-auto flex items-center justify-center h-12 sm:h-14 w-12 sm:w-14 rounded-full bg-odara-alerta/10 mb-3 sm:mb-4">
              <CircleX className="h-6 w-6 sm:h-7 sm:w-7 text-odara-alerta" />
            </div>

            {/* Textos do modal */}
            <h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
            <p className="text-odara-name text-sm sm:text-base mb-3 sm:mb-4">
              Tem certeza que deseja excluir esta preferência?
            </p>

            {/* Detalhes da preferência */}
            {tituloPreferencia && (
              <div className="bg-odara-offwhite rounded-lg p-3 mb-3 sm:mb-4 border border-gray-200">
                <p className="text-sm font-medium text-odara-dark">Preferência:</p>
                <p className="text-sm font-semibold text-odara-name truncate" title={tituloPreferencia}>
                  {tituloPreferencia}
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

  const ListaPreferencias = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Preferências</h2>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Total: {preferenciasFiltradas.length}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.status || filtros.residenteId || filtros.categoria || filtros.prioridade || searchTerm) && (
          <div className="mb-3 flex flex-wrap justify-center sm:justify-start gap-1 text-xs">
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

            {filtros.status && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Status: {filtros.status}
              </span>
            )}

            {filtros.categoria && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Categoria: {CATEGORIAS[filtros.categoria as keyof typeof CATEGORIAS]}
              </span>
            )}

            {filtros.prioridade && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Prioridade: {filtros.prioridade}
              </span>
            )}
          </div>
        )}

        {/* Lista ou mensagem de vazio */}
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando preferências...</p>
          </div>
        ) : preferenciasFiltradas.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              {preferencias.length === 0 ? 'Nenhuma preferência cadastrada' : 'Nenhuma preferência encontrada'}
            </p>

            {preferencias.length > 0 && (
              <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
            {preferenciasFiltradas.map(preferencia => (
              <CardPreferencia
                key={preferencia.id}
                preferencia={preferencia}
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
          <Heart size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent flex-shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                Registro de Preferências
              </h1>
              
              <button
                onClick={() => setInfoVisivel(!infoVisivel)}
                className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ml-1"
                aria-label="Informações"
              >
                <Info size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-odara-accent" />
              </button>
            </div>
            
            {infoVisivel && (
              <div className="absolute z-10 top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-80 bg-blue-50 border border-blue-100 rounded-lg shadow-lg animate-fade-in">
                <div className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-odara-dark">
                    <strong className="font-semibold">Como usar:</strong> Gerencie as preferências, hábitos e necessidades específicas de cada residente.
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

  const BotaoNovaPreferencia = () => {
    return (
      <button
        onClick={abrirModalNovo}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-max justify-center"
      >
        <Plus className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> Nova Preferência
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="min-h-screen bg-odara-offwhite overflow-x-hidden">
      {/* Modal de Preferências */}
      <ModalPreferencias
        preferencia={preferenciaSelecionada}
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
        {/* Cabeçalho e Botão Novo - Ajustado para mobile */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6'>
          <Cabecalho />
          <div className="w-full sm:w-auto">
            <BotaoNovaPreferencia />
          </div>
        </div>

        {/* Barra de Busca e Filtros - Otimizado para mobile */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          {/* Barra de Busca */}
          <div className="flex-1 relative min-w-0">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <Search className="text-odara-primary h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título, descrição ou residente..."
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

        {/* Lista de Preferências */}
        <ListaPreferencias />

        {/* Contador de resultados */}
        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {preferenciasFiltradas.length} preferência(s) encontrada(s) de {preferencias.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroPreferencias;