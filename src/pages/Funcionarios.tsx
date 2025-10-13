import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, Badge } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { Funcionario } from '../Modelos';

const Funcionarios: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('funcionario')
          .select('*');

        if (error) throw error;
        if (data) setFuncionarios(data);
      } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFuncionarios();
  }, []);

  const filteredFuncionarios = funcionarios.filter(funcionario =>
    (funcionario.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (funcionario.cargo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (funcionario.vinculo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (funcionario.registro_profissional?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        const { error } = await supabase
          .from('funcionario')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setFuncionarios(funcionarios.filter(funcionario => funcionario.id !== id));
      } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        alert('Erro ao excluir funcionário');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'bg-green-100 text-green-700';
      case 'licença': return 'bg-yellow-100 text-yellow-700';
      case 'afastado': return 'bg-orange-100 text-orange-700';
      case 'inativo': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
        <div className="text-odara-dark">Carregando funcionários...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-odara-offwhite">
      <div className="container mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">Funcionários</h1>
            <p className="text-sm text-odara-dark/70 mt-1">Gestão de equipe e profissionais</p>
          </div>
          <div className="flex-shrink-0">
            <button className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full lg:w-auto" onClick={() => navigate('/app/admin/funcionario/formulario')}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Funcionário
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-6">
          <div className="flex items-center">
            <Search className="text-gray-400 mr-3 h-4 w-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo, vínculo ou registro..."
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
                  <th className="p-4 text-left font-medium">Funcionário</th>
                  <th className="p-4 text-left font-medium">Cargo</th>
                  <th className="p-4 text-left font-medium">Vínculo</th>
                  <th className="p-4 text-left font-medium">Contato</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Admissão</th>
                  <th className="p-4 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFuncionarios.map((funcionario) => (
                  <tr key={funcionario.id} className="hover:bg-odara-offwhite/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                          <User className="h-4 w-4 text-odara-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-odara-dark">{funcionario.nome}</p>
                          <p className="text-xs text-gray-500">{funcionario.cpf}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge className="h-3 w-3 text-gray-500" />
                        <span>{funcionario.cargo}</span>
                      </div>
                      {funcionario.registro_profissional && (
                        <p className="text-xs text-gray-500 mt-1">{funcionario.registro_profissional}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {funcionario.vinculo}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span className="text-sm">{funcionario.telefone}</span>
                        </div>
                        {funcionario.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span className="text-sm truncate">{funcionario.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(funcionario.status)}`}>
                        {funcionario.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          className="p-1 text-blue-500 hover:text-blue-700 transition hover:bg-blue-50 rounded"
                          title="Editar funcionário"
                          onClick={() => navigate('/app/admin/funcionario/formulario', {state: { funcionario }})}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-red-500 hover:text-red-700 transition hover:bg-red-50 rounded"
                          onClick={() => handleDelete(funcionario.id)}
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

            {filteredFuncionarios.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Cadastre o primeiro funcionário'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contagem */}
        <div className="mt-4 text-sm text-odara-dark/70">
          Total de {filteredFuncionarios.length} funcionário(s) encontrado(s) de {funcionarios.length}
        </div>
      </div>
    </div>
  );
};

export default Funcionarios;