import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  User, Pill, Activity, Utensils, AlertCircle, Briefcase, 
  Heart, Clock, Search, ChevronDown, ChevronUp, Loader2, 
  ArrowLeft, FileText, Thermometer, ClipboardList
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// --- TYPES (Baseado no retorno da RPC get_dados_completos_residente) ---
type ResidenteCompleto = {
  residente: {
    id: number;
    nome: string;
    data_nascimento: string;
    foto: string | null;
    quarto: string | null;
    status: boolean;
    dependencia: string | null;
    plano_saude: string | null;
    numero_carteirinha: string | null;
    observacoes: string | null;
  };
  medicamentos: Array<{ id: number; nome: string; dosagem: string; recorrencia: string; status: string }>;
  administracoes: any[];
  atividades: Array<{ nome: string; data: string; horario_inicio: string; local: string; status: string }>;
  cardapio: Array<{ refeicao: string; alimento: string; data: string; }>;
  consultas: Array<{ id: number; motivo_consulta: string; medico: string; data_consulta: string; horario: string }>;
  exames: Array<{ id: number; tipo: string; data_prevista: string; status: string }>;
  ocorrencias: Array<{ id: number; titulo: string; descricao: string; data: string; horario: string; providencias: string }>;
  comportamentos: any[];
  pertences: Array<{ id: number; nome: string; estado: string }>;
  preferencias: Array<{ id: number; tipo_preferencia: string; titulo: string }>;
};

// --- UTILITÁRIOS ---
const calcularIdade = (dataNascimento: string) => {
  if (!dataNascimento) return "N/A";
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
};

