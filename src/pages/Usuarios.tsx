import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, User, ShieldCheck, CheckCircle, Ban } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Usuarios: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("usuario_sistema")
          .select(`
          id,
          email,
          status,
          criado_em,
          atualizado_em,
          funcionario (nome, cpf),
          responsavel (nome, cpf),
          papel (nome)
        `);

        if (error) {
          throw new Error("Erro ao buscar usuários: " + error.message);
        } else {
          setUsuarios(data);
        }
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) {
      try {
        const { error } = await supabase
          .from('usuario_sistema')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setUsuarios(usuarios.filter(usuario => usuario.id !== id));
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário');
      }
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'administrador': return 'bg-purple-100 text-purple-700';
      case 'colaborador': return 'bg-blue-100 text-blue-700';
      case 'responsavel': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      usuario.email.toLowerCase().includes(searchLower) ||
      (usuario.funcionario && usuario.funcionario.nome.toLowerCase().includes(searchLower)) ||
      (usuario.funcionario && usuario.funcionario.cpf.includes(searchLower)) ||
      (usuario.responsavel && usuario.responsavel.nome.toLowerCase().includes(searchLower)) ||
      (usuario.responsavel && usuario.responsavel.cpf.includes(searchLower)) ||
      (usuario.papel && usuario.papel.nome.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
        <div className="text-odara-dark">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-odara-offwhite">
      <div className="container mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">Usuários do Sistema</h1>
            <p className="text-sm text-odara-dark/70 mt-1">Gerenciamento de acessos e permissões</p>
          </div>
          <div className="flex-shrink-0">
            <button className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full lg:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Usuário
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-6">
          <div className="flex items-center">
            <Search className="text-gray-400 mr-3 h-4 w-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, CPF ou papel..."
              className="w-full p-2 outline-none bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-odara-primary text-odara-contorno">
                <tr>
                  <th className="p-4 text-left font-medium">Usuário</th>
                  <th className="p-4 text-left font-medium">Papel</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsuarios.map((usuario) => {
                  const roleNome = usuario.papel?.nome;
                  const nomeFuncionario = usuario.funcionario?.nome;
                  const cpfFuncionario = usuario.funcionario?.cpf;
                  const nomeResponsavel = usuario.responsavel?.nome;
                  const cpfResponsavel = usuario.responsavel?.cpf;

                  return (
                    <tr key={usuario.id} className="hover:bg-odara-offwhite/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                            <User className="h-4 w-4 text-odara-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-odara-dark">{nomeFuncionario || nomeResponsavel}</p>
                            <p className="text-xs text-gray-500">{usuario.email}</p>
                            <p className="text-xs text-gray-500 mt-1">{cpfFuncionario || cpfResponsavel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(roleNome)}`}>
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            <span>{roleNome}</span>
                          </div>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(usuario.status)}`}>
                          <div className="flex items-center gap-1">
                            {usuario.status ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                            <span>{usuario.status ? 'Ativo' : 'Inativo'}</span>
                          </div>
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            className="p-1 text-blue-500 hover:text-blue-700 transition hover:bg-blue-50 rounded"
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-red-500 hover:text-red-700 transition hover:bg-red-50 rounded"
                            onClick={() => handleDelete(usuario.id)}
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

            {filteredUsuarios.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Cadastre o primeiro usuário do sistema'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contagem */}
        <div className="mt-4 text-sm text-odara-dark/70">
          Total de {filteredUsuarios.length} usuário(s) encontrado(s)
        </div>
      </div>
    </div>
  );
};

export default Usuarios;