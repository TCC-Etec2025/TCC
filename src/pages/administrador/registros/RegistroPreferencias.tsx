import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Filter, Search, Plus, Edit, Trash, Info, ChevronDown, Check, Star, User } from 'lucide-react';

import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

import ModalPreferencias from './ModalPreferencias';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
  foto?: string | null;
};

type Preferencia = {
  id: number;
  titulo: string;
  descricao: string;
  tipo_preferencia: string;
  prioridade: string;
  atualizado_em: string;
  id_residente: number;
  observacoes?: string | null;
  foto?: string | null;
  status: string;
  criado_em: string;
  residente?: Residente | null;
};

/* Constantes */
const CORES_CATEGORIAS: Record<string, {
  bg: string;
  text: string;
  border: string;
  bola: string;
}> = {
  alimentar: {
    bg: 'bg-odara-contorno/20',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-odara-dark/30',
    bola: 'bg-odara-contorno'
  },
  atividade: {
    bg: 'bg-odara-dropdown-accent/10',
    text: 'text-odara-dropdown-accent font-semibold',
    border: 'border-b border-odara-dropdown-accent',
    bola: 'bg-odara-dropdown-accent'
  },
  cuidador: {
    bg: 'bg-odara-primary/10',
    text: 'text-odara-primary font-semibold',
    border: 'border-b border-odara-primary',
    bola: 'bg-odara-primary'
  }
} as const;

const CATEGORIAS = {
  alimentar: 'Alimentar',
  atividade: 'Atividade',
  cuidador: 'Cuidador',
} as const;

