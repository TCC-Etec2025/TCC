import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, ClipboardPlus, HeartPulse, AlertTriangle, Siren, UserRoundSearch, Palette, Apple, Star, Calendar, FileText, UsersRound, Activity, Utensils, Stethoscope, Bell, Info, X, type LucideIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import DataFormatada from '../../components/DataFormatada';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../context/UserContext';

// Interfaces para tipagem
interface BotaoAcao {
  id: number;
  nome: string;
  icone: LucideIcon;
  acao: () => void;
}

interface DadosDashboard {
  checklists: number;
  residentes: number;
}

type Alertas = {
  medicamentos: MedicamentosAlerta[];
  atividades: AtividadesAlerta[];
  alimentacao: AlimentacaoAlerta[];
  consultas: ConsultasAlerta[];
  contagens?: {
    medicamentos: number;
    atividades: number;
    alimentacao: number;
    consultas: number;
  }
};

type MedicamentosAlerta = {
  residente: string;
  medicamento: string;
  data_prevista: string;
  horario_previsto: string;
}

type AtividadesAlerta = {
  atividade: string;
  data: string;
  horario_inicio: string;
}

type AlimentacaoAlerta = {
  residente: string;
  refeicao: string;
  data: string;
  horario: string;
}

type ConsultasAlerta = {
  residente: string;
  data_consulta: string;
  horario: string;
}

