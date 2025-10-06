import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Responsavel } from '../Modelos'

const Responsaveis: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        setLoading(true);

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
        const responsaveisComIdosos = responsaveisData.map(responsavel => {
          const idososDoResponsavel = residentesData
            .filter(idoso => idoso.id_responsavel === responsavel.id)
            .map(idoso => ({
              id: idoso.id,
              nome_completo: idoso.nome,
              parentesco: idoso.responsavel_parentesco
            }));

          return {
            ...responsavel,
            idosos: idososDoResponsavel
          };
        });

        setResponsaveis(responsaveisComIdosos);

      } catch (error) {
        console.error('Erro ao buscar responsáveis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponsaveis();
  }, []);

  const filteredResponsaveis = responsaveis.filter(responsavel => {
    if (!responsavel) return false;

    const searchLower = searchTerm.toLowerCase();

    return (
      (responsavel.nome?.toLowerCase() || '').includes(searchLower) ||
      (responsavel.telefone_principal?.toLowerCase() || '').includes(searchLower) ||
      (responsavel.email?.toLowerCase() || '').includes(searchLower) ||
      // Buscar também nos nomes dos residentes vinculados
      responsavel.residentes?.some(residente =>
        residente.nome?.toLowerCase().includes(searchLower)
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

        setResponsaveis(responsaveis.filter(responsavel => responsavel.id !== id));
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
              placeholder="Buscar por nome, telefone, email ou nome do residente..."
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
                  <th className="p-4 text-left font-medium">Contato</th>
                  <th className="p-4 text-left font-medium">Residentes Vinculados</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Cadastro</th>
                  <th className="p-4 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResponsaveis.map((responsavel) => (
                  <tr key={responsavel.id} className="hover:bg-odara-offwhite/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                          <User className="h-4 w-4 text-odara-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-odara-dark">{responsavel.nome || 'Não informado'}</p>
                          <p className="text-xs text-gray-500">{responsavel.cpf || 'Sem CPF'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span className="text-sm">{responsavel.telefone_principal || 'Não informado'}</span>
                        </div>
                        {responsavel.telefone_secundario && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{responsavel.telefone_secundario}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="text-sm truncate">{responsavel.email || 'Não informado'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {responsavel.residentes?.map((residente) => (
                          <div key={residente.id} className="flex items-center gap-2">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-sm font-medium text-odara-dark">
                              {residente.nome}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {residente.responsavel_parentesco}
                            </span>
                          </div>
                        ))}
                        {responsavel.residentes?.length === 0 && (
                          <span className="text-sm text-gray-500">Nenhum residente vinculado</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium
                        ${responsavel.status
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'}
                      `}>
                        {responsavel.status || 'Não definido'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {responsavel.criado_em ? new Date(responsavel.criado_em).toLocaleDateString('pt-BR') : 'Não informado'}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          className="p-1 text-blue-500 hover:text-blue-700 transition hover:bg-blue-50 rounded"
                          title="Editar responsável"
                          onClick={() => navigate('/app/admin/responsavel/formulario', {state: { responsavel }})}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-red-500 hover:text-red-700 transition hover:bg-red-50 rounded"
                          onClick={() => handleDelete(responsavel.id)}
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

            {filteredResponsaveis.length === 0 && (
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
          Total de {filteredResponsaveis.length} responsável(eis) encontrado(s) de {responsaveis.length}
        </div>
      </div>
    </div>
  );
};

export default Responsaveis;