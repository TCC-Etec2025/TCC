import { useEffect, useState } from 'react';
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
} from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import DataFormatada from '../components/DataFormatada';

// Declaração de tipo para o componente de atividade
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

// Componente para um item de atividade
function ActivityItem({ status, title, description }: ActivityItemProps) {
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
}

// Componente de cabeçalho
function Header() {
  return (
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
          <span><DataFormatada /></span>
        </div>
        <LuCircleUser className="h-8 w-8 text-gray-400" />
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
      <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow">
        <div>
          <div className="text-sm text-gray-500">Total de Residentes</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{numeroIdosos}</div>
        </div>
        <div className="rounded-full bg-gray-100 p-3 text-gray-400">
          <LuUser className="h-6 w-6" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow">
        <div>
          <div className="text-sm text-gray-500">Funcionários Ativos</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{numeroColaboradores}</div>
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
}

// Componente para as ações administrativas
function AdministrativeActions() {
  const navigate = useNavigate();
  const botoes = [
    {
      nome: 'Cadastrar Residente',
      descricao: 'Adicionar novo residente e seu responsável',
      icone: <LuUserPlus className="h-6 w-6" />,
      acao: () => navigate('/app/admin/residente/formulario')
    },
    {
      nome: 'Cadastrar Responsável',
      descricao: 'Adicionar novo responsável ao sistema',
      icone: <LuUserPlus className="h-6 w-6" />,
      acao: () => navigate('/app/admin/responsavel/formulario')
    },
    {
      nome: 'Cadastrar Funcionário',
      descricao: 'Adicionar novo funcionário ao sistema',
      icone: <LuUserPlus className="h-6 w-6" />,
      acao: () => navigate('/app/admin/funcionario/formulario')
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
            key={botao.nome}
            onClick={botao.acao}
            className="flex cursor-pointer items-center p-4 transition-colors bg-yellow-600 hover:bg-red-50"
          >
            <div className="rounded-lg p-3 bg-blue-400 text-white">
              {botao.icone}
            </div>
            <div className="ml-4 flex flex-col justify-center w-full items-center text-center">
              <h3 className="font-semibold text-white">{botao.nome}</h3>
              <p className="text-sm text-black">{botao.descricao}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Componente de atividade recente
function RecentActivity() {
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
}

// Componente de alerta detalhado
interface AlertItem {
  title: string;
  description: string;
  status: ActivityStatus;
}

function AlertButton({ numeroAlertas, alertas }: { numeroAlertas: number, alertas: AlertItem[] }) {
  return (
    <div className="relative group">
      {/* Botão principal */}
      <button className="flex items-center justify-between w-full rounded-lg bg-white p-6 shadow hover:bg-red-50 transition-colors">
        <div>
          <div className="text-sm text-gray-500">Alertas Críticos</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{numeroAlertas}</div>
          <div className="mt-2 text-xs font-medium text-red-500">resolvido pendente</div>
        </div>
        <div className="rounded-full bg-gray-100 p-3 text-gray-400">
          <LuTriangleAlert className="h-6 w-6" />
        </div>
      </button>

      {/* Dropdown de alertas */}
      <div className="absolute right-0 z-10 mt-2 hidden w-80 rounded-lg bg-white shadow-lg group-hover:block">
        <div className="max-h-64 overflow-y-auto p-4 space-y-2">
          {alertas.map((alerta, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-lg p-3 ${statusColors[alerta.status]}`}
            >
              <div className="mt-1">{statusIcons[alerta.status]}</div>
              <div>
                <h4 className="font-medium text-gray-800">{alerta.title}</h4>
                <p className="text-sm text-gray-500">{alerta.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// Componente principal da Dashboard
export default function AdminDashboard() {
  const [numeroIdosos, setNumeroIdosos] = useState(0);
  const [numeroColaboradores, setNumeroColaboradores] = useState(0);
  const [numeroAlertas, setNumeroAlertas] = useState(0);

  useEffect(() => {
    const numeroPessoas = async () => {
      const [
        { count: idososCount, error: idososError },
        { count: colaboradoresCount, error: colaboradoresError },
        { count: alertasCount, error: alertasError }
      ] = await Promise.all([
        supabase.from('idosos').select('*', { count: 'exact', head: true }),
        supabase.from('colaboradores').select('*', { count: 'exact', head: true }),
        supabase.from('colaboradores').select('id, idosos!left(id)', { count: 'exact', head: true })
      ]);

      if (!idososError) setNumeroIdosos(idososCount ?? 0);
      if (!colaboradoresError) setNumeroColaboradores(colaboradoresCount ?? 0);
      if (!alertasError) setNumeroAlertas(alertasCount ?? 0);
    };

    numeroPessoas();
  }, []);


  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <Header />
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCards numeroIdosos={numeroIdosos} numeroColaboradores={numeroColaboradores} />
        <AlertButton
          numeroAlertas={numeroAlertas}
          alertas={[
            { title: "Medicamento em falta", description: "Verificar estoque de insulina", status: "warning" },
            { title: "Checklist não concluído", description: "Completar checklist do residente João Silva", status: "info" },
            { title: "Relatório pendente", description: "Enviar relatório semanal do medicamento", status: "success" },
          ]}
        />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdministrativeActions />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}