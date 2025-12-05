import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Info, Filter, ChevronDown, ChevronRight, MessageCircleMore, Clock, Pill, Check, CircleCheck, CircleMinus, Search, Edit, RockingChair, XCircle, Loader, X, type LucideIcon } from 'lucide-react';

import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../context/UserContext';
import { useObservacaoModal } from '../../../hooks/useObservacaoModal';
import toast, { Toaster } from 'react-hot-toast';

/* Tipos */
type Administracao = {
  id: number;
  id_medicamento: number;
  data_prevista: string;
  horario_previsto: string;
  data_administracao: string | null;
  horario_administracao: string | null;
  status: string;
  id_funcionario: number;
  observacao: string | null;
};

type Medicamento = {
  id: number;
  nome: string;
  dosagem: string;
  dose: string;
  id_residente: number;
};

type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type AdministracaoComDetalhes = Administracao & {
  medicamento: Medicamento;
  residente: Residente;
};

type Filtros = {
  residenteId: number | null;
  status: string | null;
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
  administrado: {
    bola: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-green-200',
    icon: CircleCheck
  },
  parcial: {
    bola: 'bg-orange-400',
    bg: 'bg-orange-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-orange-200',
    icon: CircleMinus
  },
  nao_administrado: {
    bola: 'bg-odara-alerta',
    bg: 'bg-odara-alerta/10',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-odara-alerta/20',
    icon: XCircle
  },
  pendente: {
    bola: 'bg-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-yellow-200',
    icon: Clock
  }
};

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente', icon: Clock },
  { value: 'administrado', label: 'Administrado', icon: CircleCheck },
  { value: 'parcial', label: 'Parcial', icon: CircleMinus },
  { value: 'nao_administrado', label: 'Não Administrado', icon: XCircle }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'administrado', label: 'Administrado' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'nao_administrado', label: 'Não Administrado' }
];

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

