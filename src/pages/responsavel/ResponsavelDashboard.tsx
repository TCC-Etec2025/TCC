import { useState, useEffect, useCallback } from "react";
import { 
  Home, Pill, Utensils, Palette, Bell, 
  ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, 
  Clock, Eye, Loader2, Calendar, UsersRound, X, ChevronRight as ChevronRightIcon
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../context/UserContext";
import { ModalRoot } from "../../components/dashboard/modals/ModalRoot";
import type { TipoModal } from "../../components/dashboard/modals/types";

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

const formatarDataLocal = (date: Date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

const DashboardResponsavel = () => {
  const { usuario } = useUser();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  const [dados, setDados] = useState<DadosResidente[]>([]);
  
  const [visualizacao, setVisualizacao] = useState<"casa" | "familiar">("casa");
  const [idxSelecionado, setIdxSelecionado] = useState(0);

  const [modalAberto, setModalAberto] = useState<TipoModal>(null);
  
  // Estado para painel de notificações
  const [notificacoesAbertas, setNotificacoesAbertas] = useState<boolean>(false);

  // Wrapper para ícones
  const WrapperIcone = ({
    icone: Icone,
    tamanho = 24,
    className = ""
  }: {
    icone: React.ComponentType<any>;
    tamanho?: number;
    className?: string;
  }) => (
    <Icone size={tamanho} className={className} />
  );

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

  if (loading) return (
    <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-odara-primary" />
    </div>
  );
  
  if (erro || dados.length === 0) return (
    <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{erro || "Nenhum residente vinculado."}</p>
        <button 
          onClick={fetchResumo} 
          className="px-4 py-2 bg-odara-primary text-white rounded-lg hover:bg-odara-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );

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

  // Contador total de alertas (ocorrências + próximo medicamento)
  const totalAlertas = ocorrenciasView.length + (proximoMedicamento ? 1 : 0);

  // Componente de Cabeçalho
  const CabecalhoDashboard = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark">
            {visualizacao === "casa" ? "Área do Responsável" : `Perfil - ${familiarAtual.residente.nome}`}
          </h1>
          <p className="text-odara-dark/60 text-sm">
            {visualizacao === "casa" ? "Visão geral de todos os residentes" : `Quarto ${familiarAtual.residente.quarto || "-"}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <WrapperIcone icone={Calendar} tamanho={20} className="text-odara-primary" />
            <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          
          {/* Botão de Notificações no Cabeçalho - Só mostra se houver alertas */}
          {totalAlertas > 0 && (
            <button
              onClick={() => setNotificacoesAbertas(true)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              aria-label="Notificações"
            >
              <div className="p-2 bg-odara-primary/10 rounded-lg group-hover:bg-odara-primary/20 transition-colors">
                <WrapperIcone 
                  icone={Bell} 
                  tamanho={20} 
                  className="text-odara-primary" 
                />
              </div>
              <span className="absolute -top-1 -right-1 bg-odara-primary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {totalAlertas}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Componente do Painel de Notificações
  const PainelNotificacoes = () => {
    if (!notificacoesAbertas) return null;

    return (
      <>
        <div 
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setNotificacoesAbertas(false)}
        />
        
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200
            inset-x-0 bottom-0 top-16
            sm:inset-auto sm:right-4 sm:top-20 sm:max-w-sm sm:w-full
            lg:max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-odara-primary rounded-lg">
                  <WrapperIcone icone={Bell} tamanho={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-odara-dark">Alertas</h3>
                  <p className="text-sm text-gray-500">
                    {totalAlertas} item{totalAlertas !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificacoesAbertas(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar alertas"
              >
                <WrapperIcone icone={X} tamanho={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-140px)] sm:h-[calc(60vh)]">
            {/* Próximo Medicamento */}
            {proximoMedicamento && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-odara-dark flex items-center gap-2">
                    <WrapperIcone icone={Clock} tamanho={16} className="text-odara-primary" />
                    Próximo Medicamento
                  </h4>
                </div>
                <div
                  onClick={() => {
                    setModalAberto('MEDICAMENTOS');
                    setNotificacoesAbertas(false);
                  }}
                  className="p-3 border border-odara-primary/20 rounded-lg hover:bg-odara-primary/5 active:bg-odara-primary/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <p className="text-sm font-medium text-odara-dark mb-1 line-clamp-2">
                        {proximoMedicamento.nome_medicamento}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{proximoMedicamento.nome_residente}</span>
                        <span className="text-xs font-bold text-odara-primary">
                          Hoje às {proximoMedicamento.horario_previsto.slice(0,5)}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon size={14} className="text-odara-primary flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Ocorrências */}
            {ocorrenciasView.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-odara-dark flex items-center gap-2">
                    <WrapperIcone icone={CalendarIcon} tamanho={16} className="text-odara-primary" />
                    Ocorrências ({ocorrenciasView.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {ocorrenciasView.map((ocorrencia) => (
                    <div
                      key={ocorrencia.id}
                      onClick={() => {
                        setModalAberto('OCORRENCIA');
                        setNotificacoesAbertas(false);
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium text-odara-dark mb-1 line-clamp-2">
                            {ocorrencia.titulo}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{ocorrencia.nome_residente}</span>
                            <span className="text-xs text-gray-500">{ocorrencia.horario.slice(0,5)}</span>
                          </div>
                        </div>
                        <ChevronRightIcon size={14} className="text-odara-primary flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem quando não há alertas */}
            {totalAlertas === 0 && (
              <div className="p-8 text-center">
                <div className="p-4 bg-odara-primary/10 rounded-full inline-block mb-3">
                  <WrapperIcone icone={Bell} tamanho={24} className="text-odara-primary" />
                </div>
                <p className="text-gray-500 font-medium">Sem alertas no momento</p>
                <p className="text-gray-400 text-sm mt-1">Tudo tranquilo por aqui</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Componente de Cartões de Residentes
  const CartoesResidentes = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {dados.map((d, idx) => (
          <div key={d.residente.id} onClick={() => selecionarFamiliar(idx)}
            className="bg-white p-4 sm:p-6 rounded-xl shadow hover:shadow-md transition cursor-pointer border border-gray-100 group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-white shadow">
                {d.residente.foto ? 
                  <img src={d.residente.foto} alt={d.residente.nome} className="w-full h-full object-cover"/> : 
                  <User className="w-full h-full p-2 sm:p-3 text-gray-400"/>
                }
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-odara-dark group-hover:text-odara-primary transition-colors truncate">
                  {d.residente.nome}
                </h3>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-500">
                  <span className="truncate">Quarto: {d.residente.quarto || "-"}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {d.residente.dependencia || "Ativo"}
                  </span>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-odara-primary transition-colors flex-shrink-0" size={20}/>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Componente de Perfil do Familiar
  const PerfilFamiliar = () => {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 border-l-4 border-odara-primary">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setVisualizacao("casa")}
            className="flex items-center gap-2 px-4 py-2 text-odara-primary bg-white border border-odara-primary rounded-lg hover:bg-odara-primary/10 transition font-medium text-sm"
          >
            <Home size={18} />
            <span>Voltar para Visão Geral</span>
          </button>
          
          {dados.length > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={anteriorFamiliar} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition">
                <ChevronLeft size={18}/>
              </button>
              <button onClick={proximoFamiliar} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition">
                <ChevronRight size={18}/>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
            {familiarAtual.residente.foto ? 
              <img src={familiarAtual.residente.foto} alt={familiarAtual.residente.nome} className="w-full h-full object-cover"/> : 
              <User className="w-full h-full p-3 sm:p-5 text-gray-400"/>
            }
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-odara-dark">{familiarAtual.residente.nome}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <span className="px-3 py-1 bg-odara-primary/10 text-odara-primary text-xs rounded-full font-medium">
                Quarto {familiarAtual.residente.quarto || "-"}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                {familiarAtual.residente.dependencia || "Ativo"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Plano de Saúde</p>
            <p className="font-semibold text-odara-dark">{familiarAtual.residente.plano_saude || "Particular"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Carteirinha</p>
            <p className="font-semibold text-odara-dark">{familiarAtual.residente.numero_carteirinha || "-"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Observações</p>
            <p className="font-semibold text-odara-dark truncate">{familiarAtual.residente.observacoes || "Nenhuma"}</p>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Cartões de Informações (layout responsivo de 4 colunas - agora usando 4 colunas para os cards)
  const CartoesInformacoes = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Medicamentos */}
        <div 
          onClick={() => setModalAberto('MEDICAMENTOS')}
          className="bg-white p-4 sm:p-5 rounded-xl shadow hover:shadow-md transition cursor-pointer border border-gray-200 group"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={Pill} tamanho={18} className="text-odara-primary"/>
              </div>
              <span>Medicamentos</span>
            </h3>
            <Eye size={16} className="text-gray-400 group-hover:text-odara-primary transition-colors"/>
          </div>
          <div className="space-y-2">
            {medicamentosView.slice(0, 3).map(med => (
              <div key={med.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition">
                <div className="min-w-0">
                  <p className="font-medium text-odara-dark truncate">{med.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{med.dosagem}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
              </div>
            ))}
            {medicamentosView.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum medicamento ativo.</p>
            )}
          </div>
        </div>

        {/* Cardápio */}
        <div 
          onClick={() => setModalAberto('CARDAPIO')}
          className="bg-white p-4 sm:p-5 rounded-xl shadow hover:shadow-md transition cursor-pointer border border-gray-200 group"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={Utensils} tamanho={18} className="text-odara-primary"/>
              </div>
              <span>Cardápio (Hoje)</span>
            </h3>
            <Eye size={16} className="text-gray-400 group-hover:text-odara-primary transition-colors"/>
          </div>
          <div className="space-y-2 pt-2">
            {cardapioView.slice(0, 3).map(item => (
              <div key={item.id} className="flex gap-2 items-center text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                <p className="text-odara-dark truncate flex-1">{item.alimento}</p>
                <span className="text-xs text-gray-500 flex-shrink-0">{item.refeicao}</span>
              </div>
            ))}
            {cardapioView.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sem registros hoje.</p>
            )}
          </div>
        </div>

        {/* Consultas */}
        <div 
          onClick={() => setModalAberto('CONSULTAS')}
          className="bg-white p-4 sm:p-5 rounded-xl shadow hover:shadow-md transition cursor-pointer border border-gray-200 group"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={CalendarIcon} tamanho={18} className="text-odara-primary"/>
              </div>
              <span>Próximas Consultas</span>
            </h3>
            <Eye size={16} className="text-gray-400 group-hover:text-odara-primary transition-colors"/>
          </div>
          <div className="space-y-3">
            {consultasView.slice(0, 2).map(con => (
              <div key={con.id} className="bg-indigo-50 p-3 rounded-lg flex items-center gap-3">
                <div className="bg-white p-1.5 rounded text-indigo-600 font-bold text-xs flex flex-col items-center leading-tight min-w-9 flex-shrink-0">
                  <span>{new Date(con.data_consulta).getDate()}</span>
                  <span className="text-[9px] uppercase">
                    {new Date(con.data_consulta).toLocaleString('pt-BR', {month:'short'}).slice(0,3)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-odara-dark truncate">{con.motivo_consulta || "Consulta"}</p>
                  <p className="text-xs text-gray-500 truncate">{con.medico}</p>
                </div>
              </div>
            ))}
            {consultasView.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma consulta agendada.</p>
            )}
          </div>
        </div>

        {/* Atividades */}
        <div 
          onClick={() => setModalAberto('ATIVIDADES')}
          className="bg-white p-4 sm:p-5 rounded-xl shadow hover:shadow-md transition cursor-pointer border border-gray-200 group"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={Palette} tamanho={18} className="text-odara-primary"/>
              </div>
              <span>Atividades (Hoje)</span>
            </h3>
            <Eye size={16} className="text-gray-400 group-hover:text-odara-primary transition-colors"/>
          </div>
          <div className="space-y-2">
            {atividadesView.slice(0, 3).map(atv => (
              <div key={atv.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-odara-dark truncate">{atv.nome}</span>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded flex-shrink-0">
                  {atv.horario_inicio.slice(0,5)}
                </span>
              </div>
            ))}
            {atividadesView.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sem atividades hoje.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <CabecalhoDashboard />

        {visualizacao === "casa" && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-odara-dark">
                <UsersRound size={20} className="text-odara-primary" />
                <span className="text-sm font-semibold">{dados.length} residente{dados.length > 1 ? 's' : ''} vinculado{dados.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <CartoesResidentes />
          </div>
        )}

        {visualizacao === "familiar" && (
          <div className="mb-6 sm:mb-8">
            <PerfilFamiliar />
          </div>
        )}

        <CartoesInformacoes />

        {/* Modal Unificado */}
        <ModalRoot
          isOpen={!!modalAberto}
          onClose={() => setModalAberto(null)}
          tipo={modalAberto}
          idResidente={familiarAtual?.residente.id || null}
        />
      </div>

      <PainelNotificacoes />
    </div>
  );
};

export default DashboardResponsavel;