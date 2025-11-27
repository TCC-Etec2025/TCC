import { useState, useEffect, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import type { BaseContentProps, Ocorrencia } from "../types";

export const OcorrenciasContent = ({ idResidente }: BaseContentProps) => {
  const [loading, setLoading] = useState(true);
  const [todasOcorrencias, setTodasOcorrencias] = useState<Ocorrencia[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      // Mapeando campos para garantir compatibilidade com o type
      const { data } = await supabase.from('ocorrencia')
        .select('*')
        .eq('id_residente', idResidente)
        .order('data', { ascending: false }); // Note: o banco usa 'data' ou 'data_ocorrencia'? Ajuste conforme seu SQL real
        
      setTodasOcorrencias(data || []);
      setLoading(false);
    };
    fetchAll();
  }, [idResidente]);

  const listaFiltrada = useMemo(() => {
    if (!busca) return todasOcorrencias;
    const lower = busca.toLowerCase();
    return todasOcorrencias.filter(o => 
       o.titulo?.toLowerCase().includes(lower) || 
       o.descricao?.toLowerCase().includes(lower)
    );
  }, [todasOcorrencias, busca]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-red-600"/></div>;

  return (
    <div>
      <div className="relative mb-6">
         <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
         <input 
            type="text"
            placeholder="Buscar ocorrência..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100"
         />
      </div>

      <div className="space-y-4">
         {listaFiltrada.map((o) => (
            <div key={o.id} className="bg-white border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm border-t border-r border-b">
               <div className="flex justify-between items-start">
                   <h4 className="font-bold text-gray-800">{o.titulo}</h4>
                   <span className="text-xs text-gray-500 font-medium">
                       {new Date(o.data || o.data_ocorrencia).toLocaleDateString()}
                   </span>
               </div>
               <p className="text-gray-600 text-sm mt-2 leading-relaxed">{o.descricao}</p>
               {o.providencias && (
                   <div className="mt-3 bg-red-50 p-2 rounded text-xs text-red-800">
                       <span className="font-bold">Providências:</span> {o.providencias}
                   </div>
               )}
            </div>
         ))}
         {listaFiltrada.length === 0 && <p className="text-center text-gray-400 py-4">Nenhuma ocorrência encontrada.</p>}
      </div>
    </div>
  );
};