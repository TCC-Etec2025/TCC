import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Info,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  Check,
  Palette,
  CheckCircle,
  XCircle as XCircleIcon,
  AlertCircle,
  Calendar as CalendarIcon,
  MessageCircleMore,
  X,
  Loader,
  type LucideIcon
} from 'lucide-react';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

/* Tipos */
type ResidenteBase = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type ResidenteNaAtividade = ResidenteBase & {
  statusIndividual: string;
  observacao?: string;
};

type Atividade = {
  id: number;
  residentes: ResidenteNaAtividade[];
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
  status: string;
  observacao: string;
};

type Filtros = {
    residenteId: number | null;
    status: string | null;
    categoria: string | null;
    startDate: string | null;
    endDate: string | null;
  };

/* Constantes */
const COR_STATUS: Record<string, {
  bola: string;
  bg: string;
  text: string;
  border: string;
  icon: LucideIcon;
}> = {
  concluido: {
    bola: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-green-200',
    icon: CheckCircle
  },
  pendente: {
    bola: 'bg-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-yellow-200',
    icon: Clock
  },
  cancelado: {
    bola: 'bg-odara-alerta',
    bg: 'bg-odara-alerta/10',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-odara-alerta/20',
    icon: XCircleIcon
  }
};

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' }
];

const CATEGORIAS = [
  { value: 'todos', label: 'Todas as categorias' },
  { value: 'fisica', label: 'Física' },
  { value: 'cognitiva', label: 'Cognitiva' },
  { value: 'social', label: 'Social' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'outra', label: 'Outra' }
];

const CATEGORIA_LABELS: Record<string, string> = {
  fisica: 'Física',
  cognitiva: 'Cognitiva',
  social: 'Social',
  lazer: 'Lazer',
  outra: 'Outra'
};

const CATEGORIA_COLORS: Record<string, string> = {
  fisica: 'bg-blue-100 text-blue-600 border-blue-200',
  cognitiva: 'bg-purple-100 text-purple-600 border-purple-200',
  social: 'bg-green-100 text-green-600 border-green-200',
  lazer: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  outra: 'bg-gray-100 text-gray-600 border-gray-200'
};

/* Utilitários */
const getTodayString = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatarData = (data: string): string => {
  return data.split('-').reverse().join('/');
};

const formatarHorario = (horario: string): string => {
  return horario.slice(0, 5);
};

/* Componente: Dropdown de Filtro */
interface FiltroDropdownProps {
  titulo: string;
  aberto: boolean;
  setAberto: (aberto: boolean) => void;
  valorSelecionado: string | number | null;
  onSelecionar: (value: string | number | null) => void;
  tipo: 'residente' | 'status' | 'categoria';
  residentesUnicos?: [number, string][];
  ref?: React.Ref<HTMLDivElement>;
}

