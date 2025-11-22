import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Microscope, Stethoscope, AlertTriangle, ClipboardList, Calendar, Utensils, FileText, Users, Bell, Info, Eye, Plus, X } from "lucide-react";

import { supabase } from '../../lib/supabaseClient';

import DataFormatada from '../../components/DataFormatada';

const AdminDashboard = () => {
  {/* 
  const statusColors: Record<ActivityStatus, string> = {
    info: 'bg-gray-100 text-gray-500',
    success: 'bg-green-100 text-green-500',
    warning: 'bg-red-100 text-red-500',
  };

  const statusIcons: Record<ActivityStatus, React.ReactNode> = {
    info: <LuCircleCheck className="h-5 w-5" />,
    success: <LuCircleCheck className="h-5 w-5" />,
    warning: <LuCircleAlert className="h-5 w-5" />,
  };
  */}
  
  const [acaoSelecionada, setAcaoSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [numeroIdosos, setNumeroIdosos] = useState(0);
  const [numeroColaboradores, setNumeroColaboradores] = useState(0);

  const IconWrapper = ({ icon: Icon, size = 24, className = "" }) => (
    <Icon size={size} className={`${className}`} />
  );

  const abrirModal = (item) => {
    setItemSelecionado(item);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setItemSelecionado(null);
  };

  useEffect(() => {
    const numeroPessoas = async () => {
      const [
        { count: idososCount, error: idososError },
        { count: colaboradoresCount, error: colaboradoresError }
      ] = await Promise.all([
        supabase.from('residente').select('*', { count: 'exact', head: true }),
        supabase.from('funcionario').select('*', { count: 'exact', head: true }),
        supabase.from('funcionario').select('id, idosos!left(id)', { count: 'exact', head: true })
      ]);

      if (!idososError) setNumeroIdosos(idososCount ?? 0);
      if (!colaboradoresError) setNumeroColaboradores(colaboradoresCount ?? 0);
    };

    numeroPessoas();
  }, []);

  // Componente de cabeçalho
  function Header() {
    return (
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-odara-dark">Dashboard Administrativo</h1>
          <p className="text-odara-dark/60 text-sm">Visão geral e controle do sistema ILPI</p>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
            <IconWrapper icon={Calendar} size={20} className="text-odara-primary" />
            <span><DataFormatada /></span>
        </div>
      </div>
    );
  }

  // Componente para os cartões de estatísticas
  interface StatsCardsProps {
    numeroIdosos: number;
    numeroColaboradores: number;
  }

  function StatsCards({ numeroIdosos, numeroColaboradores }: StatsCardsProps) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Residentes Ativos</h3>
                <p className="text-3xl font-bold text-odara-dark mt-2">
                  {numeroIdosos}
                </p>
              </div>
              <div className="p-3 rounded-full">
                <IconWrapper icon={FileText} size={32} className='text-odara-primary'/>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Funcionários Ativos</h3>
                <p className="text-3xl font-bold text-odara-dark mt-2">
                  {numeroColaboradores}
                </p>
                <p className="text-sm text-gray-600 mt-1">3 online</p>
              </div>
              <div className="p-3 rounded-full">
                <IconWrapper icon={Users} size={32} className='text-odara-primary'/>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  function AcoesAdministrativas() {
    const navigate = useNavigate();
    const botoesCadastros = [
      {
        id: 1,
        nome: "Cadastrar Residente",
        icone: Plus,
        acao: () => navigate('/app/admin/residente/formulario')
      },

      {
        id: 2,
        nome: "Cadastrar Responsável",
        icone: Plus,
        acao: () => navigate('/app/admin/responsavel/formulario')
      },

      {
        id: 3,
        nome: "Cadastrar Funcionário",
        icone: Plus,
        acao: () => navigate('/app/admin/funcionario/formulario')
      },

      {
        id: 4,
        nome: "Cadastrar Pertences",
        icone: Plus,
        acao: () => navigate('/app/admin/pertence/formulario')
      },

      {
        id: 5,
        nome: "Gerenciar Usuário",
        icone: Plus,
        acao: () => navigate('/app/admin/usuarios')
      },
    ];

    const botoesChecklists = [
      {
        id: 6,
        nome: "Medicamentos",
        icone: Pill,
        acao: () => navigate("/app/funcionario/checklist/medicamentos/check")
      },

      {
        id: 7,
        nome: "Exames médicos",
        icone: Microscope,
        acao: () => navigate("/app/funcionario/checklist/exames/medicos")
      },

      {
        id: 8,
        nome: "Consultas médicas",
        icone: Stethoscope,
        acao: () => navigate("/app/funcionario/checklist/consultas/medicas")
      },

      {
        id: 9,
        nome: "Atividades",
        icone: ClipboardList,
        acao: () => navigate("/app/funcionario/checklist/atividades")
      },

      {
        id: 10,
        nome: "Alimentação",
        icone: Utensils,
        acao: () => navigate("/app/funcionario/checklist/alimentacao")
      },
    ];

    return (
      <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-odara-primary">
        <h2 className="text-xl font-semibold text-odara-dark mb-4">Cadastros</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {botoesCadastros.map((cadastro) => (
            <div
              key={cadastro.id}
              onClick={cadastro.acao}
              className={`border border-gray-200 rounded-md p-4 cursor-pointer hover:shadow-md transition-all duration-200 group 
              ${acaoSelecionada?.id === cadastro.id
                  ? "ring-2 ring-odara-primary shadow-sm"
                  : "hover:border-odara-primary/50 hover:bg-odara-primary/5"
                }
            `}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-lg bg-odara-primary/10 group-hover:bg-odara-primary/20 transition-colors">
                  <IconWrapper icon={cadastro.icone} size={28} className='text-odara-primary'/>
                </div>

                <span className="text-sm font-medium text-odara-dark">
                  {cadastro.nome}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Linha separadora */}
        <hr className="border-gray-200 my-6" />

        {/* Checklists */}
        <h2 className="text-xl font-semibold text-odara-dark mb-4">Checklists</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {botoesChecklists.map((checklist) => (
            <div
              key={checklist.id}
              onClick={checklist.acao}
              className={`border border-gray-200 rounded-md p-4 cursor-pointer hover:shadow-md transition-all duration-200 group 
              ${acaoSelecionada?.id === checklist.id
                  ? "ring-2 ring-odara-primary shadow-sm"
                  : "hover:border-odara-primary/50 hover:bg-odara-primary/5"
                }
            `}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-lg bg-odara-primary/10 group-hover:bg-odara-primary/20 transition-colors">
                  <IconWrapper icon={checklist.icone} size={28} className='text-odara-primary'/>
                </div>

                <span className="text-sm font-medium text-odara-dark">
                  {checklist.nome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Componente de atividade recente
  function AlertaNotifica() {
    const alertas = [
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

    const notificacoes = [
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
          <IconWrapper icon={Bell} className='text-odara-accent'/>
          <h2 className="text-xl font-semibold text-odara-dark">Alertas e Notificações</h2>
        </div>

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
                  <IconWrapper icon={AlertTriangle} size={20} className='text-odara-alerta'/>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-odara-dark">{alerta.texto}</p>
                    <p className="text-xs text-gray-500 mt-1">{alerta.hora}</p>
                  </div>
                  <button
                    onClick={() => abrirModal(alerta)}
                    className="text-gray-400 hover:text-odara-dark transition-colors"
                    title="Ver detalhes"
                  >
                    <IconWrapper icon={Eye} size={16} className='text-odara-accent'/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

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
                  <IconWrapper icon={Info} size={20} className='text-odara-dropdown-accent'/>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-odara-dark">{notificacao.texto}</p>
                    <p className="text-xs text-gray-500 mt-1">{notificacao.hora}</p>
                  </div>
                  <button
                    onClick={() => abrirModal(notificacao)}
                    className="text-gray-400 hover:text-odara-dark transition-colors"
                    title="Ver detalhes"
                  >
                    <IconWrapper icon={Eye} size={16} className='text-odara-accent'/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-8">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <StatsCards
              numeroIdosos={numeroIdosos}
              numeroColaboradores={numeroColaboradores}
            />

            <AcoesAdministrativas />
          </div>

          <div className="lg:col-span-1">
            <AlertaNotifica />
          </div>
        </div>
      </div>

      {modalAberto && itemSelecionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-odara-dark">
                {itemSelecionado.detalhes.titulo}
              </h3>

              <button
                onClick={fecharModal}
                className="transition-colors"
              >
                <IconWrapper icon={X} size={24} className='text-odara-accent hover:text-odara-secondary'/>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${itemSelecionado.tipo === 'alerta' ? 'bg-odara-alerta/10' : 'bg-odara-dropdown/50'}`}>
                  <IconWrapper
                    className={itemSelecionado.tipo === 'alerta' ? 'text-odara-alerta' : 'text-odara-dropdown-accent'}
                    icon={itemSelecionado.tipo === 'alerta' ? AlertTriangle : Info}
                    size={20}
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

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>

              <button
                onClick={() => {
                  console.log(`Ação tomada para: ${itemSelecionado.texto}`);
                  fecharModal();
                }}

                className={'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-odara-accent hover:bg-odara-secondary'}
              >
                Marcar como Lida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;