const CATEGORIA_OPTIONS = [
  { value: 'todos', label: 'Todas categorias' },
  { value: 'alimentar', label: 'Alimentar' },
  { value: 'atividade', label: 'Atividade' },
  { value: 'cuidador', label: 'Cuidador' }
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
    categoria: string | null;
  }>({
    residenteId: null,
    categoria: null
  });

  // Estados de UI
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);

  // Refs para dropdowns
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroCategoriaRef = useRef<HTMLDivElement>(null);

  /* Utilitários */
  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  /* Efeitos */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(event.target as Node)) {
        setFiltroResidenteAberto(false);
      }
      if (filtroCategoriaRef.current && !filtroCategoriaRef.current.contains(event.target as Node)) {
        setFiltroCategoriaAberto(false);
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
          residente:residente(id, nome, quarto, foto)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      
      // Garantir que os dados estão no formato correto
      const preferenciasFormatadas = (data || []).map(item => ({
        ...item,
        tipo_preferencia: item.tipo_preferencia || 'outros',
        prioridade: item.prioridade || 'media',
        status: item.status || 'ativo'
      })) as Preferencia[];
      
      console.log('Preferências carregadas:', preferenciasFormatadas);
      console.log('Categorias presentes:', [...new Set(preferenciasFormatadas.map(p => p.tipo_preferencia))]);
      
      setPreferencias(preferenciasFormatadas);
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
        .select('id, nome, quarto, foto')
        .order('nome');

      if (!error) setResidentes(data || []);
    } catch (err) {
      console.error('Erro ao carregar residentes:', err);
      toast.error('Erro ao carregar lista de residentes');
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

      setPreferencias(prev => prev.filter(o => o.id !== preferenciaParaExcluir));
      toast.success('Preferência excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir preferência:', err);
      toast.error('Erro ao excluir preferência');
    } finally {
      fecharModalExclusao();
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

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarResidente = (residenteId: number | null) => {
    setFiltros(prev => ({ ...prev, residenteId }));
    setFiltroResidenteAberto(false);
  };

  const selecionarCategoria = (categoria: string | null) => {
    setFiltros(prev => ({ 
      ...prev, 
      categoria: categoria === 'todos' ? null : categoria 
    }));
    setFiltroCategoriaAberto(false);
  };

  const limparFiltros = () => {
    setFiltros({
      residenteId: null,
      categoria: null
    });
    setSearchTerm('');
    setFiltroResidenteAberto(false);
    setFiltroCategoriaAberto(false);
  };

  /* Filtragem e Ordenação */
  const preferenciasFiltradas = useMemo(() => {
    console.log('Filtrando preferências...');
    console.log('Total de preferências:', preferencias.length);
    console.log('Filtros ativos:', filtros);
    console.log('Termo de busca:', searchTerm);

    const resultado = preferencias
      .filter(preferencia => {
        // Filtro por texto (busca em título, descrição, nome do residente)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitulo = preferencia.titulo?.toLowerCase().includes(term) || false;
          const matchDescricao = preferencia.descricao?.toLowerCase().includes(term) || false;
          const matchResidente = preferencia.residente?.nome?.toLowerCase().includes(term) || false;
          const matchObservacoes = preferencia.observacoes?.toLowerCase().includes(term) || false;
          
          if (!matchTitulo && !matchDescricao && !matchResidente && !matchObservacoes) {
            return false;
          }
        }

        // Filtro por residente
        if (filtros.residenteId && preferencia.residente?.id !== filtros.residenteId) {
          return false;
        }

        // Filtro por categoria - CORRIGIDO
        if (filtros.categoria) {
          // Verifica se a categoria da preferência é igual à categoria filtrada
          if (preferencia.tipo_preferencia !== filtros.categoria) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Ordena por data de registro (mais recente primeiro)
        const dataA = new Date(a.criado_em).getTime();
        const dataB = new Date(b.criado_em).getTime();
        
        return dataB - dataA;
      });
    
    console.log('Resultados filtrados:', resultado.length);
    return resultado;
  }, [preferencias, searchTerm, filtros]);

  /* Componentes de UI */
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
    onSelecionar: (value: string | number | null) => void;
    tipo: 'residente' | 'categoria';
    opcoes: Array<{ value: string; label: string }>;
  }) => {
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
              : valorSelecionado
                ? opcoes.find(opt => opt.value === valorSelecionado)?.label
                : titulo
            }
          </span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500 shrink-0" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
            <button
              onClick={() => onSelecionar(tipo === 'residente' ? null : 'todos')}
              className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${!valorSelecionado || valorSelecionado === 'todos'
                ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                : 'text-gray-700'
                }`}
            >
              <span>
                {tipo === 'categoria' ? 'Todas categorias' : 'Todos os residentes'}
              </span>
              {(!valorSelecionado || valorSelecionado === 'todos') && 
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
              opcoes.filter(opt => opt.value !== 'todos').map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => onSelecionar(opcao.value)}
                  className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === opcao.value
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
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
    const cores = CORES_CATEGORIAS[preferencia.tipo_preferencia] || CORES_CATEGORIAS.outros;
    const categoriaLabel = CATEGORIAS[preferencia.tipo_preferencia as keyof typeof CATEGORIAS] || preferencia.tipo_preferencia;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card - Somente categoria com cor */}
        <div className={`flex flex-wrap justify-between gap-2 items-center p-2 sm:p-3 rounded-t-lg ${cores.border} ${cores.bg}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${cores.bola}`}></div>
            <p className={`text-xs sm:text-sm md:text-base ${cores.text}`}>
              {categoriaLabel}
            </p>
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Título e Botões de Ação */}
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

          {/* Observações */}
          {preferencia.observacoes && (
            <div className="mb-3 sm:mb-4">
              <strong className="text-odara-dark text-xs sm:text-sm">Observações:</strong>
              <p className="text-sm text-odara-dark mt-1">
                {preferencia.observacoes}
              </p>
            </div>
          )}

          {/* Datas em duas colunas - Sem ícones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-auto">
            <div>
              <strong className="text-odara-dark text-xs sm:text-sm">Registro:</strong>
              <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                {formatarData(preferencia.criado_em)}
              </span>
            </div>

            <div>
              <strong className="text-odara-dark text-xs sm:text-sm">Atualização:</strong>
              <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                {formatarData(preferencia.atualizado_em)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer do Card - Balão com nome do residente e quarto */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-wrap justify-center sm:justify-between gap-1 sm:gap-2 text-xs">
            <div className="flex items-center flex-wrap gap-1 justify-center sm:justify-start">
              {preferencia.residente && (
                <>
                  <span className="bg-odara-accent text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <User size={10} className="sm:w-3 sm:h-3" />
                    {preferencia.residente.nome}
                  </span>

                  {preferencia.residente.quarto && (
                    <span className="text-xs text-odara-dark">
                      • Quarto {preferencia.residente.quarto}
                    </span>
                  )}
                </>
              )}
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
        {/* Filtros principais em layout responsivo */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-5 w-full">
          <div className="flex flex-col md:flex-row flex-1 gap-4 sm:gap-5 w-full">
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
                opcoes={[]}
              />
            </div>

            {/* Filtro de Categoria */}
            <div className="flex-1 min-w-0">
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
                onSelecionar={selecionarCategoria as (value: string | number | null) => void}
                tipo="categoria"
                opcoes={CATEGORIA_OPTIONS}
              />
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          <div className="flex md:items-end gap-2 pt-1 md:pt-0 md:shrink-0">
            <button
              onClick={limparFiltros}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full md:w-auto justify-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    const preferencia = preferenciaParaExcluir
      ? preferencias.find(p => p.id === preferenciaParaExcluir)
      : null;
    const tituloPreferencia = preferencia?.titulo || '';
    const nomeResidente = preferencia?.residente?.nome || '';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full animate-scale-in">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 sm:h-14 w-12 sm:w-14 rounded-full bg-odara-alerta/10 mb-3 sm:mb-4">
              <Trash className="h-6 w-6 sm:h-7 sm:w-7 text-odara-alerta" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
            <p className="text-odara-name text-sm sm:text-base mb-3 sm:mb-4">
              Tem certeza que deseja excluir esta preferência?
            </p>

            {tituloPreferencia && (
              <div className="bg-odara-offwhite rounded-lg p-3 mb-3 sm:mb-4 border border-gray-200">
                <p className="text-sm font-medium text-odara-dark">Preferência:</p>
                <p className="text-sm font-semibold text-odara-name truncate" title={tituloPreferencia}>
                  {tituloPreferencia}
                </p>
                {nomeResidente && (
                  <p className="text-sm text-odara-dark mt-1">
                    Residente: <span className="font-medium">{nomeResidente}</span>
                  </p>
                )}
              </div>
            )}

            <p className="text-xs sm:text-sm text-odara-alerta mb-4 sm:mb-6 font-medium">
              Esta ação não pode ser desfeita.
            </p>

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
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Preferências</h2>
          </div>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Total: {preferenciasFiltradas.length}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.residenteId || filtros.categoria || searchTerm) && (
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

            {filtros.categoria && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Categoria: {CATEGORIAS[filtros.categoria as keyof typeof CATEGORIAS]}
              </span>
            )}
          </div>
        )}

        {/* Lista ou mensagem de vazio */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-odara-accent mb-4"></div>
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando preferências...</p>
          </div>
        ) : preferenciasFiltradas.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <Star className="h-8 w-8 text-odara-accent mx-auto mb-4 opacity-50" />
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              {preferencias.length === 0 ? 'Nenhuma preferência registrada' : 'Nenhuma preferência encontrada'}
            </p>

            {preferencias.length > 0 && (
              <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
            
            <button
              onClick={abrirModalNovo}
              className="mt-4 bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
            >
              <Plus className="inline mr-2 h-4 w-4" />
              Registrar primeira preferência
            </button>
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
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3 w-full">
          <Star size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                Registro de Preferências
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
                    <strong className="font-semibold">Como usar:</strong> Gerencie as preferências, hábitos e necessidades específicas de cada residente.
                  </p>
                  <button
                    onClick={() => setInfoVisivel(false)}
                    className="mt-2 text-xs sm:text-sm text-odara-accent hover:text-odara-secondary font-medium"
                  >
                    Entendi
                  </button>
                </div>
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
      <ModalPreferencias
        preferencia={preferenciaSelecionada}
        isOpen={modalAberto}
        onClose={fecharModal}
      />

      <ModalConfirmacaoExclusao />

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
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6'>
          <Cabecalho />
          <div className="w-full sm:w-auto">
            <BotaoNovaPreferencia />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
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

        <SecaoFiltros />

        <ListaPreferencias />

        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {preferenciasFiltradas.length} preferência(s) encontrada(s) de {preferencias.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroPreferencias;