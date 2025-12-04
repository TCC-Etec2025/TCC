import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, AlertTriangle, Mail, Phone, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

// Interfaces para tipagem
interface Papel {
  id: number;
  nome: string;
  descricao?: string;
}

interface FuncionarioUsuario {
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  status: string;
  telefone_principal: string;
}

interface ResponsavelUsuario {
  id: number;
  nome: string;
  cpf: string;
  status: boolean;
  telefone_principal: string;
  parentesco?: string;
}

interface Usuario {
  id: number;
  email: string;
  senha: string;
  id_papel: number;
  status: boolean;
  criado_em: string;
  atualizado_em: string;
  papel?: Papel;
  funcionario?: FuncionarioUsuario;
  responsavel?: ResponsavelUsuario;
}

const Usuarios: React.FC = () => {
  const navigate = useNavigate();

  // Estados do componente
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<number | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  // Busca todos os usuários do banco de dados com consultas separadas
  const buscarUsuarios = async () => {
    try {
      setCarregando(true);

      // 1. Buscar usuários básicos
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuario')
        .select('*')
        .order('criado_em', { ascending: false });

      if (usuariosError) throw usuariosError;

      if (!usuariosData || usuariosData.length === 0) {
        setListaUsuarios([]);
        return;
      }

      // 2. Buscar papéis
      const { data: papeisData, error: papeisError } = await supabase
        .from('papel')
        .select('*');

      if (papeisError) throw papeisError;

      // 3. Buscar funcionários vinculados aos usuários
      const usuarioIds = usuariosData.map(u => u.id);
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionario')
        .select('id, id_usuario, nome, cpf, cargo, status, telefone_principal')
        .in('id_usuario', usuarioIds);

      if (funcionariosError) throw funcionariosError;

      // 4. Buscar responsáveis vinculados aos usuários
      const { data: responsaveisData, error: responsaveisError } = await supabase
        .from('responsavel')
        .select('id, id_usuario, nome, cpf, status, telefone_principal')
        .in('id_usuario', usuarioIds);

      if (responsaveisError) throw responsaveisError;

      // 5. Buscar parentesco dos responsáveis na tabela residente
      const responsavelIds = responsaveisData?.map(r => r.id) || [];
      let parentescos: { [key: number]: string } = {};

      if (responsavelIds.length > 0) {
        const { data: residentesData, error: residentesError } = await supabase
          .from('residente')
          .select('id_responsavel, responsavel_parentesco')
          .in('id_responsavel', responsavelIds);

        if (!residentesError && residentesData) {
          // Criar mapa de parentesco por responsável
          residentesData.forEach(residente => {
            if (residente.id_responsavel && residente.responsavel_parentesco) {
              parentescos[residente.id_responsavel] = residente.responsavel_parentesco;
            }
          });
        }
      }

      // Combinar todos os dados
      const usuariosCompletos = usuariosData.map(usuario => {
        const papel = papeisData?.find(p => p.id === usuario.id_papel);
        const funcionario = funcionariosData?.find(f => f.id_usuario === usuario.id);
        const responsavel = responsaveisData?.find(r => r.id_usuario === usuario.id);
        
        // Adicionar parentesco ao responsável se existir
        const responsavelComParentesco = responsavel ? {
          ...responsavel,
          parentesco: parentescos[responsavel.id] || '',
          telefone_principal: responsavel.telefone_principal
        } : undefined;

        return {
          ...usuario,
          papel: papel || undefined,
          funcionario: funcionario ? {
            id: funcionario.id,
            nome: funcionario.nome,
            cpf: funcionario.cpf,
            cargo: funcionario.cargo,
            status: funcionario.status,
            telefone_principal: funcionario.telefone_principal
          } : undefined,
          responsavel: responsavelComParentesco
        };
      });

      setListaUsuarios(usuariosCompletos);

    } catch (erro: any) {
      console.error('Erro ao buscar usuários:', erro);
      toast.error('Erro ao buscar usuários: ' + (erro?.message ?? String(erro)));
    } finally {
      setCarregando(false);
    }
  };

  // Efeito para carregar usuários quando o componente montar
  useEffect(() => {
    buscarUsuarios();
  }, []);

  // Filtra usuários baseado no termo de busca
  const usuariosFiltrados = listaUsuarios.filter(usuario => {
    const termoLower = termoBusca.toLowerCase();

    return (
      usuario.email.toLowerCase().includes(termoLower) ||
      (usuario.papel?.nome?.toLowerCase() || '').includes(termoLower) ||
      (usuario.funcionario?.nome?.toLowerCase() || '').includes(termoLower) ||
      (usuario.funcionario?.cpf || '').includes(termoLower) ||
      (usuario.funcionario?.cargo?.toLowerCase() || '').includes(termoLower) ||
      (usuario.funcionario?.telefone_principal || '').includes(termoLower) ||
      (usuario.responsavel?.nome?.toLowerCase() || '').includes(termoLower) ||
      (usuario.responsavel?.cpf || '').includes(termoLower) ||
      (usuario.responsavel?.parentesco?.toLowerCase() || '').includes(termoLower) ||
      (usuario.responsavel?.telefone_principal || '').includes(termoLower)
    );
  });

  // Formata número de telefone para exibição
  const formatarTelefone = (telefone: string) => {
    if (!telefone) return '';
    
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    // Formata baseado no tamanho
    if (numeros.length === 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    } else if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    
    // Retorna o original se não conseguir formatar
    return telefone;
  };

  // Alterna o status do usuário
  const alternarStatus = async (id: number, statusAtual: boolean) => {
    try {
      setAtualizandoStatus(id);
      const novoStatus = !statusAtual;

      const { error } = await supabase
        .from('usuario')
        .update({
          status: novoStatus,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Atualiza a lista localmente
      setListaUsuarios(listaUsuarios.map(usuario =>
        usuario.id === id ? { ...usuario, status: novoStatus } : usuario
      ));

      toast.success(`Usuário ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (erro: any) {
      console.error('Erro ao alterar status:', erro);
      toast.error('Erro ao alterar status: ' + (erro?.message ?? String(erro)));
    } finally {
      setAtualizandoStatus(null);
    }
  };

  // Retorna as classes CSS para o status do usuário
  const obterCorStatus = (status: boolean) => {
    return status
      ? 'bg-green-50 text-green-500 hover:bg-green-100'
      : 'bg-gray-100 text-gray-400 hover:bg-gray-200';
  };

  // Obtém o nome do usuário (funcionário ou responsável)
  const obterNomeUsuario = (usuario: Usuario): string => {
    return usuario.funcionario?.nome || usuario.responsavel?.nome || 'Nome não informado';
  };

  // Obtém informações adicionais do usuário
  const obterInfoUsuario = (usuario: Usuario): string => {
    if (usuario.funcionario) {
      return `${usuario.funcionario.cpf} • ${usuario.funcionario.cargo}`;
    }
    if (usuario.responsavel) {
      return `${usuario.responsavel.cpf}${usuario.responsavel.parentesco ? ' • ' + usuario.responsavel.parentesco : ''}`;
    }
    return 'Usuário do sistema';
  };

  // Formata o nome do papel
  const formatarPapel = (papel: string | undefined) => {
    switch (papel?.toLowerCase()) {
      case 'administrador': return 'Administrador';
      case 'funcionario': return 'Funcionário';
      case 'responsavel': return 'Responsável';
      default: return papel || 'Não informado';
    }
  };

  // Abre o modal de confirmação para exclusão
  const abrirModalExclusao = (id: number) => {
    setUsuarioParaExcluir(id);
    setModalExclusaoAberto(true);
  };

  // Fecha o modal de exclusão
  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setUsuarioParaExcluir(null);
  };

  // Executa a exclusão do usuário após confirmação
  const executarExclusao = async () => {
    if (!usuarioParaExcluir) return;

    try {
      const { error } = await supabase
        .from('usuario')
        .delete()
        .eq('id', usuarioParaExcluir);

      if (error) throw error;

      // Atualiza a lista localmente
      setListaUsuarios(listaUsuarios.filter(usuario => usuario.id !== usuarioParaExcluir));
      toast.success('Usuário excluído com sucesso!');
    } catch (erro: any) {
      console.error('Erro ao excluir usuário:', erro);
      toast.error('Erro ao excluir usuário: ' + (erro?.message ?? String(erro)));
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
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
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
  const CardUsuarioMobile = ({ usuario }: { usuario: Usuario }) => {
    const nomeUsuario = obterNomeUsuario(usuario);
    const infoUsuario = obterInfoUsuario(usuario);
    const telefone = usuario.funcionario?.telefone_principal || usuario.responsavel?.telefone_principal;
    const papelFormatado = formatarPapel(usuario.papel?.nome);

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
                <p className="font-medium text-odara-dark truncate">{nomeUsuario}</p>
                <p className="text-xs text-gray-400 truncate">{infoUsuario}</p>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setMenuAberto(menuAberto === usuario.id ? null : usuario.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="h-5 w-5 text-odara-dropdown-accent" />
              </button>
              
              {menuAberto === usuario.id && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  {usuario.papel?.nome?.toLowerCase() === 'funcionario' && (
                    <button
                      onClick={() => {
                        navigate('/app/admin/funcionario/permissoes', { 
                          state: { 
                            idFuncionario: usuario.id, 
                            nomeFuncionario: nomeUsuario 
                          } 
                        });
                        setMenuAberto(null);
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 text-odara-dropdown-accent"
                    >
                      <Edit className="h-4 w-4" />
                      Editar permissões
                    </button>
                  )}
                  <button
                    onClick={() => {
                      abrirModalExclusao(usuario.id);
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
          {/* E-mail */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">E-mail</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-odara-primary flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">{usuario.email}</span>
            </div>
          </div>

          {/* Telefone */}
          {telefone && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Telefone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-odara-primary flex-shrink-0" />
                <span className="text-sm text-gray-600">{formatarTelefone(telefone)}</span>
              </div>
            </div>
          )}

          {/* Papel */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Papel</p>
            <span className="text-sm font-medium text-odara-dark capitalize">
              {papelFormatado}
            </span>
          </div>

          {/* Status e data de cadastro */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <button
                onClick={() => alternarStatus(usuario.id, usuario.status)}
                disabled={atualizandoStatus === usuario.id}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(usuario.status)} ${atualizandoStatus === usuario.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                {atualizandoStatus === usuario.id ? 'Alterando...' : (usuario.status ? 'Ativo' : 'Inativo')}
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cadastro</p>
              <p className="text-sm font-medium text-odara-dark">
                {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
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
        <div className="text-odara-dark">Carregando usuários...</div>
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark">Usuários do Sistema</h1>
            <p className="text-xs sm:text-sm text-odara-dark/70 mt-1">Gerenciamento de acessos e permissões</p>
          </div>

          {/* Botão Cadastrar Usuário */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full sm:w-auto"
              onClick={() => navigate('/app/admin/usuario/formulario')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Usuário
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
            placeholder="Buscar por e-mail, telefone, nome, CPF, cargo, papel ou parentesco..."
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
                    <th className="p-4 text-left font-semibold align-middle">Usuário</th>
                    <th className="p-4 text-left font-semibold align-middle">Contato</th>
                    <th className="p-4 text-left font-semibold align-middle">Papel</th>
                    <th className="p-4 text-left font-semibold align-middle">Status</th>
                    <th className="p-4 text-left font-semibold align-middle">Cadastro</th>
                    <th className="p-4 text-left font-semibold align-middle">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {usuariosFiltrados.map((usuario) => {
                    const nomeUsuario = obterNomeUsuario(usuario);
                    const infoUsuario = obterInfoUsuario(usuario);
                    const telefone = usuario.funcionario?.telefone_principal || usuario.responsavel?.telefone_principal;
                    const papelFormatado = formatarPapel(usuario.papel?.nome);

                    return (
                      <tr key={usuario.id} className="hover:bg-odara-offwhite/40 transition-colors">
                        {/* Coluna Usuário */}
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            {/* Ícone */}
                            <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                              <User className="h-4 w-4 text-odara-primary" />
                            </div>

                            {/* Nome e informações */}
                            <div>
                              <p className="font-medium text-odara-dark">{nomeUsuario}</p>
                              <p className="text-xs text-gray-400">{infoUsuario}</p>
                            </div>
                          </div>
                        </td>

                        {/* Coluna Contato */}
                        <td className="p-4">
                          <div className="space-y-1 text-odara-dark">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-odara-primary" />
                              <span className="text-sm truncate">{usuario.email}</span>
                            </div>
                            {telefone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-odara-primary" />
                                <span className="text-sm truncate">
                                  {formatarTelefone(telefone)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Coluna Papel */}
                        <td className="p-4">
                          <span className={`text-xs text-odara-dark font-medium capitalize ${usuario.papel?.nome ? '' : 'px-2 py-1 rounded-full bg-gray-100 text-gray-400'}`}>
                            <div className="flex items-center gap-1">
                              <span>{papelFormatado}</span>
                            </div>
                          </span>
                        </td>

                        {/* Coluna Status */}
                        <td className="p-4">
                          <button
                            onClick={() => alternarStatus(usuario.id, usuario.status)}
                            disabled={atualizandoStatus === usuario.id}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${obterCorStatus(usuario.status)} ${atualizandoStatus === usuario.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            title="Clique para alterar o status"
                          >
                            {atualizandoStatus === usuario.id ? 'Alterando...' : (usuario.status ? 'Ativo' : 'Inativo')}
                          </button>
                        </td>

                        {/* Coluna Data de Cadastro */}
                        <td className="p-4 whitespace-nowrap text-odara-dark">
                          {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
                        </td>

                        {/* Coluna Ações */}
                        <td className="p-4">
                          <div className="flex space-x-2">
                            {/* Botão Editar permissões (apenas para funcionários) */}
                            {usuario.papel?.nome?.toLowerCase() === 'funcionario' && (
                              <button
                                className="p-1 text-odara-dropdown-accent transition hover:text-odara-secondary rounded"
                                title="Editar permissões"
                                onClick={() => navigate('/app/admin/funcionario/permissoes', { 
                                  state: { 
                                    idFuncionario: usuario.id, 
                                    nomeFuncionario: nomeUsuario 
                                  } 
                                })}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}

                            {/* Botão Excluir */}
                            <button
                              className="p-1 text-odara-alerta transition hover:text-red-700 rounded"
                              onClick={() => abrirModalExclusao(usuario.id)}
                              title="Excluir usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Resultado vazio */}
              {usuariosFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {termoBusca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {termoBusca ? 'Tente ajustar sua busca' : 'Cadastre o primeiro usuário'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cards para mobile e tablet */}
        <div className="lg:hidden">
          {usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map((usuario) => (
              <CardUsuarioMobile key={usuario.id} usuario={usuario} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">
                {termoBusca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {termoBusca ? 'Tente ajustar sua busca' : 'Cadastre o primeiro usuário'}
              </p>
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 text-xs sm:text-sm text-gray-400">
          Total de {usuariosFiltrados.length} usuário(s) encontrado(s) de {listaUsuarios.length}
        </div>
      </div>
    </div>
  );
};

export default Usuarios;