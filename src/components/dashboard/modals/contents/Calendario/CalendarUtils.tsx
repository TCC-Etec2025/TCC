import { useState, useMemo } from "react";
import {CalendarIcon,  ChevronLeft,  ChevronRight } from "lucide-react";

// Tipos para os dados do calendário
export interface CalendarItem {
  data: string;
  [key: string]: any;
}

/**
 * Hook customizado para gerenciar calendário
 */
export const useCalendar = <T extends CalendarItem>(
  dados: T[],
  campoData: keyof T
) => {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());

  // Filtra dados do dia selecionado
  const dadosDoDia = useMemo(() => {
    const dataString = dataSelecionada.toISOString().split('T')[0];
    const dadosFiltrados = dados.filter(item => item[campoData] === dataString);
    
    // Ordenação baseada no tipo de horário disponível
    return dadosFiltrados.sort((a, b) => {
      if ('horario' in a && 'horario' in b) {
        return (a.horario as string).localeCompare(b.horario as string);
      }
      if ('horario_inicio' in a && 'horario_inicio' in b) {
        return (a.horario_inicio as string).localeCompare(b.horario_inicio as string);
      }
      return 0;
    });
  }, [dados, dataSelecionada, campoData]);

  // Verifica se é hoje
  const isHoje = (date: Date): boolean => {
    const hoje = new Date();
    return date.getDate() === hoje.getDate() &&
      date.getMonth() === hoje.getMonth() &&
      date.getFullYear() === hoje.getFullYear();
  };

  // Verifica se está selecionado
  const isSelecionado = (date: Date): boolean => {
    return date.getDate() === dataSelecionada.getDate() &&
      date.getMonth() === dataSelecionada.getMonth() &&
      date.getFullYear() === dataSelecionada.getFullYear();
  };

  // Conteúdo do tile (ponto indicador)
  const tileContent = ({ date, view }: { date: Date; view: string }): JSX.Element | null => {
    if (view === 'month') {
      const dataStr = date.toISOString().split('T')[0];
      const temDado = dados.some(item => item[campoData] === dataStr);
      return temDado ? (
        <div className="w-2 h-2 bg-odara-primary rounded-full mx-auto mt-1"></div>
      ) : null;
    }
    return null;
  };

  // Classes CSS do tile
  const tileClassName = ({ date, view }: { date: Date; view: string }): string => {
    if (view === 'month') {
      let classes = 'react-calendar__tile';

      if (isHoje(date)) {
        classes += ' today-custom';
      }

      // CORREÇÃO: Usar a mesma cor que em AtividadesContent.tsx
      if (isSelecionado(date) && !isHoje(date)) {
        classes += ' !bg-odara-primary/30 !text-odara-accent rounded-lg';
      }

      return classes;
    }
    return '';
  };

  // Navegação entre meses
  const navigateMonth = (direction: 'prev' | 'next'): void => {
    const newDate = new Date(dataSelecionada);
    newDate.setMonth(direction === 'prev' ? newDate.getMonth() - 1 : newDate.getMonth() + 1);
    setDataSelecionada(newDate);
  };

  // Formata horário HH:MM
  const formatarHorario = (horario: string): string => {
    return horario.slice(0, 5);
  };

  return {
    dataSelecionada,
    setDataSelecionada,
    dadosDoDia,
    isHoje,
    isSelecionado,
    tileContent,
    tileClassName,
    navigateMonth,
    formatarHorario
  };
};

/**
 * Componente de calendário com controles
 */
export const CalendarControls = ({
  dataSelecionada,
  navigateMonth,
  children,
  legendLabel = "atividades"
}: {
  dataSelecionada: Date;
  navigateMonth: (direction: 'prev' | 'next') => void;
  children: React.ReactNode;
  legendLabel?: string;
}) => (
  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200">
    {/* Controles */}
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={() => navigateMonth('prev')}
        className="p-2 hover:bg-white rounded-lg transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={20} className="text-odara-primary" />
      </button>

      <div className="flex items-center gap-2 text-odara-dark font-semibold">
        <CalendarIcon size={18} className="text-odara-primary" />
        <span className="capitalize">
          {dataSelecionada.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <button
        onClick={() => navigateMonth('next')}
        className="p-2 hover:bg-white rounded-lg transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight size={20} className="text-odara-primary" />
      </button>
    </div>

    {children}

    {/* Legenda */}
    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-odara-accent rounded-full"></div>
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-odara-primary/30 rounded-full border border-odara-primary"></div>
          <span>Selecionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-odara-primary rounded-full"></div>
          <span>Com {legendLabel}</span>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Componente de loading padronizado
 */
export const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-12 min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-odara-primary"></div>
  </div>
);

/**
 * Componente de lista vazia padronizado
 */
export const EmptyList = ({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { 
    size?: number | string; 
    className?: string 
  }>;
  title: string;
  description: string;
}) => (
  <div className="text-center py-12">
    <div className="rounded-full p-4 bg-gray-100 inline-block mb-3">
      <Icon size={32} className="text-gray-400" />
    </div>
    <p className="text-gray-500 font-medium text-lg">{title}</p>
    <p className="text-gray-400 text-sm mt-1">{description}</p>
  </div>
);