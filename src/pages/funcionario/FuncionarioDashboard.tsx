import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Microscope, ClipboardPlus, HeartPulse, AlertTriangle, Siren, UserRoundSearch, Palette, Apple, Star, Calendar, FileText, UsersRound, Bell, Info, Eye, X, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import DataFormatada from '../../components/DataFormatada';

// Interfaces para tipagem
interface DetalhesItem {
  titulo: string;
  descricao: string;
  lista: string[];
  acaoRecomendada: string;
}

interface ItemAlertaNotificacao {
  id: number;
  texto: string;
  tipo: 'alerta' | 'info';
  hora: string;
  detalhes: DetalhesItem;
  lido?: boolean;
}

interface BotaoAcao {
  id: number;
  nome: string;
  icone: React.ComponentType<any>;
  acao: () => void;
}

const FuncionarioDashboard = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [acaoSelecionada, setAcaoSelecionada] = useState<BotaoAcao | null>(null);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemAlertaNotificacao | null>(null);
  const [dadosDashboard, setDadosDashboard] = useState({
    checklistDia: 15,
    residentesAtribuidos: 8,
  });
  const [carregando, setCarregando] = useState<boolean>(false);
  
  // Estados para notificações
  const [notificacoesAbertas, setNotificacoesAbertas] = useState<boolean>(false);
  const [alertas, setAlertas] = useState<ItemAlertaNotificacao[]>([
    {
      id: 1,
      texto: "Checklist de medicamentos pendente",
      tipo: "alerta",
      hora: "09:30",
      detalhes: {
        titulo: "Checklist Pendente",
        descricao: "Checklist de medicamentos está pendente para 2 residentes:",
        lista: [
          "Maria Silva - Medicamento às 10:00",
          "João Santos - Medicamento às 14:00"
        ],
        acaoRecomendada: "Realizar o checklist de medicamentos o mais breve possível."
      },
      lido: false
    },
    {
      id: 3,
      texto: "Atividade física cancelada hoje",
      tipo: "alerta",
      hora: "08:15",
      detalhes: {
        titulo: "Atividade Cancelada",
        descricao: "A atividade física programada para hoje foi cancelada:",
        lista: [
          "Atividade: Fisioterapia em grupo",
          "Horário: 10:00 - 11:00",
          "Motivo: Profissional de saúde ausente"
        ],
        acaoRecomendada: "Informar aos residentes e reorganizar a agenda."
      },
      lido: false
    },
  ]);
  
  const [notificacoes, setNotificacoes] = useState<ItemAlertaNotificacao[]>([
    {
      id: 2,
      texto: "Reunião de equipe às 14:00",
      tipo: "info",
      hora: "08:15",
      detalhes: {
        titulo: "Reunião de Equipe",
        descricao: "Reunião agendada para hoje às 14:00 na sala de reuniões principal.",
        lista: [
          "Horário: 14:00 - 15:30",
          "Local: Sala de Reuniões Principal",
          "Pauta: Revisão mensal de métricas",
          "Participantes: Equipe completa"
        ],
        acaoRecomendada: "Confirmar presença e preparar relatórios solicitados."
      },
      lido: false
    },
    {
      id: 4,
      texto: "Novo residente atribuído",
      tipo: "info",
      hora: "Ontem",
      detalhes: {
        titulo: "Novo Residente Atribuído",
        descricao: "Você foi atribuído para cuidar de um novo residente:",
        lista: [
          "Nome: Carlos Alberto",
          "Quarto: 201",
          "Necessidades especiais: Cadeirante",
          "Responsável: Ana Silva"
        ],
        acaoRecomendada: "Revisar o prontuário do residente antes do primeiro atendimento."
      },
      lido: false
    },
    {
      id: 5,
      texto: "Treinamento de primeiros socorros",
      tipo: "info",
      hora: "10:00",
      detalhes: {
        titulo: "Treinamento Agendado",
        descricao: "Treinamento de primeiros socorros agendado para próxima semana:",
        lista: [
          "Data: Segunda-feira, 10:00",
          "Local: Sala de Treinamento",
          "Duração: 4 horas",
          "Instrutor: Dr. Roberto"
        ],
        acaoRecomendada: "Confirmar presença no sistema interno."
      },
      lido: false
    },
  ]);

  // Wrapper para ícones com configurações padrão
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

  // Função para abrir modal com detalhes do item
  const abrirModal = (item: ItemAlertaNotificacao) => {
    setItemSelecionado(item);
    setModalAberto(true);
    // Fechar painel de notificações no mobile
    if (window.innerWidth < 640) {
      setNotificacoesAbertas(false);
    }
    // Marcar como lido ao abrir
    if (!item.lido) {
      if (item.tipo === 'alerta') {
        setAlertas(prev => prev.map(a => a.id === item.id ? { ...a, lido: true } : a));
      } else {
        setNotificacoes(prev => prev.map(n => n.id === item.id ? { ...n, lido: true } : n));
      }
    }
  };

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setItemSelecionado(null);
  };

  // Função para marcar item como lido
  const marcarComoLido = (item: ItemAlertaNotificacao) => {
    if (item.tipo === 'alerta') {
      setAlertas(prev => prev.map(a => a.id === item.id ? { ...a, lido: true } : a));
    } else {
      setNotificacoes(prev => prev.map(n => n.id === item.id ? { ...n, lido: true } : n));
    }
    toast.success('Notificação marcada como lida!');
    fecharModal();
  };

  // Função para marcar todas como lidas
  const marcarTodasComoLidas = () => {
    setAlertas(prev => prev.map(a => ({ ...a, lido: true })));
    setNotificacoes(prev => prev.map(n => ({ ...n, lido: true })));
    toast.success('Todas as notificações marcadas como lidas!');
    setNotificacoesAbertas(false);
  };

  // Contadores
  const alertasNaoLidos = alertas.filter(a => !a.lido).length;
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lido).length;
  const totalNaoLidas = alertasNaoLidos + notificacoesNaoLidas;

  // Efeito para simular carregamento de dados
  useEffect(() => {
    const carregarDadosDashboard = async () => {
      try {
        setCarregando(true);
        // Simular carregamento de dados
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Dashboard carregado com sucesso!');
      } catch (erro: any) {
        console.error('Erro ao carregar dashboard:', erro);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setCarregando(false);
      }
    };

    carregarDadosDashboard();
  }, []);

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
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-odara-primary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {totalNaoLidas}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Componente de Cartões de Estatísticas - RESPONSIVO
  const CartoesEstatisticas = ({
    checklistDia,
    residentesAtribuidos
  }: {
    checklistDia: number;
    residentesAtribuidos: number;
  }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Cartão de Checklists do Dia */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Checklists do Dia</h3>
              <p className="text-2xl sm:text-3xl font-bold text-odara-dark mt-1 sm:mt-2">
                {carregando ? '...' : checklistDia}
              </p>
              <p className="text-xs sm:text-sm font-medium text-gray-400 mt-1">+5 Pendentes</p>
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
              <h3 className="text-sm font-medium text-gray-500">Residentes Atribuídos</h3>
              <p className="text-2xl sm:text-3xl font-bold text-odara-dark mt-1 sm:mt-2">
                {carregando ? '...' : residentesAtribuidos}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total: 12 residentes</p>
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
      {
        id: 2,
        nome: "Exames Médicos",
        icone: Microscope,
        acao: () => navigate("/app/funcionario/checklist/exames/medicos")
      },
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
                  <p className="text-sm text-gray-500">
                    {totalNaoLidas > 0 
                      ? `${totalNaoLidas} não lida${totalNaoLidas !== 1 ? 's' : ''}`
                      : 'Todas lidas'}
                  </p>
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
            {alertasNaoLidos > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-odara-dark flex items-center gap-2">
                    <WrapperIcone icone={AlertTriangle} tamanho={16} className="text-odara-primary" />
                    Alertas Urgentes ({alertasNaoLidos})
                  </h4>
                </div>
                <div className="space-y-3">
                  {alertas.filter(a => !a.lido).map((alerta) => (
                    <div
                      key={alerta.id}
                      onClick={() => abrirModal(alerta)}
                      className="p-3 border border-odara-primary/20 rounded-lg hover:bg-odara-primary/5 active:bg-odara-primary/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium text-odara-dark mb-1 line-clamp-2">
                            {alerta.texto}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{alerta.hora}</span>
                            <ChevronRight size={14} className="text-odara-primary flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notificações Gerais */}
            {notificacoesNaoLidas > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-odara-dark flex items-center gap-2">
                    <WrapperIcone icone={Info} tamanho={16} className="text-odara-primary" />
                    Informações ({notificacoesNaoLidas})
                  </h4>
                </div>
                <div className="space-y-3">
                  {notificacoes.filter(n => !n.lido).map((notificacao) => (
                    <div
                      key={notificacao.id}
                      onClick={() => abrirModal(notificacao)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium text-odara-dark mb-1 line-clamp-2">
                            {notificacao.texto}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{notificacao.hora}</span>
                            <ChevronRight size={14} className="text-odara-primary flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem quando não há notificações */}
            {totalNaoLidas === 0 && (
              <div className="p-8 text-center">
                <div className="p-4 bg-odara-primary/10 rounded-full inline-block mb-3">
                  <WrapperIcone icone={Bell} tamanho={24} className="text-odara-primary" />
                </div>
                <p className="text-gray-500 font-medium">Sem notificações pendentes</p>
                <p className="text-gray-400 text-sm mt-1">Todas as notificações foram lidas</p>
              </div>
            )}
          </div>

          {/* Rodapé do Painel */}
          {totalNaoLidas > 0 && (
            <div className="border-t border-gray-200 p-4 sticky bottom-0 bg-white">
              <button
                onClick={marcarTodasComoLidas}
                className="w-full py-3 text-sm font-medium text-odara-primary bg-odara-primary/10 rounded-lg hover:bg-odara-primary/20 active:bg-odara-primary/30 transition-colors"
              >
                Marcar todas como lidas
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  // Componente do Modal de Detalhes - TOTALMENTE RESPONSIVO
  const ModalDetalhes = () => {
    if (!modalAberto || !itemSelecionado) return null;

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
                <div className="p-2 bg-odara-primary rounded-lg flex-shrink-0">
                  <WrapperIcone
                    className="text-white"
                    icone={itemSelecionado.tipo === 'alerta' ? AlertTriangle : Info}
                    tamanho={20}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-odara-dark truncate">
                    {itemSelecionado.detalhes.titulo}
                  </h3>
                  <p className="text-xs text-gray-500">{itemSelecionado.hora}</p>
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2 flex-shrink-0"
                aria-label="Fechar"
              >
                <WrapperIcone icone={X} tamanho={20} className="text-gray-500" />
              </button>
            </div>

            {/* Corpo do Modal com scroll */}
            <div className="overflow-y-auto flex-1 p-4">
              {/* Descrição */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {itemSelecionado.detalhes.descricao}
                </p>
              </div>

              {/* Lista de detalhes */}
              {itemSelecionado.detalhes.lista && itemSelecionado.detalhes.lista.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-odara-dark mb-2 text-sm">Detalhes:</h4>
                  <ul className="space-y-2">
                    {itemSelecionado.detalhes.lista.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                        <div className="w-1.5 h-1.5 rounded-full bg-odara-primary mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ação Recomendada */}
              <div className="p-3 bg-odara-primary/5 border border-odara-primary/20 rounded-lg">
                <h4 className="font-medium text-odara-dark mb-1 text-sm">
                  Ação Recomendada:
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {itemSelecionado.detalhes.acaoRecomendada}
                </p>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="border-t p-4">
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={fecharModal}
                  className="px-4 py-2.5 text-sm font-medium text-odara-primary hover:text-odara-primary/80 transition-colors order-2 sm:order-1"
                >
                  Fechar
                </button>
                {!itemSelecionado.lido && (
                  <button
                    onClick={() => marcarComoLido(itemSelecionado)}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-odara-primary rounded-lg hover:bg-odara-primary/90 active:bg-odara-primary/95 transition-colors order-1 sm:order-2"
                  >
                    Marcar como Lida
                  </button>
                )}
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
            checklistDia={dadosDashboard.checklistDia}
            residentesAtribuidos={dadosDashboard.residentesAtribuidos}
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