export const ResidenteProntuario = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Recupera o ID passado via state da navegação anterior
  const idResidente = location.state?.id;

  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<ResidenteCompleto | null>(null);
  
  // --- ESTADOS DE FILTRO LOCAL ---
  const [filtroOcorrencia, setFiltroOcorrencia] = useState("");
  const [filtroConsulta, setFiltroConsulta] = useState<'todas'|'futuras'>('futuras');
  
  // --- CONTROLE DE SEÇÕES (Acordeão) ---
  const [secoes, setSecoes] = useState({
    saude: true,
    rotina: true,
    historico: false,
    pessoal: false
  });

  const toggle = (sec: keyof typeof secoes) => setSecoes(p => ({...p, [sec]: !p[sec]}));

  // --- FETCH DADOS ---
  useEffect(() => {
    if (!idResidente) {
        setLoading(false);
        return;
    }

    const fetchDados = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_dados_completos_residente', { 
            p_id_residente: Number(idResidente) 
        });
        
        if (error) throw error;
        setDados(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [idResidente]);

  // --- LÓGICA DE FILTRAGEM (Client-Side) ---
  const ocorrenciasFiltradas = useMemo(() => {
    if (!dados) return [];
    return dados.ocorrencias.filter(o => 
      o.titulo?.toLowerCase().includes(filtroOcorrencia.toLowerCase()) ||
      o.descricao?.toLowerCase().includes(filtroOcorrencia.toLowerCase())
    );
  }, [dados, filtroOcorrencia]);

  const consultasFiltradas = useMemo(() => {
    if (!dados) return [];
    const hoje = new Date().toISOString().split('T')[0];
    if (filtroConsulta === 'futuras') {
        return dados.consultas.filter(c => c.data_consulta >= hoje);
    }
    return dados.consultas;
  }, [dados, filtroConsulta]);


  // --- RENDERIZAÇÃO ---
  
  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10"/>
        </div>
    );
  }

  // Caso não tenha ID no state (ex: usuário deu refresh na página)
  if (!idResidente || !dados) {
    return (
        <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-4">
            <User size={48} className="text-gray-300 mb-4"/>
            <h2 className="text-xl font-bold text-gray-700">Nenhum residente selecionado</h2>
            <p className="text-gray-500 mb-6">Por favor, selecione um residente na lista anterior.</p>
            <button 
                onClick={() => navigate(-1)} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
                Voltar para Lista
            </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 animate-in fade-in duration-300">
      
      {/* === HEADER FIXO === */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition group">
                <ArrowLeft size={24} className="group-hover:text-blue-600"/>
             </button>
             
             <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-md">
                   {dados.residente.foto ? <img src={dados.residente.foto} className="w-full h-full object-cover"/> : <User className="w-full h-full p-3 text-gray-400"/>}
                </div>
                <div>
                   <h1 className="text-2xl font-bold text-gray-800 leading-tight">{dados.residente.nome}</h1>
                   <p className="text-sm text-gray-500">
                      {calcularIdade(dados.residente.data_nascimento)} anos • Quarto {dados.residente.quarto}
                   </p>
                </div>
             </div>

             <div className={`px-3 py-1 rounded-full text-xs font-bold border ${dados.residente.status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {dados.residente.status ? 'ATIVO' : 'INATIVO'}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* === 1. SAÚDE & CUIDADOS === */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('saude')} className="p-5 bg-blue-50/50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition">
              <div className="flex items-center gap-3 text-blue-900 font-bold text-lg">
                 <Heart className="text-blue-600" size={22}/> Saúde e Cuidados
              </div>
              {secoes.saude ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
           </div>
           
           {secoes.saude && (
             <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Medicamentos */}
                <div className="lg:col-span-1">
                   <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b pb-2"><Pill size={16}/> Medicamentos Ativos</h3>
                   <div className="space-y-3">
                      {dados.medicamentos.map(med => (
                         <div key={med.id} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm hover:border-blue-200 transition">
                            <div className="flex justify-between items-start">
                               <p className="font-bold text-gray-800">{med.nome}</p>
                               <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">ATIVO</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{med.dosagem} • {med.recorrencia}</p>
                         </div>
                      ))}
                      {dados.medicamentos.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum medicamento ativo.</p>}
                   </div>
                </div>

                {/* Consultas */}
                <div className="lg:col-span-1">
                   <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wide"><Briefcase size={16}/> Consultas</h3>
                      <div className="flex bg-gray-100 rounded p-0.5">
                         <button onClick={() => setFiltroConsulta('futuras')} className={`px-2 py-0.5 text-[10px] rounded transition ${filtroConsulta === 'futuras' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}>Futuras</button>
                         <button onClick={() => setFiltroConsulta('todas')} className={`px-2 py-0.5 text-[10px] rounded transition ${filtroConsulta === 'todas' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}>Todas</button>
                      </div>
                   </div>
                   <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {consultasFiltradas.map(con => (
                         <div key={con.id} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="text-center min-w-[40px] leading-none bg-white p-1 rounded border border-gray-200">
                               <span className="block text-xl font-bold text-blue-600">{new Date(con.data_consulta).getDate()}</span>
                               <span className="block text-[9px] uppercase text-gray-400 font-bold">{new Date(con.data_consulta).toLocaleString('pt-BR',{month:'short'})}</span>
                            </div>
                            <div className="overflow-hidden">
                               <p className="font-bold text-gray-800 text-sm truncate">{con.motivo_consulta || "Consulta"}</p>
                               <p className="text-xs text-gray-500 truncate">Dr(a). {con.medico}</p>
                               <p className="text-[10px] text-blue-500 font-bold mt-0.5">{con.horario.slice(0,5)}</p>
                            </div>
                         </div>
                      ))}
                      {consultasFiltradas.length === 0 && <p className="text-sm text-gray-400 italic">Nenhuma consulta.</p>}
                   </div>
                </div>

                {/* Exames */}
                <div className="lg:col-span-1">
                   <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b pb-2"><Thermometer size={16}/> Exames Recentes</h3>
                   <div className="space-y-3">
                      {dados.exames.map(exa => (
                         <div key={exa.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium text-gray-700">{exa.tipo}</span>
                            <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border">{new Date(exa.data_prevista).toLocaleDateString()}</span>
                         </div>
                      ))}
                      {dados.exames.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum exame recente.</p>}
                   </div>
                </div>

             </div>
           )}
        </section>

        {/* === 2. ROTINA & ALIMENTAÇÃO === */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('rotina')} className="p-5 bg-green-50/50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-green-50 transition">
              <div className="flex items-center gap-3 text-green-900 font-bold text-lg">
                 <Clock className="text-green-600" size={22}/> Rotina Recente
              </div>
              {secoes.rotina ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
           </div>

           {secoes.rotina && (
             <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Atividades Recentes */}
                <div>
                   <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b pb-2"><Activity size={16}/> Últimas Atividades</h3>
                   <div className="space-y-3">
                      {dados.atividades.slice(0, 5).map((atv, i) => (
                         <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition border-b border-gray-50 last:border-0">
                            <div className="flex flex-col items-center justify-center bg-green-100 text-green-700 w-10 h-10 rounded-lg">
                               <Activity size={18}/>
                            </div>
                            <div>
                               <p className="font-bold text-gray-800 text-sm">{atv.nome}</p>
                               <p className="text-xs text-gray-500">
                                  {new Date(atv.data).toLocaleDateString()} • {atv.local} • {atv.horario_inicio.slice(0,5)}
                               </p>
                            </div>
                         </div>
                      ))}
                      {dados.atividades.length === 0 && <p className="text-sm text-gray-400 italic">Sem atividades recentes.</p>}
                   </div>
                </div>

                {/* Cardápio Recente */}
                <div>
                   <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b pb-2"><Utensils size={16}/> Alimentação Recente</h3>
                   <div className="space-y-3">
                      {dados.cardapio.slice(0, 5).map((item, i) => (
                         <div key={i} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex gap-3 items-center">
                            <div className="bg-white p-1.5 rounded text-orange-500">
                               <Utensils size={16}/>
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between mb-0.5">
                                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">{item.refeicao}</span>
                                  <span className="text-[10px] text-gray-400">{new Date(item.data).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm font-medium text-gray-800 leading-tight">{item.alimento}</p>
                            </div>
                         </div>
                      ))}
                      {dados.cardapio.length === 0 && <p className="text-sm text-gray-400 italic">Sem registros recentes.</p>}
                   </div>
                </div>
             </div>
           )}
        </section>

        {/* === 3. HISTÓRICO & OCORRÊNCIAS === */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('historico')} className="p-5 bg-red-50/50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-red-50 transition">
              <div className="flex items-center gap-3 text-red-900 font-bold text-lg">
                 <AlertCircle className="text-red-600" size={22}/> Histórico e Ocorrências
              </div>
              {secoes.historico ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
           </div>

           {secoes.historico && (
             <div className="p-6">
                <div className="mb-6 relative">
                   <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                   <input 
                      type="text"
                      placeholder="Buscar por título ou descrição..."
                      value={filtroOcorrencia}
                      onChange={(e) => setFiltroOcorrencia(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 bg-gray-50 text-sm transition-all"
                   />
                </div>

                <div className="space-y-4">
                   {ocorrenciasFiltradas.map(oc => (
                      <div key={oc.id} className="border border-gray-200 rounded-xl p-4 hover:border-red-200 transition bg-white shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                               <div className="p-1.5 bg-red-100 text-red-600 rounded-full">
                                  <AlertCircle size={16}/>
                               </div>
                               <h4 className="font-bold text-gray-800">{oc.titulo}</h4>
                            </div>
                            <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                               {new Date(oc.data).toLocaleDateString()} • {oc.horario.slice(0,5)}
                            </span>
                         </div>
                         <p className="text-sm text-gray-600 leading-relaxed mb-3 pl-8">{oc.descricao}</p>
                         {oc.providencias && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs ml-8">
                               <span className="font-bold text-red-800 block mb-1 uppercase tracking-wide">Providências:</span>
                               <span className="text-red-700">{oc.providencias}</span>
                            </div>
                         )}
                      </div>
                   ))}
                   {ocorrenciasFiltradas.length === 0 && <p className="text-center text-gray-400 py-4 italic">Nenhuma ocorrência encontrada.</p>}
                </div>
             </div>
           )}
        </section>

        {/* === 4. INFORMAÇÕES PESSOAIS === */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('pessoal')} className="p-5 bg-purple-50/50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-purple-50 transition">
              <div className="flex items-center gap-3 text-purple-900 font-bold text-lg">
                 <FileText className="text-purple-600" size={22}/> Informações Pessoais
              </div>
              {secoes.pessoal ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
           </div>

           {secoes.pessoal && (
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pertences */}
                <div>
                   <h4 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2"><ClipboardList size={16}/> Pertences</h4>
                   <ul className="space-y-2">
                      {dados.pertences.map(p => (
                         <li key={p.id} className="text-sm flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                            <span className="text-gray-800 font-medium">{p.nome}</span>
                            <span className="text-xs text-gray-500 italic px-2 py-0.5 bg-white rounded border">{p.estado}</span>
                         </li>
                      ))}
                      {dados.pertences.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum pertence cadastrado.</p>}
                   </ul>
                </div>
                
                {/* Preferências */}
                <div>
                   <h4 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2"><Heart size={16}/> Preferências</h4>
                   <div className="flex flex-wrap gap-2">
                      {dados.preferencias.map(pref => (
                         <span key={pref.id} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100 flex items-center gap-1">
                            <span className="opacity-50 uppercase text-[9px]">{pref.tipo_preferencia}:</span> {pref.titulo}
                         </span>
                      ))}
                      {dados.preferencias.length === 0 && <p className="text-sm text-gray-400 italic">Nenhuma preferência cadastrada.</p>}
                   </div>
                </div>
             </div>
           )}
        </section>

      </div>
    </div>
  );
};