const FuncionarioDashboard = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [acaoSelecionada, setAcaoSelecionada] = useState<BotaoAcao | null>(null);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [alertaSelecionado, setAlertaSelecionado] = useState<MedicamentosAlerta[] | AtividadesAlerta[] | AlimentacaoAlerta[] | ConsultasAlerta[] | null>(null);
  const [dadosDashboard, setDadosDashboard] = useState<DadosDashboard | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);
  const { usuario } = useUser();

  // Estados para notificações
  const [notificacoesAbertas, setNotificacoesAbertas] = useState<boolean>(false);
  const [alertas, setAlertas] = useState<Alertas | null>(null);

  // Wrapper para ícones com configurações padrão
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

  // Função para abrir modal com detalhes do item
  const abrirModal = (item: MedicamentosAlerta[] | AtividadesAlerta[] | AlimentacaoAlerta[] | ConsultasAlerta[]) => {
    setAlertaSelecionado(item);
    setModalAberto(true);
    // Fechar painel de notificações no mobile
    if (window.innerWidth < 640) {
      setNotificacoesAbertas(false);
    }
  };

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setAlertaSelecionado(null);
  };

  // Efeito para simular carregamento de dados
    useEffect(() => {
      const carregarDadosDashboard = async () => {
        setCarregando(true);
        try {
          const { data, error } = await supabase
            .rpc('resumo_checklist_funcionario', {
              p_id_funcionario: usuario?.id,
              p_data: new Date().toISOString().split('T')[0]
            });
  
          if (error) throw error;
          setDadosDashboard(data?.[0] || null);
        } catch (erro) {
          console.error('Erro ao buscar dados do dashboard:', erro);
          toast.error('Erro ao buscar dados do dashboard');
        } finally {
          setCarregando(false);
        }
      };
  
      // Chama a função depois de declará-la
      carregarDadosDashboard();
      buscarAlertas();
    }, [usuario?.id]);

  const buscarAlertas = async () => {
    try {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + 5);
      const dataLimite = agora.toISOString();

      const { data, error } = await supabase
        .rpc('get_alertas_funcionario', {
          p_id_funcionario: usuario?.id,
          p_data_limite: dataLimite
        });

      if (error) throw error;
      setAlertas(data);
    } catch (error) {
      console.error('Erro ao chamar função RPC:', error);
    }
  };

  // Componente de Cabeçalho COM ÍCONE DE NOTIFICAÇÕES
  const CabecalhoDashboard = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark">Dashboard do Funcionário</h1>
          <p className="text-odara-dark/60 text-sm">Controle e monitoramento de atividades</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <WrapperIcone icone={Calendar} tamanho={20} className="text-odara-primary" />
            <span><DataFormatada /></span>
          </div>

          {/* Botão de Notificações no Cabeçalho */}
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
          </button>
        </div>
      </div>
    );
  };

  // Componente de Cartões de Estatísticas - RESPONSIVO
  const CartoesEstatisticas = ({
    checklists,
    residentes
  }: {
    checklists: number;
    residentes: number;
  }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Cartão de Checklists do Dia */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Checklists do Dia</h3>
              <p className="text-2xl sm:text-3xl font-bold text-odara-dark mt-1 sm:mt-2">
                {carregando ? '...' : checklists}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-odara-primary/10 rounded-full">
              <WrapperIcone icone={FileText} tamanho={28} className='text-odara-primary' />
            </div>
          </div>
        </div>

        {/* Cartão de Residentes Atribuídos */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Residentes</h3>
              <p className="text-2xl sm:text-3xl font-bold text-odara-dark mt-1 sm:mt-2">
                {carregando ? '...' : residentes}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-odara-primary/10 rounded-full">
              <WrapperIcone icone={UsersRound} tamanho={28} className='text-odara-primary' />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Ações do Funcionário - RESPONSIVO
  const AcoesFuncionario = () => {
    // Botões para checklists
    const botoesChecklists: BotaoAcao[] = [
      {
        id: 1,
        nome: "Medicamentos",
        icone: Pill,
        acao: () => navigate("/app/funcionario/checklist/medicamentos")
      },
      /*
      {
        id: 2,
        nome: "Exames Médicos",
        icone: Microscope,
        acao: () => navigate("/app/funcionario/checklist/exames/medicos")
      },
      */
      {
        id: 3,
        nome: "Atividades",
        icone: Palette,
        acao: () => navigate("/app/funcionario/checklist/atividades")
      },
      {
        id: 4,
        nome: "Alimentação",
        icone: Apple,
        acao: () => navigate("/app/funcionario/checklist/alimentacao")
      },
    ];

    // Botões para registros
    const botoesRegistros: BotaoAcao[] = [
      {
        id: 5,
        nome: "Ocorrências",
        icone: Siren,
        acao: () => navigate("../admin/registro/ocorrencias")
      },
      {
        id: 6,
        nome: "Preferências",
        icone: Star,
        acao: () => navigate("../admin/registro/preferencias")
      },
      {
        id: 7,
        nome: "Comportamento",
        icone: UserRoundSearch,
        acao: () => navigate("../admin/registro/comportamento")
      },
      {
        id: 8,
        nome: "Saúde",
        icone: HeartPulse,
        acao: () => navigate("../admin/registro/saudeInicial")
      },
      {
        id: 9,
        nome: "Consultas Médicas",
        icone: ClipboardPlus,
        acao: () => navigate("../admin/registro/consultas")
      },
    ];

    const lidarComClique = (botao: BotaoAcao) => {
      setAcaoSelecionada(botao);
      toast.success(`Abrindo ${botao.nome.toLowerCase()}...`);
      botao.acao();
    };

    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-5 border-l-4 border-odara-primary">
        {/* Seção de Checklists */}
        <h2 className="text-lg sm:text-xl font-semibold text-odara-dark mb-3 sm:mb-4">Checklists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {botoesChecklists.map((checklist) => (
            <div
              key={checklist.id}
              onClick={() => lidarComClique(checklist)}
              className={`border border-gray-200 rounded-md p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all duration-200 group 
                ${acaoSelecionada?.id === checklist.id
                  ? "ring-2 ring-odara-primary shadow-sm"
                  : "hover:border-odara-primary/50 hover:bg-odara-primary/5"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 sm:p-3 rounded-lg bg-odara-primary/10 group-hover:bg-odara-primary/20 transition-colors">
                  <WrapperIcone icone={checklist.icone} tamanho={24} className='text-odara-primary' />
                </div>
                <span className="text-xs sm:text-sm font-medium text-odara-dark">
                  {checklist.nome}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Separador */}
        <hr className="border-gray-200 my-4 sm:my-6" />

        {/* Seção de Registros */}
        <h2 className="text-lg sm:text-xl font-semibold text-odara-dark mb-3 sm:mb-4">Registros</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {botoesRegistros.map((registro) => (
            <div
              key={registro.id}
              onClick={() => lidarComClique(registro)}
              className={`border border-gray-200 rounded-md p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all duration-200 group 
                ${acaoSelecionada?.id === registro.id
                  ? "ring-2 ring-odara-primary shadow-sm"
                  : "hover:border-odara-primary/50 hover:bg-odara-primary/5"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 sm:p-3 rounded-lg bg-odara-primary/10 group-hover:bg-odara-primary/20 transition-colors">
                  <WrapperIcone icone={registro.icone} tamanho={24} className='text-odara-primary' />
                </div>
                <span className="text-xs sm:text-sm font-medium text-odara-dark leading-tight">
                  {registro.nome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Componente do Painel de Notificações Flutuante - RESPONSIVO
  const PainelNotificacoes = () => {
    if (!notificacoesAbertas) return null;

    const totalAlertas = (alertas?.contagens?.alimentacao || 0) + (alertas?.contagens?.consultas || 0) + (alertas?.contagens?.medicamentos || 0) + (alertas?.contagens?.atividades || 0);

    return (
      <>
        {/* Overlay para mobile */}
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setNotificacoesAbertas(false)}
        />

        {/* Painel de Notificações */}
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200
            // Mobile: tela cheia no fundo
            inset-x-0 bottom-0 top-16
            // Tablet: tela cheia ajustada
            sm:inset-auto sm:right-4 sm:top-20 sm:max-w-sm sm:w-full
            // Desktop: painel flutuante
            lg:max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho do Painel */}
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-odara-primary rounded-lg">
                  <WrapperIcone icone={Bell} tamanho={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-odara-dark">Notificações</h3>
                </div>
              </div>
              <button
                onClick={() => setNotificacoesAbertas(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar notificações"
              >
                <WrapperIcone icone={X} tamanho={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Corpo do Painel com scroll */}
          <div className="overflow-y-auto h-[calc(100%-140px)] sm:h-[calc(60vh)]">
            {/* Alertas Urgentes */}
            {totalAlertas > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-odara-dark flex items-center gap-2">
                    <WrapperIcone icone={AlertTriangle} tamanho={16} className="text-odara-primary" />
                    Alertas Urgentes 
                  </h4>
                </div>
                <div className="space-y-3">
                  {alertas && (['medicamentos', 'atividades', 'alimentacao', 'consultas'] as const).map((key) => {
                    const value = alertas?.contagens?.[key];
                    if ((value || 0) > 0) {
                      return (
                        <div
                          key={key}
                          onClick={() => abrirModal(alertas[key])}
                          className="p-3 border border-odara-primary/20 rounded-lg hover:bg-odara-primary/5 active:bg-odara-primary/10 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <p className="text-sm font-medium text-odara-dark mb-1 line-clamp-2">
                                {(key === 'medicamentos') ? (
                                  `${value} administrações de medicamentos pendentes`
                                ) : (key === 'atividades') ? (
                                  `${value} atividades não iniciadas`
                                ) : (key === 'alimentacao') ? (
                                  `${value} refeições atrasadas`
                                ) : (key === 'consultas') ? (
                                  `${value} consultas médicas próximas`
                                ) : null}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Mensagem quando não há notificações */}
            {totalAlertas === 0 && (
              <div className="p-8 text-center">
                <div className="p-4 bg-odara-primary/10 rounded-full inline-block mb-3">
                  <WrapperIcone icone={Bell} tamanho={24} className="text-odara-primary" />
                </div>
                <p className="text-gray-500 font-medium">Sem notificações pendentes</p>
                <p className="text-gray-400 text-sm mt-1">Todas as notificações foram lidas</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Componente do Modal de Detalhes - TOTALMENTE RESPONSIVO
  const ModalDetalhes = () => {
    // Verifica se há dados para exibir
    if (!modalAberto || !alertaSelecionado || (Array.isArray(alertaSelecionado) && alertaSelecionado.length === 0)) return null;

    // Função auxiliar para determinar o título e ícone com base no tipo de dado (Duck Typing)
    const getConfig = () => {
      const item = Array.isArray(alertaSelecionado) ? alertaSelecionado[0] : alertaSelecionado;

      if ('medicamento' in item) return { titulo: 'Medicamentos Pendentes', icone: AlertTriangle, cor: 'bg-red-500' };
      if ('atividade' in item) return { titulo: 'Atividades Pendentes', icone: Activity, cor: 'bg-blue-500' };
      if ('refeicao' in item) return { titulo: 'Alimentação Pendentes', icone: Utensils, cor: 'bg-orange-500' };
      if ('data_consulta' in item) return { titulo: 'Consultas Médicas Pendentes', icone: Stethoscope, cor: 'bg-purple-500' };

      return { titulo: 'Detalhes', icone: Info, cor: 'bg-odara-primary' };
    };

    const config = getConfig();
    const listaItens = Array.isArray(alertaSelecionado) ? alertaSelecionado : [alertaSelecionado];

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/30 z-50"
          onClick={fecharModal}
        />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${config.cor}`}>
                  <WrapperIcone
                    className="text-white"
                    icone={config.icone}
                    tamanho={20}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-odara-dark truncate">
                    {config.titulo}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {listaItens.length} {listaItens.length === 1 ? 'item pendente' : 'itens pendentes'}
                  </p>
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2 shrink-0"
                aria-label="Fechar"
              >
                <WrapperIcone icone={X} tamanho={20} className="text-gray-500" />
              </button>
            </div>

            {/* Corpo do Modal com scroll - Renderização Condicional */}
            <div className="overflow-y-auto flex-1 p-4">
              <ul className="space-y-3">
                {listaItens.map((item: MedicamentosAlerta | AtividadesAlerta | AlimentacaoAlerta | ConsultasAlerta, index: number) => {

                  // Renderização: MEDICAMENTOS
                  if ('medicamento' in item) {
                    return (
                      <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-odara-dark">{item.medicamento}</span>
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            {item.horario_previsto.slice(0, 5)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Residente: <span className="font-medium">{item.residente}</span></p>
                        <p className="text-xs text-gray-400 mt-1">Data: {item.data_prevista.split('-').reverse().join('/')}</p>
                      </li>
                    );
                  }

                  // Renderização: ATIVIDADES
                  if ('atividade' in item) {
                    return (
                      <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-odara-dark">{item.atividade}</span>
                          <div className="text-right">
                            <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {item.horario_inicio.slice(0, 5)}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{item.data.split('-').reverse().join('/')}</div>
                          </div>
                        </div>
                      </li>
                    );
                  }

                  // Renderização: ALIMENTAÇÃO
                  if ('refeicao' in item) {
                    return (
                      <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-odara-dark">{item.refeicao}</span>
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                            {item.horario.slice(0, 5)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Residente: <span className="font-medium">{item.residente}</span></p>
                      </li>
                    );
                  }

                  // Renderização: CONSULTAS
                  if ('data_consulta' in item) {
                    return (
                      <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-odara-dark">Consulta Médica</span>
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            {item.horario.slice(0, 5)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Residente: <span className="font-medium">{item.residente}</span></p>
                        <p className="text-xs text-gray-400 mt-1">Data: {item.data_consulta.split('-').reverse().join('/')}</p>
                      </li>
                    );
                  }

                  return null;
                })}
              </ul>
            </div>

            {/* Rodapé do Modal */}
            <div className="border-t p-4">
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={fecharModal}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-odara-primary rounded-lg hover:bg-odara-primary/90 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              color: '#00c950',
              border: '1px solid #00c950',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#fdecec',
              color: '#f65c5a',
              border: '1px solid #f65c5a',
            },
          },
        }}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <CabecalhoDashboard />

        <div className="space-y-4 sm:space-y-6">
          <CartoesEstatisticas
            checklists={dadosDashboard?.checklists ?? 0}
            residentes={dadosDashboard?.residentes ?? 0}
          />

          <AcoesFuncionario />
        </div>
      </div>

      <PainelNotificacoes />
      <ModalDetalhes />
    </div>
  );
};

export default FuncionarioDashboard;