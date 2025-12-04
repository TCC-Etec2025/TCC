import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Info, Filter, ChevronDown, ChevronRight, MessageCircleMore, Clock, FileText, Check, CircleCheck, Microscope, Search, Edit, RockingChair, XCircle, Loader, X, AlertCircle, Calendar, Building } from 'lucide-react';

import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../context/UserContext';
import { useObservacaoModal } from '../../../hooks/useObservacaoModal';
import toast, { Toaster } from 'react-hot-toast';

/* Tipos */
type Exame = {
  id: number;
  id_residente: number;
  id_consulta: number | null;
  tipo: string;
  laboratorio: string;
  data_prevista: string;
  horario_previsto: string;
  data_realizacao: string | null;
  horario_realizacao: string | null;
  resultado: string | null;
  status: string;
  observacao: string | null;
  created_at: string;
  updated_at: string;
};

type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type ExameComDetalhes = Exame & {
  residente: Residente;
};

/* Constantes */
const COR_STATUS: Record<string, {
  bola: string;
  bg: string;
  text: string;
  border: string;
  icon: any;
}> = {
  realizado: {
    bola: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-green-200',
    icon: CircleCheck
  },
  pendente: {
    bola: 'bg-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-yellow-200',
    icon: Clock
  },
  cancelado: {
    bola: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-red-200',
    icon: XCircle
  },
  reagendado: {
    bola: 'bg-blue-400',
    bg: 'bg-blue-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-blue-200',
    icon: Calendar
  }
};

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente', icon: Clock },
  { value: 'realizado', label: 'Realizado', icon: CircleCheck },
  { value: 'cancelado', label: 'Cancelado', icon: XCircle },
  { value: 'reagendado', label: 'Reagendado', icon: Calendar }
];

const FILTRO_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'reagendado', label: 'Reagendado' }
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

const formatarHora = (hora: string): string => {
  return hora.substring(0, 5);
};

