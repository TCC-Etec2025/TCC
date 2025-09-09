import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, User, Upload, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface Pertence {
  id?: number;
  id_idoso: number;
  nome_item: string;
  descricao_detalhada?: string;
  estado_conservacao?: string;
  data_registro: string;
  foto_url?: string;
  status: string;
  data_baixa?: string;
  observacoes?: string;
}

interface Idoso {
  id: number;
  nome_completo: string;
}

export default function CadastroPertences() {
  const navigate = useNavigate();
  const location = useLocation();
  const idoso = location.state?.idoso as Idoso;
  
  const [pertences, setPertences] = useState<Pertence[]>([]);
  const [novoPertence, setNovoPertence] = useState('');
  const [descricaoDetalhada, setDescricaoDetalhada] = useState('');
  const [estadoConservacao, setEstadoConservacao] = useState('');
  const [status, setStatus] = useState('Em uso');
  const [observacoes, setObservacoes] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!idoso) {
      alert('Idoso não especificado. Retornando à página anterior.');
      navigate(-1);
    }
  }, [idoso, navigate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensagem('Por favor, selecione um arquivo de imagem válido.');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensagem('A imagem deve ter no máximo 5MB.');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }

    setFotoFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `pertences/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('idosos-fotos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('idosos-fotos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setMensagem('Erro ao fazer upload da imagem. Tente novamente.');
      setTimeout(() => setMensagem(''), 3000);
      return null;
    }
  };

  const adicionarPertence = async () => {
    if (!novoPertence.trim()) {
      setMensagem('Por favor, informe o nome do item');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }

    setIsLoading(true);
    let fotoUrl = undefined;

    try {
      // Fazer upload da imagem se uma foi selecionada
      if (fotoFile) {
        const uploadedUrl = await uploadImage(fotoFile);
        if (uploadedUrl) {
          fotoUrl = uploadedUrl;
        }
      }

      const novoItem: Pertence = {
        id_idoso: idoso.id,
        nome_item: novoPertence.trim(),
        descricao_detalhada: descricaoDetalhada.trim() || undefined,
        estado_conservacao: estadoConservacao || undefined,
        data_registro: new Date().toISOString().split('T')[0],
        foto_url: fotoUrl,
        status: status,
        observacoes: observacoes.trim() || undefined,
      };

      // Inserir no banco de dados
      const { data, error } = await supabase
        .from('pertences')
        .insert(novoItem)
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao salvar item: ' + error.message);
      }

      setPertences([...pertences, data]);
      
      // Reset dos campos
      setNovoPertence('');
      setDescricaoDetalhada('');
      setEstadoConservacao('');
      setStatus('Em uso');
      setObservacoes('');
      setFotoFile(null);
      setFotoPreview(null);
      
      setMensagem('Item adicionado com sucesso!');
      setTimeout(() => setMensagem(''), 3000);

    } catch (err: any) {
      setMensagem(err.message);
      setTimeout(() => setMensagem(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const removerPertence = async (id: number) => {
    try {
      const { error } = await supabase
        .from('pertences')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Erro ao remover item: ' + error.message);
      }

      const novosPertences = pertences.filter(p => p.id !== id);
      setPertences(novosPertences);
      setMensagem('Item removido com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err: any) {
      setMensagem(err.message);
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  const carregarPertences = async () => {
    try {
      const { data, error } = await supabase
        .from('pertences')
        .select('*')
        .eq('id_idoso', idoso.id)
        .order('data_registro', { ascending: false });

      if (error) {
        throw new Error('Erro ao carregar pertences: ' + error.message);
      }

      setPertences(data || []);
    } catch (err: any) {
      setMensagem(err.message);
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  useEffect(() => {
    if (idoso) {
      carregarPertences();
    }
  }, [idoso]);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
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
            <span className="text-blue-800 font-medium">{idoso?.nome_completo}</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
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
                Estado de Conservação
              </label>
              <select
                value={estadoConservacao}
                onChange={(e) => setEstadoConservacao(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Selecione o estado</option>
                <option value="Novo">Novo</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Ruim">Ruim</option>
                <option value="Precisa de reparo">Precisa de reparo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="Em uso">Em uso</option>
                <option value="Guardado">Guardado</option>
                <option value="Em manutenção">Em manutenção</option>
                <option value="Extraviado">Extraviado</option>
                <option value="Devolvido">Devolvido</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição Detalhada
              </label>
              <textarea
                value={descricaoDetalhada}
                onChange={(e) => setDescricaoDetalhada(e.target.value)}
                placeholder="Detalhes sobre o item, marca, modelo, características..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto do Item (opcional)
              </label>
              <div className="flex items-center space-x-4">
                {fotoPreview ? (
                  <div className="relative">
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFotoPreview(null);
                        setFotoFile(null);
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                    <Upload size={24} className="text-gray-500" />
                  </div>
                )}
                
                <div className="flex-1">
                  <label className="flex flex-col items-center px-4 py-2 bg-white text-blue-500 rounded-lg border border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors">
                    <Upload size={18} className="mb-1" />
                    <span className="text-sm font-medium">Selecionar imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG até 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={adicionarPertence}
            disabled={!novoPertence.trim() || isLoading}
            className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Plus size={20} className="mr-2" />
                Adicionar Item
              </>
            )}
          </button>
        </div>

        {/* Lista de pertences */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Itens Cadastrados</h2>
            <p className="text-sm text-gray-600">Lista de pertences do {idoso?.nome_completo}</p>
          </div>
          
          {pertences.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pertences.map((pertence) => (
                <div key={pertence.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-gray-900 text-lg">{pertence.nome_item}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pertence.status === 'Em uso' ? 'bg-green-100 text-green-800' :
                          pertence.status === 'Guardado' ? 'bg-blue-100 text-blue-800' :
                          pertence.status === 'Em manutenção' ? 'bg-yellow-100 text-yellow-800' :
                          pertence.status === 'Extraviado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pertence.status}
                        </span>
                      </div>
                      
                      {pertence.descricao_detalhada && (
                        <p className="text-gray-600 mt-2">{pertence.descricao_detalhada}</p>
                      )}
                      
                      {pertence.estado_conservacao && (
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Estado:</strong> {pertence.estado_conservacao}
                        </p>
                      )}
                      
                      {pertence.observacoes && (
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Observações:</strong> {pertence.observacoes}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>Registrado em:</strong> {formatarData(pertence.data_registro)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {pertence.foto_url && (
                        <img
                          src={pertence.foto_url}
                          alt={pertence.nome_item}
                          className="w-16 h-16 rounded object-cover border-2 border-gray-300"
                        />
                      )}
                      
                      <button
                        onClick={() => pertence.id && removerPertence(pertence.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
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

        {/* Botão de voltar */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}