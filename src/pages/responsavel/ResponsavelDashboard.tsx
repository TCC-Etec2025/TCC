import { useState, useEffect, useCallback } from "react";
import {
  Home, Pill, Apple, Coffee, Banana, Cookie, Soup, GlassWater, CookingPot, Palette, Bell,
  ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, Microscope,
  Clock, Loader2, Calendar, UsersRound, X, ChevronRight as ChevronRightIcon,
  RockingChair,
  type LucideIcon
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../context/UserContext";
import { ModalRoot } from "../../components/dashboard/modals/ModalRoot";
import type { TipoModal } from "../../components/dashboard/modals/types";

type MedicamentoResumo = { id: number; nome: string; dosagem: string; horario_inicio: string; recorrencia: string; };

type AtividadeResumo = { id: number; nome: string; horario_inicio: string; local: string | null; };

type AlimentacaoResumo = { id: number; refeicao: string; alimento: string; horario: string; };

type ConsultaResumo = { id: number; data_consulta: string; horario: string; medico: string; motivo_consulta: string | null; };

type ExameResumo = { id: number; tipo: string; laboratorio: string | null; data: string; horario: string; status: string; };

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
  status: boolean;
};

type DadosResidente = {
  residente: ResidenteResumo;
  medicamentos_ativos: MedicamentoResumo[];
  administracoes_dia: AdministracaoResumo[];
  atividades_dia: AtividadeResumo[];
  alimentacao_dia: AlimentacaoResumo[];
  consultas_semana: ConsultaResumo[];
  exames_semana: ExameResumo[];
  ocorrencias_dia: OcorrenciaResumo[];
};

const formatarDataLocal = (date: Date) => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

