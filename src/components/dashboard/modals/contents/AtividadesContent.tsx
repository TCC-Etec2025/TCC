import { useState, useEffect, useMemo } from "react";
import { Loader2, Activity } from "lucide-react";
import Calendar from 'react-calendar';
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Atividade } from "../types";

export const AtividadesContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todasAtividades, setTodasAtividades] = useState<Atividade[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());

  // 1. Fetch TUDO (Histórico Completo)
  useEffect(() => {
    const fetchAll = async () => {
      // Nota: Buscando tudo sem filtro de data no .eq()
      const { data } = await supabase
        .from('atividade_residente')
        .select('id, status, atividade!inner(*)')
        .eq('id_residente', idResidente);
      
      setTodasAtividades(data as unknown as Atividade[] || []);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  // 2. Filtro Local por Data
  const atividadesDoDia = useMemo(() => {
    const dataString = dataSelecionada.toISOString().split('T')[0];
    return todasAtividades
        .filter(a => a.atividade.data === dataString)
        .sort((a, b) => a.atividade.horario_inicio.localeCompare(b.atividade.horario_inicio));
  }, [todasAtividades, dataSelecionada]);

  // (Opcional) Função para marcar dias com bolinha no calendário
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
        const dataStr = date.toISOString().split('T')[0];
        const temAtividade = todasAtividades.some(a => a.atividade.data === dataStr);
        return temAtividade ? <div className="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-1"></div> : null;
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-600"/></div>;

  return (
    <div>
      <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 mb-6">
         <Calendar 
            onChange={(val) => setDataSelecionada(val as Date)} 
            value={dataSelecionada} 
            className="w-full border-0 bg-transparent"
            tileContent={tileContent} // Mostra bolinhas nos dias que tem atividade
         />
      </div>

      <div className="space-y-3">
         <h4 className="text-sm font-bold text-gray-500 border-b pb-2 mb-4">
            {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
         </h4>
         
         {atividadesDoDia.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2 bg-green-100 text-green-700 rounded-full">
                    <Activity size={20}/>
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">{item.atividade.nome}</h4>
                    <p className="text-sm text-gray-500">{item.atividade.horario_inicio.slice(0,5)} • {item.atividade.local}</p>
                </div>
            </div>
         ))}
         {atividadesDoDia.length === 0 && <p className="text-center text-gray-400 py-4">Dia livre.</p>}
      </div>
    </div>
  );
};