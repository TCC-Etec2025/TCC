import { useState, useEffect, useCallback } from "react";
import { 
  Home, Pill, Utensils, Activity, Bell, 
  ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, 
  Clock, Eye, Loader2
} from "lucide-react";
// Removi o import do Calendar pois ele não é mais usado neste arquivo (os modais usam o deles internamente)
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../context/UserContext";
import { ModalRoot } from "../../components/dashboard/modals/ModalRoot";
import type { TipoModal } from "../../components/dashboard/modals/types";

// ================= TYPES (Resumo Inicial) =================

type MedicamentoResumo = { id: number; nome: string; dosagem: string; horario_inicio: string; recorrencia: string; };
type AtividadeResumo = { id: number; nome: string; horario_inicio: string; local: string | null; };
type AlimentacaoResumo = { id: number; refeicao: string; alimento: string; horario: string; };
type ConsultaResumo = { id: number; data_consulta: string; horario: string; medico: string; motivo_consulta: string | null; };
type OcorrenciaResumo = { id: number; titulo: string; descricao: string; horario: string; providencias: string | null; status: boolean; };
type AdministracaoResumo = { id: number; horario_previsto: string; status: string; nome_medicamento: string; };

type ResidenteResumo = {
  id: number;
  nome: string;
  foto: string | null;
  quarto: string | null;
  dependencia: string | null;
  plano_saude?: string; 
  numero_carteirinha?: string;
  observacoes?: string;
};

type DadosResidente = {
  residente: ResidenteResumo;
  medicamentos_ativos: MedicamentoResumo[];
  administracoes_dia: AdministracaoResumo[];
  atividades_dia: AtividadeResumo[];
  alimentacao_dia: AlimentacaoResumo[];
  consultas_semana: ConsultaResumo[];
  ocorrencias_dia: OcorrenciaResumo[];
};

// ================= UTILITÁRIOS =================

