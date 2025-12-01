import React, { useEffect, useState, useRef, useCallback } from "react";
import {Plus, Edit, Trash, Info, ChevronDown, Check, Siren, Filter, Search, CheckCircle,
  Calendar, Clock, RockingChair, UsersRound} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import ModalOcorrencias from "./ModalOcorrencias";
import toast, { Toaster } from "react-hot-toast";

/* Tipos */
type ResidenteFuncionario = { 
  id: number; 
  nome: string;
  quarto?: string | null;
};

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao?: string | null;
  providencias?: string | null;
  data: string;
  residente: ResidenteFuncionario;
  funcionario: ResidenteFuncionario;
  categoria: string;
  status: boolean; // ← MUDADO: de 'resolvido: boolean' para 'status: boolean'
  criado_em?: string | null;
};

/* Constantes */
const CORES_CATEGORIAS: Record<string, { 
  bola: string; 
  bg: string; 
  text: string; 
  border: string;
  label: string;
}> = {
  acidente: { 
    bola: 'bg-odara-alerta', 
    bg: 'bg-odara-alerta/10', 
    text: 'text-odara-alerta', 
    border: 'border-b border-odara-alerta/20',
    label: 'Acidente'
  },
  saude: { 
    bola: 'bg-blue-500', 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-b border-blue-200',
    label: 'Saúde'
  },
  estrutural: { 
    bola: 'bg-yellow-500', 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-700', 
    border: 'border-b border-yellow-200',
    label: 'Estrutural'
  },
};

const COR_STATUS: Record<string, { 
  bola: string; 
  bg: string; 
  text: string; 
  border: string;
  icon: React.ComponentType<any>;
}> = {
  resolvido: { 
    bola: 'bg-green-500', 
    bg: 'bg-green-50', 
    text: 'text-odara-dark', 
    border: 'border-b border-green-200',
    icon: CheckCircle
  },
  pendente: { 
    bola: 'bg-yellow-500', 
    bg: 'bg-yellow-50', 
    text: 'text-odara-dark', 
    border: 'border-b border-yellow-200',
    icon: Clock
  },
};

const CATEGORIAS_FILTRO = [
  { value: 'todos', label: 'Todas as categorias' },
  { value: 'acidente', label: 'Acidente' },
  { value: 'saude', label: 'Saúde' },
  { value: 'estrutural', label: 'Estrutural' }
];

const STATUS_FILTRO = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'resolvido', label: 'Resolvidas' }
];

