import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Microscope, AlertTriangle, Palette, Calendar, Apple, FileText, UsersRound, Bell, Info, UserRoundPlus, PackagePlus, UserRoundCog, X, Activity, Utensils, Stethoscope, type LucideIcon } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

import { supabase } from '../../lib/supabaseClient';
import DataFormatada from '../../components/DataFormatada';

// Interfaces para tipagem
interface BotaoAcao {
  id: number;
  nome: string;
  icone: LucideIcon;
  acao: () => void;
}

type Alertas = {
  medicamentos: MedicamentosAlerta[];
  atividades: AtividadesAlerta[];
  alimentacao: AlimentacaoAlerta[];
  consultas: ConsultasAlerta[];
  contagens: {
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

type Ocorrencia = {
	id: number;
	titulo: string;
	descricao: string;
	providencias?: string | null;
	data: string;
	residente: Residente | null;
	categoria: string;
	status: boolean;
	criado_em?: string | null;
};

type Residente = {
  id: number;
  nome: string;
};

const AdminDashboard = () => {

  // Estados do componente
  const [acaoSelecionada, setAcaoSelecionada] = useState<BotaoAcao | null>(null);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [numeroIdosos, setNumeroIdosos] = useState<number>(0);
  const [numeroColaboradores, setNumeroColaboradores] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Estados para notificações
  const [notificacoesAbertas, setNotificacoesAbertas] = useState<boolean>(false);

  const [meusAlertas, setMeusAlertas] = useState<Alertas | null>(null);

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  const [alertaSelecionado, setAlertaSelecionado] = useState<MedicamentosAlerta[] | AtividadesAlerta[] | AlimentacaoAlerta[] | ConsultasAlerta[] | null>(null);

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
  const abrirModal = (item: MedicamentosAlerta[] | AtividadesAlerta[] | AlimentacaoAlerta[] | ConsultasAlerta[] | null) => {
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

  // Efeito para carregar estatísticas iniciais
  useEffect(() => {
    const buscarNumeroPessoas = async () => {
      try {
        setCarregando(true);

        const [
          { count: contadorIdosos, error: erroIdosos },
          { count: contadorColaboradores, error: erroColaboradores }
        ] = await Promise.all([
          supabase.from('residente').select('*', { count: 'exact', head: true }),
          supabase.from('funcionario').select('*', { count: 'exact', head: true })
        ]);

        if (erroIdosos) throw new Error(`Erro ao buscar idosos: ${erroIdosos.message}`);
        if (erroColaboradores) throw new Error(`Erro ao buscar colaboradores: ${erroColaboradores.message}`);

        setNumeroIdosos(contadorIdosos ?? 0);
        setNumeroColaboradores(contadorColaboradores ?? 0);

      } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
        toast.error('Erro ao carregar estatísticas');
      } finally {
        setCarregando(false);
      }
    };

    buscarNumeroPessoas();
    buscarAlertas();
    buscarOcorrencias();
  }, []);

  const buscarAlertas = async () => {
    try {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + 5);
      const dataLimite = agora.toISOString();

      const { data, error } = await supabase
        .rpc('get_alertas_dashboard', {
          data_limite: dataLimite
        });

      if (error) throw error;
      setMeusAlertas(data);
    } catch (error) {
      console.error('Erro ao chamar função RPC:', error);
    }
  };

  const buscarOcorrencias = async () => {
    try {
      const { data, error } = await supabase
        .from('ocorrencia')
        .select('*, residente(id, nome)')
        .eq('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: false });
      if (error) throw error;
      setOcorrencias(data || []);
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
    }
  };

  // Componente de Cabeçalho COM ÍCONE DE NOTIFICAÇÕES
  const CabecalhoDashboard = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark">Dashboard Administrativo</h1>
          <p className="text-odara-dark/60 text-sm">Visão geral e controle do sistema ILPI</p>
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

  // Componente de Cartões de Estatísticas
  const CartoesEstatisticas = ({
    numeroIdosos,
    numeroColaboradores
  }: {
    numeroIdosos: number;
    numeroColaboradores: number;
  }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Cartão de Residentes */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Residentes Ativos</h3>
              <p className="text-2xl sm:text-3xl font-bold text-odara-dark mt-1 sm:mt-2">
                {carregando ? '...' : numeroIdosos}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-odara-primary/10 rounded-full">
              <WrapperIcone icone={FileText} tamanho={28} className='text-odara-primary' />
            </div>
          </div>
        </div>

        {/* Cartão de Funcionários */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Funcionários Ativos</h3>
              <p className="text-2xl sm:text-3xl font-bold text-odara-dark mt-1 sm:mt-2">
                {carregando ? '...' : numeroColaboradores}
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

  // Componente de Ações Administrativas
  const AcoesAdministrativas = () => {
    const navegar = useNavigate();

    // Botões para cadastros rápidos
    const botoesCadastros: BotaoAcao[] = [
      {
        id: 1,
        nome: "Cadastrar Residente",
        icone: UserRoundPlus,
        acao: () => navegar('/app/admin/residente/formulario')
      },
      {
        id: 2,
        nome: "Cadastrar Responsável",
        icone: UserRoundPlus,
        acao: () => navegar('/app/admin/responsavel/formulario')
      },
      {
        id: 3,
        nome: "Cadastrar Funcionário",
        icone: UserRoundPlus,
        acao: () => navegar('/app/admin/funcionario/formulario')
      },
      {
        id: 4,
        nome: "Cadastrar Pertences",
        icone: PackagePlus,
        acao: () => navegar('/app/admin/pertence/formulario')
      },
      {
        id: 5,
        nome: "Gerenciar Usuário",
        icone: UserRoundCog,
        acao: () => navegar('/app/admin/usuarios')
      },
    ];

    // Botões para checklists
    const botoesChecklists: BotaoAcao[] = [
      {
        id: 6,
        nome: "Medicamentos",
        icone: Pill,
        acao: () => navegar("/app/funcionario/checklist/medicamentos")
      },
      {
        id: 7,
        nome: "Exames Médicos",
        icone: Microscope,
        acao: () => navegar("/app/funcionario/checklist/exames/medicos")
      },
      {
        id: 8,
        nome: "Atividades",
        icone: Palette,
        acao: () => navegar("/app/funcionario/checklist/atividades")
      },
      {
        id: 9,
        nome: "Alimentação",
        icone: Apple,
        acao: () => navegar("/app/funcionario/checklist/alimentacao")
      },
    ];

    const lidarComClique = (botao: BotaoAcao) => {
      setAcaoSelecionada(botao);
      toast.success(`Abrindo ${botao.nome.toLowerCase()}...`);
      botao.acao();
    };

    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-5 border-l-4 border-odara-primary">
        {/* Seção de Cadastros */}
        <h2 className="text-lg sm:text-xl font-semibold text-odara-dark mb-3 sm:mb-4">Cadastros</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {botoesCadastros.map((cadastro) => (
            <div
              key={cadastro.id}
              onClick={() => lidarComClique(cadastro)}
              className={`border border-gray-200 rounded-md p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all duration-200 group 
                ${acaoSelecionada?.id === cadastro.id
                  ? "ring-2 ring-odara-primary shadow-sm"
                  : "hover:border-odara-primary/50 hover:bg-odara-primary/5"
                }`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 sm:p-3 rounded-lg bg-odara-primary/10 group-hover:bg-odara-primary/20 transition-colors">
                  <WrapperIcone icone={cadastro.icone} tamanho={24} className='text-odara-primary' />
                </div>
                <span className="text-xs sm:text-sm font-medium text-odara-dark leading-tight">
                  {cadastro.nome}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Separador */}
        <hr className="border-gray-200 my-4 sm:my-6" />

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
      </div>
    );
  };

  // Componente do Painel de Notificações Flutuante - RESPONSIVO
  const PainelNotificacoes = () => {
    if (!notificacoesAbertas) return null;

    const totalAlertas = meusAlertas
      ? meusAlertas.contagens.medicamentos +
        meusAlertas.contagens.atividades +
        meusAlertas.contagens.alimentacao +
        meusAlertas.contagens.consultas
      : 0;

    const totalOcorrencias = ocorrencias.length;

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
                    Alertas Urgentes ({totalAlertas})
                  </h4>
                </div>
                <div className="space-y-3">
                  {meusAlertas && (['medicamentos', 'atividades', 'alimentacao', 'consultas'] as const).map((key) => {
                    const value = meusAlertas.contagens[key];
                    if (value > 0) {
                      return (
                        <div
                          key={key}
                          onClick={() => abrirModal(meusAlertas[key])}
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

            {totalOcorrencias > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-odara-dark flex items-center gap-2">
                    <WrapperIcone icone={AlertTriangle} tamanho={16} className="text-odara-primary" />
                    Ocorrências ({totalOcorrencias})
                  </h4>
                </div>
                <div className="space-y-3">
                  {ocorrencias && ocorrencias.map((ocorrencia) => (
                    <div
                      key={ocorrencia.id}
                      className="p-3 border border-odara-primary/20 rounded-lg hover:bg-odara-primary/5 active:bg-odara-primary/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-odara-dark">{ocorrencia.titulo}</h5>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                ocorrencia.status
                                  ? 'text-green-700 bg-green-50 border-green-100'
                                  : 'text-yellow-700 bg-yellow-50 border-yellow-100'
                              }`}
                            >
                              {ocorrencia.status ? 'Resolvida' : 'Pendente'}
                            </span>
                          </div>

                          {ocorrencia.descricao && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ocorrencia.descricao}</p>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                            <span>{ocorrencia.residente ? ocorrencia.residente.nome : 'Residente não informado'}</span>
                            <span>{ocorrencia.data ? ocorrencia.data.split('-').reverse().join('/') : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
            numeroIdosos={numeroIdosos}
            numeroColaboradores={numeroColaboradores}
          />

          <AcoesAdministrativas />
        </div>
      </div>

      <PainelNotificacoes />
      <ModalDetalhes />
    </div>
  );
};

export default AdminDashboard;