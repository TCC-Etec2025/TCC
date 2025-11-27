import { useState, useEffect, useMemo } from "react";
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Coffee, 
  Sun, 
  Utensils, 
  Moon, 
  GlassWater,
  Calendar as CalendarIcon,
  X,
  Info
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Cardapio } from "../types";

// CONFIGURAÇÃO RESTAURADA COM AS CHAVES ORIGINAIS
const REFEICOES_CONFIG = [
  { key: "cafe-da-manha", label: "Café da manhã", icon: <Coffee size={20} className="text-orange-600" /> },
  { key: "lanche-manha", label: "Lanche manhã", icon: <Utensils size={18} className="text-orange-500" /> },
  { key: "almoco", label: "Almoço", icon: <Sun size={20} className="text-orange-600" /> },
  { key: "lanche-tarde", label: "Lanche tarde", icon: <Utensils size={18} className="text-orange-500" /> },
  { key: "jantar", label: "Jantar", icon: <Moon size={20} className="text-orange-600" /> },
  { key: "ceia", label: "Ceia", icon: <GlassWater size={20} className="text-orange-500" /> },
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
  const weekDates = useMemo(() => {
    const dates = [];
    const curr = new Date(currentWeek);
    const first = curr.getDate() - curr.getDay(); // Pega o Domingo
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      dates.push(new Date(day));
    }
    // Reset para evitar mutação errada
    curr.setDate(first);
    return dates;
  }, [currentWeek]);

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const goToToday = () => setCurrentWeek(new Date());

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-600 w-8 h-8"/></div>;

  return (
    <div className="bg-white rounded-2xl p-2 sm:p-4 relative">
      
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white py-2 flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 mb-4 sm:mb-0 text-orange-800">
            <CalendarIcon className="w-5 h-5"/>
            <span className="font-bold text-lg">Diário Alimentar</span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={goToToday} className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition text-sm shadow-sm font-medium">
            Hoje
          </button>
          
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 shadow-inner border border-gray-200">
            <button onClick={() => navigateWeek("prev")} className="p-2 rounded-full hover:bg-gray-200 transition text-gray-600"><ChevronLeft size={16} /></button>
            <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
              {weekDates[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {weekDates[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
            <button onClick={() => navigateWeek("next")} className="p-2 rounded-full hover:bg-gray-200 transition text-gray-600"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[900px]">
          
          {/* Cabeçalho Dias */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="w-28"></div>
            {weekDates.map((date, index) => {
              const isToday = formatDateKey(date) === formatDateKey(new Date());
              return (
                <div key={index} className={`text-center p-3 rounded-xl shadow-sm border transition-all ${isToday ? "bg-orange-500 text-white border-orange-500 shadow-md transform scale-105" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  <div className="font-semibold text-xs uppercase opacity-90">{date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0,3)}</div>
                  <div className="text-xl font-bold">{date.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Linhas Refeições */}
          {REFEICOES_CONFIG.map(ref => (
            <div key={ref.key} className="grid grid-cols-8 gap-2 mb-3">
              
              {/* Coluna Nome Refeição */}
              <div className="w-28 flex items-center justify-center bg-orange-50 rounded-xl p-3 border border-orange-100">
                <div className="text-center">
                  <div className="mb-2 flex justify-center bg-white p-2 rounded-full shadow-sm w-fit mx-auto">{ref.icon}</div>
                  <div className="text-xs font-bold text-gray-700 leading-tight">{ref.label}</div>
                </div>
              </div>

              {/* Células */}
              {weekDates.map((date, i) => {
                const dateKey = formatDateKey(date);
                
                const registros = todoCardapio.filter(r => 
                    r.data === dateKey && 
                    r.refeicao === ref.key 
                );

                return (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 min-h-[100px] p-1.5 hover:bg-gray-50 transition-colors flex flex-col gap-2">
                    {registros.length > 0 ? (
                        registros.map(registro => (
                          <div 
                            key={registro.id} 
                            onClick={() => setRegistroSelecionado(registro)} // AÇÃO DE CLIQUE AQUI
                            className="bg-orange-50/50 rounded-lg p-2 border border-orange-100 relative group cursor-pointer hover:bg-orange-100 hover:border-orange-300 transition-all"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-orange-600 bg-white px-1.5 py-0.5 rounded shadow-sm">{registro.horario.slice(0,5)}</span>
                              {registro.observacao && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="Possui observação"></div>}
                            </div>
                            <p className="text-xs text-gray-700 font-medium line-clamp-3 leading-snug">{registro.alimento}</p>
                          </div>
                        ))
                    ) : (
                        <div className="h-full flex items-center justify-center"><div className="w-1 h-1 bg-gray-200 rounded-full"></div></div>
                    )}
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
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded shadow-sm"></div><span className="font-medium">Hoje</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-50 border border-orange-100 rounded shadow-sm"></div><span className="font-medium">Refeição Realizada</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"></div><span className="font-medium">Possui Observação</span></div>
        </div>
      </div>

      {/* --- MODAL DE DETALHES DO REGISTRO --- */}
      {registroSelecionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header do Modal */}
            <div className="bg-orange-50 p-6 border-b border-orange-100 flex justify-between items-start">
              <div>
                <span className="inline-block px-3 py-1 bg-white text-orange-600 text-xs font-bold rounded-full mb-2 uppercase tracking-wide border border-orange-100">
                  {registroSelecionado.refeicao.replace('-', ' ')}
                </span>
                <h3 className="text-xl font-bold text-gray-800">Detalhes da Refeição</h3>
              </div>
              <button 
                onClick={() => setRegistroSelecionado(null)}
                className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-6">
              
              {/* Data e Hora */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full">
                  <CalendarIcon size={18} className="text-orange-500"/>
                  <span className="font-medium text-sm">{new Date(registroSelecionado.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full">
                  <Utensils size={18} className="text-orange-500"/>
                  <span className="font-medium text-sm">{registroSelecionado.horario.slice(0,5)}</span>
                </div>
              </div>

              {/* Alimento */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">O que foi servido</label>
                <p className="text-lg text-gray-800 font-medium leading-relaxed">
                  {registroSelecionado.alimento}
                </p>
              </div>

              {/* Observação */}
              {registroSelecionado.observacao ? (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
                    <Info size={16}/> Observação
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {registroSelecionado.observacao}
                  </p>
                </div>
              ) : (
                <div className="text-center py-2 border-t border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 italic">Sem observações adicionais.</p>
                </div>
              )}

            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setRegistroSelecionado(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
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