const FiltroDropdown = React.forwardRef<HTMLDivElement, FiltroDropdownProps>(
  ({ titulo, aberto, setAberto, valorSelecionado, onSelecionar, tipo, residentesUnicos = [] }, ref) => {
    const getOpcoes = () => {
      switch (tipo) {
        case 'residente':
          return [];
        case 'status':
          return FILTRO_STATUS_OPTIONS;
        case 'categoria':
          return CATEGORIAS;
        default:
          return [];
      }
    };

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
                ? residentesUnicos.find(([id]) => id === valorSelecionado)?.[1] || titulo
                : titulo
              : tipo === 'status'
                ? valorSelecionado
                  ? FILTRO_STATUS_OPTIONS.find(opt => opt.value === valorSelecionado)?.label || titulo
                  : titulo
                : valorSelecionado
                  ? CATEGORIAS.find(opt => opt.value === valorSelecionado)?.label || titulo
                  : titulo
            }
          </span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500 shrink-0" />
        </button>

        {aberto && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-60 overflow-y-auto">
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
              getOpcoes().map((opcao) => (
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
  }
);

FiltroDropdown.displayName = 'FiltroDropdown';

/* Schema de validação para observação */
const observacaoSchema = yup.object({
  observacao: yup
    .string()
    .when('$status', ([status], schema) => {
      if (status === 'cancelado') {
        return schema.required('A observação é obrigatória para cancelar');
      }
      return schema.nullable();
    })
    .max(100, 'A observação deve ter no máximo 100 caracteres')
    .default('')
});

type ObservacaoFormData = {
  observacao: string;
};

/* Componente Modal de Observação */
interface ObservacaoModalProps {
  isOpen: boolean;
  observacaoInicial: string;
  status: string;
  onConfirm: (observacao: string) => void;
  onCancel: () => void;
  onClose: () => void;
  validationError: string | null;
  onClearValidationError: () => void;
}

const ObservacaoModal: React.FC<ObservacaoModalProps> = ({
  isOpen,
  observacaoInicial,
  status,
  onConfirm,
  onClose,
  onCancel,
  validationError,
  onClearValidationError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors
  } = useForm<ObservacaoFormData>({
    resolver: yupResolver(observacaoSchema),
    context: { status },
    defaultValues: {
      observacao: observacaoInicial || ''
    }
  });

  const isObservacaoObrigatoria = status === 'cancelado';
  const isEdicao = !!observacaoInicial;
  const tituloModal = isEdicao ? 'Editar Observação' : isObservacaoObrigatoria ? 'Informe o motivo' : 'Adicionar Observação';
  const descricaoModal = isEdicao
    ? 'Atualize a observação da atividade'
    : isObservacaoObrigatoria
    ? 'Informe o motivo da ação'
    : 'Informe a observação para a atividade';

  const onSubmit = async (values: ObservacaoFormData) => {
    setIsSubmitting(true);

    try {
      if (isObservacaoObrigatoria && !values.observacao?.trim()) {
        setError('observacao', {
          type: 'manual',
          message: 'A observação é obrigatória para esta ação'
        });
        setIsSubmitting(false);
        return;
      }

      onConfirm(values.observacao || '');

    } catch (err) {
      console.error("Erro detalhado ao salvar observação:", err);
      toast.error("Erro ao salvar observação");
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-odara-offwhite/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-odara-primary">
        {/* Header do Modal */}
        <div className="border-b border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {tituloModal}
            </h2>

            <button
              onClick={onClose}
              className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
              aria-label="Fechar modal"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-odara-white mt-1 text-sm">
            {descricaoModal}
          </p>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 bg-odara-offwhite/30">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-medium text-odara-dark">
                  {isObservacaoObrigatoria ? 'Observação *' : ' Observação (opcional)'}
                </label>
              </div>

              <textarea
                {...register('observacao')}
                onChange={(e) => {
                  setValue('observacao', e.target.value);
                  if (validationError) {
                    onClearValidationError();
                  }
                  clearErrors('observacao');
                }}
                className={'w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2'}
                rows={4}
                placeholder={
                  isObservacaoObrigatoria
                    ? "Descreva a observação (campo obrigatório)..."
                    : "Descreva a observação (opcional)..."
                }
                autoFocus
              />

              {errors.observacao && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.observacao.message}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base font-medium"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className='w-max px-6 py-2 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin inline mr-2" size={16} />
                    {isEdicao ? 'Salvando...' : 'Adicionando...'}
                  </>
                ) : (
                  <>
                    {isEdicao ? 'Salvar Alterações' : 'Adicionar Observação'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* Componente: Card de Atividade */
interface CardAtividadeProps {
  atividade: Atividade;
  onConcluirAtividade: (atividade: Atividade) => Promise<void>;
  onCancelarAtividade: (atividade: Atividade) => Promise<void>;
  onEditObservation: (atividade: Atividade) => Promise<void>;
}

const CardAtividade: React.FC<CardAtividadeProps> = ({
  atividade,
  onConcluirAtividade,
  onCancelarAtividade,
  onEditObservation
}) => {
  const cores = COR_STATUS[atividade.status] || COR_STATUS.pendente;
  const isCancelado = atividade.status === 'cancelado';
  const isConcluido = atividade.status === 'concluido';

  return (
    <div className={`bg-white rounded-lg shadow border overflow-hidden border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col h-full ${isCancelado ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className={`flex flex-wrap justify-center sm:justify-between gap-2 items-center p-2 sm:p-3 ${cores.border} ${cores.bg}`}>
        {/* Coluna Esquerda - Data e Hora */}
        <div className="flex items-center">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${cores.bola}`}></div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
            <p className={`text-xs sm:text-sm md:text-base ${cores.text} whitespace-nowrap`}>
              {formatarData(atividade.data)}
            </p>
            <span className="text-odara-accent mx-1 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm md:text-base text-odara-accent whitespace-nowrap">
              {formatarHorario(atividade.horario_inicio)}
              {atividade.horario_fim && ` - ${formatarHorario(atividade.horario_fim)}`}
            </span>
          </div>
        </div>

        {/* Status e Categoria */}
        <div className="flex items-center gap-2">
          {atividade.categoria && atividade.categoria !== 'outra' && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${CATEGORIA_COLORS[atividade.categoria] || CATEGORIA_COLORS.outra}`}>
              {CATEGORIA_LABELS[atividade.categoria] || atividade.categoria}
            </span>
          )}
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm">
            <Clock size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
            <span className="text-odara-dark capitalize">{atividade.status}</span>
          </div>
        </div>
      </div>

      {/* Corpo do Card */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-odara-dark line-clamp-2 flex-1">
            {atividade.nome}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 flex-1">
          {/* Coluna Esquerda */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <strong className="text-odara-dark text-xs sm:text-sm">Local:</strong>
                  <div className="mt-0.5">
                    <span className="text-odara-name text-xs sm:text-sm">
                      {atividade.local || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {atividade.observacao && (
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Observação:</strong>
                <div className="mt-0.5">
                  <span className="text-odara-name text-xs sm:text-sm flex-1 line-clamp-3">
                    {atividade.observacao}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita - Residentes */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <strong className="text-odara-dark text-xs sm:text-sm">Participantes:</strong>
                  <div className="space-y-1 mt-2">
                    {atividade.residentes.map(residente => {
                      const participou = residente.statusIndividual === 'participou';
                      return (
                        <div
                          key={residente.id}
                          className="flex items-center gap-2"
                        >
                          <div className={`text-xs sm:text-sm ${participou ? 'text-gray-800 font-medium' : 'text-odara-name'}`}>
                            {residente.nome}
                          </div>
                        </div>
                      );
                    })}
                    {atividade.residentes.length === 0 && (
                      <div className="text-odara-name text-xs sm:text-sm italic">
                        Nenhum residente vinculado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer do Card - Mesmo estilo dos medicamentos */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 mt-auto">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onConcluirAtividade(atividade)}
              disabled={isCancelado || isConcluido}
              className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${isConcluido
                ? 'bg-green-100 text-green-500 border border-green-500'
                : 'bg-white text-gray-400 border border-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-600'
                } ${isCancelado ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <CheckCircle size={14} className="mb-1 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">{isConcluido ? 'Concluído' : 'Concluir'}</span>
            </button>

            <button
              onClick={() => onCancelarAtividade(atividade)}
              disabled={isCancelado || isConcluido}
              className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${isCancelado
                ? 'bg-red-100 text-red-500 border border-red-500'
                : 'bg-white text-gray-400 border border-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-600'
                } ${isConcluido ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <XCircleIcon size={14} className="mb-1 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">{isCancelado ? 'Cancelada' : 'Cancelar'}</span>
            </button>
          </div>

          <button
            onClick={() => onEditObservation(atividade)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${atividade.observacao
              ? 'bg-blue-50 text-blue-500 border border-blue-500'
              : 'bg-white text-gray-400 border border-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-500'
              }`}
          >
            <MessageCircleMore size={12} className="sm:w-3.5 sm:h-3.5" />
            {atividade.observacao ? 'Editar Observação' : 'Adicionar Observação'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Componente: Seção de Filtros */
interface SecaoFiltrosProps {
  filtros: {
    residenteId: number | null;
    status: string | null;
    categoria: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  filtrosAberto: boolean;
  filtroResidenteAberto: boolean;
  setFiltroResidenteAberto: (aberto: boolean) => void;
  filtroStatusAberto: boolean;
  setFiltroStatusAberto: (aberto: boolean) => void;
  filtroCategoriaAberto: boolean;
  setFiltroCategoriaAberto: (aberto: boolean) => void;
  onLimparFiltros: () => void;
  residentesUnicos: [number, string][];
  dateError: string | null;
  setDateError: (error: string | null) => void;
}

const SecaoFiltros: React.FC<SecaoFiltrosProps> = ({
  filtros,
  setFiltros,
  filtrosAberto,
  filtroResidenteAberto,
  setFiltroResidenteAberto,
  filtroStatusAberto,
  setFiltroStatusAberto,
  filtroCategoriaAberto,
  setFiltroCategoriaAberto,
  onLimparFiltros,
  residentesUnicos,
  dateError,
  setDateError
}) => {
  const filtroResidenteRef = useRef<HTMLDivElement>(null);
  const filtroStatusRef = useRef<HTMLDivElement>(null);
  const filtroCategoriaRef = useRef<HTMLDivElement>(null);

  const selecionarResidente = useCallback((residenteId: number | null) => {
    setFiltros((prev: Filtros) => ({ ...prev, residenteId }));
    setFiltroResidenteAberto(false);
  }, [setFiltros, setFiltroResidenteAberto]);

  const selecionarStatus = useCallback((status: string | null) => {
    setFiltros((prev: Filtros) => ({ ...prev, status: status === 'todos' ? null : status }));
    setFiltroStatusAberto(false);
  }, [setFiltros, setFiltroStatusAberto]);

  const selecionarCategoria = useCallback((categoria: string | null) => {
    setFiltros((prev: Filtros) => ({ ...prev, categoria: categoria === 'todos' ? null : categoria }));
    setFiltroCategoriaAberto(false);
  }, [setFiltros, setFiltroCategoriaAberto]);

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
              valorSelecionado={filtros.residenteId}
              onSelecionar={selecionarResidente as (value: string | number | null) => void}
              tipo="residente"
              residentesUnicos={residentesUnicos}
              ref={filtroResidenteRef}
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
              valorSelecionado={filtros.status || 'todos'}
              onSelecionar={selecionarStatus as (value: string | number | null) => void}
              tipo="status"
              ref={filtroStatusRef}
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
              valorSelecionado={filtros.categoria || 'todos'}
              onSelecionar={selecionarCategoria as (value: string | number | null) => void}
              tipo="categoria"
              ref={filtroCategoriaRef}
            />
          </div>
        </div>

        {/* Botão Limpar Filtros/Busca */}
        <div className="flex md:items-end gap-2 pt-1 md:pt-0 md:shrink-0">
          <button
            onClick={onLimparFiltros}
            className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full md:w-auto justify-center"
          >
            Limpar Filtros/Busca
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
            onChange={(e) => {
              setFiltros((prev: Filtros) => ({ ...prev, startDate: e.target.value || null }));
              setDateError(null);
            }}
            className={`w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none ${dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
          />
        </div>

        {/* Até a Data */}
        <div>
          <div className='flex gap-1 items-center ml-1 mb-1'>
            <Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
            <label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Até a Data</label>
          </div>
          <input
            type="date"
            value={filtros.endDate || ''}
            onChange={(e) => {
              setFiltros((prev: Filtros) => ({ ...prev, endDate: e.target.value || null }));
              setDateError(null);
            }}
            className={`w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none ${dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
          />
        </div>

        {dateError && (
          <div className="flex items-center mt-1 text-red-600 text-xs col-span-2">
            <AlertCircle className="mr-1" size={14} />
            {dateError}
          </div>
        )}
      </div>
    </div>
  );
};

/* Componente Principal */
const Atividades = () => {
  /* Estados */
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [residentesList, setResidentesList] = useState<ResidenteBase[]>([]);
  const [datesExpanded, setDatesExpanded] = useState<Record<string, boolean>>({});
  const [dateError, setDateError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filtros, setFiltros] = useState<Filtros>({
    residenteId: null as number | null,
    status: null as string | null,
    categoria: null as string | null,
    startDate: getTodayString(),
    endDate: getTodayString(),
  });

  /* Estado do Modal */
  const [modalState, setModalState] = useState({
    isOpen: false,
    observacaoInicial: '',
    atividadeId: null as number | null,
    status: '' as string,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const openModal = useCallback((observacaoInicial: string, atividadeId: number | null, status: string) => {
    return new Promise<string | null>((resolve) => {
      setModalState({
        isOpen: true,
        observacaoInicial,
        atividadeId,
        status
      });
      
      // Armazenar a função resolve para usar no handleConfirm
      (window as any).__resolveObservacaoModal = resolve;
    });
  }, []);

  const handleConfirm = useCallback((observacao: string) => {
    const resolve = (window as any).__resolveObservacaoModal;
    if (resolve) {
      resolve(observacao);
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
    clearValidationError();
  }, [clearValidationError]);

  const handleCancel = useCallback(() => {
    const resolve = (window as any).__resolveObservacaoModal;
    if (resolve) {
      resolve(null);
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
    clearValidationError();
  }, [clearValidationError]);

  /* Componente: Cabecalho */
  const Cabecalho: React.FC = () => {
    const [infoVisivel, setInfoVisivel] = useState(false);

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3 w-full">
          <Palette size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                Checklist de Atividades
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
                    <strong className="font-semibold">Como usar:</strong> Controle diário das atividades dos residentes. Marque presenças individualmente ou conclua a atividade para todos.
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

  /* Carregar Dados */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar atividades
      const { data: atividadesData, error: atvError } = await supabase
        .from('atividade')
        .select('*')
        .order('data', { ascending: true })
        .order('horario_inicio', { ascending: true });

      if (atvError) throw atvError;

      // Buscar relações atividade-residente
      const { data: joinsData, error: joinError } = await supabase
        .from('atividade_residente')
        .select('*');

      if (joinError) throw joinError;

      // Buscar residentes
      const { data: resData, error: resError } = await supabase
        .from('residente')
        .select('id, nome, quarto')
        .order('nome', { ascending: true });

      if (resError) throw resError;

      setResidentesList(resData || []);

      // Combinar dados
      const atividadesCompletas: Atividade[] = (atividadesData || []).map(atv => {
        const relacoes = (joinsData || []).filter((j: AtividadeResidente) => j.id_atividade === atv.id);
        const residentesMapeados: ResidenteNaAtividade[] = relacoes.reduce<ResidenteNaAtividade[]>((acc, j) => {
          const dadosResidente = resData?.find(r => r.id === j.id_residente);
          if (dadosResidente) {
            acc.push({
              ...dadosResidente,
              statusIndividual: j.status || 'pendente',
              observacao: j.observacao || ''
            });
          }
          return acc;
        }, []);

        return {
          ...atv,
          residentes: residentesMapeados
        };
      });

      setAtividades(atividadesCompletas);

    } catch (err) {
      console.error('Erro ao buscar atividades:', err);
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Utilitários */
  const obterResidentesUnicos = useMemo(() => {
    const residentesMap = new Map<number, string>();
    atividades.forEach(atv => {
      atv.residentes.forEach(r => {
        residentesMap.set(r.id, r.nome);
      });
    });
    return Array.from(residentesMap.entries());
  }, [atividades]);

  /* Filtragem e Agrupamento */
  const gruposAtividades = useMemo(() => {
    const { residenteId, status, categoria, startDate, endDate } = filtros;

    const filtradas = atividades.filter(atv => {
      // Filtro por busca
      if (searchTerm.trim() &&
        !atv.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !atv.local.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !atv.categoria.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !atv.residentes.some(r => r.nome.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }

      // Filtro por residente
      if (residenteId && !atv.residentes.some(r => r.id === residenteId)) return false;

      // Filtro por status
      if (status && status !== 'todos' && atv.status !== status) return false;

      // Filtro por categoria
      if (categoria && categoria !== 'todos' && atv.categoria !== categoria) return false;

      // Filtro por data
      if (startDate && endDate) {
        if (atv.data < startDate || atv.data > endDate) return false;
      } else if (startDate) {
        if (atv.data < startDate) return false;
      } else if (endDate) {
        if (atv.data > endDate) return false;
      }

      return true;
    });

    // Ordenar por data e horário
    filtradas.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.horario_inicio.localeCompare(b.horario_inicio);
    });

    // Agrupar por data
    const grupos: Record<string, Atividade[]> = {};
    filtradas.forEach(atv => {
      const dataKey = atv.data || 'Sem Data';
      if (!grupos[dataKey]) grupos[dataKey] = [];
      grupos[dataKey].push(atv);
    });

    return Object.keys(grupos).sort().map(data => ({
      data,
      dataFormatada: data === 'Sem Data' ? 'Sem Data' : formatarData(data),
      itens: grupos[data],
      isExpandido: datesExpanded[data] !== false
    }));
  }, [atividades, filtros, datesExpanded, searchTerm]);

  /* Handlers */
  const handleConcluirAtividade = useCallback(async (atividade: Atividade) => {
    try {
      const obs = await openModal(atividade.observacao || "", atividade.id, "concluido");
      if (obs !== null) {
        const { error } = await supabase
          .from('atividade')
          .update({ 
            status: 'concluido',
            observacao: obs 
          })
          .eq('id', atividade.id);

        if (error) throw error;

        // Atualizar estado local
        setAtividades(prev => prev.map(a =>
          a.id === atividade.id ? { 
            ...a, 
            status: 'concluido',
            observacao: obs 
          } : a
        ));

        toast.success('Atividade concluída com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao concluir atividade:', err);
      toast.error('Erro ao concluir atividade');
    }
  }, [openModal]);

  const handleCancelarAtividade = useCallback(async (atividade: Atividade) => {
    try {
      const obs = await openModal(atividade.observacao || "", atividade.id, "cancelado");
      if (obs !== null) {
        const { error } = await supabase
          .from('atividade')
          .update({ 
            status: 'cancelado',
            observacao: obs 
          })
          .eq('id', atividade.id);

        if (error) throw error;

        // Atualizar estado local
        setAtividades(prev => prev.map(a =>
          a.id === atividade.id ? { 
            ...a, 
            status: 'cancelado',
            observacao: obs 
          } : a
        ));

        toast.success('Atividade cancelada com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao cancelar atividade:', err);
      toast.error('Erro ao cancelar atividade');
    }
  }, [openModal]);

  const handleEditObservation = useCallback(async (atividade: Atividade) => {
    try {
      const novaObs = await openModal(atividade.observacao || "", atividade.id, atividade.status);
      if (novaObs !== null) {
        const { error } = await supabase
          .from('atividade')
          .update({ observacao: novaObs })
          .eq('id', atividade.id);

        if (error) throw error;

        // Atualizar estado local
        setAtividades(prev => prev.map(a =>
          a.id === atividade.id ? { ...a, observacao: novaObs } : a
        ));

        toast.success('Observação atualizada com sucesso!');
      }
    } catch {
      // cancelado pelo usuário
    }
  }, [openModal]);

  const toggleDate = useCallback((date: string) => {
    setDatesExpanded(prev => {
      const isCurrentlyExpanded = prev[date] !== false;
      return { ...prev, [date]: !isCurrentlyExpanded };
    });
  }, []);

  const toggleFiltros = useCallback(() => {
    setFiltrosAberto(prev => !prev);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({
      residenteId: null,
      status: null,
      categoria: null,
      startDate: getTodayString(),
      endDate: getTodayString()
    });
    setSearchTerm('');
    setFiltroResidenteAberto(false);
    setFiltroStatusAberto(false);
    setFiltroCategoriaAberto(false);
  }, []);

  /* Componente: Lista de Atividades */
  const ListaAtividades = () => {
    const totalFiltrado = gruposAtividades.reduce((acc, grupo) => acc + grupo.itens.length, 0);

    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Atividades Programadas</h2>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Total: {totalFiltrado}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.residenteId || filtros.status || filtros.categoria || searchTerm || filtros.startDate || filtros.endDate) && (
          <div className="mb-3 flex flex-wrap justify-center sm:justify-start gap-1 text-xs">
            {searchTerm && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Busca: {searchTerm}
              </span>
            )}
            {filtros.residenteId && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Residente: {residentesList.find(r => r.id === filtros.residenteId)?.nome}
              </span>
            )}
            {filtros.status && filtros.status !== 'todos' && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Status: {filtros.status}
              </span>
            )}
            {filtros.categoria && filtros.categoria !== 'todos' && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Categoria: {CATEGORIA_LABELS[filtros.categoria] || filtros.categoria}
              </span>
            )}
            {(filtros.startDate || filtros.endDate) && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Data: {filtros.startDate ? ` ${formatarData(filtros.startDate)}` : ''}
                {filtros.endDate ? ' até' + ` ${formatarData(filtros.endDate)}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Lista de atividades */}
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando atividades...</p>
          </div>
        ) : gruposAtividades.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <CalendarIcon className="mx-auto text-gray-300 mb-3" size={32} />
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              Nenhuma atividade encontrada
            </p>
            <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
              Tente ajustar os termos da busca ou os filtros
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {gruposAtividades.map(grupo => {
              const pendentes = grupo.itens.filter(item => item.status === 'pendente').length;
              const totalGrupo = grupo.itens.length;

              return (
                <div key={`group-${grupo.data}`} className="bg-gray-50 rounded-xl overflow-hidden border-l-2 border-odara-primary">
                  {/* Cabeçalho da Data */}
                  <div
                    className="bg-odara-primary/20 border-b border-odara-primary/60 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleDate(grupo.data)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto justify-center sm:justify-start mb-2 sm:mb-0">
                      {grupo.isExpandido ? (
                        <ChevronDown className="text-odara-accent shrink-0" size={16} />
                      ) : (
                        <ChevronRight className="text-odara-accent shrink-0" size={16} />
                      )}
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-odara-dark truncate">
                        {grupo.dataFormatada}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-xs font-medium ${pendentes > 0
                        ? 'bg-yellow-50 text-yellow-600 border-yellow-600'
                        : 'bg-gray-50 text-gray-500 border-gray-500'
                        }`}>
                        {pendentes > 0
                          ? `Pendentes: ${pendentes} de ${totalGrupo}`
                          : `Total: ${totalGrupo}`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Lista de Atividades */}
                  {grupo.isExpandido && (
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
                        {grupo.itens.map(atividade => (
                          <CardAtividade
                            key={atividade.id}
                            atividade={atividade}
                            onConcluirAtividade={handleConcluirAtividade}
                            onCancelarAtividade={handleCancelarAtividade}
                            onEditObservation={handleEditObservation}
                          />
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
    );
  };

  return (
    <div className="min-h-screen bg-odara-offwhite overflow-x-hidden">
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
        {/* Cabeçalho */}
        <Cabecalho />
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          {/* Barra de Busca */}
          <div className="flex-1 relative min-w-0">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <Search className="text-odara-primary h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, local, categoria ou residente..."
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
        <SecaoFiltros
          filtros={filtros}
          setFiltros={setFiltros}
          filtrosAberto={filtrosAberto}
          filtroResidenteAberto={filtroResidenteAberto}
          setFiltroResidenteAberto={setFiltroResidenteAberto}
          filtroStatusAberto={filtroStatusAberto}
          setFiltroStatusAberto={setFiltroStatusAberto}
          filtroCategoriaAberto={filtroCategoriaAberto}
          setFiltroCategoriaAberto={setFiltroCategoriaAberto}
          onLimparFiltros={limparFiltros}
          residentesUnicos={obterResidentesUnicos}
          dateError={dateError}
          setDateError={setDateError}
        />

        {/* Lista de Atividades */}
        <ListaAtividades />

        {/* Contador de resultados */}
        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {gruposAtividades.reduce((acc, grupo) => acc + grupo.itens.length, 0)} atividade(s) encontrada(s) de {atividades.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>

        {/* Modal de Observação */}
        <ObservacaoModal
          isOpen={modalState.isOpen}
          observacaoInicial={modalState.observacaoInicial}
          status={modalState.status}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={handleCancel}
          validationError={validationError}
          onClearValidationError={clearValidationError}
        />
      </div>
    </div>
  );
};

export default Atividades;