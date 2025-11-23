import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { Funcionario } from '../../Modelos';
import toast, { Toaster } from 'react-hot-toast';

// Tipos de status disponíveis para funcionários
type StatusFuncionario = 'ativo' | 'licença' | 'afastado' | 'inativo';

const Funcionarios: React.FC = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [listaFuncionarios, setListaFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState<number | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null);

  // Busca todos os funcionários do banco de dados
  const buscarFuncionarios = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('funcionario')
        .select('*');

      if (error) throw error;
      if (data) setListaFuncionarios(data);
    } catch (erro: any) {
      console.error('Erro ao buscar funcionários:', erro);
      toast.error('Erro ao buscar funcionários: ' + (erro?.message ?? String(erro)));
    } finally {
      setCarregando(false);
    }
  };

  // Efeito para carregar funcionários quando o componente montar
  useEffect(() => {
    buscarFuncionarios();
  }, []);

  // Filtra funcionários baseado no termo de busca
  const funcionariosFiltrados = listaFuncionarios.filter(funcionario =>
    (funcionario.nome?.toLowerCase() || '').includes(termoBusca.toLowerCase()) ||
    (funcionario.cargo?.toLowerCase() || '').includes(termoBusca.toLowerCase()) ||
    (funcionario.vinculo?.toLowerCase() || '').includes(termoBusca.toLowerCase()) ||
    (funcionario.registro_profissional?.toLowerCase() || '').includes(termoBusca.toLowerCase())
  );

  // Alterna entre os status disponíveis para funcionários
  const alternarStatus = async (id: number, statusAtual: string) => {
    try {
      setAtualizandoStatus(id);
      
      // Define a ordem dos status para ciclagem
      const statusOrdem: StatusFuncionario[] = ['ativo', 'licença', 'afastado', 'inativo'];
      const statusIndex = statusOrdem.indexOf(statusAtual as StatusFuncionario);
      const proximoStatus = statusOrdem[(statusIndex + 1) % statusOrdem.length];

      const { error } = await supabase
        .from('funcionario')
        .update({ status: proximoStatus })
        .eq('id', id);

      if (error) throw error;

      // Atualiza a lista localmente
      setListaFuncionarios(listaFuncionarios.map(funcionario =>
        funcionario.id === id ? { ...funcionario, status: proximoStatus } : funcionario
      ));

      toast.success(`Status alterado para ${proximoStatus.charAt(0).toUpperCase() + proximoStatus.slice(1)}!`);
    } catch (erro: any) {
      console.error('Erro ao alterar status:', erro);
      toast.error('Erro ao alterar status: ' + (erro?.message ?? String(erro)));
    } finally {
      setAtualizandoStatus(null);
    }
  };

  // Retorna as classes CSS para o status do funcionário
  const obterCorStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'bg-green-50 text-green-500 hover:bg-green-100';
      case 'licença': return 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100';
      case 'afastado': return 'bg-orange-50 text-orange-500 hover:bg-orange-100';
      case 'inativo': return 'bg-gray-100 text-gray-500 hover:bg-gray-200';
      default: return 'bg-gray-100 text-gray-400 hover:bg-gray-200';
    }
  };

  // Abre o modal de confirmação para exclusão
  const abrirModalExclusao = (id: number) => {
    setFuncionarioParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  // Fecha o modal de exclusão
  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setFuncionarioParaExcluir(null);
  };

  // Executa a exclusão do funcionário após confirmação
  const executarExclusao = async () => {
    if (!funcionarioParaExcluir) return;

    try {
      const { error } = await supabase
        .from('funcionario')
        .delete()
        .eq('id', funcionarioParaExcluir);

      if (error) throw error;

      // Atualiza a lista localmente
      setListaFuncionarios(listaFuncionarios.filter(funcionario => funcionario.id !== funcionarioParaExcluir));
      toast.success('Funcionário excluído com sucesso!');
    } catch (erro: any) {
      console.error('Erro ao excluir funcionário:', erro);
      toast.error('Erro ao excluir funcionário: ' + (erro?.message ?? String(erro)));
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
              Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
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
        <div className="text-odara-dark">Carregando funcionários...</div>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">Funcionários</h1>
            <p className="text-sm text-odara-dark/70 mt-1">Gestão de equipe e profissionais</p>
          </div>
          
          {/* Botão Cadastrar Funcionário */}
          <div className="flex-shrink-0">
            <button
              className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full lg:w-auto"
              onClick={() => navigate('/app/admin/funcionario/formulario')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Funcionário
            </button>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-6">
          <div className="flex items-center">
            <Search className="text-odara-primary mr-3 h-4 w-4 flex-shrink-0" />

            <input
              type="text"
              placeholder="Buscar por nome, cargo, vínculo ou registro..."
              className="w-full p-2 outline-none bg-transparent text-odara-dark placeholder:text-gray-400"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Funcionários */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-odara-primary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-1 border-odara-primary bg-odara-primary/10 text-odara-primary">
                <tr>
                  <th className="p-4 text-left font-semibold align-middle">Funcionário</th>
                  <th className="p-4 text-left font-semibold align-middle">Cargo</th>
                  <th className="p-4 text-left font-semibold align-middle">Vínculo</th>
                  <th className="p-4 text-left font-semibold align-middle">Contato</th>
                  <th className="p-4 text-left font-semibold align-middle">Status</th>
                  <th className="p-4 text-left font-semibold align-middle">Admissão</th>
                  <th className="p-4 text-left font-semibold align-middle">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {funcionariosFiltrados.map((funcionario) => (
                  <tr key={funcionario.id} className="hover:bg-odara-offwhite/40 transition-colors">
                    {/* Coluna Funcionário */}
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {/* Ícone */}
                        <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                          <User className="h-4 w-4 text-odara-primary" />
                        </div>

                        {/* Nome e CPF */}
                        <div>
                          <p className="font-medium text-odara-dark">{funcionario.nome}</p>
                          <p className="text-xs text-gray-400">{funcionario.cpf}</p>
                        </div>
                      </div>
                    </td>

                    {/* Coluna Cargo */}
                    <td className="p-4 text-odara-dark">
                      <div className="flex items-center gap-2">
                        <span>{funcionario.cargo}</span>
                      </div>
                      {funcionario.registro_profissional && (
                        <p className="text-xs text-gray-400 mt-1">{funcionario.registro_profissional}</p>
                      )}
                    </td>

                    {/* Coluna Vínculo */}
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {funcionario.vinculo}
                      </span>
                    </td>

                    {/* Coluna Contato */}
                    <td className="p-4">
                      <div className="space-y-1 text-odara-dark">
                        {/* Telefone */}
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-odara-primary" />
                          <span className="text-sm">{funcionario.telefone_principal}</span>
                          {funcionario.telefone_secundario && (
                            <span className="text-sm text-gray-400">/{funcionario.telefone_secundario}</span>
                          )}
                        </div>

                        {/* E-mail */}
                        {funcionario.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-odara-primary" />
                            <span className="text-sm truncate">{funcionario.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Coluna Status */}
                    <td className="p-4">
                      <button
                        onClick={() => alternarStatus(funcionario.id, funcionario.status)}
                        disabled={atualizandoStatus === funcionario.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(funcionario.status)} ${
                          atualizandoStatus === funcionario.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Clique para alterar o status"
                      >
                        {atualizandoStatus === funcionario.id ? 'Alterando...' : funcionario.status}
                      </button>
                    </td>

                    {/* Coluna Data de Admissão */}
                    <td className="p-4 whitespace-nowrap text-odara-dark">
                      {new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')}
                    </td>

                    {/* Coluna Ações */}
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {/* Botão Editar */}
                        <button
                          className="p-1 text-odara-dropdown-accent transition hover:text-odara-secondary rounded"
                          title="Editar funcionário"
                          onClick={() => navigate('/app/admin/funcionario/formulario', { state: { funcionario } })}
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Botão Excluir */}
                        <button
                          className="p-1 text-odara-alerta transition hover:text-red-700 rounded"
                          onClick={() => abrirModalExclusao(funcionario.id)}
                          title="Excluir funcionário"
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
            {funcionariosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400">
                  {termoBusca ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {termoBusca ? 'Tente ajustar sua busca' : 'Cadastre o primeiro funcionário'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 text-sm text-gray-400">
          Total de {funcionariosFiltrados.length} funcionário(s) encontrado(s) de {listaFuncionarios.length}
        </div>
      </div>
    </div>
  );
};

export default Funcionarios;