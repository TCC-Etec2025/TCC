import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash, Filter, Search, Info, Calendar, Clock, Activity, HeartPulse, Thermometer, Heart, Droplets, Scale, AlertCircle, ChevronDown, Check, User, Clock as ClockIcon, Calendar as CalendarIcon, Users, type LucideIcon } from 'lucide-react';

import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

import ModalSaude from "./ModalSaude";

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
};

type Saude = {
  id: number;
  id_residente: number;
  id_funcionario: number;
  data: string;
  horario: string;
  categoria: string;
  valor: string;
  observacoes: string | null;
  criado_em?: string;
  atualizado_em?: string;
  residente?: Residente;
  funcionario?: Funcionario;
};

/* Constantes para categorias de saúde */
const CATEGORIAS = [
  { value: 'pressao_arterial', label: 'Pressão Arterial', icon: HeartPulse, cor: 'bg-red-100', texto: 'text-red-800', iconeCor: 'text-red-600' },
  { value: 'temperatura', label: 'Temperatura', icon: Thermometer, cor: 'bg-orange-100', texto: 'text-orange-800', iconeCor: 'text-orange-600' },
  { value: 'glicemia', label: 'Glicemia', icon: Droplets, cor: 'bg-blue-100', texto: 'text-blue-800', iconeCor: 'text-blue-600' },
  { value: 'frequencia_cardiaca', label: 'Freq. Cardíaca', icon: Heart, cor: 'bg-pink-100', texto: 'text-pink-800', iconeCor: 'text-pink-600' },
  { value: 'saturacao_oxigenio', label: 'Sat. de Oxigênio', icon: Activity, cor: 'bg-cyan-100', texto: 'text-cyan-800', iconeCor: 'text-cyan-600' },
  { value: 'peso', label: 'Peso', icon: Scale, cor: 'bg-green-100', texto: 'text-green-800', iconeCor: 'text-green-600' },
  { value: 'outro', label: 'Outro', icon: AlertCircle, cor: 'bg-gray-100', texto: 'text-gray-800', iconeCor: 'text-gray-600' },
];

const CATEGORIA_OPTIONS = [
  { value: 'todos', label: 'Todas as categorias' },
  ...CATEGORIAS.map(cat => ({ value: cat.value, label: cat.label }))
];

/* Formatar valores por categoria */
const formatarValor = (categoria: string, valor: string): string => {
  const formatos: Record<string, string> = {
    pressao_arterial: `${valor} mmHg`,
    temperatura: `${valor}°C`,
    glicemia: `${valor} mg/dL`,
    frequencia_cardiaca: `${valor} bpm`,
    saturacao_oxigenio: `${valor}%`,
    peso: `${valor} kg`,
  };
  return formatos[categoria] || valor;
};

/* Verificar se valor está dentro da faixa saudável */
const verificarValorSaudavel = (categoria: string, valor: string): { saudavel: boolean; mensagem: string } => {
  const num = parseFloat(valor.replace(/[^\d.-]/g, ''));
  
  if (isNaN(num)) return { saudavel: true, mensagem: '' };

  const limites: Record<string, { min: number; max: number; mensagem: string }> = {
    pressao_arterial: {
      min: 90, max: 140, mensagem: 'Pressão ideal: 120/80 mmHg'
    },
    temperatura: {
      min: 36, max: 37.5, mensagem: 'Temperatura normal: 36-37.5°C'
    },
    glicemia: {
      min: 70, max: 140, mensagem: 'Glicemia normal: 70-140 mg/dL'
    },
    frequencia_cardiaca: {
      min: 60, max: 100, mensagem: 'Frequência normal: 60-100 bpm'
    },
    saturacao_oxigenio: {
      min: 95, max: 100, mensagem: 'Sat. normal: 95-100%'
    }
  };

  const limite = limites[categoria];
  if (!limite) return { saudavel: true, mensagem: '' };

  const saudavel = num >= limite.min && num <= limite.max;
  return { 
    saudavel, 
    mensagem: saudavel ? limite.mensagem : `Valor fora do ideal (${limite.min}-${limite.max})`
  };
};

const RegistroSaude = () => {
  // Estados principais
  const [registros, setRegistros] = useState<Saude[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<Saude | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados de exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [registroParaExcluir, setRegistroParaExcluir] = useState<number | null>(null);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{
    residenteId: number | null;
    funcionarioId: number | null;
    categoria: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    residenteId: null,
    funcionarioId: null,
    categoria: null,
    startDate: null,
    endDate: null
  });

  // Estados de UI
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroFuncionarioAberto, setFiltroFuncionarioAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroFuncionarioRef = useRef<HTMLDivElement>(null);
  const filtroCategoriaRef = useRef<HTMLDivElement>(null);

  /* Efeitos */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(event.target as Node)) {
        setFiltroResidenteAberto(false);
      }
      if (filtroFuncionarioRef.current && !filtroFuncionarioRef.current.contains(event.target as Node)) {
        setFiltroFuncionarioAberto(false);
      }
      if (filtroCategoriaRef.current && !filtroCategoriaRef.current.contains(event.target as Node)) {
        setFiltroCategoriaAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Carregar Dados */
  const carregarRegistros = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saude')
        .select(`
          *,
          residente:residente(id, nome, quarto),
          funcionario:funcionario(id, nome, cargo)
        `)
        .order('data', { ascending: false })
        .order('horario', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (err) {
      console.error('Erro ao carregar registros de saúde:', err);
      toast.error('Erro ao carregar registros de saúde.');
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

  const carregarFuncionarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('funcionario')
        .select('id, nome, cargo')
        .order('nome');
      if (!error) setFuncionarios(data || []);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
    }
  }, []);

  useEffect(() => {
    carregarRegistros();
    carregarResidentes();
    carregarFuncionarios();
  }, [carregarRegistros, carregarResidentes, carregarFuncionarios]);

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
        .from("saude")
        .delete()
        .eq("id", registroParaExcluir);
      if (error) throw error;
      setRegistros(prev => prev.filter(o => o.id !== registroParaExcluir));
      toast.success('Registro excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
      toast.error('Erro ao excluir registro');
    } finally {
      fecharModalExclusao();
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (registro: Saude) => {
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
    carregarRegistros();
  };

  const toggleFiltros = () => {
    setFiltrosAberto(!filtrosAberto);
  };

  const selecionarResidente = (residenteId: number | null) => {
    setFiltros(prev => ({ ...prev, residenteId }));
    setFiltroResidenteAberto(false);
  };

  const selecionarFuncionario = (funcionarioId: number | null) => {
    setFiltros(prev => ({ ...prev, funcionarioId }));
    setFiltroFuncionarioAberto(false);
  };

  const selecionarCategoria = (categoria: string | null) => {
    setFiltros(prev => ({ ...prev, categoria: categoria === 'todos' ? null : categoria }));
    setFiltroCategoriaAberto(false);
  };

  const limparFiltros = () => {
    setFiltros({
      categoria: null,
      residenteId: null,
      funcionarioId: null,
      startDate: null,
      endDate: null
    });
    setSearchTerm('');
    setFiltroCategoriaAberto(false);
    setFiltroResidenteAberto(false);
    setFiltroFuncionarioAberto(false);
  };

  /* Filtragem e Ordenação */
  const registrosFiltrados = useMemo(() => {
    return registros
      .filter(registro => {
        // Filtro por texto (busca em valor, observações, nome do residente, nome do funcionário)
        if (searchTerm.trim()) {
          const termo = searchTerm.toLowerCase();
          const buscaValor = registro.valor.toLowerCase().includes(termo);
          const buscaObservacoes = registro.observacoes?.toLowerCase().includes(termo) || false;
          const buscaResidente = registro.residente?.nome.toLowerCase().includes(termo) || false;
          const buscaFuncionario = registro.funcionario?.nome.toLowerCase().includes(termo) || false;
          const buscaCategoria = CATEGORIAS.find(c => c.value === registro.categoria)?.label.toLowerCase().includes(termo) || false;

          if (!buscaValor && !buscaObservacoes && !buscaResidente && !buscaFuncionario && !buscaCategoria) {
            return false;
          }
        }

        // Filtro por residente
        if (filtros.residenteId && registro.residente?.id !== filtros.residenteId) {
          return false;
        }

        // Filtro por funcionário
        if (filtros.funcionarioId && registro.funcionario?.id !== filtros.funcionarioId) {
          return false;
        }

        // Filtro por categoria
        if (filtros.categoria && registro.categoria !== filtros.categoria) {
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
        if (a.data !== b.data) return b.data.localeCompare(a.data);
        return b.horario.localeCompare(a.horario);
      });
  }, [registros, searchTerm, filtros]);

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
    onSelecionar: (value: string | number | null) => void;
    tipo: 'categoria' | 'residente' | 'funcionario';
  }) => {
    const opcoes = tipo === 'categoria' ? CATEGORIA_OPTIONS : [];
    const lista = tipo === 'residente' ? residentes : tipo === 'funcionario' ? funcionarios : [];

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
              : tipo === 'funcionario'
              ? valorSelecionado
                ? funcionarios.find(f => f.id === valorSelecionado)?.nome
                : titulo
              : valorSelecionado
                ? CATEGORIA_OPTIONS.find(opt => opt.value === valorSelecionado)?.label
                : titulo
            }
          </span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500 shrink-0" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
            {tipo === 'categoria' ? (
              opcoes.map(opcao => (
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
            ) : (
              <>
                <button
                  onClick={() => onSelecionar(null)}
                  className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${!valorSelecionado
                    ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                    : 'text-gray-700'
                    }`}
                >
                  <span>{tipo === 'residente' ? 'Todos os residentes' : 'Todos os funcionários'}</span>
                  {!valorSelecionado && <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                </button>

                {lista.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelecionar(item.id)}
                    className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === item.id
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <span className="truncate">
                      {item.nome}
                      {tipo === 'residente' && 'quarto' in item && item.quarto ? ` (${item.quarto})` : ''}
                      {tipo === 'funcionario' && 'cargo' in item && item.cargo ? ` - ${item.cargo}` : ''}
                    </span>
                    {valorSelecionado === item.id && <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
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

            {/* Filtro de Funcionário */}
            <div className="flex-1 min-w-0">
              <div className='flex gap-1 items-center ml-1 mb-1'>
                <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
                <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Funcionário</label>
              </div>
              <FiltroDropdown
                titulo="Todos os funcionários"
                aberto={filtroFuncionarioAberto}
                setAberto={setFiltroFuncionarioAberto}
                ref={filtroFuncionarioRef}
                valorSelecionado={filtros.funcionarioId}
                onSelecionar={selecionarFuncionario as (value: string | number | null) => void}
                tipo="funcionario"
              />
            </div>

            {/* Filtro de Categoria */}
            <div className="flex-1 min-w-0">
              <div className='flex gap-1 items-center ml-1 mb-1'>
                <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
                <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Categoria</label>
              </div>
              <FiltroDropdown
                titulo="Todas as categorias"
                aberto={filtroCategoriaAberto}
                setAberto={setFiltroCategoriaAberto}
                ref={filtroCategoriaRef}
                valorSelecionado={filtros.categoria || 'todos'}
                onSelecionar={selecionarCategoria as (value: string | number | null) => void}
                tipo="categoria"
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
          </div>
        </div>
      </div>
    );
  };

  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    const registro = registroParaExcluir
      ? registros.find(o => o.id === registroParaExcluir)
      : null;
    const categoriaInfo = registro ? CATEGORIAS.find(c => c.value === registro.categoria) : null;

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
              Tem certeza que deseja excluir este registro de saúde?
            </p>

            {/* Detalhes do registro */}
            {registro && (
              <div className="bg-odara-offwhite rounded-lg p-3 mb-3 sm:mb-4 border border-gray-200">
                <p className="text-sm font-medium text-odara-dark">Registro:</p>
                <div className="flex items-center gap-2 mt-1">
                  {categoriaInfo && <categoriaInfo.icon className={`w-4 h-4 ${categoriaInfo.iconeCor}`} />}
                  <p className="text-sm font-semibold text-odara-name">
                    {categoriaInfo?.label}: {formatarValor(registro.categoria, registro.valor)}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {registro.residente?.nome} • {registro.data.split('-').reverse().join('/')}
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

  const CardSaude = ({ registro }: { registro: Saude }) => {
    const categoriaInfo = CATEGORIAS.find(c => c.value === registro.categoria);
    const IconeCategoria = categoriaInfo?.icon || HeartPulse;
    const { saudavel, mensagem } = verificarValorSaudavel(registro.categoria, registro.valor);
    const valorFormatado = formatarValor(registro.categoria, registro.valor);

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Header do Card */}
        <div className={`flex justify-between items-center p-3 sm:p-4 rounded-t-lg border-b ${categoriaInfo?.cor || 'bg-gray-100'} border-gray-200`}>
          <div className="flex items-center gap-2">
            <IconeCategoria className={`w-5 h-5 sm:w-6 sm:h-6 ${categoriaInfo?.iconeCor || 'text-gray-600'}`} />
            <span className={`font-semibold text-sm sm:text-base ${categoriaInfo?.texto || 'text-gray-800'}`}>
              {categoriaInfo?.label || 'Saúde'}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-odara-dark font-medium">
            {registro.data.split('-').reverse().join('/')}
            <span className="text-odara-accent ml-1">• {registro.horario.slice(0, 5)}</span>
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          {/* Valor Principal */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-odara-dark">
                {valorFormatado}
              </h3>
              {!saudavel && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  Atenção
                </span>
              )}
            </div>
            {mensagem && (
              <p className={`text-xs sm:text-sm mt-1 ${saudavel ? 'text-green-600' : 'text-red-600'}`}>
                {mensagem}
              </p>
            )}
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-2 sm:space-y-3 flex-1">
            {registro.funcionario && (
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Funcionário:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {registro.funcionario.nome}
                  {registro.funcionario.cargo && ` • ${registro.funcionario.cargo}`}
                </span>
              </div>
            )}

            {registro.observacoes && (
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Observações:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {registro.observacoes}
                </span>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => abrirModalEdicao(registro)}
              className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-odara-dropdown-accent text-xs sm:text-sm flex items-center gap-1"
              title="Editar registro"
            >
              <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
              Editar
            </button>
            <button
              onClick={() => abrirModalExclusao(registro.id)}
              className="text-odara-alerta hover:text-odara-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-odara-alerta text-xs sm:text-sm flex items-center gap-1"
              title="Excluir registro"
            >
              <Trash size={12} className="sm:w-3.5 sm:h-3.5" />
              Excluir
            </button>
          </div>
        </div>

        {/* Footer do Card */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              <User size={10} className="text-odara-accent" />
              <span className="font-medium text-odara-dark">
                {registro.residente?.nome || 'Sem residente'}
              </span>
              {registro.residente?.quarto && (
                <span className="text-gray-600">
                  • Quarto {registro.residente.quarto}
                </span>
              )}
            </div>
            <div className="text-gray-500 flex items-center gap-1">
              <ClockIcon size={9} />
              Criado: {registro.criado_em ? new Date(registro.criado_em).toLocaleDateString('pt-BR') : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ListaRegistros = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Registros de Saúde</h2>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Total: {registrosFiltrados.length} de {registros.length}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.categoria || filtros.residenteId || filtros.funcionarioId || filtros.startDate || filtros.endDate || searchTerm) && (
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
            {filtros.funcionarioId && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Funcionário: {funcionarios.find(f => f.id === filtros.funcionarioId)?.nome}
              </span>
            )}
            {filtros.categoria && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Categoria: {CATEGORIA_OPTIONS.find(opt => opt.value === filtros.categoria)?.label}
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
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando registros...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              {registros.length === 0 ? 'Nenhum registro de saúde' : 'Nenhum registro encontrado'}
            </p>
            {registros.length > 0 && (
              <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {registrosFiltrados.map(registro => (
              <CardSaude key={registro.id} registro={registro} />
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
          <HeartPulse size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                <span className="sm:hidden">Saúde</span>
                <span className="hidden sm:inline">Monitoramento de Saúde</span>
              </h1>
              
              <button
                onClick={() => setInfoVisivel(!infoVisivel)}
                className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ml-1"
                aria-label="Informações"
              >
                <Info size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-odara-accent" />
              </button>
            </div>
            
            {/* Info aparecendo como um OVERLAY ABSOLUTO */}
            {infoVisivel && (
              <div className="absolute z-10 top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-72 bg-blue-50 border border-blue-100 rounded-lg shadow-lg animate-fade-in">
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold mb-2 text-sm">Monitoramento de Saúde</h3>
                  <p className="text-xs sm:text-sm text-odara-dark">
                    Registre e monitore a saúde dos residentes com aferições regulares de pressão, temperatura, glicemia e outros parâmetros importantes. Cada registro é vinculado ao funcionário responsável pela aferição.
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

  const BotaoNovoRegistro = () => {
    return (
      <button
        onClick={abrirModalNovo}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-max justify-center"
      >
        <Plus className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> Nova Aferição
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="min-h-screen bg-odara-offwhite overflow-x-hidden">
      {/* Modal de Saúde */}
      <ModalSaude
        registro={registroSelecionado}
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
            <BotaoNovoRegistro />
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
              placeholder="Buscar por valor, observações, residente ou funcionário..."
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

        {/* Lista de Registros */}
        <ListaRegistros />

        {/* Contador de resultados */}
        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {registrosFiltrados.length} registro(s) encontrado(s) de {registros.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>
    </div>
  );
};

export default RegistroSaude;