// Função para verificar se uma data é hoje ou futura
const isDataHojeOuFutura = (dataString: string): boolean => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera horas para comparar apenas datas

  const data = new Date(dataString);
  data.setHours(0, 0, 0, 0);

  return data >= hoje;
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
    icone: LucideIcon;
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

  // Função para obter os dados a serem exibidos nos cartões
  const obterDadosParaCartoes = () => {
    if (visualizacao === "casa") {
      // Modo casa: mostrar todos os residentes
      return dados;
    } else {
      // Modo familiar: mostrar apenas o residente selecionado
      return [dados[idxSelecionado]];
    }
  };

  // Função para lidar com clique nos cartões (só funciona no modo familiar)
  const handleClickCartao = (tipoModal: TipoModal) => {
    if (visualizacao === "familiar") {
      setModalAberto(tipoModal);
    }
    // No modo "casa", o clique permanece desativado
  };

  if (loading) return (
    <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-odara-primary" />
    </div>
  );

  if (erro || dados.length === 0) return (
    <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">{erro || "Nenhum residente vinculado."}</p>
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
  const dadosParaCartoes = obterDadosParaCartoes();

  {/* Listas agregadas */ }
  // Const OCORRENCIAS
  const ocorrenciasView = visualizacao === "casa"
    ? dados.flatMap(d => d.ocorrencias_dia.map(o => ({ ...o, nome_residente: d.residente.nome })))
    : familiarAtual.ocorrencias_dia.map(o => ({ ...o, nome_residente: familiarAtual.residente.nome }));

  // Const MEDICAMENTOS
  const medicamentosView = visualizacao === "casa"
    ? dados.flatMap(d => d.medicamentos_ativos.map(m => ({ ...m, nome_residente: d.residente.nome })))
    : familiarAtual.medicamentos_ativos.map(m => ({ ...m, nome_residente: familiarAtual.residente.nome }));

  const administracoesView = visualizacao === "casa"
    ? dados.flatMap(d => d.administracoes_dia.map(a => ({ ...a, nome_residente: d.residente.nome })))
    : familiarAtual.administracoes_dia.map(a => ({ ...a, nome_residente: familiarAtual.residente.nome }));

  const proximoMedicamento = administracoesView
    .filter(a => a.status === 'pendente')
    .sort((a, b) => a.horario_previsto.localeCompare(b.horario_previsto))[0];

  // Const ALIMENTAR
  const REFEICOES_CONFIG = [
    { key: "cafe-da-manha", label: "Café da Manhã", icon: <Coffee size={18} /> },
    { key: "lanche-manha", label: "Lanche da Manhã", icon: <Banana size={18} /> },
    { key: "almoco", label: "Almoço", icon: <CookingPot size={18} /> },
    { key: "lanche-tarde", label: "Lanche da Tarde", icon: <Cookie size={18} /> },
    { key: "jantar", label: "Jantar", icon: <Soup size={18} /> },
    { key: "ceia", label: "Ceia", icon: <GlassWater size={18} /> },
  ];

  const cardapioView = visualizacao === "casa"
    ? dados.flatMap(d => d.alimentacao_dia.map(m => ({ ...m, nome_residente: d.residente.nome })))
    : familiarAtual.alimentacao_dia.map(m => ({ ...m, nome_residente: familiarAtual.residente.nome }));

  // Const ATIVIDADES
  const atividadesView = visualizacao === "casa"
    ? dados.flatMap(d => d.atividades_dia.map(m => ({ ...m, nome_residente: d.residente.nome })))
    : familiarAtual.atividades_dia.map(m => ({ ...m, nome_residente: familiarAtual.residente.nome }));

  // Const CONSULTAS - Filtrar apenas hoje e futuras
  const consultasView = visualizacao === "casa"
    ? dados.flatMap(d =>
      d.consultas_semana
        .filter(c => isDataHojeOuFutura(c.data_consulta))
        .map(c => ({ ...c, nome_residente: d.residente.nome }))
    )
    : familiarAtual.consultas_semana
      .filter(c => isDataHojeOuFutura(c.data_consulta))
      .map(c => ({ ...c, nome_residente: familiarAtual.residente.nome }));

  // Const EXAMES - Filtrar apenas hoje e futuras
  const examesView = visualizacao === "casa"
    ? dados.flatMap(d =>
      d.exames_semana
        .filter(e => isDataHojeOuFutura(e.data))
        .map(e => ({ ...e, nome_residente: d.residente.nome }))
    )
    : familiarAtual.exames_semana
      .filter(e => isDataHojeOuFutura(e.data))
      .map(e => ({ ...e, nome_residente: familiarAtual.residente.nome }));

  // Contador total de alertas (ocorrências + próximo medicamento)
  const totalAlertas = ocorrenciasView.length + (proximoMedicamento ? 1 : 0);

  // Função para formatar data e determinar cor
  const formatarDataComCor = (dataString: string) => {
    const data = new Date(dataString);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);

    data.setHours(0, 0, 0, 0);

    let dataColor = "text-gray-400";
    let dataBg = "bg-white";

    if (data.getTime() === hoje.getTime()) {
      dataColor = "text-odara-alerta";
      dataBg = "bg-white";
    } else if (data.getTime() === amanha.getTime()) {
      dataColor = "text-gray-400";
      dataBg = "bg-white";
    }

    return {
      formatted: data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      color: dataColor,
      bg: dataBg
    };
  };

  // Componente de Cabeçalho
  const CabecalhoDashboard = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-8 gap-4">
        {visualizacao === "familiar" ? (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => setVisualizacao("casa")}
              className="flex items-center gap-2 px-4 py-2 text-odara-primary bg-white border border-odara-primary rounded-lg hover:bg-odara-primary/10 transition font-medium text-sm"
            >
              <Home size={18} />
              <span>Voltar para Visão Geral</span>
            </button>

            
          </div>
        ) : (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark">
              Área do Responsável
            </h1>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 w-full">
            <WrapperIcone icone={Calendar} tamanho={20} className="text-odara-primary" />
            <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Botão de Notificações no Cabeçalho */}
            <button
              onClick={() => setNotificacoesAbertas(true)}
              className="relative p-2 rounded-lg transition-colors group"
              aria-label="Notificações"
            >
              <div className="p-2 bg-odara-white border border-odara-primary rounded-lg group-hover:bg-odara-primary/20 transition-colors">
                <WrapperIcone
                  icone={Bell}
                  tamanho={20}
                  className="text-odara-primary"
                />
              </div>

              <span className={`absolute -top-1 -right-1 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${totalAlertas > 0 ? 'bg-odara-alerta' : 'bg-odara-dropdown-accent'}`}>
                {totalAlertas}
              </span>
            </button>
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
          className="fixed inset-0 z-40 bg-odara-offwhite/50 backdrop-blur-sm"
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
                  <p className="text-sm text-gray-400">
                    {totalAlertas} item{totalAlertas !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificacoesAbertas(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar alertas"
              >
                <WrapperIcone icone={X} tamanho={20} className="text-gray-400" />
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
                        <span className="text-xs text-gray-400">{proximoMedicamento.nome_residente}</span>
                        <span className="text-xs font-bold text-odara-primary">
                          Hoje às {proximoMedicamento.horario_previsto.slice(0, 5)}
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
                            <span className="text-xs text-gray-400">{ocorrencia.nome_residente}</span>
                            <span className="text-xs text-gray-400">{ocorrencia.horario.slice(0, 5)}</span>
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
                <p className="text-gray-400 font-medium">Sem alertas no momento</p>
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
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-odara-primary/10 shrink-0 border-2 border-white shadow">
                {d.residente.foto ?
                  <img src={d.residente.foto} alt={d.residente.nome} className="w-full h-full object-cover" /> :
                  <RockingChair className="w-full h-full p-2 sm:p-3 text-odara-primary" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-odara-dark group-hover:text-odara-primary transition-colors truncate">
                  {d.residente.nome}
                </h3>

                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-400">
                  <span className="truncate">Quarto: {d.residente.quarto || "-"}</span>

                  <span className="hidden sm:inline">•</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {d.residente.dependencia || "Ativo"}
                  </span>
                </div>
              </div>

              <ChevronRight className="text-gray-400 group-hover:text-odara-primary transition-colors flex-shrink-0" size={20} />
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
      {/* CONTAINER PRINCIPAL COM SETAS + FOTO + NOME */}
      <div className="flex items-center justify-between mb-6">        
        {/* Setas de navegação - ESQUERDA */}
        {dados.length > 1 && (
          <button 
            onClick={anteriorFamiliar} 
            className="p-2 bg-odara-primary/10 rounded-full hover:bg-odara-primary transition flex-shrink-0 group"
            aria-label="Familiar anterior"
          >
            <ChevronLeft size={20} className="text-odara-primary group-hover:text-odara-white" />
          </button>
        )}
        
        {/* CONTEÚDO CENTRAL: FOTO + NOME + BADGES */}
        <div className="flex flex-col items-center flex-1 mx-4 sm:mx-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 mb-3">
            {familiarAtual.residente.foto ?
              <img src={familiarAtual.residente.foto} alt={familiarAtual.residente.nome} className="w-full h-full object-cover" /> :
              <User className="w-full h-full p-3 sm:p-5 text-gray-400" />
            }
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-odara-dark text-center mb-2">
            {familiarAtual.residente.nome}
          </h2>
          <div className="flex flex-wrap justify-center gap-2">            
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${familiarAtual.residente.status ? "bg-green-100 text-green-500 " : "bg-gray-100 text-gray-400 "}`}>
            {familiarAtual.residente.status ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>
        
        {/* Setas de navegação - DIREITA */}
        {dados.length > 1 && (
          <button 
            onClick={proximoFamiliar} 
            className="p-2 bg-odara-primary/10 rounded-full hover:bg-odara-primary transition flex-shrink-0 group"
            aria-label="Próximo familiar"
          >
            <ChevronRight size={20} className="text-odara-primary group-hover:text-odara-white" />
          </button>
        )}
        
        {/* Espaço vazio para balancear layout quando não há setas */}
        {dados.length <= 1 && <div className="w-10"></div>}
      </div>

      {/* GRID DE INFORMAÇÕES (mantido igual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Quarto</p>
          <p className="font-semibold text-odara-dark">{familiarAtual.residente.quarto || "-"}</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Grau de Dependência</p>
          <p className="font-semibold text-odara-dark">{familiarAtual.residente.dependencia || "Ativo"}</p>
        </div>

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
          <p className="font-semibold text-odara-dark truncate">{familiarAtual.residente.observacoes || "-"}</p>
        </div>
      </div>
    </div>
  );
};

  // Componente de Cartões de Informações (layout responsivo de 5 colunas)
  const CartoesInformacoes = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Medicamentos */}
        <div
          onClick={() => handleClickCartao('MEDICAMENTOS')}
          className={`bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200 ${visualizacao === "familiar" ? "cursor-pointer hover:border-odara-primary/50 hover:shadow-md transition-all" : ""}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={Pill} tamanho={18} className="text-odara-primary" />
              </div>
              <span>Medicamentos Ativos</span>
            </h3>
            {visualizacao === "familiar" && (
              <div className="text-xs text-odara-primary font-medium">
                Ver todos
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 max-h-80 overflow-y-auto">
            {dadosParaCartoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum residente vinculado.</p>
            ) : (
              dadosParaCartoes.map((residenteData, index) => {
                const medicamentosResidente = residenteData.medicamentos_ativos;

                return (
                  <div
                    key={residenteData.residente.id}
                    className={`pb-4 ${index < dadosParaCartoes.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-odara-dark font-semibold flex items-center gap-2">
                        {residenteData.residente.nome}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {medicamentosResidente.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Nenhum medicamento ativo.
                        </p>
                      ) : (
                        medicamentosResidente.slice(0, 3).map(med => {
                          const administracaoHoje = residenteData.administracoes_dia?.find(
                            a => a.nome_medicamento === med.nome
                          );

                          const horarioTextColor = administracaoHoje?.status === 'concluído'
                            ? 'text-green-500'
                            : 'text-gray-400';
                          const horarioBorderColor = administracaoHoje?.status === 'concluído'
                            ? 'border-green-500'
                            : 'border-gray-200';

                          return (
                            <div key={med.id} className="flex gap-2 items-center text-sm bg-gray-50 p-2 rounded-lg">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-odara-dark truncate">{med.nome}</p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {med.dosagem}
                                </p>
                              </div>

                              <span className={`text-xs flex-shrink-0 bg-white px-2 py-0.5 rounded-full border ${horarioBorderColor} ${horarioTextColor} whitespace-nowrap`}>
                                {med.horario_inicio.slice(0, 5)}
                                {administracaoHoje?.status === 'concluído' && (
                                  <span className="ml-1">✓</span>
                                )}
                              </span>
                            </div>
                          );
                        })
                      )}

                      {medicamentosResidente.length > 3 && (
                        <p className="text-xs text-odara-primary text-center">
                          +{medicamentosResidente.length - 3} medicamentos
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cardápio */}
        <div
          onClick={() => handleClickCartao('CARDAPIO')}
          className={`bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200 ${visualizacao === "familiar" ? "cursor-pointer hover:border-odara-primary/50 hover:shadow-md transition-all" : ""}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={Apple} tamanho={18} className="text-odara-primary" />
              </div>
              <span>Cardápio do Dia</span>
            </h3>
            {visualizacao === "familiar" && (
              <div className="text-xs text-odara-primary font-medium">
                Ver todos
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 max-h-80 overflow-y-auto">
            {dadosParaCartoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum residente vinculado.</p>
            ) : (
              dadosParaCartoes.map((residenteData, index) => {
                const cardapioResidente = residenteData.alimentacao_dia;

                return (
                  <div
                    key={residenteData.residente.id}
                    className={`pb-4 ${index < dadosParaCartoes.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-odara-dark font-semibold flex items-center gap-2">
                        {residenteData.residente.nome}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {cardapioResidente.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Sem refeições hoje.
                        </p>
                      ) : (
                        cardapioResidente.slice(0, 3).map(item => (
                          <div key={item.id} className="flex gap-2 items-center text-sm bg-gray-50 p-2 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-odara-dark truncate">{item.alimento}</p>
                            </div>

                            <span className="text-xs text-gray-400 flex-shrink-0 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                              {REFEICOES_CONFIG.find(ref => ref.key === item.refeicao)?.label}
                            </span>
                          </div>
                        ))
                      )}

                      {cardapioResidente.length > 3 && (
                        <p className="text-xs text-odara-primary text-center">
                          +{cardapioResidente.length - 3} refeições
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Atividades */}
        <div
          onClick={() => handleClickCartao('ATIVIDADES')}
          className={`bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200 ${visualizacao === "familiar" ? "cursor-pointer hover:border-odara-primary/50 hover:shadow-md transition-all" : ""}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={Palette} tamanho={18} className="text-odara-primary" />
              </div>
              <span>Atividades do Dia</span>
            </h3>
            {visualizacao === "familiar" && (
              <div className="text-xs text-odara-primary font-medium">
                Ver todos
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 max-h-80 overflow-y-auto">
            {dadosParaCartoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum residente vinculado.</p>
            ) : (
              dadosParaCartoes.map((residenteData, index) => {
                const atividadesResidente = residenteData.atividades_dia;

                return (
                  <div
                    key={residenteData.residente.id}
                    className={`pb-4 ${index < dadosParaCartoes.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-odara-dark font-semibold flex items-center gap-2">
                        {residenteData.residente.nome}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {atividadesResidente.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Sem atividades hoje.
                        </p>
                      ) : (
                        atividadesResidente.slice(0, 3).map(atividade => (
                          <div key={atividade.id} className="flex gap-2 items-center text-sm bg-gray-50 p-2 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-odara-dark truncate">{atividade.nome}</p>
                              {atividade.local && (
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {atividade.local}
                                </p>
                              )}
                            </div>

                            <span className="text-xs text-gray-400 flex-shrink-0 bg-white px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
                              {atividade.horario_inicio.slice(0, 5)}
                            </span>
                          </div>
                        ))
                      )}

                      {atividadesResidente.length > 3 && (
                        <p className="text-xs text-odara-primary text-center">
                          +{atividadesResidente.length - 3} atividades
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Consultas */}
        <div
          onClick={() => handleClickCartao('CONSULTAS')}
          className={`bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200 ${visualizacao === "familiar" ? "cursor-pointer hover:border-odara-primary/50 hover:shadow-md transition-all" : ""}`}
        >
          <div className="flex flex-1 justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={CalendarIcon} tamanho={18} className="text-odara-primary" />
              </div>
              <span>Próximas Consultas</span>
            </h3>
            {visualizacao === "familiar" && (
              <div className="text-xs text-odara-primary font-medium">
                Ver todos
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 max-h-80 overflow-y-auto">
            {dadosParaCartoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum residente vinculado.</p>
            ) : (
              dadosParaCartoes.map((residenteData, index) => {
                // Filtrar apenas consultas hoje e futuras
                const consultasFuturas = (residenteData.consultas_semana || [])
                  .filter(c => isDataHojeOuFutura(c.data_consulta));

                return (
                  <div
                    key={residenteData.residente.id}
                    className={`pb-4 ${index < dadosParaCartoes.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-odara-dark font-semibold flex items-center gap-2">
                        {residenteData.residente.nome}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {consultasFuturas.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Nenhuma consulta agendada.
                        </p>
                      ) : (
                        consultasFuturas.slice(0, 3).map(consulta => {
                          const { formatted, color, bg } = formatarDataComCor(consulta.data_consulta);

                          return (
                            <div key={consulta.id} className="flex gap-2 items-center text-sm bg-gray-50 p-2 rounded-lg">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-odara-dark truncate">
                                  {consulta.motivo_consulta || "Consulta"}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <p className="text-xs text-gray-400 truncate">{consulta.medico}</p>
                                </div>
                              </div>

                              <span className={`text-xs flex-shrink-0 ${bg} px-2 py-0.5 rounded-full border ${color} border-gray-200 whitespace-nowrap`}>
                                {formatted}
                                <span className="mx-1">•</span>
                                {consulta.horario.slice(0, 5)}
                              </span>
                            </div>
                          );
                        })
                      )}

                      {consultasFuturas.length > 3 && (
                        <p className="text-xs text-odara-primary text-center">
                          +{consultasFuturas.length - 3} consultas
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Exames */}
        <div
          onClick={() => handleClickCartao('EXAMES')}
          className={`bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200 ${visualizacao === "familiar" ? "cursor-pointer hover:border-odara-primary/50 hover:shadow-md transition-all" : ""}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-odara-dark flex items-center gap-2 text-base">
              <div className="p-2 bg-odara-primary/10 rounded-lg">
                <WrapperIcone icone={Microscope} tamanho={18} className="text-odara-primary" />
              </div>
              <span>Próximos Exames</span>
            </h3>
            {visualizacao === "familiar" && (
              <div className="text-xs text-odara-primary font-medium">
                Ver todos
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 max-h-80 overflow-y-auto">
            {dadosParaCartoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum residente vinculado.</p>
            ) : (
              dadosParaCartoes.map((residenteData, index) => {
                // Filtrar apenas exames hoje e futuros
                const examesFuturos = (residenteData.exames_semana || [])
                  .filter(e => isDataHojeOuFutura(e.data));

                return (
                  <div
                    key={residenteData.residente.id}
                    className={`pb-4 ${index < dadosParaCartoes.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-odara-dark font-semibold flex items-center gap-2">
                        {residenteData.residente.nome}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {examesFuturos.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Nenhum exame agendado.
                        </p>
                      ) : (
                        examesFuturos.slice(0, 3).map(exame => {
                          const { formatted, color, bg } = formatarDataComCor(exame.data);

                          // Determinar cor baseada no status
                          let statusColor = "text-gray-400";
                          let statusBg = "bg-gray-100";

                          if (exame.status === 'realizado') {
                            statusColor = "text-green-500";
                            statusBg = "bg-green-50";
                          } else {
                            statusColor = "text-gray-400";
                            statusBg = "bg-gray-100";
                          }

                          return (
                            <div key={exame.id} className="flex gap-2 items-center text-sm bg-gray-50 p-2 rounded-lg">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-odara-dark truncate">
                                  {exame.tipo}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <p className="text-xs text-gray-400 truncate">
                                    {exame.laboratorio || "Laboratório"}
                                  </p>
                                </div>
                              </div>

                              <span className={`text-xs flex-shrink-0 ${bg} px-2 py-0.5 rounded-full border ${color} border-gray-200 whitespace-nowrap`}>
                                {formatted}
                                <span className="mx-1">•</span>
                                {exame.horario.slice(0, 5)}
                              </span>
                            </div>
                          );
                        })
                      )}

                      {examesFuturos.length > 3 && (
                        <p className="text-xs text-odara-primary text-center">
                          +{examesFuturos.length - 3} exames
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
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