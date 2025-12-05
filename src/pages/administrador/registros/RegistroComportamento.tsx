import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { 
  Filter, Search, Plus, Edit, Trash, Info, ChevronDown, Check, 
  AlertCircle, User, 
  UserRoundSearch,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import ModalComportamento from "./ModalComportamento";
import toast, { Toaster } from 'react-hot-toast';

// ===== CONSTANTES =====
const CATEGORIAS = {
  POSITIVO: "positivo",
  NEGATIVO: "negativo",
  NEUTRO: "neutro",
} as const;

const ROTULOS_CATEGORIAS: Record<string, string> = {
  [CATEGORIAS.POSITIVO]: "Positivo",
  [CATEGORIAS.NEGATIVO]: "Negativo",
  [CATEGORIAS.NEUTRO]: "Neutro",
};

const CORES_CATEGORIAS: Record<string, {
  bg: string;
  text: string;
  border: string;
  bola: string;
}> = {
  [CATEGORIAS.POSITIVO]: {
    bg: 'bg-green-50',
    text: 'text-green-800 font-semibold',
    border: 'border-b border-green-200',
    bola: 'bg-green-500'
  },
  [CATEGORIAS.NEGATIVO]: {
    bg: 'bg-red-50',
    text: 'text-red-800 font-semibold',
    border: 'border-b border-red-200',
    bola: 'bg-red-500'
  },
  [CATEGORIAS.NEUTRO]: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800 font-semibold',
    border: 'border-b border-yellow-200',
    bola: 'bg-yellow-500'
  },
};

const FILTRO_CATEGORIA_OPTIONS = [
  { value: 'todos', label: 'Todas categorias' },
  { value: 'positivo', label: 'Positivo' },
  { value: 'negativo', label: 'Negativo' },
  { value: 'neutro', label: 'Neutro' }
];

// ===== TIPOS =====
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
  foto?: string | null;
};

type Funcionario = {
  id: number;
  nome: string;
};

type Comportamento = {
  id: number;
  titulo: string;
  descricao?: string | null;
  data: string;
  horario: string;
  id_residente: number | null;
  residente: Residente | null;
  id_funcionario: number | null;
  funcionario: Funcionario | null;
  categoria: string;
  status: boolean;
  criado_em?: string;
};

export interface ComportamentoBD {
  id: number;
  id_residente: number | null;
  id_funcionario: number;
  titulo: string;
  descricao: string | null;
  data: string;
  horario: string;
  categoria: string;
  status: boolean;
  criado_em: string;
  atualizado_em: string;
  residente: {
    id: number;
    nome: string;
    quarto: string | null;
    foto: string | null;
  } | null;
  funcionario: {
    id: number;
    nome: string;
  } | null;
}