/* Componente Principal */
const Medicamentos: React.FC = () => {
  /* Estados */
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [administracoes, setAdministracoes] = useState<Administracao[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);

  const [datesExpanded, setDatesExpanded] = useState<Record<string, boolean>>({});
  const [dateError, setDateError] = useState(null as string | null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    residenteId: null,
    status: null,
    startDate: getTodayString(),
    endDate: getTodayString(),
  });
  const [statusParaObservacao, setStatusParaObservacao] = useState<string>('');

  /* Hooks */
  const { usuario } = useUser();
  const observacaoModal = useObservacaoModal();

  /* Componente: Dropdown de Filtro */
  interface FiltroDropdownProps {
    titulo: string;
    aberto: boolean;
    setAberto: (aberto: boolean) => void;
    valorSelecionado: string | number | null;
    onSelecionar: (value: string | number | null) => void;
    tipo: 'residente' | 'status';
    residentesUnicos?: [number, string][];
    ref?: React.Ref<HTMLDivElement>;
  }

  const FiltroDropdown = React.forwardRef<HTMLDivElement, FiltroDropdownProps>(
    ({ titulo, aberto, setAberto, valorSelecionado, onSelecionar, tipo, residentesUnicos = [] }, ref) => {
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
                : valorSelecionado
                  ? FILTRO_STATUS_OPTIONS.find(opt => opt.value === valorSelecionado)?.label || titulo
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
    }
  );

  FiltroDropdown.displayName = 'FiltroDropdown';

  /* Componente: Dropdown de Status */
  interface DropdownStatusProps {
    admin: AdministracaoComDetalhes;
    onStatusChange: (adminId: number, status: string) => Promise<void>;
    dropdownAberto: number | null;
    toggleDropdown: (id: number) => void;
  }

  const DropdownStatus: React.FC<DropdownStatusProps> = ({
    admin,
    onStatusChange,
    dropdownAberto,
    toggleDropdown
  }) => {
    const cores = COR_STATUS[admin.status] || COR_STATUS.pendente;
    const IconeStatus = cores.icon;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(admin.id)}
          className="flex items-center gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
        >
          <IconeStatus size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
          <span className="text-odara-dark capitalize">{admin.status.replace('_', ' ')}</span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500" />
        </button>

        {dropdownAberto === admin.id && (
          <>
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => toggleDropdown(admin.id)}
            />
            <div className="absolute top-full sm:right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = COR_STATUS[option.value].icon;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(admin.id, option.value);
                      toggleDropdown(admin.id);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${admin.status === option.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <OptionIcon size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
                    <span className="capitalize">{option.label}</span>
                    {admin.status === option.value && (
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

  /* Componente: Card de Administração */
  interface CardAdministracaoProps {
    admin: AdministracaoComDetalhes;
    onStatusClick: (adminId: number, status: string) => Promise<void>;
    onEditObservation: (admin: AdministracaoComDetalhes) => Promise<void>;
    dropdownAberto: number | null;
    toggleDropdown: (id: number) => void;
  }

  const CardAdministracao: React.FC<CardAdministracaoProps> = ({
    admin,
    onStatusClick,
    onEditObservation,
    dropdownAberto,
    toggleDropdown
  }) => {
    const cores = COR_STATUS[admin.status] || COR_STATUS.pendente;

    return (
      <div className="bg-white rounded-lg shadow border overflow-hidden border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
        {/* Header */}
        <div className={`flex flex-wrap justify-center sm:justify-between gap-2 items-center p-2 sm:p-3 ${cores.border} ${cores.bg}`}>
          {/* Coluna Esquerda - Data e Hora */}
          <div className="flex items-center">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${cores.bola}`}></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
              <p className={`text-xs sm:text-sm md:text-base ${cores.text} whitespace-nowrap`}>
                {formatarData(admin.data_prevista)}
              </p>
              <span className="text-odara-accent mx-1 hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm md:text-base text-odara-accent whitespace-nowrap">
                {admin.horario_previsto.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Status - Responsivo */}
          <div className="w-full sm:w-auto">
            <DropdownStatus
              admin={admin}
              onStatusChange={onStatusClick}
              dropdownAberto={dropdownAberto}
              toggleDropdown={toggleDropdown}
            />
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-odara-dark line-clamp-1 flex-1">
              {admin.medicamento.nome}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 flex-1">
            {/* Coluna Esquerda */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Dose:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {admin.medicamento.dose || 'Não informado'}
                </span>
              </div>

              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Dosagem:</strong>
                <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                  {admin.medicamento.dosagem || 'Não informado'}
                </span>
              </div>
            </div>

            {/* Coluna Direita - Estilo igual ao Exame */}
            <div className="space-y-2 sm:space-y-3">
              {/* Residente - estilo exame (nome em baixo) */}
              <div>
                <div className="flex items-start gap-2">
                  <RockingChair className="text-odara-accent shrink-0 mt-0.5 hidden sm:block" size={12} />
                  <div className="flex-1 min-w-0">
                    <strong className="text-odara-dark text-xs sm:text-sm">Residente:</strong>
                    <div className="mt-0.5">
                      <span className="text-odara-name text-xs sm:text-sm">
                        {admin.residente.nome}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observação - alinhado com o nome do residente acima */}
              <div>
                <div className="flex gap-2">
                  {/* Espaço reservado para alinhar com o ícone */}
                  <div className="w-3 shrink-0 hidden sm:block" />
                  
                  <div className="flex-1 min-w-0">
                    <strong className="text-odara-dark text-xs sm:text-sm">Observação:</strong>
                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                      <span className="text-odara-name text-xs sm:text-sm flex-1 line-clamp-2">
                        {admin.observacao || 'Nenhuma observação'}
                      </span>
                      {admin.observacao && (
                        <button
                          onClick={() => onEditObservation(admin)}
                          className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-dropdown-accent shrink-0"
                          title="Editar observação"
                        >
                          <Edit size={12} className="sm:w-3.5 sm:h-3.5 hidden sm:block" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Card */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 mt-auto">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onStatusClick(admin.id, "administrado")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${admin.status === "administrado"
                  ? 'bg-green-100 text-green-500 border border-green-500'
                  : 'bg-white text-gray-400 border border-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-600'
                  }`}
              >
                <CircleCheck size={14} className="mb-1 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Ok</span>
              </button>

              <button
                onClick={() => onStatusClick(admin.id, "parcial")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${admin.status === "parcial"
                  ? 'bg-yellow-50 text-yellow-500 border border-yellow-500'
                  : 'bg-white text-gray-400 border border-gray-400 hover:bg-yellow-50 hover:text-yellow-500 hover:border-yellow-500'
                  }`}
              >
                <CircleMinus size={14} className="mb-1 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Parcial</span>
              </button>

              <button
                onClick={() => onStatusClick(admin.id, "nao_administrado")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${admin.status === "nao_administrado"
                  ? 'bg-odara-alerta/10 text-odara-alerta border border-odara-alerta'
                  : 'bg-white text-gray-400 border border-gray-400 hover:bg-odara-alerta/10 hover:text-odara-alerta hover:border-odara-alerta'
                  }`}
              >
                <Clock size={14} className="mb-1 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Não</span>
              </button>
            </div>

            <button
              onClick={() => onEditObservation(admin)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${admin.observacao
                ? 'bg-blue-50 text-blue-500 border border-blue-500'
                : 'bg-white text-gray-400 border border-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-500'
                }`}
            >
              <MessageCircleMore size={12} className="sm:w-3.5 sm:h-3.5" />
              {admin.observacao ? 'Editar Observação' : 'Adicionar Observação'}
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
      startDate: string | null;
      endDate: string | null;
    };
    setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
    filtrosAberto: boolean;
    filtroResidenteAberto: boolean;
    setFiltroResidenteAberto: (aberto: boolean) => void;
    filtroStatusAberto: boolean;
    setFiltroStatusAberto: (aberto: boolean) => void;
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
    onLimparFiltros,
    residentesUnicos,
    dateError,
    setDateError
  }) => {
    const filtroResidenteRef = useRef<HTMLDivElement>(null);
    const filtroStatusRef = useRef<HTMLDivElement>(null);

    const selecionarResidente = useCallback((residenteId: number | null) => {
      setFiltros((prev: Filtros) => ({ ...prev, residenteId }));
      setFiltroResidenteAberto(false);
    }, [setFiltros, setFiltroResidenteAberto]);

    const selecionarStatus = useCallback((status: string | null) => {
      setFiltros((prev: Filtros) => ({ ...prev, status: status === 'todos' ? null : status }));
      setFiltroStatusAberto(false);
    }, [setFiltros, setFiltroStatusAberto]);

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
            <div className="flex items-center mt-1 text-red-600 text-xs">
              <Info className="mr-1" size={14} />
              {dateError}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* Componente: Cabecalho */
  const Cabecalho: React.FC = () => {
    const [infoVisivel, setInfoVisivel] = useState(false);

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3 w-full">
          <Pill size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                Checklist de Medicamentos
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
                    <strong className="font-semibold">Como usar:</strong> Controle diário das administrações dos medicamentos dos residentes.
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

  // Schema de validação
  const observacaoSchema = yup.object({
    observacao: yup
      .string()
      .when('$status', ([status], schema) => {
        // Observação obrigatória para status 'parcial' e 'nao_administrado'
        if (status === 'parcial' || status === 'nao_administrado') {
          return schema.required('A observação é obrigatória para este status');
        }
        return schema.nullable();
      })
      .max(100, 'A observação deve ter no máximo 100 caracteres')
      .default('')
  });

  type ObservacaoFormData = {
    observacao: string;
    id?: number;
  };

  const ObservacaoModalComponente: React.FC<ObservacaoModalProps> = ({
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

    const isObservacaoObrigatoria = status === 'parcial' || status === 'nao_administrado';
    const isEdicao = !!observacaoInicial;
    const tituloModal = isEdicao ? 'Editar Observação' : 'Adicionar Observação';
    const descricaoModal = isEdicao
      ? 'Atualize a observação da administração'
      : 'Informe a observação para a administração';

    const onSubmit = async (values: ObservacaoFormData) => {
      setIsSubmitting(true);

      try {
        console.log("Dados sendo enviados:", values.observacao);

        if ((status === 'parcial' || status === 'nao_administrado') && !values.observacao?.trim()) {
          setError('observacao', {
            type: 'manual',
            message: 'A observação é obrigatória para este status'
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
                    <Info size={14} /> {errors.observacao.message}
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

  /* Carregar Dados */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar administrações
      const { data: adminData, error: adminErr } = await supabase
        .from("administracao_medicamento")
        .select("*")
        .order('data_prevista', { ascending: true })
        .order('horario_previsto', { ascending: true });

      if (adminErr) throw adminErr;
      setAdministracoes(adminData || []);

      // Buscar medicamentos relacionados
      const medicamentoIds = [...new Set(adminData?.map(a => a.id_medicamento) || [])];
      if (medicamentoIds.length > 0) {
        const { data: medsData, error: medsErr } = await supabase
          .from("medicamento")
          .select("*")
          .in("id", medicamentoIds);
        if (medsErr) throw medsErr;
        setMedicamentos(medsData || []);
      }

      // Buscar residentes
      const { data: resData, error: resErr } = await supabase
        .from("residente")
        .select("id, nome, quarto")
        .order('nome', { ascending: true });
      if (resErr) throw resErr;
      setResidentes(resData || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      toast.error('Erro ao carregar administrações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Utilitários */
  const listaCompleta = useMemo(() => {
    if (!administracoes.length || !medicamentos.length || !residentes.length) return [];

    return administracoes.map(admin => {
      const medicamento = medicamentos.find(m => m.id === admin.id_medicamento);
      if (!medicamento) return null;

      const residente = residentes.find(r => r.id === medicamento.id_residente);
      if (!residente) return null;

      return { ...admin, medicamento, residente };
    }).filter((item): item is AdministracaoComDetalhes => item !== null);
  }, [administracoes, medicamentos, residentes]);

  const obterResidentesUnicos = useMemo(() => {
    const residentesMap = new Map<number, string>();
    listaCompleta.forEach(m => {
      if (m.residente) {
        residentesMap.set(m.residente.id, m.residente.nome);
      }
    });
    return Array.from(residentesMap.entries());
  }, [listaCompleta]);

  /* Filtragem e Agrupamento */
  const gruposRenderizaveis = useMemo(() => {
    const { residenteId, status, startDate, endDate } = filtros;

    const filtradas = listaCompleta.filter(admin => {
      // Filtro por busca
      if (searchTerm.trim() &&
        !admin.medicamento.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por residente
      if (residenteId && admin.residente.id !== residenteId) return false;

      // Filtro por status
      if (status && status !== 'todos' && admin.status !== status) return false;

      // Filtro por data
      if (startDate && endDate) {
        if (admin.data_prevista < startDate || admin.data_prevista > endDate) return false;
      } else if (startDate) {
        if (admin.data_prevista < startDate) return false;
      } else if (endDate) {
        if (admin.data_prevista > endDate) return false;
      }

      return true;
    });

    // Ordenar por data e horário
    filtradas.sort((a, b) => {
      if (a.data_prevista !== b.data_prevista) return a.data_prevista.localeCompare(b.data_prevista);
      return a.horario_previsto.localeCompare(b.horario_previsto);
    });

    // Agrupar por data
    const grupos: Record<string, AdministracaoComDetalhes[]> = {};
    filtradas.forEach(item => {
      if (!grupos[item.data_prevista]) grupos[item.data_prevista] = [];
      grupos[item.data_prevista].push(item);
    });

    return Object.keys(grupos).sort().map(data => ({
      dataFormatada: data,
      itens: grupos[data],
      isExpandido: datesExpanded[data] !== false
    }));
  }, [listaCompleta, filtros, datesExpanded, searchTerm]);

  /* Handlers */
  const updateStatus = useCallback(async (adminId: number, newStatus: string, observacao?: string) => {
    try {
      const now = new Date();
      const dataHoje = getTodayString();
      const horarioAgora = now.toTimeString().substring(0, 5);

      const { error } = await supabase
        .from("administracao_medicamento")
        .update({
          status: newStatus,
          id_funcionario: usuario?.id,
          observacao: observacao ?? null,
          data_administracao: newStatus !== 'pendente' ? dataHoje : null,
          horario_administracao: newStatus !== 'pendente' ? horarioAgora : null
        })
        .eq("id", adminId);

      if (error) throw error;

      // Atualizar estado local
      setAdministracoes(prev =>
        prev.map(a =>
          a.id === adminId
            ? {
              ...a,
              status: newStatus,
              observacao: observacao ?? a.observacao,
              data_administracao: newStatus !== 'pendente' ? dataHoje : null,
              horario_administracao: newStatus !== 'pendente' ? horarioAgora : null
            }
            : a
        )
      );

      toast.success(`Status atualizado para "${newStatus.replace('_', ' ')}"`);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error('Erro ao atualizar status');
    }
  }, [usuario?.id]);

  const handleStatusClick = useCallback(async (adminId: number, status: string) => {
    try {
      if (status === "administrado") {
        await updateStatus(adminId, status);
      } else {
        setStatusParaObservacao(status);
        const obs = await observacaoModal.openModal("", adminId, status);
        if (obs !== null) {
          await updateStatus(adminId, status, obs);
        }
      }
    } catch {
      // cancelado pelo usuário
    }
  }, [observacaoModal, updateStatus]);

  const handleEditObservation = useCallback(async (admin: AdministracaoComDetalhes) => {
    try {
      const novaObs = await observacaoModal.openModal(admin.observacao || "", admin.id, admin.status);
      if (novaObs !== null) {
        await updateStatus(admin.id, admin.status, novaObs);
      }
    } catch {
      // cancelado pelo usuário
    }
  }, [observacaoModal, updateStatus]);


  const toggleDate = useCallback((date: string) => {
    setDatesExpanded(prev => {
      const isCurrentlyExpanded = prev[date] !== false;
      return { ...prev, [date]: !isCurrentlyExpanded };
    });
  }, []);

  const toggleDropdown = useCallback((id: number) => {
    setDropdownAberto(prev => prev === id ? null : id);
  }, []);

  const toggleFiltros = useCallback(() => {
    setFiltrosAberto(prev => !prev);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({
      residenteId: null,
      status: null,
      startDate: getTodayString(),
      endDate: getTodayString()
    });
    setSearchTerm('');
    setFiltroResidenteAberto(false);
    setFiltroStatusAberto(false);
  }, []);

  /* Componente: Lista Administrações */
  const ListaAdministracoes = () => {
    const totalFiltrado = gruposRenderizaveis.reduce((acc, grupo) => acc + grupo.itens.length, 0);

    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Administrações</h2>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Total: {totalFiltrado}
          </span>
        </div>

        {/* Tags de filtros ativos */}
        {(filtros.residenteId || filtros.status || searchTerm || filtros.startDate || filtros.endDate) && (
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
            {filtros.status && filtros.status !== 'todos' && (
              <span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
                Status: {filtros.status}
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

        {/* Lista de administrações */}
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando administrações...</p>
          </div>
        ) : gruposRenderizaveis.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <Pill className="mx-auto text-gray-300 mb-3" size={32} />
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              Nenhuma administração encontrada
            </p>
            <p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
              Tente ajustar os termos da busca ou os filtros
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {gruposRenderizaveis.map(grupo => {
              const pendentes = grupo.itens.filter(item => item.status === 'pendente').length;
              const totalGrupo = grupo.itens.length;

              return (
                <div key={`group-${grupo.dataFormatada}`} className="bg-gray-50 rounded-xl overflow-hidden border-l-2 border-odara-primary">
                  {/* Cabeçalho da Data */}
                  <div
                    className="bg-odara-primary/20 border-b border-odara-primary/60 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleDate(grupo.dataFormatada)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto justify-center sm:justify-start mb-2 sm:mb-0">
                      {grupo.isExpandido ? (
                        <ChevronDown className="text-odara-accent shrink-0" size={16} />
                      ) : (
                        <ChevronRight className="text-odara-accent shrink-0" size={16} />
                      )}
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-odara-dark truncate">
                        {formatarData(grupo.dataFormatada)}
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

                  {/* Lista de Medicamentos */}
                  {grupo.isExpandido && (
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
                        {grupo.itens.map(admin => (
                          <CardAdministracao
                            key={admin.id}
                            admin={admin}
                            onStatusClick={handleStatusClick}
                            onEditObservation={handleEditObservation}
                            dropdownAberto={dropdownAberto}
                            toggleDropdown={toggleDropdown}
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
              placeholder="Buscar por nome do medicamento..."
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
          onLimparFiltros={limparFiltros}
          residentesUnicos={obterResidentesUnicos}
          dateError={dateError}
          setDateError={setDateError}
        />

        {/* Lista de Administrações */}
        <ListaAdministracoes />

        {/* Contador de resultados */}
        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {gruposRenderizaveis.reduce((acc, grupo) => acc + grupo.itens.length, 0)} administração(ões) encontrada(s) de {listaCompleta.length}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>

        {/* Modal de Observação */}
        <ObservacaoModalComponente
          isOpen={observacaoModal.modalState.isOpen}
          observacaoInicial={observacaoModal.modalState.observacaoInicial}
          status={observacaoModal.modalState.status || statusParaObservacao}
          onConfirm={observacaoModal.handleConfirm}
          onCancel={observacaoModal.handleCancel}
          onClose={observacaoModal.handleCancel}
          validationError={observacaoModal.validationError}
          onClearValidationError={observacaoModal.clearValidationError}
        />
      </div>
    </div>
  );
};

export default Medicamentos;