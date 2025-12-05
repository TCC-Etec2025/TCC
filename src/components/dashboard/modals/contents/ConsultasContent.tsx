// src/components/dashboard/modals/contents/ConsultasContent.tsx
import { useState, useEffect } from "react";
import { Stethoscope, ClipboardPlus, Clock, X } from "lucide-react";
import Calendar from 'react-calendar';
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Consulta } from "../types";
import { 
  useCalendar, 
  CalendarControls, 
  EmptyList, 
  LoadingSpinner 
} from "./Calendario/CalendarUtils";
import { CalendarStyles } from "./Calendario/CalendarStyles";
import 'react-calendar/dist/Calendar.css';

// Interface estendida para consulta baseada na tabela do Supabase
interface ConsultaComStatus extends Omit<Consulta, 'id'> {
  id: number;
  data: string; // Adicionado para compatibilidade com CalendarItem
  status: 'agendada' | 'cancelada' | 'realizada';
  observacoes?: string;
  id_residente: number;
  tratamento_indicado?: string | null;
}

export const ConsultasContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todasConsultas, setTodasConsultas] = useState<ConsultaComStatus[]>([]);
  const [consultaSelecionada, setConsultaSelecionada] = useState<ConsultaComStatus | null>(null);

  // Função para obter status da consulta
  const getStatusConsulta = (status: string) => {
    switch (status) {
      case 'agendada':
        return { label: 'Agendada', color: 'bg-blue-50 text-blue-500', dot: 'bg-blue-500' };
      case 'cancelada':
        return { label: 'Cancelada', color: 'bg-gray-100 text-gray-400', dot: 'bg-gray-400' };
      case 'realizada':
        return { label: 'Realizada', color: 'bg-green-50 text-green-500', dot: 'bg-green-500' };
      default:
        return { label: 'Agendada', color: 'bg-blue-50 text-blue-500', dot: 'bg-blue-500' };
    }
  };

  // Usa hook customizado para calendário
  const {
    dataSelecionada,
    setDataSelecionada,
    dadosDoDia: consultasDoDia,
    tileContent,
    tileClassName,
    navigateMonth,
    formatarHorario
  } = useCalendar(todasConsultas, 'data_consulta');

  // Busca todas as consultas
  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('consulta')
        .select('*')
        .eq('id_residente', idResidente)
        .order('data_consulta', { ascending: false });

      if (error) {
        console.error('Erro ao buscar consultas:', error);
      }

      // Converter para o tipo estendido
      const consultasFormatadas: ConsultaComStatus[] = (data || []).map(consulta => ({
        ...consulta,
        data: consulta.data_consulta, // Para compatibilidade com CalendarItem
        status: (consulta.status as 'agendada' | 'cancelada' | 'realizada') || 'agendada',
        observacoes: consulta.observacao
      }));
      
      setTodasConsultas(consultasFormatadas);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-4 relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-1">
          <CalendarControls 
            dataSelecionada={dataSelecionada}
            navigateMonth={navigateMonth}
            legendLabel="consultas"
          >
            <div className="react-calendar-custom">
              <Calendar
                onChange={(val) => setDataSelecionada(val as Date)}
                value={dataSelecionada}
                className="w-full border-0 bg-transparent"
                tileContent={tileContent}
                tileClassName={tileClassName}
                nextLabel={null}
                prevLabel={null}
                next2Label={null}
                prev2Label={null}
                showNavigation={false}
              />
            </div>
          </CalendarControls>
        </div>

        {/* Lista de Consultas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-odara-dark">
                {dataSelecionada.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h4>
              <span className="text-sm text-gray-500">
                {consultasDoDia.length} consulta{consultasDoDia.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {consultasDoDia.length === 0 ? (
                <EmptyList
                  icon={ClipboardPlus}
                  title="Nenhuma consulta hoje"
                  description="Não há consultas agendadas para esta data"
                />
              ) : (
                consultasDoDia.map((consulta) => {
                  const status = getStatusConsulta(consulta.status);

                  return (
                    <div
                      key={consulta.id}
                      onClick={() => setConsultaSelecionada(consulta)}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-odara-primary/50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Ícone de consulta */}
                        <div className="p-3 rounded-lg bg-odara-primary/10 text-odara-primary border border-odara-primary/20">
                          <ClipboardPlus size={20} />
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-odara-dark text-lg line-clamp-1 group-hover:text-odara-primary transition-colors">
                              {consulta.motivo_consulta || "Consulta Médica"}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-400">
                                {formatarHorario(consulta.horario)}
                              </span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Médico */}
                            <div className="flex items-center gap-2">
                              <Stethoscope size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">Dr(a). {consulta.medico}</span>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                              <span className="text-xs text-gray-500">Status: {status.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalhes da consulta */}
      {consultaSelecionada && (
        <div className="fixed inset-0 bg-odara-offwhite/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col border-l-4 border-odara-primary">
            {/* Header */}
            <div className="border-b border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
              <div className="flex justify-between items-center">
                <span className="flex gap-3 items-baseline">
                  <ClipboardPlus size={24} className="text-odara-accent" />
                  <h2 className="text-2xl font-bold text-odara-accent">
                    {consultaSelecionada.motivo_consulta || "Consulta Médica"}
                  </h2>
                </span>
                <button
                  onClick={() => setConsultaSelecionada(null)}
                  className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary hover:bg-white/20"
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Médico e Horário */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className="text-odara-primary" />
                      Médico
                    </div>
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    Dr(a). {consultaSelecionada.medico}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-odara-primary" />
                      Horário
                    </div>
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    {formatarHorario(consultaSelecionada.horario)}
                  </p>
                </div>
              </div>

              {/* Data e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-odara-primary" />
                      Data da Consulta
                    </div>
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    {new Date(consultaSelecionada.data_consulta).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusConsulta(consultaSelecionada.status).dot}`}></div>
                    <span className="text-lg font-bold text-odara-dark">
                      {getStatusConsulta(consultaSelecionada.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivo */}
              {consultaSelecionada.motivo_consulta && (
                <div className="p-5 rounded-xl border border-odara-primary shadow-small">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">
                    Motivo da Consulta
                  </label>
                  <p className="text-odara-dark leading-relaxed whitespace-pre-wrap">
                    {consultaSelecionada.motivo_consulta}
                  </p>
                </div>
              )}

              {/* Tratamento Indicado */}
              {consultaSelecionada.tratamento_indicado && (
                <div className="p-5 rounded-xl border border-odara-primary shadow-small">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">
                    Tratamento Indicado
                  </label>
                  <p className="text-odara-dark leading-relaxed whitespace-pre-wrap">
                    {consultaSelecionada.tratamento_indicado}
                  </p>
                </div>
              )}

              {/* Observações */}
              {consultaSelecionada.observacoes && (
                <div className="p-5 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">
                    Observações
                  </label>
                  <p className="text-odara-dark leading-relaxed whitespace-pre-wrap">
                    {consultaSelecionada.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setConsultaSelecionada(null)}
                className="px-6 py-3 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 font-medium"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      <CalendarStyles />
    </div>
  );
};