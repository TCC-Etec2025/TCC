import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, AlertTriangle, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { Responsavel } from '../../Modelos';
import toast, { Toaster } from 'react-hot-toast';

type ResponsavelComResidente = Responsavel & {
  residentes: {
    id: number;
    nome: string;
    parentesco: string;
  }[];
};

const Responsaveis: React.FC = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [listaResponsaveis, setListaResponsaveis] = useState<ResponsavelComResidente[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [responsavelParaExcluir, setResponsavelParaExcluir] = useState<number | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  // Busca todos os responsáveis do banco de dados
  const buscarResponsaveis = async () => {
    try {
      setCarregando(true);

      // 1. Buscar todos os responsáveis
      const { data: responsaveisData, error: responsaveisError } = await supabase
        .from('responsavel')
        .select('*')
        .order('nome', { ascending: true });

      if (responsaveisError) throw responsaveisError;

      // 2. Buscar todos os residentes com seus responsáveis
      const { data: residentesData, error: residentesError } = await supabase
        .from('residente')
        .select('id, nome, id_responsavel, responsavel_parentesco')
        .not('id_responsavel', 'is', null);

      if (residentesError) throw residentesError;

      // 3. Combinar os dados
      const responsaveisComResidentes = responsaveisData.map(responsavel => {
        const residentesDoResponsavel = residentesData
          .filter(residente => residente.id_responsavel === responsavel.id)
          .map(residente => ({
            id: residente.id,
            nome: residente.nome,
            parentesco: residente.responsavel_parentesco
          }));

        return {
          ...responsavel,
          residentes: residentesDoResponsavel
        };
      });

      setListaResponsaveis(responsaveisComResidentes);

    } catch (erro) {
      console.error('Erro ao buscar responsáveis:', erro);
      toast.error('Erro ao buscar responsáveis');
    } finally {
      setCarregando(false);
    }
  };

  // Efeito para carregar responsáveis quando o componente montar
  useEffect(() => {
    buscarResponsaveis();
  }, []);

  // Filtra responsáveis baseado no termo de busca
  const responsaveisFiltrados = listaResponsaveis.filter(responsavel => {
    if (!responsavel) return false;

    const termoBuscaLower = termoBusca.toLowerCase();

    return (
      (responsavel.nome?.toLowerCase() || '').includes(termoBuscaLower) ||
      (responsavel.telefone_principal?.toLowerCase() || '').includes(termoBuscaLower) ||
      (responsavel.email?.toLowerCase() || '').includes(termoBuscaLower) ||
      responsavel.residentes?.some(residente =>
        residente.nome?.toLowerCase().includes(termoBuscaLower)
      )
    );
  });

  // Formata número de telefone para exibição
  const formatarTelefone = (telefone: string) => {
    if (!telefone) return '';
    return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`;
  };

  // Alterna o status do responsável
  const alternarStatus = async (id: number, statusAtual: boolean) => {
    try {
      setAtualizandoStatus(id);
      const novoStatus = !statusAtual;

      const { error } = await supabase
        .from('responsavel')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      // Atualiza a lista localmente
      setListaResponsaveis(listaResponsaveis.map(responsavel =>
        responsavel.id === id ? { ...responsavel, status: novoStatus } : responsavel
      ));

      toast.success(`Responsável ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (erro) {
      console.error('Erro ao alterar status:', erro);
      toast.error('Erro ao alterar status');
    } finally {
      setAtualizandoStatus(null);
    }
  };

  // Retorna as classes CSS para o status do responsável
  const obterCorStatus = (status: boolean) => {
    return status
      ? 'bg-green-50 text-green-500 hover:bg-green-100'
      : 'bg-gray-200 text-gray-500 hover:bg-gray-300';
  };

  // Abre o modal de confirmação para exclusão
  const abrirModalExclusao = (id: number) => {
    setResponsavelParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  // Fecha o modal de exclusão
  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setResponsavelParaExcluir(null);
  };

  // Executa a exclusão do responsável após confirmação
  const executarExclusao = async () => {
    if (!responsavelParaExcluir) return;

    try {
      // Primeiro, remover o vínculo dos residentes com este responsável
      const { error: updateError } = await supabase
        .from('residente')
        .update({ id_responsavel: null })
        .eq('id_responsavel', responsavelParaExcluir);

      if (updateError) throw updateError;

      // Depois, excluir o responsável
      const { error: deleteError } = await supabase
        .from('responsavel')
        .delete()
        .eq('id', responsavelParaExcluir);

      if (deleteError) throw deleteError;

      // Atualiza a lista localmente
      setListaResponsaveis(listaResponsaveis.filter(responsavel => responsavel.id !== responsavelParaExcluir));
      toast.success('Responsável excluído com sucesso!');
    } catch (erro) {
      console.error('Erro ao excluir responsável:', erro);
      toast.error('Erro ao excluir responsável');
    } finally {
      fecharModalExclusao();
    }
  };

  // Componente do Modal de Confirmação de Exclusão
  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            {/* Ícone de alerta */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            {/* Textos do modal */}
            <h3 className="text-lg font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
            <p className="text-odara-name mb-6">
              Tem certeza que deseja excluir este responsável? Esta ação não pode ser desfeita.
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
  const CardResponsavelMobile = ({ responsavel }: { responsavel: ResponsavelComResidente }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
        {/* Cabeçalho do card */}
        <div className="p-4 border-b border-gray-100 bg-odara-offwhite/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-odara-primary/20 rounded-full p-2 shrink-0">
                <User className="h-5 w-5 text-odara-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-odara-dark truncate">{responsavel.nome}</p>
                <p className="text-xs text-gray-400 truncate">{responsavel.cpf}</p>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setMenuAberto(menuAberto === responsavel.id ? null : responsavel.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="h-5 w-5 text-odara-dropdown-accent" />
              </button>
              
              {menuAberto === responsavel.id && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      navigate('/app/admin/responsavel/formulario', { state: { responsavel } });
                      setMenuAberto(null);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 text-odara-dropdown-accent"
                  >
                    <Edit className="h-4 w-4" />
                    Editar responsável
                  </button>
                  <button
                    onClick={() => {
                      abrirModalExclusao(responsavel.id);
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
          {/* Contato */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Contato</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-odara-primary shrink-0" />
                <span className="text-sm text-odara-dark">
                  {formatarTelefone(responsavel.telefone_principal)}
                </span>
              </div>
              {responsavel.telefone_secundario && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-odara-primary shrink-0" />
                  <span className="text-sm text-gray-600">
                    {formatarTelefone(responsavel.telefone_secundario)}
                  </span>
                </div>
              )}
              {responsavel.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-odara-primary shrink-0" />
                  <span className="text-sm text-gray-600 truncate">
                    {responsavel.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Residentes vinculados */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Residentes vinculados</p>
            {responsavel.residentes?.length > 0 ? (
              <div className="space-y-2">
                {responsavel.residentes.map((residente) => (
                  <div key={residente.id} className="flex items-center gap-2">
                    <User className="h-4 w-4 text-odara-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-odara-dark truncate">
                        {residente.nome}
                      </p>
                      {residente.parentesco && (
                        <p className="text-xs text-gray-500 capitalize">
                          {residente.parentesco}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Nenhum residente vinculado</span>
            )}
          </div>

          {/* Status e data de cadastro */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <button
                onClick={() => alternarStatus(responsavel.id, responsavel.status)}
                disabled={atualizandoStatus === responsavel.id}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(responsavel.status)} ${atualizandoStatus === responsavel.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                {atualizandoStatus === responsavel.id ? 'Alterando...' : (responsavel.status ? 'Ativo' : 'Inativo')}
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cadastro</p>
              <p className="text-sm font-medium text-odara-dark">
                {responsavel.criado_em ? new Date(responsavel.criado_em).toLocaleDateString('pt-BR') : 'Não informado'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Estado de carregamento
  if (carregando) {
    return (
      <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
        <div className="text-odara-dark">Carregando responsáveis...</div>
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark">Responsáveis</h1>
            <p className="text-xs sm:text-sm text-odara-dark/70 mt-1">Gestão de responsáveis pelos residentes</p>
          </div>

          {/* Botão Cadastrar Responsável */}
          <div className="shrink-0 w-full sm:w-auto">
            <button
              className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full sm:w-auto"
              onClick={() => navigate('/app/admin/responsavel/formulario')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Responsável
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
            placeholder="Buscar por nome, telefone, email ou residente..."
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
                <thead className="border-b border-odara-primary bg-odara-primary/10 text-odara-primary">
                  <tr>
                    <th className="p-4 text-left font-semibold align-middle">Responsável</th>
                    <th className="p-4 text-left font-semibold align-middle">Contato</th>
                    <th className="p-4 text-left font-semibold align-middle">Residentes Vinculados</th>
                    <th className="p-4 text-left font-semibold align-middle">Status</th>
                    <th className="p-4 text-left font-semibold align-middle">Cadastro</th>
                    <th className="p-4 text-left font-semibold align-middle">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {responsaveisFiltrados.map((responsavel) => (
                    <tr key={responsavel.id} className="hover:bg-odara-offwhite/40 transition-colors">
                      {/* Coluna Responsável */}
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {/* Ícone */}
                          <div className="bg-odara-primary/20 rounded-full p-2 shrink-0">
                            <User className="h-4 w-4 text-odara-primary" />
                          </div>

                          {/* Nome e CPF */}
                          <div>
                            <p className="font-medium text-odara-dark">{responsavel.nome}</p>
                            <p className="text-xs text-gray-400">{responsavel.cpf}</p>
                          </div>
                        </div>
                      </td>

                      {/* Coluna Contato */}
                      <td className="p-4">
                        <div className="space-y-1 text-odara-dark">
                          {/* Telefone Principal */}
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-odara-primary" />
                            <span className="text-sm">{formatarTelefone(responsavel.telefone_principal)}</span>
                          </div>

                          {/* Telefone Secundário */}
                          {responsavel.telefone_secundario && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-odara-primary" />
                              <span className="text-sm text-gray-400">{formatarTelefone(responsavel.telefone_secundario)}</span>
                            </div>
                          )}

                          {/* E-mail */}
                          {responsavel.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-odara-primary" />
                              <span className="text-sm truncate">{responsavel.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Coluna Residentes Vinculados */}
                      <td className="p-4">
                        <div className="space-y-2">
                          {responsavel.residentes?.map((residente) => (
                            <div key={residente.id} className="flex items-center gap-2">
                              <User className="h-4 w-4 text-odara-primary" />
                              <span className="text-sm font-medium text-odara-dark">
                                {residente.nome}
                              </span>
                              <span className={` ${residente.parentesco ? 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize' : ''}`}>
                                {residente.parentesco ? residente.parentesco : ''}
                              </span>
                            </div>
                          ))}
                          {responsavel.residentes?.length === 0 && (
                            <span className="text-sm text-gray-500">Nenhum residente vinculado</span>
                          )}
                        </div>
                      </td>

                      {/* Coluna Status */}
                      <td className="p-4">
                        <button
                          onClick={() => alternarStatus(responsavel.id, responsavel.status)}
                          disabled={atualizandoStatus === responsavel.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(responsavel.status)} ${atualizandoStatus === responsavel.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          title={`Clique para ${responsavel.status ? 'inativar' : 'ativar'}`}
                        >
                          {atualizandoStatus === responsavel.id ? 'Alterando...' : (responsavel.status ? 'Ativo' : 'Inativo')}
                        </button>
                      </td>

                      {/* Coluna Data de Cadastro */}
                      <td className="p-4 whitespace-nowrap text-odara-dark">
                        {responsavel.criado_em ? new Date(responsavel.criado_em).toLocaleDateString('pt-BR') : 'Não informado'}
                      </td>

                      {/* Coluna Ações */}
                      <td className="p-4">
                        <div className="flex space-x-2">
                          {/* Botão Editar */}
                          <button
                            className="p-1 text-odara-dropdown-accent transition hover:text-odara-secondary rounded"
                            title="Editar responsável"
                            onClick={() => navigate('/app/admin/responsavel/formulario', { state: { responsavel } })}
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            className="p-1 text-odara-alerta transition hover:text-red-700 rounded"
                            onClick={() => abrirModalExclusao(responsavel.id)}
                            title="Excluir responsável"
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
              {responsaveisFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {termoBusca ? 'Nenhum responsável encontrado' : 'Nenhum responsável cadastrado'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {termoBusca ? 'Tente ajustar sua busca' : 'Cadastre o primeiro responsável'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cards para mobile e tablet */}
        <div className="lg:hidden">
          {responsaveisFiltrados.length > 0 ? (
            responsaveisFiltrados.map((responsavel) => (
              <CardResponsavelMobile key={responsavel.id} responsavel={responsavel} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">
                {termoBusca ? 'Nenhum responsável encontrado' : 'Nenhum responsável cadastrado'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {termoBusca ? 'Tente ajustar sua busca' : 'Cadastre o primeiro responsável'}
              </p>
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 text-xs sm:text-sm text-gray-400">
          Total de {responsaveisFiltrados.length} responsável(eis) encontrado(s) de {listaResponsaveis.length}
        </div>
      </div>
    </div>
  );
};

export default Responsaveis;