// ===== COMPONENTE =====
const RegistroComportamento: React.FC = () => {
  // estados principais
  const [comportamentos, setComportamentos] = useState<Comportamento[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [comportamentoEditando, setComportamentoEditando] = useState<Comportamento | null>(null);
  const [loading, setLoading] = useState(true);
  
  // estados de exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [comportamentoParaExcluir, setComportamentoParaExcluir] = useState<number | null>(null);

  // estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{
    residenteId: number | null;
    status: string | null;
    categoria: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    residenteId: null,
    status: null,
    categoria: null,
    startDate: null,
    endDate: null
  });

  // estados de UI
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);

  // refs para dropdowns
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroCategoriaRef = useRef<HTMLDivElement>(null);

  /* Utilitários */
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  /* Efeitos */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(target)) {
        setFiltroResidenteAberto(false);
      }
      if (filtroCategoriaRef.current && !filtroCategoriaRef.current.contains(target)) {
        setFiltroCategoriaAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Carregar Dados */
  const carregarComportamentos = useCallback(async () => {
    console.log('Carregando comportamentos...');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("comportamento")
        .select(`
          *,
          residente:residente(id, nome, quarto, foto),
          funcionario:funcionario(id, nome)
        `)
        .order("data", { ascending: false })
        .returns<ComportamentoBD[]>();

      if (error) throw error;

      // Mapear os dados para o formato correto
      const comportamentosMapeados = (data || []).map((item) => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        data: item.data,
        horario: item.horario,
        categoria: item.categoria,
        status: item.status || false,
        criado_em: item.criado_em,
        id_residente: item.id_residente,
        id_funcionario: item.id_funcionario,
        residente: item.residente || null,
        funcionario: item.funcionario || null
      })) as Comportamento[];

      setComportamentos(comportamentosMapeados);
      console.log('Comportamentos carregados:', comportamentosMapeados.length);
    } catch (error) {
      console.error('Erro ao buscar comportamentos:', error);
      toast.error('Erro ao carregar comportamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarResidentes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("residente")
        .select("id, nome, quarto, foto")
        .order("nome");

      if (error) throw error;
      setResidentes(data || []);
    } catch (err) {
      console.error('Erro ao carregar residentes:', err);
      toast.error('Erro ao carregar lista de residentes');
    }
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      await carregarComportamentos();
      await carregarResidentes();
    };
    
    carregarDados();
  }, [carregarComportamentos, carregarResidentes]);

  /* Handlers de Exclusão */
  const abrirModalExclusao = (id: number) => {
    setComportamentoParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setComportamentoParaExcluir(null);
  };

  const executarExclusao = async () => {
    if (!comportamentoParaExcluir) return;

    try {
      const { error } = await supabase
        .from("comportamento")
        .delete()
        .eq("id", comportamentoParaExcluir);

      if (error) throw error;

      // Atualiza a lista localmente
      setComportamentos(prev => prev.filter(c => c.id !== comportamentoParaExcluir));
      toast.success('Comportamento excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir comportamento:', err);
      toast.error('Erro ao excluir comportamento');
    } finally {
      fecharModalExclusao();
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (comportamento: Comportamento) => {
    setComportamentoEditando(comportamento);
    setModalAberto(true);
  };

  const abrirModalNovo = () => {
    setComportamentoEditando(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setComportamentoEditando(null);
    carregarComportamentos();
  };

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarResidente = (residenteId: number | null) => {
    setFiltros(prev => ({ ...prev, residenteId }));
    setFiltroResidenteAberto(false);
  };

  const selecionarCategoria = (categoria: string | null) => {
    setFiltros(prev => ({ ...prev, categoria: categoria === 'todos' ? null : categoria }));
    setFiltroCategoriaAberto(false);
  };

  const limparFiltros = () => {
    setFiltros({
      status: null,
      residenteId: null,
      categoria: null,
      startDate: null,
      endDate: null
    });
    setSearchTerm('');
    setFiltroResidenteAberto(false);
    setFiltroCategoriaAberto(false);
  };

  /* Filtragem e Ordenação */
  const comportamentosFiltrados = useMemo(() => {
    return comportamentos
      .filter(comportamento => {
        // Filtro por texto (busca em título, descrição, nome do residente)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitulo = comportamento.titulo?.toLowerCase().includes(term) || false;
          const matchDescricao = comportamento.descricao?.toLowerCase().includes(term) || false;
          const matchResidente = comportamento.residente?.nome?.toLowerCase().includes(term) || false;
          const matchFuncionario = comportamento.funcionario?.nome?.toLowerCase().includes(term) || false;
          
          if (!matchTitulo && !matchDescricao && !matchResidente && !matchFuncionario) {
            return false;
          }
        }

        // Filtro por residente
        if (filtros.residenteId && comportamento.residente?.id !== filtros.residenteId) {
          return false;
        }

        // Filtro por categoria
        if (filtros.categoria && comportamento.categoria !== filtros.categoria) {
          return false;
        }

        // Filtro por data
        if (filtros.startDate || filtros.endDate) {
          const dataComportamento = new Date(comportamento.data);
          
          if (filtros.startDate) {
            const startDate = new Date(filtros.startDate);
            if (dataComportamento < startDate) {
              return false;
            }
          }
          
          if (filtros.endDate) {
            const endDate = new Date(filtros.endDate);
            if (dataComportamento > endDate) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Ordena por data (mais recente primeiro)
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        
        if (dataA !== dataB) return dataB - dataA;
        
        // Se mesma data, ordena por horário
        return (b.horario || '').localeCompare(a.horario || '');
      });
  }, [comportamentos, searchTerm, filtros]);

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
    opcoes: Array<{ value: string; label: string; }>;
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
              onClick={() => onSelecionar(tipo === 'categoria' ? 'todos' : null)}
              className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${!valorSelecionado || (tipo === 'categoria' && valorSelecionado === 'todos')
                ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                : 'text-gray-700'
                }`}
            >
              <span>{tipo === 'categoria' ? 'Todas categorias' : 'Todos os residentes'}</span>
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

  const CardComportamento = ({ comportamento }: { comportamento: Comportamento }) => {
    const cores = CORES_CATEGORIAS[comportamento.categoria] || CORES_CATEGORIAS.neutro;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex flex-wrap justify-between gap-2 items-center p-2 sm:p-3 rounded-t-lg ${cores.border} ${cores.bg}`}>
          {/* Coluna Esquerda */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${cores.bola}`}></div>
            <p className={`text-xs sm:text-sm md:text-base ${cores.text}`}>
              {ROTULOS_CATEGORIAS[comportamento.categoria]}
            </p>
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Título e Botões de Ação */}
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-odara-dark line-clamp-1 flex-1">
              {comportamento.titulo}
            </h3>
            
            {/* Botões de Ação - Posicionamento igual ao de Medicamentos */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => abrirModalEdicao(comportamento)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar comportamento"
              >
                <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>

              <button
                onClick={() => abrirModalExclusao(comportamento.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir comportamento"
              >
                <Trash size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div className="mb-3 sm:mb-4">
            <p className="text-sm text-odara-dark line-clamp-3">
              {comportamento.descricao || 'Sem descrição'}
            </p>
          </div>
            {/* Detalhes do Comportamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-1">
              {/* Registrado por */}
              {comportamento.funcionario && (
                <div className="flex items-start gap-2">
                  <div>
                    <strong className="text-odara-dark text-xs sm:text-sm">Registrado por:</strong>
                    <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                      {comportamento.funcionario.nome}
                    </span>
                  </div>
                </div>
              )}

              {/* Criado em */}
              {comportamento.criado_em && (
                <div className="flex items-start gap-2">
                  <div>
                    <strong className="text-odara-dark text-xs sm:text-sm">Criado em:</strong>
                    <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                      {formatarData(comportamento.criado_em)}
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Footer do Card - Balão com nome do residente e quarto */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-wrap justify-center sm:justify-between gap-1 sm:gap-2 text-xs">
            <div className="flex items-center flex-wrap gap-1 justify-center sm:justify-start">
              {comportamento.residente && (
                <>
                  <span className="bg-odara-accent text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <User size={10} className="sm:w-3 sm:h-3" />
                    {comportamento.residente.nome}
                  </span>

                  {comportamento.residente.quarto && (
                    <span className="text-xs text-odara-dark">
                      • Quarto {comportamento.residente.quarto}
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
        {/* Primeira Linha - Filtros principais em coluna única no mobile */}
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
                opcoes={FILTRO_CATEGORIA_OPTIONS}
              />
            </div>
          </div>

          {/* Botão Limpar Filtros - Alinhado à direita no desktop */}
          <div className="flex md:items-end gap-2 pt-1 md:pt-0 md:shrink-0">
            <button
              onClick={limparFiltros}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full md:w-auto justify-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Segunda Linha (Filtro de Data) - 2 colunas com mesma largura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200">
          {/* Data Inicial */}
          <div>
            <div className='flex gap-1 items-center ml-1 mb-1'>
              <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Data Inicial</label>
            </div>

            <input
              type="date"
              value={filtros.startDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value || null }))}
              className="w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
            />
          </div>

          {/* Data Final */}
          <div>
            <div className="flex gap-1 items-center ml-1 mb-1">
              <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
              <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Data Final</label>
            </div>

            <input
              type="date"
              value={filtros.endDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value || null }))}
              className="w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  };

  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    const comportamento = comportamentoParaExcluir
      ? comportamentos.find(c => c.id === comportamentoParaExcluir)
      : null;
    const tituloComportamento = comportamento?.titulo || '';
    const nomeResidente = comportamento?.residente?.nome || '';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full animate-scale-in">
          <div className="text-center">
            {/* Ícone de alerta */}
            <div className="mx-auto flex items-center justify-center h-12 sm:h-14 w-12 sm:w-14 rounded-full bg-odara-alerta/10 mb-3 sm:mb-4">
              <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-odara-alerta" />
            </div>

            {/* Textos do modal */}
            <h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
            <p className="text-odara-name text-sm sm:text-base mb-3 sm:mb-4">
              Tem certeza que deseja excluir este registro de comportamento?
            </p>

            {/* Detalhes do comportamento */}
            {tituloComportamento && (
              <div className="bg-odara-offwhite rounded-lg p-3 mb-3 sm:mb-4 border border-gray-200">
                <p className="text-sm font-medium text-odara-dark">Comportamento:</p>
                <p className="text-sm font-semibold text-odara-name truncate" title={tituloComportamento}>
                  {tituloComportamento}
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

  const ListaComportamentos = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Comportamentos</h2>
          </div>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Total: {comportamentosFiltrados.length}
          </span>
        </div>

        {/* Lista ou mensagem de vazio */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-odara-accent mb-4"></div>
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando comportamentos...</p>
          </div>
        ) : comportamentosFiltrados.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <AlertCircle className="h-8 w-8 text-odara-accent mx-auto mb-4 opacity-50" />
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              {comportamentos.length === 0 ? 'Nenhum comportamento registrado' : 'Nenhum comportamento encontrado'}
            </p>

            {comportamentos.length > 0 && (
              <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
            
            <button
              onClick={abrirModalNovo}
              className="mt-4 bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
            >
              <Plus className="inline mr-2 h-4 w-4" />
              Registrar primeiro comportamento
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
            {comportamentosFiltrados.map(comportamento => (
              <CardComportamento
                key={comportamento.id}
                comportamento={comportamento}
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
          <UserRoundSearch size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                Registro de Comportamento
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
                    <strong className="font-semibold">Como usar:</strong> Registre comportamentos dos residentes, classificando como positivo, negativo ou neutro.
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

  const BotaoNovoComportamento = () => {
    return (
      <button
        onClick={abrirModalNovo}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-max justify-center"
      >
        <Plus className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> Novo Comportamento
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="min-h-screen bg-odara-offwhite overflow-x-hidden">
      {/* Modal de Comportamento */}
      <ModalComportamento
        comportamento={comportamentoEditando}
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
            <BotaoNovoComportamento />
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

        {/* Lista de Comportamentos */}
        <ListaComportamentos />

        {/* Contador de resultados */}
        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {comportamentosFiltrados.length} comportamento(s) encontrado(s) de {comportamentos.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroComportamento;