import React from 'react';
import {
  LuSearch,
  LuCalendar,
  LuCircleUser,
  LuUser,
  LuUsers,
  LuTriangleAlert,
  LuUserPlus,
  LuCog,
  LuClipboardList,
  LuHardDrive,
  LuClipboardCheck,
  LuCircleCheck,
  LuCircleAlert,
  //LuCircle,
  //LuInfo,
} from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const Header = () => (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard Administrativo</h1>
        <p className="mt-1 text-gray-500">Visão geral e controle do sistema ILPI</p>
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <LuSearch className="text-gray-400" />
          <span>Buscar Relatório</span>
        </div>
        <div className="flex items-center space-x-2">
          <LuCalendar className="text-gray-400" />
          <span>Segunda-feira, 1 de setembro de 2025</span>
        </div>
        <LuCircleUser className="h-8 w-8 text-gray-400" />
      </div>
    </div>
  );

  const StatsCards = () => (
    <>
      <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow">
        <div>
          <div className="text-sm text-gray-500">Total de Residentes</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">45</div>
          <div className="mt-2 text-xs font-medium text-green-500">80% ocupação</div>
        </div>
        <div className="rounded-full bg-gray-100 p-3 text-gray-400">
          <LuUser className="h-6 w-6" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow">
        <div>
          <div className="text-sm text-gray-500">Funcionários Ativos</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">12</div>
          <div className="mt-2 text-xs font-medium text-gray-500">10 respondendo</div>
        </div>
        <div className="rounded-full bg-gray-100 p-3 text-gray-400">
          <LuUsers className="h-6 w-6" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow">
        <div>
          <div className="text-sm text-gray-500">Alertas Críticos</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">2</div>
          <div className="mt-2 text-xs font-medium text-red-500">resolvido pendente</div>
        </div>
        <div className="rounded-full bg-gray-100 p-3 text-gray-400">
          <LuTriangleAlert className="h-6 w-6" />
        </div>
      </div>
    </>
  );

  const AdministrativeActions = () => {
    const botoes = [
      {
        nome: 'Cadastrar Residente',
        descricao: 'Adicionar novo residente e seu responsável',
        icone: <LuUserPlus className="h-6 w-6" />,
        acao: () => navigate('/app/admin/pacientes/cadastrar')
      },
      {
        nome: 'Cadastrar Funcionário',
        descricao: 'Adicionar novo funcionário ao sistema',
        icone: <LuUserPlus className="h-6 w-6" />,
        acao: () => navigate('/app/admin/funcionarios/cadastrar')
      },
      {
        nome: 'Gerenciar Usuários',
        descricao: 'Editar ou remover usuários do sistema',
        icone: <LuUsers className="h-6 w-6" />,
        acao: () => navigate('/app/admin/usuarios')
      },
      {
        nome: 'Configurações',
        descricao: 'Ajustar configurações do sistema e permissões',
        icone: <LuCog className="h-6 w-6" />,
        acao: () => navigate('/app/admin/configuracoes')
      },
      {
        nome: 'Relatórios',
        descricao: 'Gerar e visualizar relatórios detalhados',
        icone: <LuClipboardList className="h-6 w-6" />,
        acao: () => navigate('/app/admin/relatorios')
      },
      {
        nome: 'Backup Sistema',
        descricao: 'Realizar backup manual dos dados',
        icone: <LuHardDrive className="h-6 w-6" />,
        acao: () => alert('Backup iniciado!')
      },
      {
        nome: 'Auditoria',
        descricao: 'Visualizar logs de auditoria e segurança',
        icone: <LuClipboardCheck className="h-6 w-6" />,
        acao: () => navigate('/app/admin/auditoria')
      }
    ];

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Ações Administrativas</h2>
        <div className="mt-4 grid sm:grid-cols-2 grid-cols-1 gap-2">
          {botoes.map((botao) => (
            <button
              onClick={botao.acao}
              className={`flex cursor-pointer items-center p-4 transition-colors bg-yellow-100 hover:bg-red-50`}
            >
              <div
                className={`rounded-lg p-3 bg-blue-200 text-white`}
              >
                {botao.icone}
              </div>
              <div className="ml-4">
                <h3 className={`font-semibold text-white`}>{botao.nome}</h3>
                <p className={`text-sm text-black`}>{botao.descricao}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const RecentActivity = () => {
    type ActivityStatus = 'info' | 'success' | 'warning';
    interface ActivityItemProps {
      status: ActivityStatus;
      title: string;
      description: string;
    }
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
    const ActivityItem: React.FC<ActivityItemProps> = ({ status, title, description }) => {
      return (
        <div
          className={`mb-2 flex items-center rounded-lg p-3 ${status === 'warning' ? 'bg-red-50' : ''
            }`}
        >
          <div className={`rounded-full p-2 ${statusColors[status]}`}>{statusIcons[status]}</div>
          <div className="ml-3 flex-1">
            <h4 className="font-medium text-gray-800">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      );
    };

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Atividade Recente</h2>
        <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-2">
          <ActivityItem status="info" title="Ana Bentes fez login no sistema" description="Ana Bentes - há 2 minutos" />
          <ActivityItem status="success" title="Checklist diário concluído para João Silva" description="Pedro Balneário - há 15 minutos" />
          <ActivityItem status="warning" title="Alerta crítico: Medicamento em falta no estoque" description="Estoque - há 30 minutos" />
          <ActivityItem status="success" title="Relatório semanal do medicamento gerado" description="Dr. Carlos Admin - há 1 hora" />
          <ActivityItem status="info" title="Novo funcionário cadastrado" description="RH - há 2 horas" />
          <ActivityItem status="success" title="Configurações do sistema atualizadas" description="Gerência - há 3 horas" />
          <ActivityItem status="info" title="Nova nota de prontuário adicionada" description="Enfermeiro Marcos - há 5 horas" />
        </div>
      </div>
    );
  };
/**
  const SystemStatus = () => {
    type StatusType = 'online' | 'offline' | 'pending';
    interface StatusItemProps {
      title: string;
      status: StatusType;
      value?: string;
    }
    const StatusItem: React.FC<StatusItemProps> = ({ title, status, value }) => {
      const statusColors: Record<StatusType, string> = {
        online: 'text-green-500',
        offline: 'text-red-500',
        pending: 'text-yellow-500',
      };
      return (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <LuCircle className={`mr-2 h-3 w-3 ${statusColors[status]} fill-current`} />
            <span className="text-sm text-gray-700">{title}</span>
          </div>
          {value && (
            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
              {value}
            </span>
          )}
        </div>
      );
    };

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Status do Sistema</h2>
        <div className="mt-4">
          <StatusItem title="Servidor Principal" status="online" value="99.9%" />
          <StatusItem title="Base de Dados" status="online" value="99.8%" />
          <StatusItem title="Sistema de Backup" status="online" value="100%" />
          <StatusItem title="Notificações" status="online" value="91.2%" />
        </div>
      </div>
    );
  };

  const MonthlyStatistics = () => {
    interface StatBarProps {
      title: string;
      value: number;
      total: number;
      unit?: string;
    }
    const StatBar: React.FC<StatBarProps> = ({ title, value, total, unit = '' }) => {
      const percentage = (value / total) * 100;
      return (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{title}</span>
            <span>
              {value} {unit}
            </span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-lime-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      );
    };

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Estatísticas Mensais</h2>
        <div className="mt-4">
          <StatBar title="Tarefas Concluídas" value={1247} total={1500} />
          <StatBar title="Relatórios Gerados" value={42} total={50} />
          <StatBar title="Satisfação Geral" value={94} total={100} unit="%" />
        </div>
      </div>
    );
  };

  const ImportantNotifications = () => {
    interface NotificationItemProps {
      title: string;
      description: string;
    }
    const NotificationItem: React.FC<NotificationItemProps> = ({ title, description }) => (
      <div className="mb-3 flex items-start">
        <LuInfo className="mt-1 h-5 w-5 flex-shrink-0 text-lime-500" />
        <div className="ml-3">
          <h4 className="font-medium text-gray-800">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    );

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Notificações Importantes</h2>
        <div className="mt-4">
          <NotificationItem title="Sistema de Backup" description="Backup automático falhou em 2 dias." />
          <NotificationItem title="Novo Funcionário" description="Agendar a operação de cadastro." />
          <NotificationItem title="Relatório Mensal" description="Pronto para ser lido e salvo." />
        </div>
      </div>
    );
  };
*/
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <Header />
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCards />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdministrativeActions />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
      {/*<div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <SystemStatus />
        </div>
        <div>
          <MonthlyStatistics />
        </div>
        <div>
          <ImportantNotifications />
        </div>
      </div>*/}
    </div>
  );
}