import { useState, useEffect, useMemo } from "react";
import { Loader2, Clock, Calendar as CalendarIcon } from "lucide-react";
import Calendar from 'react-calendar';
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Consulta } from "../types";

export const ExamesContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todasConsultas, setTodasConsultas] = useState<Consulta[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());

  // 1. Busca TODAS as consultas (para poder marcar os pontinhos no calendário)
  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('consulta')
        .select('*')
        .eq('id_residente', idResidente)
        .order('data_consulta', { ascending: false }); // Ordenação inicial
      
      setTodasConsultas(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  // 2. Filtra as consultas apenas do dia clicado no calendário
  const consultasDoDia = useMemo(() => {
    const dataString = dataSelecionada.toISOString().split('T')[0];
    
    return todasConsultas
        .filter(c => c.data_consulta === dataString)
        .sort((a, b) => a.horario.localeCompare(b.horario));
  }, [todasConsultas, dataSelecionada]);

  // 3. Renderiza a "bolinha" índigo nos dias que têm consulta
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
        const dataStr = date.toISOString().split('T')[0];
        const temConsulta = todasConsultas.some(c => c.data_consulta === dataStr);
        // Usa a cor indigo/azul para diferenciar do cardápio (laranja)
        return temConsulta ? <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mx-auto mt-1"></div> : null;
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div>
      {/* Área do Calendário (Estilo Índigo) */}
      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6">
         <div className="flex items-center gap-2 mb-3 text-indigo-800">
            <CalendarIcon size={18} />
            <span className="text-sm font-bold">Agenda Médica</span>
         </div>
         <Calendar 
            onChange={(val) => setDataSelecionada(val as Date)} 
            value={dataSelecionada} 
            className="w-full border-0 bg-transparent"
            tileContent={tileContent}
         />
      </div>

      {/* Lista de Consultas do Dia */}
      <div className="space-y-3">
         <h4 className="text-sm font-bold text-gray-500 border-b pb-2 mb-4">
            Consultas de {dataSelecionada.toLocaleDateString()}
         </h4>

         {consultasDoDia.map((c) => (
           <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 hover:border-indigo-200 transition">
               {/* Data/Hora destaque */}
               <div className="flex flex-col items-center justify-center bg-indigo-50 text-indigo-700 p-3 rounded-lg min-w-[60px] h-fit">
                   <Clock size={20} className="mb-1" />
                   <span className="text-xs font-bold">{c.horario.slice(0,5)}</span>
               </div>
               
               {/* Detalhes */}
               <div>
                   <h4 className="font-bold text-gray-800">{c.motivo_consulta || "Consulta Médica"}</h4>
                   <p className="text-sm text-gray-600">Dr(a). {c.medico}</p>
                   
                   {/* Mostra status ou observação se houver (opcional) */}
                   <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600 font-medium">
                       {new Date(c.data_consulta).toLocaleDateString()}
                   </div>
               </div>
           </div>
        ))}

        {consultasDoDia.length === 0 && (
            <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Nenhuma consulta agendada para este dia.</p>
                <p className="text-xs text-indigo-400 mt-2">Procure pelos pontos azuis no calendário.</p>
            </div>
        )}
      </div>
    </div>
  );
};