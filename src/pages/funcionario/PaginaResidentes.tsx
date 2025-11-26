import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, ClipboardList, HeartPulse, User, Loader2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { type Residente } from '../../Modelos';
import { differenceInYears } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

type ResidenteCompleto = Residente & {
  responsavel?: {
    nome: string;
    telefone_principal: string;
    email: string;
  };
  ultimo_checklist?: string;
  proxima_medicacao?: string;
  alertas?: string;
  cuidados?: string;
};

const PaginaResidentes: React.FC = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [listaResidentes, setListaResidentes] = useState<ResidenteCompleto[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [executandoAcao, setExecutandoAcao] = useState<number | null>(null);

  // Busca todos os residentes do banco de dados com informações completas
  const buscarResidentes = async () => {
    try {
      setCarregando(true);

      // 1. Buscar todos os residentes
      const { data: residentesData, error: residentesError } = await supabase
        .from('residente')
        .select('*')
        .eq('status', true) // Apenas residentes ativos
        .order('nome', { ascending: true });

      if (residentesError) throw residentesError;

      // 2. Buscar responsáveis para vincular
      const { data: responsaveisData, error: responsaveisError } = await supabase
        .from('responsavel')
        .select('id, nome, telefone_principal, email');

      if (responsaveisError) throw responsaveisError;

      // 3. Buscar informações adicionais (simuladas - ajustar conforme sua estrutura real)
      const residentesCompletos = residentesData.map(residente => {
        const responsavelDoResidente = responsaveisData?.find(
          responsavel => responsavel.id === residente.id_responsavel
        );

        // Simular dados de checklist, medicação e alertas (substituir por dados reais)
        const dadosSimulados = {
          ultimo_checklist: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          proxima_medicacao: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
          alertas: Math.random() > 0.7 ? "Pressão alta" : Math.random() > 0.7 ? "Diabetes" : "Nenhum",
          cuidados: residente.dependencia === 'Grau III' ? 'HAMoM' :
            residente.dependencia === 'Grau II' ? 'MoM' : 'M'
        };

        return {
          ...residente,
          ...dadosSimulados,
          responsavel: responsavelDoResidente
        };
      });

      setListaResidentes(residentesCompletos);

    } catch (erro: any) {
      console.error('Erro ao buscar residentes:', erro);
      toast.error('Erro ao buscar residentes: ' + (erro?.message ?? String(erro)));
    } finally {
      setCarregando(false);
    }
  };

  // Efeito para carregar residentes quando o componente montar
  useEffect(() => {
    buscarResidentes();
  }, []);

  // Filtra residentes baseado no termo de busca
  const residentesFiltrados = listaResidentes.filter(residente => {
    if (!residente) return false;

    const termoBuscaLower = termoBusca.toLowerCase();

    return (
      (residente.nome?.toLowerCase() || '').includes(termoBuscaLower) ||
      (residente.quarto?.toLowerCase() || '').includes(termoBuscaLower) ||
      (residente.cuidados?.toLowerCase() || '').includes(termoBuscaLower) ||
      (residente.responsavel?.nome?.toLowerCase() || '').includes(termoBuscaLower)
    );
  });

  // Calcula estatísticas em tempo real
  const estatisticas = {
    total: residentesFiltrados.length,
    comChecklistHoje: residentesFiltrados.filter(r =>
      r.ultimo_checklist === new Date().toISOString().split('T')[0]
    ).length,
    comMedicacaoProxima: residentesFiltrados.filter(r => {
      if (!r.proxima_medicacao) return false;
      const [horas] = r.proxima_medicacao.split(':');
      const horaMedicacao = parseInt(horas);
      const horaAtual = new Date().getHours();
      return horaMedicacao > horaAtual && horaMedicacao <= horaAtual + 2; // Próximas 2 horas
    }).length,
    comAlertas: residentesFiltrados.filter(r => r.alertas !== "Nenhum").length
  };

  // Handlers para as ações
  const handleVerDetalhes = async (residente: ResidenteCompleto) => {
    try {
      setExecutandoAcao(residente.id);
      // Navegar para página de detalhes do residente
      navigate(`/app/residente/${residente.id}/detalhes`);
    } catch (erro) {
      console.error('Erro ao abrir detalhes:', erro);
      toast.error('Erro ao abrir detalhes do residente');
    } finally {
      setExecutandoAcao(null);
    }
  };

  const handleRegistrarCuidados = async (residente: ResidenteCompleto) => {
    try {
      setExecutandoAcao(residente.id);
      // Navegar para página de registro de cuidados
      navigate(`/app/residente/${residente.id}/cuidados`);
    } catch (erro) {
      console.error('Erro ao abrir registro de cuidados:', erro);
      toast.error('Erro ao abrir registro de cuidados');
    } finally {
      setExecutandoAcao(null);
    }
  };

  const handleChecklist = async (residente: ResidenteCompleto) => {
    try {
      setExecutandoAcao(residente.id);
      // Navegar para página de checklist
      navigate(`/app/residente/${residente.id}/checklist`);
    } catch (erro) {
      console.error('Erro ao abrir checklist:', erro);
      toast.error('Erro ao abrir checklist');
    } finally {
      setExecutandoAcao(null);
    }
  };

  // Retorna as classes CSS para o nível de dependência
  const obterCorDependencia = (dependencia: string | undefined) => {
    switch (dependencia?.toLowerCase()) {
      case 'grau iii': return 'bg-odara-alerta/10 text-odara-alerta';
      case 'grau ii': return 'bg-yellow-50 text-yellow-500';
      case 'grau i': return 'bg-green-50 text-green-500';
      default: return 'bg-gray-100 text-gray-400';
    }
  };

  // Retorna as classes CSS para alertas
  const obterCorAlerta = (alerta: string | undefined) => {
    return alerta !== "Nenhum"
      ? 'bg-odara-alerta/10 text-odara-alerta font-semibold'
      : 'bg-gray-100 text-gray-400';
  };

  // Componente do Botão de Ação
  const BotaoAcao = ({
    icon: Icon,
    label,
    onClick,
    residenteId,
    corIcone = 'text-odara-primary hover:text-odara-accent'
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    residenteId: number;
    corIcone?: string;
  }) => {

    return (
      <div className="relative">
        <button
          className="p-2 rounded-lg bg-transparent transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onClick}
          disabled={executandoAcao === residenteId}
          title={label}
        >
          {executandoAcao === residenteId ? (
            <Loader2 size={16} className={`animate-spin ${corIcone}`} />
          ) : (
            <Icon size={16} className={corIcone} />
          )}
        </button>
      </div>
    );
  };

  // Estado de carregamento
  if (carregando) {
    return (
      <div className="min-h-screen bg-odara-offwhite flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-odara-primary animate-spin mb-2" />
          <p className="text-odara-dark">Carregando residentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-odara-offwhite">
      <Toaster />

      <div className="container mx-auto p-6 lg:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          {/* Título */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">Meus Residentes</h1>
            <p className="text-sm text-odara-dark/70 mt-1">Residentes sob sua responsabilidade</p>
          </div>

          {/* Estatística Principal */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold text-odara-primary">{estatisticas.total}</div>
            <div className="text-sm text-odara-dark/70">Residentes atribuídos</div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total de Residentes */}
          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-odara-dropdown/50 rounded-lg flex items-center justify-center mr-4">
                <User className="text-odara-dropdown-accent text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-odara-dark">{estatisticas.total}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
            </div>
          </div>

          {/* Checklist Hoje */}
          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mr-4">
                <ClipboardList className="text-green-500 text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-odara-dark">{estatisticas.comChecklistHoje}</div>
                <div className="text-sm text-gray-400">Checklist Hoje</div>
              </div>
            </div>
          </div>

          {/* Medicação Próxima */}
          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center mr-4">
                <Clock className="text-yellow-500 text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-odara-dark">{estatisticas.comMedicacaoProxima}</div>
                <div className="text-sm text-gray-400">Medicação Próxima</div>
              </div>
            </div>
          </div>

          {/* Com Alertas */}
          <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-odara-alerta/10 rounded-lg flex items-center justify-center mr-4">
                <AlertTriangle className="text-odara-alerta text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-odara-dark">{estatisticas.comAlertas}</div>
                <div className="text-sm text-gray-400">Com Alertas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="flex-1 relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-odara-primary mr-3 h-4 w-4 flex-shrink-0" />
          </div>

          <input
            type="text"
            placeholder="Buscar residente por nome, quarto ou cuidados..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>

        {/* Tabela de Residentes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-odara-primary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-1 border-odara-primary bg-odara-primary/10 text-odara-primary">
                <tr>
                  <th className="p-4 text-left font-semibold align-middle">Residente</th>
                  <th className="p-4 text-left font-semibold align-middle">Quarto</th>
                  <th className="p-4 text-left font-semibold align-middle">Dependência</th>
                  <th className="p-4 text-left font-semibold align-middle">Cuidados</th>
                  <th className="p-4 text-left font-semibold align-middle">Último Checklist</th>
                  <th className="p-4 text-left font-semibold align-middle">Próxima Medicação</th>
                  <th className="p-4 text-left font-semibold align-middle">Alertas</th>
                  <th className="p-4 text-center font-semibold align-middle">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {residentesFiltrados.map((residente) => (
                  <tr key={residente.id} className="hover:bg-odara-offwhite/40 transition-colors">
                    {/* Coluna Residente */}
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                          <User className="h-4 w-4 text-odara-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-odara-dark">{residente.nome}</p>
                          <p className="text-xs text-gray-400">
                            {differenceInYears(new Date(), new Date(residente.data_nascimento))} anos
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Coluna Quarto */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${residente.quarto ? '' : 'bg-gray-100 text-gray-400'}`}>
                        {residente.quarto || 'Não informado'}
                      </span>
                    </td>

                    {/* Coluna Dependência */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${obterCorDependencia(residente.dependencia)}`}>
                        {residente.dependencia || 'Não informado'}
                      </span>
                    </td>

                    {/* Coluna Cuidados */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${residente.cuidados ? '' : 'bg-gray-100 text-gray-400'}`}>
                        {residente.cuidados || 'Não informado'}
                      </span>
                    </td>

                    {/* Coluna Último Checklist */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-odara-primary" />
                        {new Date(residente.ultimo_checklist!).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    {/* Coluna Próxima Medicação */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-odara-primary" />
                        {residente.proxima_medicacao}
                      </div>
                    </td>

                    {/* Coluna Alertas */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${obterCorAlerta(residente.alertas)}`}>
                        {residente.alertas}
                      </span>
                    </td>

                    {/* Coluna Ações */}
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <BotaoAcao
                          icon={Eye}
                          label="Ver Detalhes"
                          onClick={() => handleVerDetalhes(residente)}
                          residenteId={residente.id}
                          corIcone="text-odara-dropdown-accent hover:text-odara-secondary"
                        />
                        <BotaoAcao
                          icon={ClipboardList}
                          label="Checklist"
                          onClick={() => handleChecklist(residente)}
                          residenteId={residente.id}
                          corIcone="text-odara-dropdown-accent hover:text-odara-secondary"
                        />
                        <BotaoAcao
                          icon={HeartPulse}
                          label="Registrar Saúde"
                          onClick={() => handleRegistrarCuidados(residente)}
                          residenteId={residente.id}
                          corIcone="text-odara-dropdown-accent hover:text-odara-secondary"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resultado vazio */}
            {residentesFiltrados.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  {termoBusca ? 'Nenhum residente encontrado' : 'Nenhum residente atribuído'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {termoBusca ? 'Tente ajustar sua busca' : 'Entre em contato com a gestão para receber residentes atribuídos'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 text-sm text-gray-400">
          Mostrando {residentesFiltrados.length} de {listaResidentes.length} residente(s)
        </div>
      </div>
    </div>
  );
};

export default PaginaResidentes;