/* Componente Principal */
const Exames: React.FC = () => {
  /* Estados */
  const [exames, setExames] = useState<Exame[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);

  const [datesExpanded, setDatesExpanded] = useState<Record<string, boolean>>({});
  const [dateError, setDateError] = useState(null as string | null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    residenteId: null as number | null,
    status: null as string | null,
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
    onSelecionar: (value: any) => void;
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
            <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500 flex-shrink-0" />
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
    exame: ExameComDetalhes;
    onStatusChange: (exameId: number, status: string) => Promise<void>;
    dropdownAberto: number | null;
    toggleDropdown: (id: number) => void;
  }

  const DropdownStatus: React.FC<DropdownStatusProps> = ({
    exame,
    onStatusChange,
    dropdownAberto,
    toggleDropdown
  }) => {
    const cores = COR_STATUS[exame.status] || COR_STATUS.pendente;
    const IconeStatus = cores.icon;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(exame.id)}
          className="flex items-center gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
        >
          <IconeStatus size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
          <span className="text-odara-dark capitalize">{exame.status.replace('_', ' ')}</span>
          <ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500" />
        </button>

        {dropdownAberto === exame.id && (
          <>
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => toggleDropdown(exame.id)}
            />
            <div className="absolute top-full sm:right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
              {STATUS_OPTIONS.map((option) => {
                const OptionIcon = COR_STATUS[option.value].icon;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(exame.id, option.value);
                      toggleDropdown(exame.id);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${exame.status === option.value
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                      }`}
                  >
                    <OptionIcon size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
                    <span className="capitalize">{option.label}</span>
                    {exame.status === option.value && (
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

  /* Componente: Card de Exame */
  interface CardExameProps {
    exame: ExameComDetalhes;
    onStatusClick: (exameId: number, status: string) => Promise<void>;
    onEditObservation: (exame: ExameComDetalhes) => Promise<void>;
    onViewResult: (exame: ExameComDetalhes) => void;
    dropdownAberto: number | null;
    toggleDropdown: (id: number) => void;
  }

  const CardExame: React.FC<CardExameProps> = ({
    exame,
    onStatusClick,
    onEditObservation,
    onViewResult,
    dropdownAberto,
    toggleDropdown
  }) => {
    const cores = COR_STATUS[exame.status] || COR_STATUS.pendente;

    return (
      <div className="bg-white rounded-lg shadow border overflow-hidden border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
        {/* Header */}
        <div className={`flex flex-wrap justify-center sm:justify-between gap-2 items-center p-2 sm:p-3 ${cores.border} ${cores.bg}`}>
          {/* Coluna Esquerda - Data e Hora */}
          <div className="flex items-center">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${cores.bola}`}></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
              <p className={`text-xs sm:text-sm md:text-base ${cores.text} whitespace-nowrap`}>
                {formatarData(exame.data_prevista)}
              </p>
              <span className="text-odara-accent mx-1 hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm md:text-base text-odara-accent whitespace-nowrap">
                {formatarHora(exame.horario_previsto)}
              </span>
            </div>
          </div>

          {/* Status - Responsivo */}
          <div className="w-full sm:w-auto">
            <DropdownStatus
              exame={exame}
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
              {exame.tipo}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 flex-1">
            {/* Coluna Esquerda */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <div className="flex items-start gap-2">
                  <Building 
                    size={12} 
                    className="text-odara-accent flex-shrink-0 mt-0.5 hidden sm:block" 
                  />
                  <div className="flex-1 min-w-0">
                    <strong className="text-odara-dark text-xs sm:text-sm">Laboratório:</strong>
                    <span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
                      {exame.laboratorio || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-odara-dark text-xs sm:text-sm">Resultado:</strong>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                  <span className={`text-xs sm:text-sm flex-1 line-clamp-2 ${exame.resultado ? 'text-odara-name' : 'text-gray-400'}`}>
                    {exame.resultado || 'Resultado não disponível'}
                  </span>
                  {exame.resultado && (
                    <button
                      onClick={() => onViewResult(exame)}
                      className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-blue-50 flex-shrink-0"
                      title="Visualizar resultado"
                    >
                      <FileText size={12} className="sm:w-3.5 sm:h-3.5 hidden sm:block" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-2 sm:space-y-3">
              {/* Residente - mantém a estrutura com ícone */}
              <div>
                <div className="flex items-start gap-2">
                  <RockingChair 
                    className="text-odara-accent flex-shrink-0 mt-0.5 hidden sm:block" 
                    size={12} 
                  />
                  <div className="flex-1 min-w-0">
                    <strong className="text-odara-dark text-xs sm:text-sm">Residente:</strong>
                    <div className="mt-0.5">
                      <span className="text-odara-name text-xs sm:text-sm">
                        {exame.residente.nome}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observação - alinhada com o nome do residente */}
              <div>
                <div className="flex gap-2">
                  {/* Espaço reservado para alinhar com o ícone */}
                  <div className="w-3 flex-shrink-0 hidden sm:block" />
                  
                  <div className="flex-1 min-w-0">
                    <strong className="text-odara-dark text-xs sm:text-sm">Observação:</strong>
                    <div className="flex items-start justify-between gap-2 mt-0.5 sm:mt-1">
                      <span className="text-odara-name text-xs sm:text-sm flex-1 line-clamp-2">
                        {exame.observacao || 'Nenhuma observação'}
                      </span>
                      {exame.observacao && (
                        <button
                          onClick={() => onEditObservation(exame)}
                          className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-dropdown-accent flex-shrink-0"
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onStatusClick(exame.id, "realizado")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${exame.status === "realizado"
                  ? 'bg-green-100 text-green-500 border border-green-500'
                  : 'bg-white text-gray-400 border border-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-600'
                  }`}
              >
                <CircleCheck size={14} className="mb-1 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Realizado</span>
              </button>

              <button
                onClick={() => onStatusClick(exame.id, "cancelado")}
                className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${exame.status === "cancelado"
                  ? 'bg-red-100 text-red-500 border border-red-500'
                  : 'bg-white text-gray-400 border border-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-600'
                  }`}
              >
                <XCircle size={14} className="mb-1 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Cancelar</span>
              </button>
            </div>

            <button
              onClick={() => onEditObservation(exame)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${exame.observacao
                ? 'bg-blue-50 text-blue-500 border border-blue-500'
                : 'bg-white text-gray-400 border border-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-500'
                }`}
            >
              <MessageCircleMore size={12} className="sm:w-3.5 sm:h-3.5" />
              {exame.observacao ? 'Editar Observação' : 'Adicionar Observação'}
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
    setFiltros: (filtros: any) => void;
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
      setFiltros((prev: any) => ({ ...prev, residenteId }));
      setFiltroResidenteAberto(false);
    }, [setFiltros, setFiltroResidenteAberto]);

    const selecionarStatus = useCallback((status: string | null) => {
      setFiltros((prev: any) => ({ ...prev, status: status === 'todos' ? null : status }));
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
                onSelecionar={selecionarResidente}
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
                onSelecionar={selecionarStatus}
                tipo="status"
                ref={filtroStatusRef}
              />
            </div>
          </div>

          {/* Botão Limpar Filtros/Busca */}
          <div className="flex md:items-end gap-2 pt-1 md:pt-0 md:flex-shrink-0">
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
                setFiltros((prev: any) => ({ ...prev, startDate: e.target.value || null }));
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
                setFiltros((prev: any) => ({ ...prev, endDate: e.target.value || null }));
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
          <Microscope size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent flex-shrink-0 mt-1 sm:mt-0' />
          
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-0.1 sm:gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
                Controle de Exames
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
                    <strong className="font-semibold">Como usar:</strong> Controle dos exames solicitados para os residentes. Acompanhe o status, resultados e observações.
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
        // Observação obrigatória para status 'cancelado'
        if (status === 'cancelado') {
          return schema.required('A observação é obrigatória para cancelamento');
        }
        return schema.nullable();
      })
      .max(200, 'A observação deve ter no máximo 200 caracteres')
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

    const isObservacaoObrigatoria = status === 'cancelado';
    const isEdicao = !!observacaoInicial;
    const tituloModal = isEdicao ? 'Editar Observação' : 'Adicionar Observação';
    const descricaoModal = isEdicao
      ? 'Atualize a observação do exame'
      : 'Informe a observação para o exame';

    const onSubmit = async (values: ObservacaoFormData) => {
      setIsSubmitting(true);

      try {
        console.log("Dados sendo enviados:", values.observacao);

        if (status === 'cancelado' && !values.observacao?.trim()) {
          setError('observacao', {
            type: 'manual',
            message: 'A observação é obrigatória para cancelamento'
          });
          setIsSubmitting(false);
          return;
        }

        onConfirm(values.observacao || '');

      } catch (err: any) {
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
          <div className="border-b-1 border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
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
                      ? "Descreva o motivo do cancelamento (campo obrigatório)..."
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

  /* Componente: Modal de Resultado */
  interface ResultadoModalProps {
    isOpen: boolean;
    exame: ExameComDetalhes | null;
    onClose: () => void;
    onEditResult: (exame: ExameComDetalhes) => Promise<void>;
  }

  const ResultadoModal: React.FC<ResultadoModalProps> = ({
    isOpen,
    exame,
    onClose,
    onEditResult
  }) => {
    const [editMode, setEditMode] = useState(false);
    const [resultadoText, setResultadoText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      if (exame) {
        setResultadoText(exame.resultado || '');
        setEditMode(false);
      }
    }, [exame]);

    const handleSave = async () => {
      if (!exame) return;

      setIsSaving(true);
      try {
        await onEditResult({ ...exame, resultado: resultadoText });
        setEditMode(false);
        toast.success('Resultado atualizado com sucesso!');
      } catch (error) {
        toast.error('Erro ao salvar resultado');
      } finally {
        setIsSaving(false);
      }
    };

    if (!isOpen || !exame) return null;

    return (
      <div className="fixed inset-0 bg-odara-offwhite/80 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-odara-primary">
          {/* Header do Modal */}
          <div className="border-b-1 border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  Resultado do Exame
                </h2>
                <p className="text-odara-white mt-1 text-sm">
                  {exame.tipo} • {exame.residente.nome}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-white text-odara-primary rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Corpo do Modal */}
          <div className="p-6 bg-odara-offwhite/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <strong className="text-odara-dark text-sm">Data Prevista:</strong>
                <p className="text-odara-name mt-1">
                  {formatarData(exame.data_prevista)} às {formatarHora(exame.horario_previsto)}
                </p>
              </div>
              <div>
                <strong className="text-odara-dark text-sm">Laboratório:</strong>
                <p className="text-odara-name mt-1">{exame.laboratorio}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-medium text-odara-dark">
                  Resultado {editMode && '*'}
                </label>
                {editMode && (
                  <span className="text-xs text-gray-500">
                    {resultadoText.length}/500 caracteres
                  </span>
                )}
              </div>

              {editMode ? (
                <textarea
                  value={resultadoText}
                  onChange={(e) => setResultadoText(e.target.value)}
                  className="w-full px-4 py-3 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                  rows={8}
                  placeholder="Digite o resultado do exame..."
                  maxLength={500}
                  autoFocus
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px]">
                  <p className="text-odara-secondary whitespace-pre-wrap">
                    {exame.resultado || 'Nenhum resultado registrado.'}
                  </p>
                </div>
              )}
            </div>

            {/* Observação */}
            {exame.observacao && (
              <div className="mb-6">
                <strong className="text-odara-dark text-sm">Observação:</strong>
                <p className="text-odara-name mt-1 text-sm">{exame.observacao}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setResultadoText(exame.resultado || '');
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !resultadoText.trim()}
                    className='px-6 py-2.5 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium'
                  >
                    {isSaving ? (
                      <>
                        <Loader className="animate-spin inline mr-2" size={16} />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Resultado'
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition-colors duration-200 text-sm font-medium"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* Carregar Dados */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar exames
      const { data: examesData, error: examesErr } = await supabase
        .from("exame")
        .select("*")
        .order('data_prevista', { ascending: true })
        .order('horario_previsto', { ascending: true });

      if (examesErr) throw examesErr;
      setExames(examesData || []);

      // Buscar residentes
      const { data: resData, error: resErr } = await supabase
        .from("residente")
        .select("id, nome, quarto")
        .order('nome', { ascending: true });
      if (resErr) throw resErr;
      setResidentes(resData || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      toast.error('Erro ao carregar exames');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Utilitários */
  const listaCompleta = useMemo(() => {
    if (!exames.length || !residentes.length) return [];

    return exames.map(exame => {
      const residente = residentes.find(r => r.id === exame.id_residente);
      if (!residente) return null;

      return { ...exame, residente };
    }).filter((item): item is ExameComDetalhes => item !== null);
  }, [exames, residentes]);

  const obterResidentesUnicos = useMemo(() => {
    const residentesMap = new Map<number, string>();
    listaCompleta.forEach(e => {
      if (e.residente) {
        residentesMap.set(e.residente.id, e.residente.nome);
      }
    });
    return Array.from(residentesMap.entries());
  }, [listaCompleta]);

  /* Filtragem e Agrupamento */
  const gruposRenderizaveis = useMemo(() => {
    const { residenteId, status, startDate, endDate } = filtros;

    const filtradas = listaCompleta.filter(exame => {
      // Filtro por busca
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        if (!exame.tipo.toLowerCase().includes(searchLower) &&
            !exame.laboratorio.toLowerCase().includes(searchLower) &&
            !exame.residente.nome.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtro por residente
      if (residenteId && exame.residente.id !== residenteId) return false;

      // Filtro por status
      if (status && status !== 'todos' && exame.status !== status) return false;

      // Filtro por data
      if (startDate && endDate) {
        if (exame.data_prevista < startDate || exame.data_prevista > endDate) return false;
      } else if (startDate) {
        if (exame.data_prevista < startDate) return false;
      } else if (endDate) {
        if (exame.data_prevista > endDate) return false;
      }

      return true;
    });

    // Ordenar por data e horário
    filtradas.sort((a, b) => {
      if (a.data_prevista !== b.data_prevista) return a.data_prevista.localeCompare(b.data_prevista);
      return a.horario_previsto.localeCompare(b.horario_previsto);
    });

    // Agrupar por data
    const grupos: Record<string, ExameComDetalhes[]> = {};
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
  const updateStatus = useCallback(async (exameId: number, newStatus: string, observacao?: string) => {
    try {
      const now = new Date();
      const dataHoje = getTodayString();
      const horarioAgora = now.toTimeString().substring(0, 5);

      const updateData: any = {
        status: newStatus,
        observacao: observacao ?? null,
      };

      // Se o exame foi realizado, registrar data e hora de realização
      if (newStatus === 'realizado') {
        updateData.data_realizacao = dataHoje;
        updateData.horario_realizacao = horarioAgora;
      } else if (newStatus === 'cancelado' || newStatus === 'reagendado') {
        updateData.data_realizacao = null;
        updateData.horario_realizacao = null;
      }

      const { error } = await supabase
        .from("exame")
        .update(updateData)
        .eq("id", exameId);

      if (error) throw error;

      // Atualizar estado local
      setExames(prev =>
        prev.map(e =>
          e.id === exameId
            ? {
              ...e,
              status: newStatus,
              observacao: observacao ?? e.observacao,
              data_realizacao: updateData.data_realizacao,
              horario_realizacao: updateData.horario_realizacao
            }
            : e
        )
      );

      toast.success(`Status atualizado para "${newStatus.replace('_', ' ')}"`);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error('Erro ao atualizar status');
    }
  }, []);

  const updateResultado = useCallback(async (exameId: number, resultado: string) => {
    try {
      const { error } = await supabase
        .from("exame")
        .update({
          resultado: resultado.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", exameId);

      if (error) throw error;

      // Atualizar estado local
      setExames(prev =>
        prev.map(e =>
          e.id === exameId
            ? { ...e, resultado: resultado.trim() || null }
            : e
        )
      );

      return true;
    } catch (err) {
      console.error("Erro ao atualizar resultado:", err);
      throw err;
    }
  }, []);

  const handleStatusClick = useCallback(async (exameId: number, status: string) => {
    try {
      if (status === "realizado") {
        await updateStatus(exameId, status);
      } else {
        setStatusParaObservacao(status);
        const obs = await observacaoModal.openModal("", exameId, status);
        if (obs !== null) {
          await updateStatus(exameId, status, obs);
        }
      }
    } catch {
      // cancelado pelo usuário
    }
  }, [observacaoModal.openModal, updateStatus]);

  const handleEditObservation = useCallback(async (exame: ExameComDetalhes) => {
    try {
      const novaObs = await observacaoModal.openModal(exame.observacao || "", exame.id, exame.status);
      if (novaObs !== null) {
        await updateStatus(exame.id, exame.status, novaObs);
      }
    } catch {
      // cancelado pelo usuário
    }
  }, [observacaoModal.openModal, updateStatus]);

  const [modalResultado, setModalResultado] = useState<{
    isOpen: boolean;
    exame: ExameComDetalhes | null;
  }>({
    isOpen: false,
    exame: null
  });

  const handleViewResult = useCallback((exame: ExameComDetalhes) => {
    setModalResultado({
      isOpen: true,
      exame
    });
  }, []);

  const handleEditResult = useCallback(async (exame: ExameComDetalhes) => {
    try {
      await updateResultado(exame.id, exame.resultado || '');
    } catch {
      toast.error('Erro ao atualizar resultado');
    }
  }, [updateResultado]);

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

  /* Componente: Lista Exames */
  const ListaExames = () => {
    const totalFiltrado = gruposRenderizaveis.reduce((acc, grupo) => acc + grupo.itens.length, 0);
    const totalGeral = listaCompleta.length;

    return (
      <div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Exames Agendados</h2>
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

        {/* Lista de exames */}
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-odara-dark/60 text-sm sm:text-lg">Carregando exames...</p>
          </div>
        ) : gruposRenderizaveis.length === 0 ? (
          <div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
            <FileText className="mx-auto text-gray-300 mb-3" size={32} />
            <p className="text-odara-dark/60 text-sm sm:text-lg">
              Nenhum exame encontrado
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
                        <ChevronDown className="text-odara-accent flex-shrink-0" size={16} />
                      ) : (
                        <ChevronRight className="text-odara-accent flex-shrink-0" size={16} />
                      )}
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-odara-dark truncate">
                        {formatarData(grupo.dataFormatada)}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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

                  {/* Lista de Exames */}
                  {grupo.isExpandido && (
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
                        {grupo.itens.map(exame => (
                          <CardExame
                            key={exame.id}
                            exame={exame}
                            onStatusClick={handleStatusClick}
                            onEditObservation={handleEditObservation}
                            onViewResult={handleViewResult}
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
              placeholder="Buscar por tipo de exame, laboratório ou residente..."
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

        {/* Lista de Exames */}
        <ListaExames />

        {/* Contador de resultados */}
        <div className="mt-3 text-xs sm:text-sm text-gray-400">
          Total de {gruposRenderizaveis.reduce((acc, grupo) => acc + grupo.itens.length, 0)} exame(s) encontrado(s) de {listaCompleta.length}
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

        {/* Modal de Resultado */}
        <ResultadoModal
          isOpen={modalResultado.isOpen}
          exame={modalResultado.exame}
          onClose={() => setModalResultado({ isOpen: false, exame: null })}
          onEditResult={handleEditResult}
        />
      </div>
    </div>
  );
};

export default Exames;