import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Pertence {
  id: number;
  nome: string;
  quantidade: number;
  descricao?: string;
}

export default function CadastroPertences() {
  const navigate = useNavigate();
  const location = useLocation();
  const idosoId = location.state?.idosoId;
  const idosoNome = location.state?.idosoNome || 'Idoso';
  
  const [pertences, setPertences] = useState<Pertence[]>([]);
  const [novoPertence, setNovoPertence] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');

  // Carregar pertences existentes (simulação)
  useEffect(() => {
    // Em uma aplicação real, buscaria os dados da API
    if (idosoId) {
      // Simulando carga de dados existentes
      const pertencesExistentes: Pertence[] = [
        { id: 1, nome: "Óculos", quantidade: 1, descricao: "Óculos de grau" },
        { id: 2, nome: "Celular", quantidade: 1, descricao: "Smartphone Samsung" },
      ];
      setPertences(pertencesExistentes);
    }
  }, [idosoId]);

  const adicionarPertence = () => {
    if (!novoPertence.trim()) {
      setMensagem('Por favor, informe o nome do item');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }
    
    const novoItem: Pertence = {
      id: Date.now(),
      nome: novoPertence.trim(),
      quantidade: quantidade,
      descricao: descricao.trim() || undefined
    };
    
    setPertences([...pertences, novoItem]);
    
    // Reset dos campos
    setNovoPertence('');
    setQuantidade(1);
    setDescricao('');
    setMensagem('Item adicionado com sucesso!');
    setTimeout(() => setMensagem(''), 3000);
  };

  const removerPertence = (id: number) => {
    const novosPertences = pertences.filter(p => p.id !== id);
    setPertences(novosPertences);
    setMensagem('Item removido com sucesso!');
    setTimeout(() => setMensagem(''), 3000);
  };

  const atualizarQuantidade = (id: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    
    const novosPertences = pertences.map(p => 
      p.id === id ? { ...p, quantidade: novaQuantidade } : p
    );
    
    setPertences(novosPertences);
  };

  const salvarPertences = () => {
    // Em uma aplicação real, enviaria os dados para a API
    console.log('Pertences a serem salvos:', pertences);
    console.log('ID do idoso:', idosoId);
    
    setMensagem('Pertences salvos com sucesso!');
    setTimeout(() => setMensagem(''), 3000);
    
    // Simulando sucesso no salvamento
    setTimeout(() => {
      navigate(-1); // Volta para a página anterior
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <ArrowLeft size={20} className="mr-1" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Cadastro de Pertences</h1>
          </div>
          
          <div className="flex items-center bg-blue-100 px-4 py-2 rounded-lg">
            <User size={18} className="text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">{idosoNome}</span>
          </div>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`p-3 rounded-lg mb-6 ${
            mensagem.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem}
          </div>
        )}

        {/* Formulário para adicionar novo item */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Novo Item</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Item *
              </label>
              <input
                type="text"
                value={novoPertence}
                onChange={(e) => setNovoPertence(e.target.value)}
                placeholder="Ex: Óculos, Celular, Documentos..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes sobre o item..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={adicionarPertence}
            disabled={!novoPertence.trim()}
            className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Adicionar Item
          </button>
        </div>

        {/* Lista de pertences */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Itens Cadastrados</h2>
            <p className="text-sm text-gray-600">Lista de pertences do {idosoNome}</p>
          </div>
          
          {pertences.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pertences.map((pertence) => (
                <div key={pertence.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="font-medium text-gray-900 text-lg">{pertence.nome}</h3>
                    {pertence.descricao && (
                      <p className="text-gray-600 mt-1">{pertence.descricao}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <label className="mr-2 text-gray-700">Qtd:</label>
                      <input
                        type="number"
                        min="1"
                        value={pertence.quantidade}
                        onChange={(e) => atualizarQuantidade(pertence.id, Number(e.target.value))}
                        className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <button
                      onClick={() => removerPertence(pertence.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum pertence cadastrado</h3>
              <p className="text-gray-500">Adicione itens usando o formulário acima</p>
            </div>
          )}
        </div>

        {/* Botão de salvar */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={salvarPertences}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save size={20} className="mr-2" />
            Salvar Pertences
          </button>
        </div>
      </div>
    </div>
  );
}