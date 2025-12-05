// src/components/dashboard/modals/contents/ExamesContent.tsx
import { useState, useEffect } from "react";
import { Microscope, Building, Clock, CalendarIcon as CalendarIconLucide, X } from "lucide-react";
import Calendar from 'react-calendar';
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Exame } from "../types";
import { 
  useCalendar, 
  CalendarControls, 
  EmptyList, 
  LoadingSpinner 
} from "./Calendario/CalendarUtils";
import { CalendarStyles } from "./Calendario/CalendarStyles";
import 'react-calendar/dist/Calendar.css';

// Interface estendida para exame baseada na tabela do Supabase
interface ExameCompleto extends Omit<Exame, 'id'> {
  id: number;
  resultado: 'pendente' | 'cancelado' | 'realizado' | 'concluido' | 'agendado';
  observacoes?: string;
  id_residente: number;
  status?: string;
}

export const ExamesContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todosExames, setTodosExames] = useState<ExameCompleto[]>([]);
  const [exameSelecionado, setExameSelecionado] = useState<ExameCompleto | null>(null);

  // Usa hook customizado para calendário
  const {
    dataSelecionada,
    setDataSelecionada,
    dadosDoDia: examesDoDia,
    tileContent,
    tileClassName,
    navigateMonth,
    formatarHorario
  } = useCalendar(todosExames, 'data');

  // Busca TODOS os exames
  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('exame')
        .select('*')
        .eq('id_residente', idResidente)
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao buscar exames:', error);
      }

      // Converter para o tipo estendido
      const examesFormatados: ExameCompleto[] = (data || []).map(exame => ({
        ...exame,
        resultado: (exame.status as 'pendente' | 'cancelado' | 'realizado' | 'concluido' | 'agendado') || 'pendente',
        observacoes: exame.observacao
      }));
      
      setTodosExames(examesFormatados);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  // Função para obter status do exame
  const getStatusExame = (resultado: string) => {
    switch (resultado) {
      case 'pendente':
        return { label: 'Pendente', color: 'bg-yellow-50 text-yellow-500', dot: 'bg-yellow-500' };
      case 'realizado':
      case 'concluido':
        return { label: 'Realizado', color: 'bg-green-50 text-green-500', dot: 'bg-green-500' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'bg-gray-100 text-gray-400', dot: 'bg-gray-400' };
      case 'agendado':
        return { label: 'Agendado', color: 'bg-blue-50 text-blue-500', dot: 'bg-blue-500' };
      default:
        return { label: 'Pendente', color: 'bg-yellow-50 text-yellow-500', dot: 'bg-yellow-500' };
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-4 relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-1">
          <CalendarControls 
            dataSelecionada={dataSelecionada}
            navigateMonth={navigateMonth}
            legendLabel="exames"
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

        {/* Lista de Exames */}
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
                {examesDoDia.length} exame{examesDoDia.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {examesDoDia.length === 0 ? (
                <EmptyList
                  icon={Microscope}
                  title="Nenhum exame hoje"
                  description="Não há exames agendados para esta data"
                />
              ) : (
                examesDoDia.map((exame) => {
                  const status = getStatusExame(exame.resultado);

                  return (
                    <div
                      key={exame.id}
                      onClick={() => setExameSelecionado(exame)}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-odara-primary/50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Ícone de exame */}
                        <div className="p-3 rounded-lg bg-odara-primary/10 text-odara-primary border border-odara-primary/20">
                          <Microscope size={20} />
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-odara-dark text-lg line-clamp-1 group-hover:text-odara-primary transition-colors">
                              {exame.tipo}
                            </h4>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {/* Laboratório */}
                            {exame.laboratorio && (
                              <div className="flex items-center gap-2">
                                <Building size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-600">{exame.laboratorio}</span>
                              </div>
                            )}

                            {/* Horário */}
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{formatarHorario(exame.horario)}</span>
                            </div>

                            {/* Resultado */}
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                              <span className="text-xs text-gray-500">Resultado: {status.label}</span>
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

      {/* Modal de detalhes do exame */}
      {exameSelecionado && (
        <div className="fixed inset-0 bg-odara-offwhite/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col border-l-4 border-odara-primary">
            {/* Header */}
            <div className="border-b border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
              <div className="flex justify-between items-center">
                <span className="flex gap-3 items-baseline">
                  <Microscope size={24} className="text-odara-accent" />
                  <h2 className="text-2xl font-bold text-odara-accent">
                    {exameSelecionado.tipo}
                  </h2>
                </span>
                <button
                  onClick={() => setExameSelecionado(null)}
                  className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary hover:bg-white/20"
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Tipo e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Tipo de Exame
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    {exameSelecionado.tipo}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusExame(exameSelecionado.resultado).dot}`}></div>
                    <span className="text-lg font-bold text-odara-dark">
                      {getStatusExame(exameSelecionado.resultado).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    <div className="flex items-center gap-2">
                      <CalendarIconLucide size={16} className="text-odara-primary" />
                      Data
                    </div>
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    {new Date(exameSelecionado.data).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
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
                    {formatarHorario(exameSelecionado.horario)}
                  </p>
                </div>
              </div>

              {/* Laboratório */}
              {exameSelecionado.laboratorio && (
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-odara-primary" />
                      Laboratório
                    </div>
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    {exameSelecionado.laboratorio}
                  </p>
                </div>
              )}

              {/* Resultado e Arquivo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Resultado
                  </label>
                  <p className="text-lg text-odara-dark font-semibold capitalize">
                    {getStatusExame(exameSelecionado.resultado).label}
                  </p>
                </div>

                {exameSelecionado.arquivo_resultado && (
                  <div className="p-4 rounded-xl border border-odara-primary shadow-small">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Arquivo do Resultado
                    </label>
                    <a
                      href={exameSelecionado.arquivo_resultado}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-odara-primary hover:text-odara-accent transition-colors underline text-sm inline-flex items-center gap-2"
                    >
                      Visualizar resultado
                    </a>
                  </div>
                )}
              </div>

              {/* Observações */}
              {exameSelecionado.observacoes && (
                <div className="p-5 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">
                    Observações
                  </label>
                  <p className="text-odara-dark leading-relaxed whitespace-pre-wrap">
                    {exameSelecionado.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setExameSelecionado(null)}
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