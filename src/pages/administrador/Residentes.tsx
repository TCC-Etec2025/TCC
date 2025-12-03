import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, AlertTriangle, Loader2, Eye, ChevronRight, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { type Residente } from '../../Modelos';
import { differenceInYears } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

type ResidenteComResponsavel = Residente & {
  responsavel?: {
    nome: string;
    telefone_principal: string;
    email: string;
  };
};

const Residentes: React.FC = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [listaResidentes, setListaResidentes] = useState<ResidenteComResponsavel[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [residenteParaExcluir, setResidenteParaExcluir] = useState<number | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  // Busca todos os residentes do banco de dados com seus responsáveis
  const buscarResidentes = async () => {
    try {
      setCarregando(true);

      // 1. Buscar todos os residentes
      const { data: residentesData, error: residentesError } = await supabase
        .from('residente')
        .select('*')
        .order('nome', { ascending: true });

      if (residentesError) throw residentesError;

      // 2. Buscar todos os responsáveis para vincular
      const { data: responsaveisData, error: responsaveisError } = await supabase
        .from('responsavel')
        .select('id, nome, telefone_principal, email');

      if (responsaveisError) throw responsaveisError;

      // 3. Combinar os dados
      const residentesComResponsaveis = residentesData.map(residente => {
        const responsavelDoResidente = responsaveisData?.find(
          responsavel => responsavel.id === residente.id_responsavel
        );

        return {
          ...residente,
          responsavel: responsavelDoResidente
        };
      });

      setListaResidentes(residentesComResponsaveis);

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
      // Buscar também no nome do responsável vinculado
      (residente.responsavel?.nome?.toLowerCase() || '').includes(termoBuscaLower)
    );
  });

  // Alterna o status do residente
  const alternarStatus = async (id: number, statusAtual: boolean) => {
    try {
      setAtualizandoStatus(id);
      const novoStatus = !statusAtual;

      const { error } = await supabase
        .from('residente')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      // Atualiza a lista localmente
      setListaResidentes(listaResidentes.map(residente =>
        residente.id === id ? { ...residente, status: novoStatus } : residente
      ));

      toast.success(`Residente ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (erro: any) {
      console.error('Erro ao alterar status:', erro);
      toast.error('Erro ao alterar status: ' + (erro?.message ?? String(erro)));
    } finally {
      setAtualizandoStatus(null);
    }
  };

  // Retorna as classes CSS para o status do residente
  const obterCorStatus = (status: boolean) => {
    return status
      ? 'bg-green-50 text-green-500 hover:bg-green-100'
      : 'bg-gray-100 text-gray-400 hover:bg-gray-200';
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

  // Formata número de telefone para exibição
  const formatarTelefone = (telefone: string) => {
    if (!telefone) return '';
    return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`;
  };

  // Abre o modal de confirmação para exclusão
  const abrirModalExclusao = (id: number) => {
    setResidenteParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  // Fecha o modal de exclusão
  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setResidenteParaExcluir(null);
  };

  // Executa a exclusão do residente após confirmação
  const executarExclusao = async () => {
    if (!residenteParaExcluir) return;

    try {
      const { error } = await supabase
        .from('residente')
        .delete()
        .eq('id', residenteParaExcluir);

      if (error) throw error;

      // Atualiza a lista localmente
      setListaResidentes(listaResidentes.filter(residente => residente.id !== residenteParaExcluir));
      toast.success('Residente excluído com sucesso!');
    } catch (erro: any) {
      console.error('Erro ao excluir residente:', erro);
      toast.error('Erro ao excluir residente: ' + (erro?.message ?? String(erro)));
    } finally {
      fecharModalExclusao();
    }
  };

  // Componente do Modal de Confirmação de Exclusão
  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    // Encontrar o residente baseado no ID
    const residente = residenteParaExcluir
      ? listaResidentes.find(r => r.id === residenteParaExcluir)
      : null;
    const nomeResidente = residente?.nome || '';

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            {/* Ícone de alerta */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            {/* Textos do modal */}
            <h3 className="text-lg font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
            <p className="text-odara-name mb-6">
              Tem certeza que deseja excluir este residente?
            </p>

            {/* Detalhes do residente */}
            {nomeResidente && (
              <div className="bg-odara-offwhite rounded-lg p-3 mb-4 border border-gray-200">
                <p className="text-sm font-medium text-odara-dark">Residente:</p>
                <p className="text-sm text-odara-name truncate" title={nomeResidente}>
                  "{nomeResidente}"
                </p>
              </div>
            )}

            <p className="text-sm text-odara-alerta mb-6 font-medium">
              Esta ação não pode ser desfeita.
            </p>

            {/* Botões de ação */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={fecharModalExclusao}
                className="px-4 py-2 border border-gray-300 text-odara-dark rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executarExclusao}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Card para mobile
  const CardResidenteMobile = ({ residente }: { residente: ResidenteComResponsavel }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
        {/* Cabeçalho do card */}
        <div className="p-4 border-b border-gray-100 bg-odara-offwhite/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                <User className="h-5 w-5 text-odara-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-odara-dark truncate">{residente.nome}</p>
                <p className="text-xs text-gray-400 truncate">{residente.cpf}</p>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setMenuAberto(menuAberto === residente.id ? null : residente.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="h-5 w-5 text-odara-dropdown-accent" />
              </button>
              
              {menuAberto === residente.id && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      navigate('/app/admin/residente/formulario', { state: { residente } });
                      setMenuAberto(null);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 text-odara-dropdown-accent"
                  >
                    <Edit className="h-4 w-4" />
                    Editar residente
                  </button>
                  <button
                    onClick={() => {
                      navigate('/app/admin/residente/visualizar', { state: { id: residente.id } });
                      setMenuAberto(null);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 text-odara-dropdown-accent"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => {
                      abrirModalExclusao(residente.id);
                      setMenuAberto(null);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-odara-alerta"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo do card */}
        <div className="p-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Sexo</p>
              <p className="text-sm font-medium text-odara-dark capitalize">
                {residente.sexo?.toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Quarto</p>
              <span className="text-sm font-medium text-odara-dark">
                {residente.quarto || 'Não informado'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Idade</p>
              <p className="text-sm font-medium text-odara-dark">
                {differenceInYears(new Date(), new Date(residente.data_nascimento))} anos
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <button
                onClick={() => alternarStatus(residente.id, residente.status)}
                disabled={atualizandoStatus === residente.id}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(residente.status)} ${atualizandoStatus === residente.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                {atualizandoStatus === residente.id ? 'Alterando...' : (residente.status ? 'Ativo' : 'Inativo')}
              </button>
            </div>
          </div>

          {/* Dependência */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Dependência</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${obterCorDependencia(residente.dependencia)}`}>
              {residente.dependencia || 'Não informado'}
            </span>
          </div>

          {/* Responsável */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Responsável</p>
            {residente.responsavel ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-odara-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-odara-dark truncate">
                    {residente.responsavel.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-odara-primary flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate">
                    {formatarTelefone(residente.responsavel.telefone_principal)}
                  </span>
                </div>
                {residente.responsavel.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-odara-primary flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate">
                      {residente.responsavel.email}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Nenhum responsável vinculado</span>
            )}
          </div>

          {/* Data de entrada */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Data de entrada</p>
            <p className="text-sm font-medium text-odara-dark">
              {new Date(residente.data_admissao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
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

      {/* Modal de Confirmação */}
      <ModalConfirmacaoExclusao />

      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
          {/* Título */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark">Residentes</h1>
            <p className="text-xs sm:text-sm text-odara-dark/70 mt-1">Gestão de moradores da instituição</p>
          </div>

          {/* Botão Cadastrar Residente */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full sm:w-auto"
              onClick={() => navigate('/app/admin/residente/formulario')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Residente
            </button>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="text-odara-primary h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <input
            type="text"
            placeholder="Buscar por nome, quarto ou responsável..."
            className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent text-sm sm:text-base"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>

        {/* Tabela para desktop - Cards para mobile */}
        <div className="hidden lg:block">
          {/* Tabela Desktop */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-odara-primary">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-1 border-odara-primary bg-odara-primary/10 text-odara-primary">
                  <tr>
                    <th className="p-4 text-left font-semibold align-middle">Residente</th>
                    <th className="p-4 text-left font-semibold align-middle">Sexo</th>
                    <th className="p-4 text-left font-semibold align-middle">Quarto</th>
                    <th className="p-4 text-left font-semibold align-middle">Idade</th>
                    <th className="p-4 text-left font-semibold align-middle">Dependência</th>
                    <th className="p-4 text-left font-semibold align-middle">Responsável Vinculado</th>
                    <th className="p-4 text-left font-semibold align-middle">Status</th>
                    <th className="p-4 text-left font-semibold align-middle">Entrada</th>
                    <th className="p-4 text-left font-semibold align-middle">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {residentesFiltrados.map((residente) => (
                    <tr key={residente.id} className="hover:bg-odara-offwhite/40 transition-colors">
                      {/* Coluna Residente */}
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {/* Ícone */}
                          <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                            <User className="h-4 w-4 text-odara-primary" />
                          </div>

                          {/* Nome */}
                          <div>
                            <p className="font-medium text-odara-dark">{residente.nome}</p>
                            <p className="text-xs text-gray-400">{residente.cpf}</p>
                          </div>
                        </div>
                      </td>

                      {/* Coluna Sexo */}
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs font-medium text-odara-dark capitalize">
                          {residente.sexo?.toLowerCase()}
                        </span>
                      </td>

                      {/* Coluna Quarto */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${residente.quarto ? '' : 'bg-gray-100 text-gray-400'}`}>
                          {residente.quarto || 'Não informado'}
                        </span>
                      </td>

                      {/* Coluna Idade */}
                      <td className="p-4 text-odara-dark">
                        {differenceInYears(new Date(), new Date(residente.data_nascimento))} anos
                      </td>

                      {/* Coluna Dependência */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${obterCorDependencia(residente.dependencia)}`}>
                          {residente.dependencia || 'Não informado'}
                        </span>
                      </td>

                      {/* Coluna Responsável Vinculado */}
                      <td className="p-4">
                        {residente.responsavel ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-odara-primary" />
                              <span className="text-sm font-medium text-odara-dark">
                                {residente.responsavel.nome}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-odara-primary" />
                              <span className="text-sm text-gray-600">
                                {formatarTelefone(residente.responsavel.telefone_principal)}
                              </span>
                            </div>
                            {residente.responsavel.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-odara-primary" />
                                <span className="text-sm text-gray-600 truncate">
                                  {residente.responsavel.email}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Nenhum responsável vinculado</span>
                        )}
                      </td>

                      {/* Coluna Status */}
                      <td className="p-4">
                        <button
                          onClick={() => alternarStatus(residente.id, residente.status)}
                          disabled={atualizandoStatus === residente.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(residente.status)} ${atualizandoStatus === residente.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          title={`Clique para ${residente.status ? 'inativar' : 'ativar'}`}
                        >
                          {atualizandoStatus === residente.id ? 'Alterando...' : (residente.status ? 'Ativo' : 'Inativo')}
                        </button>
                      </td>

                      {/* Coluna Data de Entrada */}
                      <td className="p-4 whitespace-nowrap text-odara-dark">
                        {new Date(residente.data_admissao).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Coluna Ações */}
                      <td className="p-4">
                        <div className="flex space-x-2">
                          {/* Botão Editar */}
                          <button
                            className="p-1 text-odara-dropdown-accent transition hover:text-odara-secondary rounded"
                            title="Editar residente"
                            onClick={() => navigate('/app/admin/residente/formulario', { state: { residente } })}
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            className="p-1 text-odara-dropdown-accent transition hover:text-odara-secondary rounded"
                            title="Visualizar residente"
                            onClick={() => navigate('/app/admin/residente/visualizar', { state: { id: residente.id } })}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            className="p-1 text-odara-alerta transition hover:text-red-700 rounded"
                            onClick={() => abrirModalExclusao(residente.id)}
                            title="Excluir residente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Resultado vazio */}
              {residentesFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {termoBusca ? 'Nenhum residente encontrado' : 'Nenhum residente cadastrado'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {termoBusca ? 'Tente ajustar sua busca' : 'Cadastre o primeiro residente'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cards para mobile e tablet */}
        <div className="lg:hidden">
          {residentesFiltrados.length > 0 ? (
            residentesFiltrados.map((residente) => (
              <CardResidenteMobile key={residente.id} residente={residente} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">
                {termoBusca ? 'Nenhum residente encontrado' : 'Nenhum residente cadastrado'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {termoBusca ? 'Tente ajustar sua busca' : 'Cadastre o primeiro residente'}
              </p>
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 text-xs sm:text-sm text-gray-400">
          Total de {residentesFiltrados.length} residente(s) encontrado(s) de {listaResidentes.length}
        </div>
      </div>
    </div>
  );
};

export default Residentes;