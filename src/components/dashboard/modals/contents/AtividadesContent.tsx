// src/components/dashboard/modals/contents/AtividadesContent.tsx
import { useState, useEffect } from "react";
import { Palette, MapPin, Clock, CalendarIcon as CalendarIconLucide, X } from "lucide-react";
import Calendar from 'react-calendar';
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Atividade } from "../types";
import { useCalendar,  CalendarControls,  EmptyList,  LoadingSpinner } from "./Calendario/CalendarUtils";
import { CalendarStyles } from "./Calendario/CalendarStyles";
import 'react-calendar/dist/Calendar.css';

// Interface estendida para atividade baseada na tabela do Supabase
interface AtividadeCompleta extends Omit<Atividade, 'id' | 'status'> {
  id: number;
  status: 'pendente' | 'cancelada' | 'concluida' | 'atrasada' | 'ativo';
  id_residente?: number;
}

export const AtividadesContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todasAtividades, setTodasAtividades] = useState<AtividadeCompleta[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<AtividadeCompleta | null>(null);

  // Função para obter status da atividade
  const getStatusAtividade = (status: string) => {
    switch (status) {
      case 'pendente':
        return { label: 'Pendente', color: 'bg-yellow-50 text-yellow-500', dot: 'bg-yellow-500' };
      case 'cancelada':
        return { label: 'Cancelada', color: 'bg-gray-100 text-gray-400', dot: 'bg-gray-400' };
      case 'concluida':
        return { label: 'Concluída', color: 'bg-green-50 text-green-500', dot: 'bg-green-500' };
      case 'atrasada':
        return { label: 'Atrasada', color: 'bg-red-50 text-red-500', dot: 'bg-red-500' };
      case 'ativo':
        return { label: 'Ativa', color: 'bg-blue-50 text-blue-500', dot: 'bg-blue-500' };
      default:
        return { label: 'Pendente', color: 'bg-yellow-50 text-yellow-500', dot: 'bg-yellow-500' };
    }
  };

  // Usa hook customizado para calendário
  const {
    dataSelecionada,
    setDataSelecionada,
    dadosDoDia: atividadesDoDia,
    tileContent,
    tileClassName,
    navigateMonth,
    formatarHorario
  } = useCalendar(todasAtividades, 'data');

  // Fetch TUDO (Histórico Completo)
  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('atividade')
        .select('*')
        .eq('id_residente', idResidente)
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atividades:', error);
        setTodasAtividades([]);
      } else {
        // Converter para o tipo correto
        const atividadesFormatadas: AtividadeCompleta[] = (data || []).map(item => ({
          id: item.id,
          nome: item.nome,
          categoria: item.categoria,
          data: item.data,
          horario_inicio: item.horario_inicio,
          horario_fim: item.horario_fim || item.horario_inicio,
          local: item.local,
          observacao: item.observacao,
          status: (item.status as 'pendente' | 'cancelada' | 'concluida' | 'atrasada' | 'ativo') || 'pendente',
          id_residente: item.id_residente
        }));
        
        setTodasAtividades(atividadesFormatadas);
      }
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-4 relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna do Calendário */}
        <div className="lg:col-span-1">
          <CalendarControls 
            dataSelecionada={dataSelecionada}
            navigateMonth={navigateMonth}
            legendLabel="atividades"
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

        {/* Coluna das Atividades */}
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
                {atividadesDoDia.length} atividade{atividadesDoDia.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {atividadesDoDia.length === 0 ? (
                <EmptyList
                  icon={Palette}
                  title="Nenhuma atividade hoje"
                  description="Dia livre de atividades programadas"
                />
              ) : (
                atividadesDoDia.map((atividade) => {
                  const status = getStatusAtividade(atividade.status);

                  return (
                    <div
                      key={atividade.id}
                      onClick={() => setAtividadeSelecionada(atividade)}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-odara-primary/50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Ícone de horário */}
                        <div className="p-3 rounded-lg bg-odara-primary/10 text-odara-primary border border-odara-primary/20">
                          <Clock size={20} />
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-odara-dark text-lg line-clamp-1 group-hover:text-odara-primary transition-colors">
                              {atividade.nome}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                {atividade.categoria}
                              </span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Horário */}
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatarHorario(atividade.horario_inicio)} - {formatarHorario(atividade.horario_fim)}
                              </span>
                            </div>

                            {/* Local */}
                            {atividade.local && (
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-600">{atividade.local}</span>
                              </div>
                            )}

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

      {/* Modal de detalhes da atividade */}
      {atividadeSelecionada && (
        <div className="fixed inset-0 bg-odara-offwhite/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col border-l-4 border-odara-primary">
            {/* Header */}
            <div className="border-b border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
              <div className="flex justify-between items-center">
                <span className="flex gap-3 items-baseline">
                  <Palette size={24} className="text-odara-accent" />
                  <h2 className="text-2xl font-bold text-odara-accent">
                    {atividadeSelecionada.nome}
                  </h2>
                </span>
                <button
                  onClick={() => setAtividadeSelecionada(null)}
                  className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary hover:bg-white/20"
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Status e Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusAtividade(atividadeSelecionada.status).dot}`}></div>
                    <span className="text-lg font-bold text-odara-dark">
                      {getStatusAtividade(atividadeSelecionada.status).label}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Categoria
                  </label>
                  <p className="text-lg font-bold text-odara-dark">
                    {atividadeSelecionada.categoria}
                  </p>
                </div>
              </div>

              {/* Horário e Local */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-odara-primary" />
                      Horário
                    </div>
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    {formatarHorario(atividadeSelecionada.horario_inicio)} - {formatarHorario(atividadeSelecionada.horario_fim)}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-odara-primary" />
                      Local
                    </div>
                  </label>
                  <p className="text-lg text-odara-dark font-semibold">
                    {atividadeSelecionada.local || "Não especificado"}
                  </p>
                </div>
              </div>

              {/* Data */}
              <div className="p-4 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  <div className="flex items-center gap-2">
                    <CalendarIconLucide size={16} className="text-odara-primary" />
                    Data
                  </div>
                </label>
                <p className="text-lg text-odara-dark font-semibold">
                  {new Date(atividadeSelecionada.data).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Observações */}
              {atividadeSelecionada.observacao && (
                <div className="p-5 rounded-xl border border-odara-primary shadow-small">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">
                    Observações
                  </label>
                  <p className="text-odara-dark leading-relaxed whitespace-pre-wrap">
                    {atividadeSelecionada.observacao}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setAtividadeSelecionada(null)}
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