const formatarDataLocal = (date: Date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

// ================= COMPONENTE DASHBOARD =================

const DashboardResponsavel = () => {
  const { usuario } = useUser();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  const [dados, setDados] = useState<DadosResidente[]>([]);
  
  const [visualizacao, setVisualizacao] = useState<"casa" | "familiar">("casa");
  const [idxSelecionado, setIdxSelecionado] = useState(0);

  const [modalAberto, setModalAberto] = useState<TipoModal>(null);

  // FETCH INICIAL
  const fetchResumo = useCallback(async () => {
    if (!usuario?.id) return;
    try {
      setLoading(true);
      const dataHoje = formatarDataLocal(new Date());
      const { data, error } = await supabase
        .rpc('get_detalhes_residentes_por_responsavel', { 
          p_id_responsavel: usuario.id,
          p_data_referencia: dataHoje
        });

      if (error) throw error;
      setDados(data || []);
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => { fetchResumo(); }, [fetchResumo]);

  // NAVEGAÇÃO FAMILIAR
  const proximoFamiliar = () => setIdxSelecionado((prev) => (prev + 1) % dados.length);
  const anteriorFamiliar = () => setIdxSelecionado((prev) => (prev - 1 + dados.length) % dados.length);
  const selecionarFamiliar = (idx: number) => {
    setIdxSelecionado(idx);
    setVisualizacao("familiar");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-odara-offwhite"><Loader2 className="h-10 w-10 animate-spin text-odara-primary" /></div>;
  if (erro || dados.length === 0) return <div className="flex h-screen items-center justify-center bg-odara-offwhite"><p className="text-gray-500">{erro || "Nenhum residente vinculado."}</p></div>;

  // DADOS DA VIEW ATUAL
  const familiarAtual = dados[idxSelecionado];
  
  // Listas agregadas
  const ocorrenciasView = visualizacao === "casa" 
    ? dados.flatMap(d => d.ocorrencias_dia.map(o => ({...o, nome_residente: d.residente.nome})))
    : familiarAtual.ocorrencias_dia.map(o => ({...o, nome_residente: familiarAtual.residente.nome}));
  
  const medicamentosView = visualizacao === "casa"
    ? dados.flatMap(d => d.medicamentos_ativos.map(m => ({...m, nome_residente: d.residente.nome})))
    : familiarAtual.medicamentos_ativos.map(m => ({...m, nome_residente: familiarAtual.residente.nome}));
  
  const cardapioView = visualizacao === "casa"
    ? dados.flatMap(d => d.alimentacao_dia.map(m => ({...m, nome_residente: d.residente.nome})))
    : familiarAtual.alimentacao_dia.map(m => ({...m, nome_residente: familiarAtual.residente.nome}));

  const atividadesView = visualizacao === "casa"
    ? dados.flatMap(d => d.atividades_dia.map(m => ({...m, nome_residente: d.residente.nome})))
    : familiarAtual.atividades_dia.map(m => ({...m, nome_residente: familiarAtual.residente.nome}));

  const consultasView = visualizacao === "casa"
    ? dados.flatMap(d => d.consultas_semana.map(m => ({...m, nome_residente: d.residente.nome})))
    : familiarAtual.consultas_semana.map(m => ({...m, nome_residente: familiarAtual.residente.nome}));

  // Próximo Medicamento
  const administracoesView = visualizacao === "casa"
    ? dados.flatMap(d => d.administracoes_dia.map(a => ({...a, nome_residente: d.residente.nome})))
    : familiarAtual.administracoes_dia.map(a => ({...a, nome_residente: familiarAtual.residente.nome}));

  const proximoMedicamento = administracoesView
    .filter(a => a.status === 'pendente')
    .sort((a, b) => a.horario_previsto.localeCompare(b.horario_previsto))[0];

  const totalAlertas = ocorrenciasView.length + (proximoMedicamento ? 1 : 0);

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-2">
        
        {/* === HEADER === */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-odara-dark">
                {visualizacao === "casa" ? "Área do Responsável" : `Perfil - ${familiarAtual.residente.nome}`}
              </h1>
              <p className="text-odara-dark/60 text-sm">
                {visualizacao === "casa" ? "Visão geral de todos os residentes" : `Quarto ${familiarAtual.residente.quarto || "-"}`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => visualizacao === "familiar" ? setVisualizacao("casa") : selecionarFamiliar(0)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
                  visualizacao === "casa" ? "bg-odara-primary text-white shadow-lg shadow-blue-200" : "bg-white text-gray-600 shadow hover:bg-gray-50"
                }`}
              >
                <Home size={18} />
                <span>{visualizacao === "casa" ? "Ver Detalhes" : "Voltar"}</span>
              </button>
              
              <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow text-gray-600">
                <User size={18} className="text-odara-primary"/>
                <span className="text-sm font-semibold">{dados.length} residente{dados.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* === CARDS SELEÇÃO (VIEW CASA) === */}
          {visualizacao === "casa" && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {dados.map((d, idx) => (
                <div key={d.residente.id} onClick={() => selecionarFamiliar(idx)}
                  className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-white shadow">
                       {d.residente.foto ? <img src={d.residente.foto} className="w-full h-full object-cover"/> : <User className="w-full h-full p-4 text-gray-400"/>}
                       <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">{d.residente.nome}</h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                         <span>Quarto: {d.residente.quarto || "-"}</span>
                         <span>•</span>
                         <span>{d.residente.dependencia || "Ativo"}</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors"/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* === DETALHE FAMILIAR (VIEW FAMILIAR) === */}
          {visualizacao === "familiar" && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                          {familiarAtual.residente.foto ? <img src={familiarAtual.residente.foto} className="w-full h-full object-cover"/> : <User className="w-full h-full p-5 text-gray-400"/>}
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-gray-800">{familiarAtual.residente.nome}</h2>
                          <div className="flex gap-3 mt-1">
                             <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Quarto {familiarAtual.residente.quarto}</span>
                             <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Ativo</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex gap-2">
                     <button onClick={anteriorFamiliar} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition"><ChevronLeft size={20}/></button>
                     <button onClick={proximoFamiliar} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition"><ChevronRight size={20}/></button>
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Plano de Saúde</p>
                      <p className="font-semibold text-gray-700">{familiarAtual.residente.plano_saude || "Particular"}</p>
                  </div>
                  <div className="text-center border-l border-r border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Carteirinha</p>
                      <p className="font-semibold text-gray-700">{familiarAtual.residente.numero_carteirinha || "-"}</p>
                  </div>
                  <div className="text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Observações</p>
                      <p className="font-semibold text-gray-700 truncate px-4">{familiarAtual.residente.observacoes || "Nenhuma"}</p>
                  </div>
               </div>
            </div>
          )}
        </header>

        {/* === DASHBOARD GRIDS === */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* COLUNA ESQUERDA (3/4) */}
          <div className="lg:col-span-3 space-y-6">
             
             {/* Linha 1 */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Medicamentos */}
                <div 
                   onClick={() => setModalAberto('MEDICAMENTOS')}
                   className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                >
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2"><Pill size={18} className="text-blue-500"/> Medicamentos</h3>
                       <Eye size={18} className="text-gray-300"/>
                   </div>
                   <div className="space-y-3">
                       {medicamentosView.slice(0, 3).map(med => (
                           <div key={med.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition">
                               <div>
                                   <p className="font-medium text-gray-700">{med.nome}</p>
                                   <p className="text-xs text-gray-400">{med.dosagem}</p>
                               </div>
                               <div className="w-2 h-2 rounded-full bg-green-400"></div>
                           </div>
                       ))}
                       {medicamentosView.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Nenhum ativo.</p>}
                   </div>
                </div>

                {/* Cardápio (SEM CALENDÁRIO VISUAL) */}
                <div 
                   onClick={() => setModalAberto('CARDAPIO')}
                   className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                >
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2"><Utensils size={18} className="text-orange-500"/> Cardápio (Hoje)</h3>
                       <Eye size={18} className="text-gray-300"/>
                   </div>
                   {/* Aqui havia o calendário, removido conforme solicitado */}
                   <div className="space-y-2 pt-2">
                       {cardapioView.slice(0, 3).map(item => (
                           <div key={item.id} className="flex gap-2 items-center text-sm">
                               <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                               <p className="text-gray-600 truncate flex-1">{item.alimento}</p>
                               <span className="text-xs text-gray-400">{item.refeicao}</span>
                           </div>
                       ))}
                       {cardapioView.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sem registros hoje.</p>}
                   </div>
                </div>
             </div>

             {/* Linha 2 */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 {/* Consultas */}
                 <div 
                    onClick={() => setModalAberto('CONSULTAS')}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                 >
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2"><CalendarIcon size={18} className="text-indigo-500"/> Próximas Consultas</h3>
                       <Eye size={18} className="text-gray-300"/>
                    </div>
                    <div className="space-y-3">
                       {consultasView.slice(0, 2).map(con => (
                           <div key={con.id} className="bg-indigo-50 p-3 rounded-lg flex items-center gap-3">
                               <div className="bg-white p-1.5 rounded text-indigo-600 font-bold text-xs flex flex-col items-center leading-tight min-w-9">
                                   <span>{new Date(con.data_consulta).getDate()}</span>
                                   <span className="text-[9px] uppercase">{new Date(con.data_consulta).toLocaleString('pt-BR', {month:'short'}).slice(0,3)}</span>
                               </div>
                               <div className="min-w-0">
                                   <p className="text-sm font-bold text-gray-700 truncate">{con.motivo_consulta || "Consulta"}</p>
                                   <p className="text-xs text-gray-500 truncate">{con.medico}</p>
                               </div>
                           </div>
                       ))}
                       {consultasView.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma consulta agendada.</p>}
                    </div>
                 </div>

                 {/* Atividades */}
                 <div 
                    onClick={() => setModalAberto('ATIVIDADES')}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                 >
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-green-500"/> Atividades (Hoje)</h3>
                       <Eye size={18} className="text-gray-300"/>
                    </div>
                    <div className="space-y-3">
                       {atividadesView.slice(0, 3).map(atv => (
                           <div key={atv.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                               <span className="font-medium text-gray-700">{atv.nome}</span>
                               <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">{atv.horario_inicio.slice(0,5)}</span>
                           </div>
                       ))}
                       {atividadesView.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sem atividades hoje.</p>}
                    </div>
                 </div>
             </div>
          </div>

          {/* COLUNA DIREITA (ALERTAS) */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                   <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Bell size={20}/></div>
                   <h2 className="font-bold text-lg text-gray-800">Alertas</h2>
                   {totalAlertas > 0 && (
                     <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {totalAlertas}
                     </span>
                   )}
                </div>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                   
                   {/* Destaque: Próximo Medicamento */}
                   {proximoMedicamento && (
                      <div className="relative pl-4 border-l-2 border-blue-400 pb-4 last:pb-0 last:border-0 bg-blue-50/50 p-3 rounded-r-lg mb-4">
                          <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></div>
                          <div className="flex items-center gap-2 mb-1">
                             <Clock size={14} className="text-blue-600" />
                             <h4 className="text-sm font-bold text-blue-800">Próximo Medicamento</h4>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{proximoMedicamento.nome_medicamento}</p>
                          <p className="text-xs text-blue-600 mt-1 font-semibold">
                             Hoje às {proximoMedicamento.horario_previsto.slice(0,5)} • {proximoMedicamento.nome_medicamento}
                          </p>
                      </div>
                   )}

                   {/* Lista de Ocorrências (Abre o Modal de Ocorrências) */}
                   {ocorrenciasView.map(alert => (
                       <div key={alert.id} className="relative pl-4 border-l-2 border-red-200 pb-4 last:pb-0 last:border-0">
                           <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
                           <h4 className="text-sm font-bold text-gray-800">{alert.titulo}</h4>
                           <p className="text-xs text-gray-400 mt-0.5 mb-2">{alert.horario.slice(0,5)} • {alert.nome_residente}</p>
                           <button 
                             onClick={() => setModalAberto('OCORRENCIA')}
                             className="text-xs font-medium text-blue-600 hover:underline"
                           >
                             Ver detalhes
                           </button>
                       </div>
                   ))}

                   {ocorrenciasView.length === 0 && !proximoMedicamento && (
                       <div className="text-center py-8">
                           <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-500">
                               <Bell size={20}/>
                           </div>
                           <p className="text-sm text-gray-500">Tudo tranquilo por aqui.</p>
                       </div>
                   )}
                </div>
             </div>
          </div>

        </div>

        {/* --- MODAL UNIFICADO --- */}
        <ModalRoot
            isOpen={!!modalAberto}
            onClose={() => setModalAberto(null)}
            tipo={modalAberto}
            idResidente={familiarAtual?.residente.id || null}
        />

      </div>
    </div>
  );
};

export default DashboardResponsavel;