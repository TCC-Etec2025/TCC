import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, AlertTriangle, MoreVertical, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { Funcionario } from '../../Modelos';
import toast, { Toaster } from 'react-hot-toast';
import ModalAtribuicaoResidentes from './AtribuirResidentes';

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
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);

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

  // Card para mobile
  const CardFuncionarioMobile = ({ funcionario }: { funcionario: Funcionario }) => {
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
                <p className="font-medium text-odara-dark truncate">{funcionario.nome}</p>
                <p className="text-xs text-gray-400 truncate">{funcionario.cpf}</p>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setMenuAberto(menuAberto === funcionario.id ? null : funcionario.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="h-5 w-5 text-odara-dropdown-accent" />
              </button>
              
              {menuAberto === funcionario.id && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      navigate('/app/admin/funcionario/formulario', { state: { funcionario } });
                      setMenuAberto(null);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 text-odara-dropdown-accent"
                  >
                    <Edit className="h-4 w-4" />
                    Editar funcionário
                  </button>
                  <button
                    onClick={() => {
                      setFuncionarioSelecionado(funcionario);
                      setModalAberto(true);
                      setMenuAberto(null);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10"
                  >
                    <Users className="h-4 w-4" />
                    Atribuir residentes
                  </button>
                  <button
                    onClick={() => {
                      abrirModalExclusao(funcionario.id);
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
          {/* Cargo e registro */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Cargo</p>
            <p className="text-sm font-medium text-odara-dark">{funcionario.cargo}</p>
            {funcionario.registro_profissional && (
              <p className="text-xs text-gray-500 mt-1">{funcionario.registro_profissional}</p>
            )}
          </div>

          {/* Vínculo */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Vínculo</p>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
              {funcionario.vinculo}
            </span>
          </div>

          {/* Contato */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Contato</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-odara-primary flex-shrink-0" />
                <div>
                  <span className="text-sm text-odara-dark">{funcionario.telefone_principal}</span>
                  {funcionario.telefone_secundario && (
                    <span className="text-sm text-gray-600 ml-1">/ {funcionario.telefone_secundario}</span>
                  )}
                </div>
              </div>
              {funcionario.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-odara-primary flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate">{funcionario.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status e data de admissão */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <button
                onClick={() => alternarStatus(funcionario.id, funcionario.status)}
                disabled={atualizandoStatus === funcionario.id}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(funcionario.status)} ${atualizandoStatus === funcionario.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                {atualizandoStatus === funcionario.id ? 'Alterando...' : funcionario.status}
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Admissão</p>
              <p className="text-sm font-medium text-odara-dark">
                {new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')}
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
        <div className="text-odara-dark">Carregando funcionários...</div>
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark">Funcionários</h1>
            <p className="text-xs sm:text-sm text-odara-dark/70 mt-1">Gestão de equipe e profissionais</p>
          </div>

          {/* Botão Cadastrar Funcionário */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full sm:w-auto"
              onClick={() => navigate('/app/admin/funcionario/formulario')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Funcionário
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
            placeholder="Buscar por nome, cargo, vínculo ou registro..."
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
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(funcionario.status)} ${atualizandoStatus === funcionario.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
                          {/* Atribuir residentes */}
                          <button
                            className="p-1 text-odara-dropdown-accent transition hover:text-odara-secondary rounded"
                            title="Atribuir residentes"
                            onClick={() => {
                              setFuncionarioSelecionado(funcionario);
                              setModalAberto(true);
                            }}
                          >
                            <Users className="h-4 w-4" />
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
        </div>

        {/* Cards para mobile e tablet */}
        <div className="lg:hidden">
          {funcionariosFiltrados.length > 0 ? (
            funcionariosFiltrados.map((funcionario) => (
              <CardFuncionarioMobile key={funcionario.id} funcionario={funcionario} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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

        {/* Contador de resultados */}
        <div className="mt-4 text-xs sm:text-sm text-gray-400">
          Total de {funcionariosFiltrados.length} funcionário(s) encontrado(s) de {listaFuncionarios.length}
        </div>
      </div>
      <ModalAtribuicaoResidentes
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        funcionarioId={funcionarioSelecionado?.id || null}
        funcionarioNome={funcionarioSelecionado?.nome || null}
      />
    </div>
  );
};

export default Funcionarios;