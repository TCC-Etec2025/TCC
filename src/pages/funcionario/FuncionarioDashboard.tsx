import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Microscope, Stethoscope, Hospital, AlertTriangle, BarChart as BarChartIcon, ClipboardList, Utensils, Star, Calendar, FileText, Users, Bell, Info, Eye, X } from 'lucide-react';
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
  };

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setItemSelecionado(null);
  };

  // Função para marcar item como lido
  const marcarComoLido = () => {
    if (itemSelecionado) {
      console.log(`Item marcado como lido: ${itemSelecionado.texto}`);
      toast.success('Notificação marcada como lida!');
      fecharModal();
    }
  };

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

  // Componente de Cabeçalho
  const CabecalhoDashboard = () => {
    return (
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-odara-dark">Dashboard do Funcionário</h1>
          <p className="text-odara-dark/60 text-sm">Controle e monitoramento de atividades</p>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <WrapperIcone icone={Calendar} tamanho={20} className="text-odara-primary" />
          <span><DataFormatada /></span>
        </div>
      </div>
    );
  };

  // Componente de Cartões de Estatísticas
  const CartoesEstatisticas = ({
    checklistDia,
    residentesAtribuidos
  }: {
    checklistDia: number;
    residentesAtribuidos: number;
  }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cartão de Checklists do Dia */}
        <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Checklists do Dia</h3>
              <p className="text-3xl font-bold text-odara-dark mt-2">
                {checklistDia}
              </p>
              <p className="text-sm font-medium text-yellow-400">+5 Checklists Pendentes</p>
            </div>
            <div className="p-3 rounded-full">
              <WrapperIcone icone={FileText} tamanho={32} className='text-odara-primary' />
            </div>
          </div>
        </div>

        {/* Cartão de Residentes Atribuídos */}
        <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Residentes Atribuídos</h3>
              <p className="text-3xl font-bold text-odara-dark mt-2">
                {residentesAtribuidos}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total: 12 residentes</p>
            </div>
            <div className="p-3 rounded-full">
              <WrapperIcone icone={Users} tamanho={32} className='text-odara-primary' />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Ações do Funcionário
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
        nome: "Exames médicos",
        icone: Microscope,
        acao: () => navigate("/app/funcionario/checklist/exames/medicos")
      },
      {
        id: 3,
        nome: "Consultas médicas",
        icone: Stethoscope,
        acao: () => navigate("/app/funcionario/checklist/consultas/medicas")
      },
      {
        id: 4,
        nome: "Atividades",
        icone: ClipboardList,
        acao: () => navigate("/app/funcionario/checklist/atividades")
      },
      {
        id: 5,
        nome: "Alimentação",
        icone: Utensils,
        acao: () => navigate("/app/funcionario/checklist/alimentacao")
      },
    ];

    // Botões para registros
    const botoesRegistros: BotaoAcao[] = [
      {
        id: 6,
        nome: "Registro de ocorrências",
        icone: AlertTriangle,
        acao: () => navigate("../admin/registro/ocorrencias")
      },
      {
        id: 7,
        nome: "Registro de preferências",
        icone: Star,
        acao: () => navigate("../admin/registro/preferencias")
      },
      {
        id: 8,
        nome: "Registro de comportamento",
        icone: BarChartIcon,
        acao: () => navigate("../admin/registro/comportamento")
      },
      {
        id: 9,
        nome: "Registro da saúde corporal",
        icone: Hospital,
        acao: () => navigate("../admin/registro/saudeInicial")
      },
    ];

    const lidarComClique = (botao: BotaoAcao) => {
      setAcaoSelecionada(botao);
      toast.success(`Abrindo ${botao.nome.toLowerCase()}...`);
      botao.acao();
    };

    return (
      <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-odara-primary">
        {/* Seção de Checklists */}
        <h2 className="text-xl font-semibold text-odara-dark mb-4">Checklists</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {botoesChecklists.map((checklist) => (
            <div
              key={checklist.id}
              onClick={() => lidarComClique(checklist)}
              className={`border border-gray-200 rounded-md p-4 cursor-pointer hover:shadow-md transition-all duration-200 group 
                ${acaoSelecionada?.id === checklist.id
                  ? "ring-2 ring-odara-primary shadow-sm"
                  : "hover:border-odara-primary/50 hover:bg-odara-primary/5"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-lg bg-odara-primary/10 group-hover:bg-odara-primary/20 transition-colors">
                  <WrapperIcone icone={checklist.icone} tamanho={28} className='text-odara-primary' />
                </div>
                <span className="text-sm font-medium text-odara-dark">
                  {checklist.nome}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Separador */}
        <hr className="border-gray-200 my-6" />

        {/* Seção de Registros */}
        <h2 className="text-xl font-semibold text-odara-dark mb-4">Registros</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {botoesRegistros.map((registro) => (
            <div
              key={registro.id}
              onClick={() => lidarComClique(registro)}
              className={`border border-gray-200 rounded-md p-4 cursor-pointer hover:shadow-md transition-all duration-200 group 
                ${acaoSelecionada?.id === registro.id
                  ? "ring-2 ring-odara-primary shadow-sm"
                  : "hover:border-odara-primary/50 hover:bg-odara-primary/5"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-lg bg-odara-primary/10 group-hover:bg-odara-primary/20 transition-colors">
                  <WrapperIcone icone={registro.icone} tamanho={28} className='text-odara-primary' />
                </div>
                <span className="text-sm font-medium text-odara-dark">
                  {registro.nome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Componente de Alertas e Notificações
  const AlertasNotificacoes = () => {
    // Dados mockados para alertas
    const alertas: ItemAlertaNotificacao[] = [
      {
        id: 1,
        texto: "Checklist pendente para 3 funcionários",
        tipo: "alerta",
        hora: "09:30",
        detalhes: {
          titulo: "Checklists Pendentes - Detalhes",
          descricao: "Existem 3 funcionários com checklists pendentes para hoje:",
          lista: [
            "João Silva - Checklist de segurança",
            "Maria Santos - Checklist de equipamentos",
            "Pedro Oliveira - Checklist de limpeza"
          ],
          acaoRecomendada: "Verificar com a equipe a conclusão dos checklists até o final do expediente."
        }
      },
      {
        id: 3,
        texto: "5 novos checklists atribuídos",
        tipo: "alerta",
        hora: "07:45",
        detalhes: {
          titulo: "Novos Checklists Atribuídos",
          descricao: "Foram atribuídos 5 novos checklists para sua equipe:",
          lista: [
            "Checklist de segurança - Área A",
            "Checklist de equipamentos - Turno manhã",
            "Checklist de qualidade - Produto X",
            "Checklist de limpeza - Cozinha",
            "Checklist de manutenção - Equipamento Y"
          ],
          acaoRecomendada: "Distribuir os checklists entre os funcionários disponíveis."
        }
      },
    ];

    // Dados mockados para notificações
    const notificacoes: ItemAlertaNotificacao[] = [
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
        }
      },
      {
        id: 4,
        texto: "Relatório mensal devido sexta-feira",
        tipo: "info",
        hora: "Ontem",
        detalhes: {
          titulo: "Relatório Mensal - Prazo",
          descricao: "O relatório mensal de atividades está com prazo para sexta-feira.",
          lista: [
            "Tipo: Relatório Mensal de Atividades",
            "Prazo: Sexta-feira, 17:00",
            "Formato: Planilha padrão",
            "Envio: Sistema interno"
          ],
          acaoRecomendada: "Iniciar a compilação dos dados com antecedência."
        }
      },
      {
        id: 5,
        texto: "Atualização no sistema de checklist",
        tipo: "info",
        hora: "10:00",
        detalhes: {
          titulo: "Atualização do Sistema",
          descricao: "O sistema de checklist foi atualizado com novas funcionalidades:",
          lista: [
            "Nova interface de usuário",
            "Relatórios em tempo real",
            "Exportação em PDF",
            "Notificações push"
          ],
          acaoRecomendada: "Familiarizar-se com as novas funcionalidades."
        }
      },
    ];

    return (
      <div className="bg-white rounded-2xl shadow p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <WrapperIcone icone={Bell} className='text-odara-accent' />
          <h2 className="text-xl font-semibold text-odara-dark">Alertas e Notificações</h2>
        </div>

        {/* Seção de Alertas */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-odara-dark">Alertas</h3>
            <span className="bg-odara-alerta/10 text-odara-alerta text-xs px-2 py-1 rounded-full">
              {alertas.length}
            </span>
          </div>
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="p-3 rounded-lg border-l-2 border-odara-alerta bg-odara-alerta/10">
                <div className="flex items-start gap-2">
                  <WrapperIcone icone={AlertTriangle} tamanho={20} className='text-odara-alerta' />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-odara-dark">{alerta.texto}</p>
                    <p className="text-xs text-gray-500 mt-1">{alerta.hora}</p>
                  </div>
                  <button
                    onClick={() => abrirModal(alerta)}
                    className="text-gray-400 hover:text-odara-dark transition-colors"
                    title="Ver detalhes"
                  >
                    <WrapperIcone icone={Eye} tamanho={16} className='text-odara-accent' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Seção de Notificações */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-odara-dark">Notificações</h3>
            <span className="bg-odara-dropdown/50 text-odara-dropdown-accent text-xs px-2 py-1 rounded-full">
              {notificacoes.length}
            </span>
          </div>
          <div className="space-y-3">
            {notificacoes.map((notificacao) => (
              <div key={notificacao.id} className="p-3 rounded-lg border-l-2 border-odara-dropdown-accent bg-odara-dropdown/50">
                <div className="flex items-start gap-2">
                  <WrapperIcone icone={Info} tamanho={20} className='text-odara-dropdown-accent' />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-odara-dark">{notificacao.texto}</p>
                    <p className="text-xs text-gray-500 mt-1">{notificacao.hora}</p>
                  </div>
                  <button
                    onClick={() => abrirModal(notificacao)}
                    className="text-gray-400 hover:text-odara-dark transition-colors"
                    title="Ver detalhes"
                  >
                    <WrapperIcone icone={Eye} tamanho={16} className='text-odara-secondary' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Componente do Modal de Detalhes
  const ModalDetalhes = () => {
    if (!modalAberto || !itemSelecionado) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Cabeçalho do Modal */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-odara-dark">
              {itemSelecionado.detalhes.titulo}
            </h3>
            <button
              onClick={fecharModal}
              className="transition-colors"
            >
              <WrapperIcone icone={X} tamanho={24} className='text-odara-accent hover:text-odara-secondary' />
            </button>
          </div>

          {/* Corpo do Modal */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${itemSelecionado.tipo === 'alerta' ? 'bg-odara-alerta/10' : 'bg-odara-dropdown/50'}`}>
                <WrapperIcone
                  className={itemSelecionado.tipo === 'alerta' ? 'text-odara-alerta' : 'text-odara-dropdown-accent'}
                  icone={itemSelecionado.tipo === 'alerta' ? AlertTriangle : Info}
                  tamanho={20}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">{itemSelecionado.detalhes.descricao}</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-odara-dark mb-2">Detalhes:</h4>
              <ul className="space-y-2">
                {itemSelecionado.detalhes.lista.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 ${itemSelecionado.tipo === 'alerta' ? 'bg-odara-alerta' : 'bg-odara-dropdown-accent'}`}></div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`p-3 rounded-lg ${itemSelecionado.tipo === 'alerta' ? 'bg-odara-alerta/10 border border-odara-alerta' : 'bg-odara-dropdown/50 border border-odara-dropdown-accent'}`}>
              <h4 className={`font-medium text-sm mb-1 ${itemSelecionado.tipo === 'alerta' ? 'text-odara-alerta' : 'text-odara-dropdown-accent'}`}>
                Ação Recomendada:
              </h4>
              <p className={`text-sm ${itemSelecionado.tipo === 'alerta' ? 'text-odara-dark' : 'text-odara-name'}`}>
                {itemSelecionado.detalhes.acaoRecomendada}
              </p>
            </div>
          </div>

          {/* Rodapé do Modal */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={fecharModal}
              className="px-4 py-2 text-sm font-medium text-odara-primary bg-odara-white border-2 border-odara-primary rounded-lg hover:bg-odara-primary hover:text-odara-white transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={marcarComoLido}
              className={'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-odara-accent hover:bg-odara-secondary'}
            >
              Marcar como Lida
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      {/* Toaster configurado para renderizar apenas uma vez */}
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

      <div className="flex-1 p-6 lg:p-8">
        <CabecalhoDashboard />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <CartoesEstatisticas
              checklistDia={dadosDashboard.checklistDia}
              residentesAtribuidos={dadosDashboard.residentesAtribuidos}
            />

            <AcoesFuncionario />
          </div>

          <div className="lg:col-span-1">
            <AlertasNotificacoes />
          </div>
        </div>
      </div>

      <ModalDetalhes />
    </div>
  );
};

export default FuncionarioDashboard;