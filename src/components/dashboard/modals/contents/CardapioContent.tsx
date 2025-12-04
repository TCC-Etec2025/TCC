import { useState, useEffect, cloneElement } from "react";
import { Loader2, ChevronLeft, ChevronRight, Coffee, Cookie, Banana, CookingPot, Apple, Soup, GlassWater, Calendar as CalendarIcon, X, Info, Clock } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Cardapio } from "../types";

// CONFIGURAÇÃO RESTAURADA COM AS CHAVES ORIGINAIS
const REFEICOES_CONFIG = [
  { key: "cafe-da-manha", label: "Café da Manhã", icon: <Coffee size={18} /> },
  { key: "lanche-manha", label: "Lanche da Manhã", icon: <Banana size={18} /> },
  { key: "almoco", label: "Almoço", icon: <CookingPot size={18} /> },
  { key: "lanche-tarde", label: "Lanche da Tarde", icon: <Cookie size={18} /> },
  { key: "jantar", label: "Jantar", icon: <Soup size={18} /> },
  { key: "ceia", label: "Ceia", icon: <GlassWater size={18} /> },
];

export const CardapioContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todoCardapio, setTodoCardapio] = useState<Cardapio[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // ESTADO PARA O MODAL DE DETALHES
  const [registroSelecionado, setRegistroSelecionado] = useState<Cardapio | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('registro_alimentar')
        .select('*')
        .eq('id_residente', idResidente);

      setTodoCardapio(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  // --- LÓGICA DE DATAS ---
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      dates.push(current);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);

  const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
  const formatTime = (time: string) => time.substring(0, 5);

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const goToToday = () => setCurrentWeek(new Date());

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-600 w-8 h-8" /></div>;

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-4 relative">

      {/* Controles de navegação */}
      <div className="sticky top-0 z-10 bg-odara-white py-2 flex flex-col justify-between items-center mb-4 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-max">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={goToToday}
              className="bg-odara-accent hover:bg-odara-secondary text-white rounded-lg hover:bg-odara-secondary transition text-xs sm:text-sm sm:text-sm shadow-sm px-3 py-2 whitespace-nowrap w-full sm:w-auto"
            >
              Ir para Hoje
            </button>
          </div>

          <div className="flex items-center gap-2 border border-odara-primary rounded-lg focus:outline-none focus:border-none focus:ring-2 focus:ring-odara-secondary shadow-sm w-full sm:w-auto">
            <button onClick={() => navigateWeek("prev")} className="p-1 sm:p-2 rounded-full transition">
              <ChevronLeft size={20} className="sm:w-6 sm:h-6 text-odara-primary hover:text-odara-secondary" />
            </button>

            <span className="text-odara-dark text-xs sm:text-sm sm:text-sm min-w-[100px] text-center px-1 sm:px-2">
              {weekDates[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {weekDates[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>

            <button onClick={() => navigateWeek("next")} className="p-1 sm:p-2 rounded-full transition">
              <ChevronRight size={20} className="sm:w-6 sm:h-6 text-odara-primary hover:text-odara-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-max">

          {/* Cabeçalho Dias */}
          <div className="grid grid-cols-8 gap-1 sm:gap-2 mb-2">
            <div className="min-w-max"></div>

            {weekDates.map((date, index) => {
              const isToday = formatDateKey(date) === formatDateKey(new Date());

              return (
                <div
                  key={index}
                  className={`text-center shadow-sm border rounded-lg sm:rounded-xl p-2 sm:p-3
                    ${isToday
                      ? "bg-odara-accent text-white border-odara-accent shadow-md"
                      : "bg-transparent border border-odara-primary text-odara-primary"
                    }`
                  }
                >
                  <div className="font-semibold text-xs sm:text-sm sm:text-sm capitalize truncate">
                    {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </div>
                  <div className="text-sm sm:text-lg font-bold">{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                </div>
              );
            })}
          </div>

          {/* Linhas Refeições */}
          {REFEICOES_CONFIG.map(ref => (
            <div key={ref.key} className="grid grid-cols-8 gap-2 mb-3">
              {/* Célula do tipo de refeição */}
              <div className="w-full flex items-center justify-center bg-transparent border border-odara-primary rounded-lg sm:rounded-xl p-2 sm:p-4 text-odara-primary shadow-sm">
                <div className="flex flex-col justify-center items-center gap-1 sm:gap-2 text-center">
                  {/* Icone */}
                  <div className="sm:w-6 sm:h-6">{ref.icon}</div>

                  {/* Nome da Refeição */}
                  <div className="text-xs sm:text-sm sm:text-sm font-semibold truncate">{ref.label}</div>
                </div>
              </div>

              {/* Células dos dias */}
              {weekDates.map((date, i) => {
                const dateKey = formatDateKey(date);

                const registros = todoCardapio.filter(r =>
                  r.data === dateKey &&
                  r.refeicao === ref.key
                ) || [];

                return (
                  <div
                    key={i}
                    className="flex items-center justify-center bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-200 min-h-max hover:bg-gray-100 transition-colors"
                  >
                    <div className="space-y-1 sm:space-y-2 w-full">
                      {registros.length > 0 ? (
                        registros.map(registro => (
                          <div
                            key={registro.id}
                            onClick={() => setRegistroSelecionado(registro)} // AÇÃO DE CLIQUE AQUI
                            className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-300 hover:shadow-md hover:border-odara-accent/40 transition cursor-pointer group"
                          >
                            <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                              <span className="flex items-center text-xs sm:text-sm font-medium text-odara-accent bg-odara-accent/10 px-1 sm:px-1.5 py-0.5 rounded gap-1">
                                <Clock size={10} className="sm:w-3 sm:h-3" />

                                {formatTime(registro.horario)}
                              </span>

                              {registro.observacao && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="Possui observação"></div>}
                            </div>

                            <p className="flex flex-wrap text-xs sm:text-sm text-odara-dark line-clamp-3 font-medium max-w-30 sm:max-w-50">{registro.alimento}</p>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-odara-accent rounded shadow-sm"></div>
            <span className="font-medium">Hoje</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-odara-accent/20 rounded shadow-sm"></div>
            <span className="font-medium">Refeição Realizada</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full shadow-sm"></div>
            <span className="font-medium">Possui Observação</span>
          </div>
        </div>
      </div>

      {/* --- MODAL DE DETALHES DO REGISTRO --- */}
      {registroSelecionado && (
        <div className="fixed inset-0 bg-odara-offwhite/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col border-l-4 border-odara-primary">
            {/* Header do Modal */}
            <div className="border-b-1 border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
              <div className="flex justify-between items-center">
                <span className="flex gap-2 items-baseline">
                  <span className="text-odara-accent">
                    {REFEICOES_CONFIG.find(ref => ref.key === registroSelecionado.refeicao)?.icon &&
                      cloneElement(
                        REFEICOES_CONFIG.find(ref => ref.key === registroSelecionado.refeicao)!.icon,
                        { className: "size-[1.3em]" }
                      )}
                  </span>
                  <h2 className="text-2xl font-bold">
                    {REFEICOES_CONFIG.find(ref => ref.key === registroSelecionado.refeicao)?.label}
                  </h2>
                </span>

                <button
                  onClick={() => setRegistroSelecionado(null)}
                  className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-6">
              {/* Data e Hora */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full">
                  <CalendarIcon size={18} className="text-odara-primary" />

                  <span className="font-medium text-sm">{new Date(registroSelecionado.data).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full">
                  <Apple size={18} className="text-odara-primary" />
                  <span className="font-medium text-sm">{registroSelecionado.horario.slice(0, 5)}</span>
                </div>
              </div>

              {/* Alimento */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-odara-primary tracking-wider mb-1 block">O que foi servido</label>
                <p className="text-md text-odara-dark font-medium leading-relaxed">
                  {registroSelecionado.alimento}
                </p>
              </div>

              {/* Observação */}
              {registroSelecionado.observacao ? (
                <div className="bg-odara-dropdown p-4 rounded-xl border border-odara-dropdown-accent">
                  <div className="flex items-center gap-2 text-odara-dropdown-accent font-bold text-sm mb-2">
                    <Info size={18} /> Observação
                  </div>
                  <p className="text-sm text-odara-dark leading-relaxed">
                    {registroSelecionado.observacao}
                  </p>
                </div>
              ) : (
                <div className="text-center py-2 border-t border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-400 italic">Sem observações adicionais.</p>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex justify-end gap-3 p-4">
              <button
                onClick={() => setRegistroSelecionado(null)}
                className="px-6 py-2 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 text-sm sm:text-base"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};