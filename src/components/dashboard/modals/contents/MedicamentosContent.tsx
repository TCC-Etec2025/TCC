import { useState, useEffect, useMemo } from "react";
import { Loader2, Pill } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Medicamento } from "../types";

export const MedicamentosContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todosMedicamentos, setTodosMedicamentos] = useState<Medicamento[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo');

  // 1. Fetch ALL once
  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.from('medicamento').select('*').eq('id_residente', idResidente);
      setTodosMedicamentos(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  // 2. Filter Local
  const listaFiltrada = useMemo(() => {
    if (filtroStatus === 'todos') return todosMedicamentos;
    return todosMedicamentos.filter(m => m.status === filtroStatus);
  }, [todosMedicamentos, filtroStatus]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div>
      {/* Barra de Filtro */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg border border-gray-100 w-fit">
        {(['ativo', 'inativo', 'todos'] as const).map(st => (
          <button
            key={st}
            onClick={() => setFiltroStatus(st)}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
              filtroStatus === st ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {listaFiltrada.map(m => (
          <div key={m.id} className={`p-4 rounded-xl border flex justify-between items-start ${m.status === 'ativo' ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
             <div className="flex gap-3">
                <div className={`p-2 rounded-lg h-fit ${m.status === 'ativo' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Pill size={20}/>
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">{m.nome}</h4>
                    <p className="text-sm text-gray-600 mt-1">{m.dosagem} • {m.recorrencia}</p>
                </div>
             </div>
             <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${m.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {m.status}
             </span>
          </div>
        ))}
        {listaFiltrada.length === 0 && <p className="text-center text-gray-400 py-4">Nenhum medicamento encontrado.</p>}
      </div>
    </div>
  );
};