const RegistroOcorrencias: React.FC = () => {
  // Estados principais
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);
  
  // Estados do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Ocorrencia | null>(null);
  
  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{ 
    categoria: string | null; 
    status: string | null;
    residenteId: number | null;
    startDate: string | null;
    endDate: string | null;
  }>({ 
    categoria: null, 
    status: null, 
    residenteId: null, 
    startDate: null, 
    endDate: null 
  });
  
  // Estados de UI
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  
  // Refs para dropdowns
  const filtroCategoriaRef = useRef<HTMLDivElement>(null);
  const filtroStatusRef = useRef<HTMLDivElement>(null);
  const filtroResidenteRef = useRef<HTMLDivElement>(null);

  /* Utilitários */
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return {
        data: data.toLocaleDateString("pt-BR"),
        hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
    } catch {
      return { data: "-", hora: "-" };
    }
  };

  const obterResidentesUnicos = () => {
    const residentesMap = new Map<number, ResidenteFuncionario>();
    ocorrencias
      .filter(o => o.residente)
      .forEach(o => {
        if (o.residente) {
          residentesMap.set(o.residente.id, o.residente);
        }
      });
    return Array.from(residentesMap.values());
  };

  /* Efeitos */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroCategoriaRef.current && !filtroCategoriaRef.current.contains(event.target as Node)) {
        setFiltroCategoriaAberto(false);
      }
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
  const carregarOcorrencias = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ocorrencia")
        .select(`
          *,
          residente:residente!id_residente(id, nome, quarto),
          funcionario:funcionario!id_funcionario(id, nome)
        `)
        .order("data", { ascending: false })
        .order("horario", { ascending: false });

      if (error) throw error;
      
      // Combina data e horário em uma string ISO para o frontend
      const ocorrenciasFormatadas = (data || []).map(item => ({
        ...item,
        data: `${item.data}T${item.horario}` // ← Combina data e horário
      })) as Ocorrencia[];
      
      setOcorrencias(ocorrenciasFormatadas);
    } catch (err) {
      console.error("Erro ao buscar ocorrências:", err);
      toast.error("Erro ao carregar ocorrências");
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarResidentes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("residente")
        .select("id, nome, quarto")
        .order("nome", { ascending: true });
      
      if (error) throw error;
      setResidentes(data || []);
    } catch (err) {
      console.error("Erro ao buscar residentes:", err);
      toast.error("Erro ao carregar residentes");
    }
  }, []);

  useEffect(() => {
    carregarOcorrencias();
    carregarResidentes();
  }, [carregarOcorrencias, carregarResidentes]);

  /* Handlers de Operações */
  const alternarStatusResolvido = async (ocorrencia: Ocorrencia) => {
    try {
      const novoStatus = !ocorrencia.status; // ← MUDADO: usar 'status' em vez de 'resolvido'
      
      // Atualizar localmente primeiro para feedback imediato
      setOcorrencias(prev => 
        prev.map(o => 
          o.id === ocorrencia.id ? { ...o, status: novoStatus } : o // ← MUDADO: 'resolvido' → 'status'
        )
      );

      // Atualizar no banco
      const { error } = await supabase
        .from("ocorrencia")
        .update({ status: novoStatus }) // ← MUDADO: 'resolvido' → 'status'
        .eq("id", ocorrencia.id);

      if (error) throw error;
      
      toast.success(`Ocorrência ${novoStatus ? 'resolvida' : 'marcada como pendente'}`);
    } catch (err) {
      console.error("Erro ao alternar status:", err);
      toast.error("Erro ao atualizar status");
      // Reverter mudança local em caso de erro
      carregarOcorrencias();
    }
  };

  const excluirOcorrencia = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta ocorrência?')) return;

    try {
      const { error } = await supabase
        .from("ocorrencia")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setOcorrencias(prev => prev.filter(o => o.id !== id));
      toast.success("Ocorrência excluída com sucesso");
    } catch (err) {
      console.error("Erro ao excluir ocorrência:", err);
      toast.error("Erro ao excluir ocorrência");
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (ocorrencia: Ocorrencia) => {
    setOcorrenciaSelecionada(ocorrencia);
    setModalAberto(true);
  };

  const abrirModalNova = () => {
    setOcorrenciaSelecionada(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setOcorrenciaSelecionada(null);
    carregarOcorrencias();
  };

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarCategoria = (categoria: string | null) => {
    setFiltros(prev => ({ ...prev, categoria: categoria === 'todos' ? null : categoria }));
    setFiltroCategoriaAberto(false);
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
      categoria: null, 
      status: null, 
      residenteId: null, 
      startDate: null, 
      endDate: null 
    });
    setSearchTerm('');
  };

  /* Filtragem */
  const ocorrenciasFiltradas = ocorrencias.filter(ocorrencia => {
    // Filtro por texto (busca em título, descrição, nome do residente e categoria)
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      const buscaTitulo = ocorrencia.titulo?.toLowerCase().includes(termo) || false;
      const buscaDescricao = ocorrencia.descricao?.toLowerCase().includes(termo) || false;
      const buscaResidente = ocorrencia.residente?.nome.toLowerCase().includes(termo) || false;
      const buscaCategoria = ocorrencia.categoria.toLowerCase().includes(termo) || false;
      
      if (!buscaTitulo && !buscaDescricao && !buscaResidente && !buscaCategoria) {
        return false;
      }
    }

    // Filtro por categoria
    if (filtros.categoria && ocorrencia.categoria !== filtros.categoria) {
      return false;
    }

    // Filtro por status
    if (filtros.status) {
      if (filtros.status === 'pendente' && ocorrencia.status) return false; // ← MUDADO: status = true significa resolvido
      if (filtros.status === 'resolvido' && !ocorrencia.status) return false; // ← MUDADO: status = false significa pendente
    }

    // Filtro por residente
    if (filtros.residenteId && ocorrencia.residente.id !== filtros.residenteId) {
      return false;
    }

    // Filtro por data
    if (filtros.startDate || filtros.endDate) {
      const dataOcorrencia = ocorrencia.data.includes('T') 
        ? ocorrencia.data.split('T')[0] 
        : ocorrencia.data.slice(0, 10);

      if (filtros.startDate && dataOcorrencia < filtros.startDate) return false;
      if (filtros.endDate && dataOcorrencia > filtros.endDate) return false;
    }

    return true;
  });

  /* Componentes de UI */
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
    tipo: 'categoria' | 'status' | 'residente';
  }) => {
    const opcoes = tipo === 'categoria' ? CATEGORIAS_FILTRO :
                  tipo === 'status' ? STATUS_FILTRO :
                  [];

    const residentesUnicos = obterResidentesUnicos();

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex items-center justify-between w-full h-10 border border-gray-300 rounded-lg px-3 text-sm hover:bg-gray-50 transition-colors text-odara-dark"
        >
          <span>
            {tipo === 'residente'
              ? valorSelecionado
                ? residentesUnicos.find(r => r.id === valorSelecionado)?.nome
                : titulo
              : tipo === 'categoria'
                ? valorSelecionado
                  ? CATEGORIAS_FILTRO.find(opt => opt.value === valorSelecionado)?.label
                  : titulo
                : tipo === 'status'
                  ? valorSelecionado
                    ? STATUS_FILTRO.find(opt => opt.value === valorSelecionado)?.label
                    : titulo
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
                {residentesUnicos.map((residente) => (
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
              opcoes.map((opcao) => (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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

          {/* Botões de ação dos filtros */}
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
            <label className="block text-sm font-semibold text-odara-secondary mb-1">
              Data inicial
            </label>
            <input
              type="date"
              value={filtros.startDate || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value || null }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-odara-secondary mb-1">
              Data final
            </label>
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

  const CardOcorrencia = ({ ocorrencia }: { ocorrencia: Ocorrencia }) => {
    const { data, hora } = formatarData(ocorrencia.data);
    const coresCategoria = CORES_CATEGORIAS[ocorrencia.categoria] || CORES_CATEGORIAS.acidente;
    const coresStatus = ocorrencia.status ? COR_STATUS.resolvido : COR_STATUS.pendente; // ← MUDADO: usar 'status'
    const IconeStatus = coresStatus.icon;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex items-center justify-between p-3 rounded-t-lg ${coresCategoria.border} ${coresCategoria.bg}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${coresCategoria.bola}`}></div>
            <p className={`text-sm sm:text-base ${coresCategoria.text} font-semibold`}>
              {coresCategoria.label}
            </p>
          </div>

          {/* Status */}
          <button
            onClick={() => alternarStatusResolvido(ocorrencia)} // ← Já está correto
            className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IconeStatus size={14} className="text-odara-accent" />
            <span className={coresStatus.text}>
              {ocorrencia.status ? "Resolvido" : "Pendente"} {/* ← MUDADO: usar 'status' */}
            </span>
      <ChevronDown size={12} className="text-gray-500" />
          </button>
        </div>

        {/* Corpo do Card */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Título e Data/Hora */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-odara-dark line-clamp-2">
                {ocorrencia.titulo}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{data}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{hora}</span>
                </div>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => abrirModalEdicao(ocorrencia)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar ocorrência"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => excluirOcorrencia(ocorrencia.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir ocorrência"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          {/* Descrição */}
          {ocorrencia.descricao && (
            <div className="mb-3">
              <p className="text-sm text-odara-dark line-clamp-3">
                {ocorrencia.descricao}
              </p>
            </div>
          )}

          {/* Providências */}
          {ocorrencia.providencias && (
            <div className="mb-3">
              <strong className="text-odara-dark text-sm">Providências:</strong>
              <p className="text-sm text-odara-name mt-1 line-clamp-2">
                {ocorrencia.providencias}
              </p>
            </div>
          )}

          {/* Informações de pessoas */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <RockingChair size={12} className="text-odara-accent" />
                <span className="text-xs text-odara-dark">
                  <strong>Residente:</strong> {ocorrencia.residente.nome}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UsersRound size={12} className="text-odara-accent" />
                <span className="text-xs text-odara-dark">
                  <strong>Funcionário:</strong> {ocorrencia.funcionario.nome}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Cabecalho = () => {
    const contadorPendentes = ocorrencias.filter(o => !o.status).length; // ← MUDADO: usar 'status'
    const contadorResolvidas = ocorrencias.filter(o => o.status).length; // ← MUDADO: usar 'status'

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Siren size={30} className='text-odara-accent mr-2'/>
          <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
            Registro de Ocorrências
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
                <h3 className="font-bold mb-2">Registro de Ocorrências</h3>
                <p>Documenta incidentes, acidentes, saúde e situações relevantes para acompanhamento.</p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-odara-dropdown"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Contadores */}
        <div className="flex gap-4 text-sm">
          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
            <strong>{contadorPendentes}</strong> pendentes
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <strong>{contadorResolvidas}</strong> resolvidas
          </div>
        </div>
      </div>
    );
  };

  const BotaoNovaOcorrencia = () => {
    return (
      <button
        onClick={abrirModalNova}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 mb-6"
      >
        <Plus className="mr-2" /> Nova Ocorrência
      </button>
    );
  };

  const ListaOcorrencias = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-odara-dark">Ocorrências</h2>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            Total: {ocorrenciasFiltradas.length} de {ocorrencias.length}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.categoria || filtros.status || filtros.residenteId || searchTerm) && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {searchTerm && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Busca: "{searchTerm}"
              </span>
            )}
            {filtros.categoria && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Categoria: {filtros.categoria}
              </span>
            )}
            {filtros.status && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Status: {filtros.status === 'pendente' ? 'Pendentes' : 'Resolvidas'}
              </span>
            )}
            {filtros.residenteId && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
              </span>
            )}
          </div>
        )}

        {/* Lista ou mensagem de vazio */}
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-odara-dark/60 text-lg">Carregando ocorrências...</p>
          </div>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <div className="p-8 rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-lg">
              {ocorrencias.length === 0 ? 'Nenhuma ocorrência registrada' : 'Nenhuma ocorrência encontrada'}
            </p>
            {ocorrencias.length > 0 && (
              <p className="text-odara-dark/40 text-sm mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[800px] overflow-y-auto p-2">
            {ocorrenciasFiltradas.map(ocorrencia => (
              <CardOcorrencia
                key={ocorrencia.id}
                ocorrencia={ocorrencia}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  /* Renderização Principal */
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      {/* Modal de Ocorrências */}
      <ModalOcorrencias
        ocorrencia={ocorrenciaSelecionada}
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
            <BotaoNovaOcorrencia />
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
              placeholder="Buscar por título, descrição, residente ou categoria..."
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

        {/* Lista de Ocorrências */}
        <ListaOcorrencias />

        {/* Contador de resultados */}
        <div className="my-4 text-sm text-gray-400">
          Total de {ocorrenciasFiltradas.length} ocorrência(s) encontrada(s) de {ocorrencias.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroOcorrencias;