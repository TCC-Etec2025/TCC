// src/components/RegistroMedicamentos.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Filter, Search, CheckCircle, Clock, CircleX, Plus, Edit, Trash, Info, ChevronDown, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import ModalMedicamentos from './ModalMedicamentos';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Medicamento = {
  id: number;
  nome: string;
  dosagem: string;
  dose: string;
  data_inicio: string;
  horario_inicio: string;
  data_fim?: string | null;
  recorrencia: string;
  intervalo: number;
  id_residente: number;
  efeitos_colaterais?: string | null;
  observacao?: string | null;
  saude_relacionada?: string | null;
  foto?: string | null;
  status: string;
  criado_em?: string;
  residente?: Residente | null;
};

/* Constantes */
const COR_STATUS: Record<string, { bola: string; bg: string; text: string; border: string }> = {
  ativo: { bola: 'bg-green-500', bg: 'bg-green-50', text: 'text-odara-dark font-semibold', border: 'border-b border-green-200' },
  suspenso: { bola: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-odara-dark font-semibold', border: 'border-b border-yellow-200' },
  finalizado: { bola: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-odara-dark font-semibold', border: 'border-b border-gray-200' }
};

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'finalizado', label: 'Finalizado' }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'finalizado', label: 'Finalizado' }
];

const RegistroMedicamentos: React.FC = () => {
  // Estados
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState<Medicamento | null>(null);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<{ residenteId: number | null; status: string | null }>({
    residenteId: null,
    status: null
  });
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroStatusRef = useRef<HTMLDivElement>(null);

  /* Utilitários */
  const obterIconeStatus = (status: string) => {
    switch (status) {
      case "ativo": return CheckCircle;
      case "suspenso": return Clock;
      case "finalizado": return CircleX;
      default: return Clock;
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const obterResidentesUnicos = () => {
    const residentesMap = new Map();
    medicamentos
      .filter(m => m.residente)
      .forEach(m => {
        if (m.residente) {
          residentesMap.set(m.residente.id, m.residente.nome);
        }
      });
    return Array.from(residentesMap.entries());
  };

  /* Efeitos */
  // Dentro do useEffect existente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // REMOVA OU COMENTE ESTA PARTE:
      /* if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAberto(null);
      }
      */

      // Mantenha apenas a lógica dos filtros:
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

  /* Operações de Dados */
  const carregarMedicamentos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('medicamento')
        .select(`
          *,
          residente:residente(id, nome, quarto)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setMedicamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      toast.error('Erro ao carregar medicamentos');
    }
  }, []);

  useEffect(() => {
    carregarMedicamentos();
  }, [carregarMedicamentos]);

  // FUNÇÃO CORRIGIDA - atualizar status do medicamento
  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      // Atualiza no banco de dados
      const { error } = await supabase
        .from('medicamento')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      // Atualiza o estado local imediatamente
      setMedicamentos(prev =>
        prev.map(medicamento =>
          medicamento.id === id
            ? { ...medicamento, status: novoStatus }
            : medicamento
        )
      );

      setDropdownAberto(null);
      toast.success(`Status alterado para ${novoStatus}`);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Falha ao atualizar status.');
    }
  };

  const removerMedicamento = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) return;

    try {
      const { error } = await supabase.from('medicamento').delete().eq('id', id);
      if (error) throw error;
      setMedicamentos(prev => prev.filter(m => m.id !== id));
      toast.success('Medicamento excluído com sucesso.');
    } catch (err) {
      console.error('Erro ao excluir medicamento:', err);
      toast.error('Erro ao excluir medicamento.');
    }
  };

  /* Handlers de UI */
  const abrirModalEdicao = (medicamento: Medicamento) => {
    setMedicamentoSelecionado(medicamento);
    setModalAberto(true);
  };

  const abrirModalNovo = () => {
    setMedicamentoSelecionado(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setMedicamentoSelecionado(null);
    carregarMedicamentos();
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
    setFiltros({ residenteId: null, status: null });
    setFiltroResidenteAberto(false);
    setFiltroStatusAberto(false);
  };

  /* Filtragem e Ordenação */
  const medicamentosFiltrados = medicamentos
    .filter(medicamento => {
      if (searchTerm.trim() &&
        !medicamento.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filtros.residenteId && medicamento.residente?.id !== filtros.residenteId) {
        return false;
      }

      if (filtros.status && filtros.status !== 'todos' && medicamento.status !== filtros.status) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dataA = new Date(`${a.data_inicio}T${a.horario_inicio}`).getTime();
      const dataB = new Date(`${b.data_inicio}T${b.horario_inicio}`).getTime();

      if (dataA !== dataB) return dataA - dataB;

      return (a.residente?.quarto ?? '').localeCompare(b.residente?.quarto ?? '');
    });

  /* Componentes de UI */
  const DropdownStatus = ({ medicamento }: { medicamento: Medicamento }) => {
    const cores = COR_STATUS[medicamento.status] || COR_STATUS.ativo;
    const IconeStatus = obterIconeStatus(medicamento.status);

    return (
      // Removido o ref={dropdownRef} daqui, pois ele causava o bug
      <div className="relative">
        <button
          onClick={() => toggleDropdown(medicamento.id)}
          className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconeStatus size={14} className={"text-odara-accent"} />
          <span className="text-odara-dark capitalize">{medicamento.status}</span>
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        {dropdownAberto === medicamento.id && (
          <>
            {/* CAMADA INVISÍVEL PARA FECHAR AO CLICAR FORA */}
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setDropdownAberto(null)}
            ></div>

            {/* MENU DROPDOWN (Com Z-Index maior que a camada invisível) */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = obterIconeStatus(option.value);
                return (
                  <button
                    key={option.value}
                    // Adicionado e.stopPropagation() para garantir
                    onClick={(e) => {
                      e.stopPropagation();
                      atualizarStatus(medicamento.id, option.value);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${medicamento.status === option.value
                        ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                        : 'text-gray-700'
                      }`}
                  >
                    <OptionIcon size={14} className={"text-odara-accent"} />
                    <span className="capitalize">{option.label}</span>
                    {medicamento.status === option.value && (
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
    tipo: 'residente' | 'status';
  }) => {
    const residentes = obterResidentesUnicos();

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
                ? residentes.find(([id]) => id === valorSelecionado)?.[1]
                : titulo
              : valorSelecionado
                ? FILTRO_STATUS_OPTIONS.find(opt => opt.value === valorSelecionado)?.label
                : titulo
            }
          </span>
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 max-h-60 overflow-y-auto">
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
                {residentes.map(([id, nome]) => (
                  <button
                    key={id}
                    onClick={() => onSelecionar(id)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === id
                        ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                        : 'text-gray-700'
                      }`}
                  >
                    <span>{nome}</span>
                    {valorSelecionado === id && <Check className="ml-auto text-odara-primary" size={14} />}
                  </button>
                ))}
              </>
            ) : (
              FILTRO_STATUS_OPTIONS.map((opcao) => (
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

  const CardMedicamento = ({ medicamento }: { medicamento: Medicamento }) => {
    const cores = COR_STATUS[medicamento.status] || COR_STATUS.ativo;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {/* Cabeçalho do Card - COM BOTÃO DE STATUS FUNCIONAL */}
        <div className={`flex items-center justify-between p-3 rounded-t-lg ${cores.border} ${cores.bg}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${cores.bola}`}></div>
            <p className={`text-sm sm:text-base ${cores.text}`}>
              Início: {formatarData(medicamento.data_inicio)}
              {medicamento.data_fim ? ` • Fim: ${formatarData(medicamento.data_fim)}` : ' • Uso contínuo'}
            </p>
          </div>

          {/* BOTÃO DE STATUS */}
          <DropdownStatus medicamento={medicamento} />
        </div>

        {/* Resto do código do Card permanece igual */}
        <div className="p-4 flex-1 flex flex-col min-h-[200px]">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-odara-dark line-clamp-1 flex-1">
              {medicamento.nome}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => abrirModalEdicao(medicamento)}
                className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                title="Editar medicamento"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => removerMedicamento(medicamento.id)}
                className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                title="Excluir medicamento"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="space-y-3">
              <div>
                <strong className="text-odara-dark text-sm">Dosagem:</strong>
                <p className="text-odara-name mt-1 text-sm">{medicamento.dosagem || 'Não informado'}</p>
              </div>
              <div>
                <strong className="text-odara-dark text-sm">Dose:</strong>
                <p className="text-odara-name mt-1 text-sm">{medicamento.dose || 'Não informado'}</p>
              </div>
              <div>
                <strong className="text-odara-dark text-sm">Horário:</strong>
                <p className="text-odara-name mt-1 text-sm">{medicamento.horario_inicio || 'Não informado'}</p>
              </div>
              <div>
                <strong className="text-odara-dark text-sm">Recorrência:</strong>
                <p className="text-odara-name mt-1 text-sm">{medicamento.recorrencia || 'Não informado'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <strong className="text-odara-dark text-sm">Efeitos colaterais:</strong>
                <p className="text-odara-name mt-1 text-sm line-clamp-2">
                  {medicamento.efeitos_colaterais || 'Não informado'}
                </p>
              </div>
              <div>
                <strong className="text-odara-dark text-sm">Observações:</strong>
                <p className="text-odara-name mt-1 text-sm line-clamp-2">
                  {medicamento.observacao || 'Não informado'}
                </p>
              </div>
              <div>
                <strong className="text-odara-dark text-sm">Saúde relacionada:</strong>
                <p className="text-odara-name mt-1 text-sm line-clamp-2">
                  {medicamento.saude_relacionada || 'Não informado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 mt-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                {medicamento.residente?.nome || 'Residente'}
              </span>
              {medicamento.residente?.quarto && (
                <span className="text-xs text-odara-dark">
                  Quarto: {medicamento.residente.quarto}
                </span>
              )}
            </div>
            <div className="text-xs text-odara-name">
              Atualizado: {formatarData(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Resto do código permanece igual...
  const BarraBuscaEFiltro = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-odara-primary mr-3 h-4 w-4 flex-shrink-0" />
          </div>
          <input
            type="text"
            placeholder="Buscar medicamentos por nome..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleFiltros}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-odara-dark hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            <span>Filtros</span>
          </button>
        </div>
      </div>
    );
  };

  const SecaoFiltros = () => {
    if (!filtrosAberto) return null;

    return (
      <div className="mb-8 bg-white p-5 rounded-xl shadow border border-gray-200 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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

          <div className="flex md:items-end gap-2 pt-1 md:pt-0">
            <button
              onClick={limparFiltros}
              className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {(filtros.residenteId || filtros.status) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {filtros.residenteId && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                Residente: {medicamentos.find(m => m.residente?.id === filtros.residenteId)?.residente?.nome}
              </span>
            )}
            {filtros.status && (
              <span className="bg-odara-primary text-white px-2 py-1 rounded-full">
                Status: {filtros.status}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const ListaMedicamentos = () => {
    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-odara-dark">Medicamentos</h2>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            Total: {medicamentosFiltrados.length}
          </span>
        </div>

        <div className="mb-4 text-sm text-gray-400">
          Total de {medicamentosFiltrados.length} de {medicamentos.length} medicamentos encontrados
          {searchTerm && <span> para "{searchTerm}"</span>}
          {filtros.status && <span> - Filtro: {FILTRO_STATUS_OPTIONS.find(f => f.value === filtros.status)?.label}</span>}
        </div>

        {medicamentosFiltrados.length === 0 ? (
          <div className="p-8 rounded-xl bg-odara-name/10 text-center">
            <p className="text-odara-dark/60 text-lg">
              {medicamentos.length === 0 ? 'Nenhum medicamento cadastrado' : 'Nenhum medicamento encontrado'}
            </p>
            {medicamentos.length > 0 && (
              <p className="text-odara-dark/40 text-sm mt-2">
                Tente ajustar os termos da busca ou os filtros
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[800px] overflow-y-auto p-2">
            {medicamentosFiltrados.map(medicamento => (
              <CardMedicamento
                key={medicamento.id}
                medicamento={medicamento}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
            Registro de Medicamentos
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
                <h3 className="font-bold mb-2">Registro de Medicamentos</h3>
                <p>Controle de dosagens, horários, efeitos e observações dos tratamentos.</p>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-odara-dropdown"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BotaoNovoMedicamento = () => {
    return (
      <button
        onClick={abrirModalNovo}
        className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 mb-6"
      >
        <Plus className="mr-2" /> Novo Medicamento
      </button>
    );
  };

  /* Renderização Principal */
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <Toaster position="top-right" />

      <ModalMedicamentos
        medicamento={medicamentoSelecionado}
        isOpen={modalAberto}
        onClose={fecharModal}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <Cabecalho />
        <BotaoNovoMedicamento />
        <BarraBuscaEFiltro />
        <SecaoFiltros />
        <ListaMedicamentos />
      </div>
    </div>
  );
};

export default RegistroMedicamentos;