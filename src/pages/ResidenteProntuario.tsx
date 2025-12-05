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
        <div className="flex min-h-screen items-center justify-center bg-odara-offwhite">
            <Loader2 className="animate-spin text-odara-primary w-10 h-10"/>
        </div>
    );
  }

  // Caso não tenha ID no state (ex: usuário deou refresh na página)
  if (!idResidente || !dados) {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-odara-offwhite p-4">
            <User size={48} className="text-odara-primary mb-4"/>
            <h2 className="text-xl font-bold text-odara-dark">Nenhum residente selecionado</h2>
            <p className="text-odara-name mb-6">Por favor, selecione um residente na lista anterior.</p>
            <button 
                onClick={() => navigate(-1)} 
                className="bg-odara-accent hover:bg-odara-secondary text-white px-6 py-2 rounded-lg transition font-semibold"
            >
                Voltar para Lista
            </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-odara-offwhite pb-12 animate-in fade-in duration-300">
      
      {/* === HEADER FIXO === */}
      <div className="bg-white border-b border-odara-primary sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
             <button onClick={() => navigate(-1)} className="self-start p-2 hover:bg-odara-primary/10 rounded-full text-odara-primary transition group">
                <ArrowLeft size={24} className="group-hover:text-odara-accent"/>
             </button>
             
             <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-odara-primary/20 rounded-full overflow-hidden border-2 border-white shadow-md">
                   {dados.residente.foto ? 
                     <img src={dados.residente.foto} alt={dados.residente.nome} className="w-full h-full object-cover"/> : 
                     <User className="w-full h-full p-3 text-odara-accent"/>
                   }
                </div>
                <div className="min-w-0 flex-1">
                   <h1 className="text-xl sm:text-2xl font-bold text-odara-dark leading-tight truncate">{dados.residente.nome}</h1>
                   <p className="text-sm text-odara-name">
                      {calcularIdade(dados.residente.data_nascimento)} anos • Quarto {dados.residente.quarto}
                   </p>
                </div>
             </div>

             <div className={`px-3 py-1 rounded-full text-xs font-bold border border-odara-primary self-start sm:self-auto ${dados.residente.status ? 'bg-odara-primary/10 text-odara-primary' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {dados.residente.status ? 'ATIVO' : 'INATIVO'}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* === 1. SAÚDE & CUIDADOS === */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('saude')} className="p-4 sm:p-5 border-b border-odara-primary bg-odara-primary/10 text-odara-primary flex justify-between items-center cursor-pointer hover:bg-odara-primary/20 transition">
              <div className="flex items-center gap-3 font-bold text-base sm:text-lg">
                 <Heart size={22}/> Saúde e Cuidados
              </div>
              {secoes.saude ? <ChevronUp className="text-odara-accent"/> : <ChevronDown className="text-odara-accent"/>}
           </div>
           
           {secoes.saude && (
             <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                
                {/* Medicamentos */}
                <div className="lg:col-span-1">
                   <h3 className="font-bold text-odara-dark mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b border-odara-primary pb-2"><Pill size={16} className="text-odara-accent"/> Medicamentos Ativos</h3>
                   <div className="space-y-3">
                      {dados.medicamentos.map(med => (
                         <div key={med.id} className="bg-white border border-odara-primary/20 p-3 rounded-lg shadow-sm hover:border-odara-accent/50 transition">
                            <div className="flex justify-between items-start">
                               <p className="font-bold text-odara-dark truncate">{med.nome}</p>
                               <span className="text-[10px] bg-odara-primary/10 text-odara-primary px-2 py-0.5 rounded font-bold whitespace-nowrap border border-odara-primary">ATIVO</span>
                            </div>
                            <p className="text-xs text-odara-name mt-1 font-medium truncate">{med.dosagem} • {med.recorrencia}</p>
                         </div>
                      ))}
                      {dados.medicamentos.length === 0 && <p className="text-sm text-odara-name/60 italic">Nenhum medicamento ativo.</p>}
                   </div>
                </div>

                {/* Consultas */}
                <div className="lg:col-span-1">
                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-odara-primary pb-2 gap-2">
                      <h3 className="font-bold text-odara-dark flex items-center gap-2 text-sm uppercase tracking-wide"><Briefcase size={16} className="text-odara-accent"/> Consultas</h3>
                      <div className="flex bg-odara-primary/10 rounded p-0.5 self-start border border-odara-primary">
                         <button onClick={() => setFiltroConsulta('futuras')} className={`px-2 py-0.5 text-[10px] rounded transition whitespace-nowrap ${filtroConsulta === 'futuras' ? 'bg-white shadow text-odara-primary font-bold border border-odara-primary' : 'text-odara-primary hover:bg-white/50'}`}>Futuras</button>
                         <button onClick={() => setFiltroConsulta('todas')} className={`px-2 py-0.5 text-[10px] rounded transition whitespace-nowrap ${filtroConsulta === 'todas' ? 'bg-white shadow text-odara-primary font-bold border border-odara-primary' : 'text-odara-primary hover:bg-white/50'}`}>Todas</button>
                      </div>
                   </div>
                   <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {consultasFiltradas.map(con => (
                         <div key={con.id} className="flex gap-3 items-center bg-odara-primary/5 p-3 rounded-lg border border-odara-primary/20 hover:border-odara-accent/50 transition">
                            <div className="text-center min-w-[40px] leading-none bg-white p-1 rounded border border-odara-primary shrink-0">
                               <span className="block text-xl font-bold text-odara-accent">{new Date(con.data_consulta).getDate()}</span>
                               <span className="block text-[9px] uppercase text-odara-primary font-bold">{new Date(con.data_consulta).toLocaleString('pt-BR',{month:'short'})}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="font-bold text-odara-dark text-sm truncate">{con.motivo_consulta || "Consulta"}</p>
                               <p className="text-xs text-odara-name truncate">Dr(a). {con.medico}</p>
                               <p className="text-[10px] text-odara-accent font-bold mt-0.5">{con.horario.slice(0,5)}</p>
                            </div>
                         </div>
                      ))}
                      {consultasFiltradas.length === 0 && <p className="text-sm text-odara-name/60 italic">Nenhuma consulta.</p>}
                   </div>
                </div>

                {/* Exames */}
                <div className="lg:col-span-1">
                   <h3 className="font-bold text-odara-dark mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b border-odara-primary pb-2"><Thermometer size={16} className="text-odara-accent"/> Exames Recentes</h3>
                   <div className="space-y-3">
                      {dados.exames.map(exa => (
                         <div key={exa.id} className="flex justify-between items-center bg-odara-primary/5 p-3 rounded-lg border border-odara-primary/20 hover:border-odara-accent/50 transition">
                            <span className="text-sm font-medium text-odara-dark truncate pr-2">{exa.tipo}</span>
                            <span className="text-xs text-odara-primary font-mono bg-white px-2 py-1 rounded border border-odara-primary shrink-0 whitespace-nowrap">{new Date(exa.data_prevista).toLocaleDateString()}</span>
                         </div>
                      ))}
                      {dados.exames.length === 0 && <p className="text-sm text-odara-name/60 italic">Nenhum exame recente.</p>}
                   </div>
                </div>

             </div>
           )}
        </section>

        {/* === 2. ROTINA & ALIMENTAÇÃO === */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('rotina')} className="p-4 sm:p-5 border-b border-odara-primary bg-odara-primary/10 text-odara-primary flex justify-between items-center cursor-pointer hover:bg-odara-primary/20 transition">
              <div className="flex items-center gap-3 font-bold text-base sm:text-lg">
                 <Clock size={22}/> Rotina Recente
              </div>
              {secoes.rotina ? <ChevronUp className="text-odara-accent"/> : <ChevronDown className="text-odara-accent"/>}
           </div>

           {secoes.rotina && (
             <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Atividades Recentes */}
                <div>
                   <h3 className="font-bold text-odara-dark mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b border-odara-primary pb-2"><Activity size={16} className="text-odara-accent"/> Últimas Atividades</h3>
                   <div className="space-y-3">
                      {dados.atividades.slice(0, 5).map((atv, i) => (
                         <div key={i} className="flex items-center gap-3 p-2 hover:bg-odara-primary/5 rounded transition border-b border-odara-primary/10 last:border-0">
                            <div className="flex flex-col items-center justify-center bg-odara-primary/20 text-odara-accent w-10 h-10 rounded-lg shrink-0">
                               <Activity size={18}/>
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="font-bold text-odara-dark text-sm truncate">{atv.nome}</p>
                               <p className="text-xs text-odara-name truncate">
                                  {new Date(atv.data).toLocaleDateString()} • {atv.local} • {atv.horario_inicio.slice(0,5)}
                               </p>
                            </div>
                         </div>
                      ))}
                      {dados.atividades.length === 0 && <p className="text-sm text-odara-name/60 italic">Sem atividades recentes.</p>}
                   </div>
                </div>

                {/* Cardápio Recente */}
                <div>
                   <h3 className="font-bold text-odara-dark mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b border-odara-primary pb-2"><Utensils size={16} className="text-odara-accent"/> Alimentação Recente</h3>
                   <div className="space-y-3">
                      {dados.cardapio.slice(0, 5).map((item, i) => (
                         <div key={i} className="bg-odara-primary/5 p-3 rounded-lg border border-odara-primary/20 flex gap-3 items-center hover:border-odara-accent/50 transition">
                            <div className="bg-white p-1.5 rounded text-odara-accent shrink-0 border border-odara-primary">
                               <Utensils size={16}/>
                            </div>
                            <div className="min-w-0 flex-1">
                               <div className="flex justify-between mb-0.5">
                                  <span className="text-[10px] font-bold text-odara-accent uppercase tracking-wide truncate">{item.refeicao}</span>
                                  <span className="text-[10px] text-odara-accent shrink-0 ml-2 font-semibold">{new Date(item.data).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm font-medium text-odara-dark leading-tight truncate">{item.alimento}</p>
                            </div>
                         </div>
                      ))}
                      {dados.cardapio.length === 0 && <p className="text-sm text-odara-name/60 italic">Sem registros recentes.</p>}
                   </div>
                </div>
             </div>
           )}
        </section>

        {/* === 3. HISTÓRICO & OCORRÊNCIAS === */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('historico')} className="p-4 sm:p-5 border-b border-odara-primary bg-odara-primary/10 text-odara-primary flex justify-between items-center cursor-pointer hover:bg-odara-primary/20 transition">
              <div className="flex items-center gap-3 font-bold text-base sm:text-lg">
                 <AlertCircle size={22}/> Histórico e Ocorrências
              </div>
              {secoes.historico ? <ChevronUp className="text-odara-accent"/> : <ChevronDown className="text-odara-accent"/>}
           </div>

           {secoes.historico && (
             <div className="p-4 sm:p-6">
                <div className="mb-6 relative">
                   <Search className="absolute left-3 top-2.5 text-odara-primary" size={18}/>
                   <input 
                      type="text"
                      placeholder="Buscar por título ou descrição..."
                      value={filtroOcorrencia}
                      onChange={(e) => setFiltroOcorrencia(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-odara-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-odara-primary/20 bg-odara-primary/5 text-sm transition-all focus:border-odara-accent text-odara-dark"
                   />
                </div>

                <div className="space-y-4">
                   {ocorrenciasFiltradas.map(oc => (
                      <div key={oc.id} className="border border-odara-primary/20 rounded-xl p-4 hover:border-odara-accent/50 transition bg-white shadow-sm">
                         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <div className="flex items-center gap-2">
                               <div className="p-1.5 bg-odara-primary/10 text-odara-primary rounded-full shrink-0">
                                  <AlertCircle size={16}/>
                               </div>
                               <h4 className="font-bold text-odara-dark truncate">{oc.titulo}</h4>
                            </div>
                            <span className="text-xs text-odara-primary font-mono bg-odara-primary/5 px-2 py-1 rounded border border-odara-primary self-start sm:self-auto whitespace-nowrap">
                               {new Date(oc.data).toLocaleDateString()} • {oc.horario.slice(0,5)}
                            </span>
                         </div>
                         <p className="text-sm text-odara-dark leading-relaxed mb-3 pl-8 sm:pl-10">{oc.descricao}</p>
                         {oc.providencias && (
                            <div className="bg-odara-primary/10 p-3 rounded-lg border border-odara-primary text-xs ml-8 sm:ml-10">
                               <span className="font-bold text-odara-primary block mb-1 uppercase tracking-wide">Providências:</span>
                               <span className="text-odara-primary">{oc.providencias}</span>
                            </div>
                         )}
                      </div>
                   ))}
                   {ocorrenciasFiltradas.length === 0 && <p className="text-center text-odara-primary/60 py-4 italic">Nenhuma ocorrência encontrada.</p>}
                </div>
             </div>
           )}
        </section>

        {/* === 4. INFORMAÇÕES PESSOAIS === */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow border border-gray-200 overflow-hidden">
           <div onClick={() => toggle('pessoal')} className="p-4 sm:p-5 border-b border-odara-primary bg-odara-primary/10 text-odara-primary flex justify-between items-center cursor-pointer hover:bg-odara-primary/20 transition">
              <div className="flex items-center gap-3 font-bold text-base sm:text-lg">
                 <FileText size={22}/> Informações Pessoais
              </div>
              {secoes.pessoal ? <ChevronUp className="text-odara-accent"/> : <ChevronDown className="text-odara-accent"/>}
           </div>

           {secoes.pessoal && (
             <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Pertences */}
                <div>
                   <h4 className="font-bold text-odara-dark mb-3 border-b border-odara-primary pb-2 flex items-center gap-2"><ClipboardList size={16} className="text-odara-accent"/> Pertences</h4>
                   <ul className="space-y-2">
                      {dados.pertences.map(p => (
                         <li key={p.id} className="text-sm flex justify-between p-2 bg-odara-primary/5 rounded border border-odara-primary/20 hover:border-odara-accent/50 transition">
                            <span className="text-odara-dark font-medium truncate pr-2">{p.nome}</span>
                            <span className="text-xs text-odara-accent italic px-2 py-0.5 bg-white rounded border border-odara-primary shrink-0 whitespace-nowrap">{p.estado}</span>
                         </li>
                      ))}
                      {dados.pertences.length === 0 && <p className="text-sm text-odara-name/60 italic">Nenhum pertence cadastrado.</p>}
                   </ul>
                </div>
                
                {/* Preferências */}
                <div>
                   <h4 className="font-bold text-odara-dark mb-3 border-b border-odara-primary pb-2 flex items-center gap-2"><Heart size={16} className="text-odara-accent"/> Preferências</h4>
                   <div className="flex flex-wrap gap-2">
                      {dados.preferencias.map(pref => (
                         <span key={pref.id} className="px-3 py-1 bg-odara-primary/10 text-odara-primary rounded-full text-xs font-medium border border-odara-primary flex items-center gap-1 max-w-full hover:bg-odara-primary/20 transition">
                            <span className="opacity-70 uppercase text-[9px] shrink-0">{pref.tipo_preferencia}:</span> 
                            <span className="truncate">{pref.titulo}</span>
                         </span>
                      ))}
                      {dados.preferencias.length === 0 && <p className="text-sm text-odara-name/60 italic">Nenhuma preferência cadastrada.</p>}
                   </div>
                </div>
             </div>
           )}
        </section>

      </div>
    </div>
  );
};