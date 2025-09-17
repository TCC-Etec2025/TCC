import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Residente {
  id: number;
  nome_completo: string;
  sexo: string;
  localizacao_quarto: string;
  data_nascimento: string;
  data_admissao: string;
  status: string;
  nivel_dependencia: string;
}

const Residentes: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchResidentes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('idosos')
          .select('*')
          .order('nome_completo', { ascending: true });

        if (error) throw error;
        if (data) setResidentes(data);
      } catch (error) {
        console.error('Erro ao buscar residentes:', error);
        alert('Erro ao carregar residentes');
      } finally {
        setLoading(false);
      }
    };

    fetchResidentes();
  }, []);

  const calcularIdade = (dataNascimento: string) => {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Tem certeza que deseja excluir este residente?')) {
      try {
        setDeletingId(id);
        const { error } = await supabase
          .from('idosos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setResidentes(residentes.filter(residente => residente.id !== id));
      } catch (error) {
        console.error('Erro ao excluir residente:', error);
        alert('Erro ao excluir residente');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredResidentes = residentes.filter(residente => {
    if (!residente) return false;

    const searchLower = searchTerm.toLowerCase();

    const nomeMatch = residente.nome_completo?.toLowerCase().includes(searchLower) || false;
    const quartoMatch = residente.localizacao_quarto?.toLowerCase().includes(searchLower) || false;

    return nomeMatch || quartoMatch;
  });

  if (loading) {
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
      <div className="container mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">Residentes</h1>
            <p className="text-sm text-odara-dark/70 mt-1">Gestão de moradores da instituição</p>
          </div>
          <div className="flex-shrink-0">
            <button className="bg-odara-accent hover:bg-odara-secondary text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg w-full lg:w-auto"
              onClick={() => navigate('/app/admin/pacientes/cadastrar')}>
              <Plus className="mr-2 h-5 w-5" />
              Cadastrar Residente
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-6">
          <div className="flex items-center">
            <Search className="text-gray-400 mr-3 h-4 w-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nome ou quarto..."
              className="w-full p-2 outline-none bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-odara-primary text-odara-contorno">
                <tr>
                  <th className="p-4 text-center font-medium">Nome</th>
                  <th className="p-4 text-center font-medium">Sexo</th>
                  <th className="p-4 text-center font-medium">Quarto</th>
                  <th className="p-4 text-center font-medium">Idade</th>
                  <th className="p-4 text-center font-medium">Dependência</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Entrada</th>
                  <th className="p-4 text-center font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResidentes.map((residente) => (
                  <tr key={residente.id} className="hover:bg-odara-offwhite/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="bg-odara-primary/20 rounded-full p-2 flex-shrink-0">
                          <User className="h-4 w-4 text-odara-primary" />
                        </div>
                        <span className="font-medium text-odara-dark truncate">
                          {residente.nome_completo}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {residente.sexo.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{residente.localizacao_quarto}</td>
                    <td className="p-4">{calcularIdade(residente.data_nascimento)} anos</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${residente.nivel_dependencia === 'Alta'
                          ? 'bg-red-100 text-red-700'
                          : residente.nivel_dependencia === 'Média'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'}
                      `}>
                        {residente.nivel_dependencia ? residente.nivel_dependencia:'Não informado'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium
                        ${residente.status === 'Ativo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'}
                      `}>
                        {residente.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {new Date(residente.data_admissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          className="p-1 text-blue-500 hover:text-blue-700 transition hover:bg-blue-50 rounded"
                          title="Editar residente"
                          onClick={() => navigate('/app/admin/residente/formulario', { state: { residente } })}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-red-500 hover:text-red-700 transition hover:bg-red-50 rounded"
                          onClick={() => handleDelete(residente.id)}
                          title="Excluir residente"
                          disabled={deletingId === residente.id}
                        >
                          {deletingId === residente.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResidentes.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum residente encontrado' : 'Nenhum residente cadastrado'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Cadastre o primeiro residente'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contagem de residentes */}
        <div className="mt-4 text-sm text-odara-dark/70">
          Total de {filteredResidentes.length} residente(s) encontrado(s) de {residentes.length}
        </div>
      </div>
    </div>
  );
};

export default Residentes;