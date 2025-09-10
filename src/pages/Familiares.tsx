import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface IdosoVinculado {
  id: number;
  nome_completo: string;
  parentesco: string;
}

interface Familiar {
  id: number;
  nome_completo: string;
  cpf: string;
  telefone_principal: string;
  telefone_secundario?: string;
  email: string;
  parentesco: string;
  id_residente: number;
  observacoes?: string;
  status: string;
  criado_em: string;
  idosos: IdosoVinculado[]; // Idosos vinculados a este responsável
}

const Familiares: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFamiliares = async () => {
      try {
        setLoading(true);

        // 1. Buscar todos os responsáveis
        const { data: responsaveisData, error: responsaveisError } = await supabase
          .from('responsaveis')
          .select('*')
          .order('nome_completo', { ascending: true });

        if (responsaveisError) throw responsaveisError;

        // 2. Buscar todos os idosos com seus responsáveis
        const { data: idososData, error: idososError } = await supabase
          .from('idosos')
          .select('id, nome_completo, id_responsavel, responsavel_parentesco')
          .not('id_responsavel', 'is', null);

        if (idososError) throw idososError;

        // 3. Combinar os dados
        const familiaresComIdosos = responsaveisData.map(responsavel => {
          const idososDoResponsavel = idososData
            .filter(idoso => idoso.id_responsavel === responsavel.id)
            .map(idoso => ({
              id: idoso.id,
              nome_completo: idoso.nome_completo,
              parentesco: idoso.responsavel_parentesco
            }));

          return {
            ...responsavel,
            idosos: idososDoResponsavel
          };
        });

        setFamiliares(familiaresComIdosos);

      } catch (error) {
        console.error('Erro ao buscar responsáveis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamiliares();
  }, []);

  const filteredFamiliares = familiares.filter(familiar => {
    if (!familiar) return false;

    const searchLower = searchTerm.toLowerCase();

    return (
      (familiar.nome_completo?.toLowerCase() || '').includes(searchLower) ||
      (familiar.parentesco?.toLowerCase() || '').includes(searchLower) ||
      (familiar.telefone_principal?.toLowerCase() || '').includes(searchLower) ||
      (familiar.email?.toLowerCase() || '').includes(searchLower) ||
      // Buscar também nos nomes dos idosos vinculados
      familiar.idosos.some(idoso =>
        idoso.nome_completo?.toLowerCase().includes(searchLower)
      )
    );
  });

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Tem certeza que deseja excluir este responsável?')) {
      try {
        // Primeiro, remover o vínculo dos idosos com este responsável
        const { error: updateError } = await supabase
          .from('idosos')
          .update({ id_responsavel: null })
          .eq('id_responsavel', id);

        if (updateError) throw updateError;

        // Depois, excluir o responsável
        const { error: deleteError } = await supabase
          .from('responsaveis')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        setFamiliares(familiares.filter(familiar => familiar.id !== id));
      } catch (error) {
        console.error('Erro ao excluir responsável:', error);
        alert('Erro ao excluir responsável');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
        <div className="text-odara-dark">Carregando responsáveis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-odara-offwhite">
      <div className="container mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">Responsáveis</h1>
            <p className="text-sm text-odara-dark/70 mt-1">Gestão de responsáveis pelos residentes</p>
          </div>
          <div className="flex-shrink-0">
            <button className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg w-full lg:w-auto"
              onClick={() => navigate('/app/admin/responsavel')}>
              <Plus className="mr-2 h-5 w-5" />
              Cadastrar Responsável
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-6">
          <div className="flex items-center">
            <Search className="text-gray-400 mr-3 h-4 w-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nome, parentesco, telefone, email ou nome do residente..."
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
                  <th className="p-4 text-left font-medium">Responsável</th>
                  <th className="p-4 text-left font-medium">Parentesco</th>
                  <th className="p-4 text-left font-medium">Contato</th>
                  <th className="p-4 text-left font-medium">Residentes Vinculados</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Cadastro</th>
                  <th className="p-4 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFamiliares.map((familiar) => (
                  <tr key={familiar.id} className="hover:bg-odara-offwhite/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                          <User className="h-4 w-4 text-odara-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-odara-dark">{familiar.nome_completo || 'Não informado'}</p>
                          <p className="text-xs text-gray-500">{familiar.cpf || 'Sem CPF'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {familiar.parentesco || 'Não informado'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span className="text-sm">{familiar.telefone_principal || 'Não informado'}</span>
                        </div>
                        {familiar.telefone_secundario && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{familiar.telefone_secundario}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="text-sm truncate">{familiar.email || 'Não informado'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {familiar.idosos.map((idoso) => (
                          <div key={idoso.id} className="flex items-center gap-2">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-sm font-medium text-odara-dark">
                              {idoso.nome_completo}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {idoso.parentesco}
                            </span>
                          </div>
                        ))}
                        {familiar.idosos.length === 0 && (
                          <span className="text-sm text-gray-500">Nenhum residente vinculado</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium
                        ${familiar.status === 'Ativo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'}
                      `}>
                        {familiar.status || 'Não definido'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {familiar.criado_em ? new Date(familiar.criado_em).toLocaleDateString('pt-BR') : 'Não informado'}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          className="p-1 text-blue-500 hover:text-blue-700 transition hover:bg-blue-50 rounded"
                          title="Editar responsável"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-red-500 hover:text-red-700 transition hover:bg-red-50 rounded"
                          onClick={() => handleDelete(familiar.id)}
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

            {filteredFamiliares.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum responsável encontrado' : 'Nenhum responsável cadastrado'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Cadastre o primeiro responsável'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contagem */}
        <div className="mt-4 text-sm text-odara-dark/70">
          Total de {filteredFamiliares.length} responsável(eis) encontrado(s) de {familiares.length}
        </div>
      </div>
    </div>
  );
};

export default Familiares;