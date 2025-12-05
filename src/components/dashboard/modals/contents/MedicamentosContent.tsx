import { useState, useEffect, useMemo } from "react";
import {
  Loader2, Pill, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  X, Info, CheckCircle, Clock, AlertCircle, CalendarDays, PauseCircle, CheckCircle2
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Medicamento } from "../types";

// Status configuration atualizada
const STATUS_CONFIG = [
  { key: 'ativo', label: 'Ativos', icon: <CheckCircle size={16} />, color: 'bg-odara-accent text-odara-white' },
  { key: 'inativo', label: 'Inativos', icon: <AlertCircle size={16} />, color: 'bg-odara-accent text-odara-white' },
  { key: 'todos', label: 'Todos', icon: <CalendarDays size={16} />, color: 'bg-odara-accent text-odara-white' },
];

// Helper para determinar se um medicamento está inativo
const isMedicamentoInativo = (status: string): boolean => {
  return status === 'suspenso' || status === 'finalizado';
};

export const MedicamentosContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todosMedicamentos, setTodosMedicamentos] = useState<Medicamento[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo');
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState<Medicamento | null>(null);

  // Fetch ALL once
  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('medicamento')
        .select('*')
        .eq('id_residente', idResidente)
        .order('nome', { ascending: true });
      setTodosMedicamentos(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  // Filter Local - atualizado para lidar com múltiplos status inativos
  const listaFiltrada = useMemo(() => {
    if (filtroStatus === 'todos') return todosMedicamentos;

    if (filtroStatus === 'ativo') {
      return todosMedicamentos.filter(m => m.status === 'ativo');
    }

    // Filtro para inativos: inclui 'suspenso' e 'finalizado'
    if (filtroStatus === 'inativo') {
      return todosMedicamentos.filter(m => isMedicamentoInativo(m.status));
    }

    return [];
  }, [todosMedicamentos, filtroStatus]);

  // Contadores para o resumo
  const contadores = useMemo(() => {
    const ativos = todosMedicamentos.filter(m => m.status === 'ativo').length;
    const inativos = todosMedicamentos.filter(m => isMedicamentoInativo(m.status)).length;
    const total = todosMedicamentos.length;

    return { ativos, inativos, total };
  }, [todosMedicamentos]);

  // Função para obter ícone e cor baseado no status específico
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ativo':
        return {
          icon: <CheckCircle size={14} />,
          color: 'bg-green-50 text-green-500',
          border: 'border-green-500',
          label: 'Ativo'
        };
      case 'suspenso':
        return {
          icon: <PauseCircle size={14} />,
          color: 'bg-yellow-50 text-yellow-500',
          border: 'border-yellow-500',
          label: 'Suspenso'
        };
      case 'finalizado':
        return {
          icon: <CheckCircle2 size={14} />,
          color: 'bg-gray-100 text-gray-400',
          border: 'border-gray-400',
          label: 'Finalizado'
        };
      default:
        return {
          icon: <AlertCircle size={14} />,
          color: 'bg-gray-100 text-gray-400',
          border: 'border-gray-400',
          label: status
        };
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12 min-h-[400px]">
      <Loader2 className="animate-spin text-odara-primary w-8 h-8" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-4 relative">
      {/* Header com título e filtros */}
      <div className="sticky top-0 z-10 bg-white py-4 flex flex-col justify-between items-center mb-6 gap-4 border-b border-gray-200">
        {/* Filtros de status - estilo similar ao Cardapio */}
        <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 w-full w-auto">
          {STATUS_CONFIG.map(status => (
            <button
              key={status.key}
              onClick={() => setFiltroStatus(status.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap ${filtroStatus === status.key
                ? `${status.color} shadow-sm border border-transparent`
                : 'text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow'
                }`}
            >
              <span className={`${filtroStatus === status.key ? 'opacity-90' : 'opacity-70'}`}>
                {status.icon}
              </span>
              {status.label}
              <span className="text-xs opacity-70 ml-1">
                {status.key === 'ativo' && `(${contadores.ativos})`}
                {status.key === 'inativo' && `(${contadores.inativos})`}
                {status.key === 'todos' && `(${contadores.total})`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de medicamentos */}
      <div className="overflow-y-auto max-h-[calc(80vh-200px)] min-h-[calc(60vh-200px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {listaFiltrada.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full p-4 bg-gray-100">
                <Pill size={32} className="text-gray-400"/>
              </div>
              <p className="text-gray-500 font-medium text-lg">
                {filtroStatus === 'ativo'
                  ? "Nenhum medicamento ativo encontrado"
                  : filtroStatus === 'inativo'
                    ? "Nenhum medicamento inativo encontrado"
                    : "Nenhum medicamento registrado"
                }
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {filtroStatus === 'ativo'
                  ? "Todos os medicamentos estão suspensos ou finalizados"
                  : filtroStatus === 'inativo'
                    ? "Todos os medicamentos estão ativos"
                    : "Comece adicionando um novo medicamento"
                }
              </p>
            </div>
          ) : (
            listaFiltrada.map(med => {
              const statusConfig = getStatusConfig(med.status);
              const isAtivo = med.status === 'ativo';

              return (
                <div
                  key={med.id}
                  onClick={() => setMedicamentoSelecionado(med)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-odara-primary/50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone do medicamento */}
                    <div className={`p-3 rounded-lg ${statusConfig.color} border ${statusConfig.border}`}>
                      <Pill size={20} />
                    </div>

                    {/* Informações principais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-odara-dark text-lg line-clamp-1 group-hover:text-odara-primary transition-colors">
                          {med.nome}
                        </h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusConfig.color} border ${statusConfig.border} flex items-center gap-1`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Dosagem */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Dosagem:</span>
                          <span className="text-sm text-odara-dark font-semibold">{med.dosagem}</span>
                        </div>

                        {/* Recorrência */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Recorrência:</span>
                          <span className="text-sm text-odara-dark">{med.recorrencia}</span>
                        </div>

                        {/* Horário (só mostra se estiver ativo) */}
                        {isAtivo && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{med.horario_inicio.slice(0, 5)}</span>
                            {med.intervalo && (
                              <span className="text-xs text-gray-400 ml-1">
                                (a cada {med.intervalo}h)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer informativo */}
      <div className="mt-6 p-4 border-t border-gray-200">
        <div className="flex flex-cols-1 sm:flex-cols-3 items-center justify-center gap-15 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center"></div>
            <div>
              <span className="font-medium">Ativo</span>
              <span className="text-xs text-gray-400 ml-1">• Em uso atual</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center"></div>
            <div>
              <span className="font-medium">Suspenso</span>
              <span className="text-xs text-gray-400 ml-1">• Temporariamente interrompido</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded flex items-center justify-center"></div>
            <div>
              <span className="font-medium">Finalizado</span>
              <span className="text-xs text-gray-400 ml-1">• Tratamento concluído</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do medicamento */}
      {medicamentoSelecionado && (
        <div className="fixed inset-0 bg-odara-offwhite/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col border-l-4 border-odara-primary">

            {/* Header do Modal */}
            <div className="border-b border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
              <div className="flex justify-between items-center">
                <span className="flex gap-3 items-baseline">
                    <Pill size={24} className="text-odara-accent" />
                  <h2 className="text-2xl font-bold text-odara-accent">
                    {medicamentoSelecionado.nome}
                  </h2>
                </span>

                <button
                  onClick={() => setMedicamentoSelecionado(null)}
                  className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Status */}
                <div className={`grid grid-cols-1 p-4 rounded-xl ${getStatusConfig(medicamentoSelecionado.status).color} border ${getStatusConfig(medicamentoSelecionado.status).border}`}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                  <div className="flex items-center gap-3">
                    {getStatusConfig(medicamentoSelecionado.status).icon}
                    <div>
                      <span className="text-lg font-bold">
                        {getStatusConfig(medicamentoSelecionado.status).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dosagem e Dose */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-odara-primary" />
                        Dosagem
                      </div>
                    </label>
                    <div className="space-y-2">
                      <p className="text-lg text-odara-dark font-semibold">
                        {medicamentoSelecionado.dosagem}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-odara-primary" />
                        Dose
                      </div>
                    </label>
                    <div className="space-y-2">
                      <p className="text-lg text-odara-dark font-semibold">
                        {medicamentoSelecionado.dose}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Horário e recorrência */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-odara-primary" />
                        Administração
                      </div>
                    </label>
                    <div className="space-y-2">
                      <p className="text-lg text-odara-dark font-semibold">
                        {medicamentoSelecionado.horario_inicio.substring(0, 5)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={16} className="text-odara-primary" />
                        Recorrência
                      </div>
                    </label>
                    <p className="text-lg text-odara-dark font-semibold">
                      {medicamentoSelecionado.recorrencia}
                    </p>
                  </div>
                </div>

                {/* Informações adicionais baseadas no status */}
                <div className="p-5 rounded-xl border border-odara-primary shadow-small">
                  <div className="flex items-center gap-2 font-bold text-sm mb-3 text-odara-accent">
                    <Info size={18} />
                    <span>Informações do Status</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-odara-accent"></div>
                      <span className="text-sm text-odara-dark leading-relaxed">
                        {medicamentoSelecionado.status === 'ativo'
                          ? 'Medicamento em uso regular conforme prescrição médica'
                          : medicamentoSelecionado.status === 'suspenso'
                            ? 'Tratamento temporariamente interrompido por orientação médica'
                            : 'Tratamento concluído conforme prescrição médica'
                        }
                      </span>
                    </div>

                    {medicamentoSelecionado.status === 'ativo' && medicamentoSelecionado.intervalo && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-odara-accent rounded-full"></div>
                        <span className="text-sm text-odara-dark leading-relaxed">
                          Administração a cada
                          <span className="font-bold">{' ' + medicamentoSelecionado.intervalo} hora(s)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer do Modal */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setMedicamentoSelecionado(null)}
                  className="px-6 py-3 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 font-medium"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
      )}
        </div>
      );
};