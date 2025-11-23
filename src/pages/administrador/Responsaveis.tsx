import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, AlertTriangle } from 'lucide-react';
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

// Tipos de status disponíveis para responsáveis
type StatusResponsavel = 'ativo' | 'inativo';

const Responsaveis: React.FC = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [listaResponsaveis, setListaResponsaveis] = useState<ResponsavelComResidente[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [responsavelParaExcluir, setResponsavelParaExcluir] = useState<number | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null);

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

    } catch (erro: any) {
      console.error('Erro ao buscar responsáveis:', erro);
      toast.error('Erro ao buscar responsáveis: ' + (erro?.message ?? String(erro)));
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
      // Buscar também nos nomes dos residentes vinculados
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
    } catch (erro: any) {
      console.error('Erro ao alterar status:', erro);
      toast.error('Erro ao alterar status: ' + (erro?.message ?? String(erro)));
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
    } catch (erro: any) {
      console.error('Erro ao excluir responsável:', erro);
      toast.error('Erro ao excluir responsável: ' + (erro?.message ?? String(erro)));
    } finally {
      fecharModalExclusao();
    }
  };

  // Componente do Modal de Confirmação de Exclusão
  const ModalConfirmacaoExclusao = () => {
    if (!modalExclusaoAberto) return null;

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

      <div className="container mx-auto p-6 lg:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          {/* Título */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">Responsáveis</h1>
            <p className="text-sm text-odara-dark/70 mt-1">Gestão de responsáveis pelos residentes</p>
          </div>
          
          {/* Botão Cadastrar Responsável */}
          <div className="flex-shrink-0">
            <button
              className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full lg:w-auto"
              onClick={() => navigate('/app/admin/responsavel/formulario')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Responsável
            </button>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-6">
          <div className="flex items-center">
            <Search className="text-odara-primary mr-3 h-4 w-4 flex-shrink-0" />

            <input
              type="text"
              placeholder="Buscar por nome, telefone, email ou nome do residente..."
              className="w-full p-2 outline-none bg-transparent text-odara-dark placeholder:text-gray-400"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Responsáveis */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-odara-primary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-1 border-odara-primary bg-odara-primary/10 text-odara-primary">
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
                        <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
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
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(responsavel.status)} ${
                          atualizandoStatus === responsavel.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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

        {/* Contador de resultados */}
        <div className="mt-4 text-sm text-gray-400">
          Total de {responsaveisFiltrados.length} responsável(eis) encontrado(s) de {listaResponsaveis.length}
        </div>
      </div>
    </div>
  );
};

export default Responsaveis;