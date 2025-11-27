import React, { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import ModalPreferencias from './ModalPreferencias';
import toast, { Toaster } from 'react-hot-toast';

type Preferencia = {
  id: number;
  id_residente: number;
  tipo_preferencia: string;
  titulo: string;
  descricao: string;
  foto_url: string | null;
  residente?: { 
    id: number; 
    nome: string;
    quarto?: string | null;
  } | null;
};

type Residente = { 
  id: number; 
  nome: string;
  quarto?: string | null;
};

const categorias: Record<string, string> = {
  'alimentar': 'Alimentar',
  'atividades': 'Atividades',
  'cuidador': 'Cuidador',
};

// Cores por categoria
const corCategorias: Record<string, { bg: string; text: string; border: string; bola: string }> = {
  alimentar: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-800', 
    border: 'border-b border-blue-200',
    bola: 'bg-blue-500'
  },
  atividades: { 
    bg: 'bg-green-50', 
    text: 'text-green-800', 
    border: 'border-b border-green-200',
    bola: 'bg-green-500'
  },
  cuidador: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-800', 
    border: 'border-b border-purple-200',
    bola: 'bg-purple-500'
  },
};

const RegistroPreferencias: React.FC = () => {
  const [preferencias, setPreferencias] = useState<Preferencia[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loading, setLoading] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [preferenciaSelecionada, setPreferenciaSelecionada] = useState<Preferencia | null>(null);

  // Busca sempre visível
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros avançados
  const formFiltrosRef = useRef<HTMLFormElement>(null);
  const [filtros, setFiltros] = useState<{
    categoria: string | null;
    residenteId: number | null;
  }>({ 
    categoria: null, 
    residenteId: null 
  });

  useEffect(() => {
    fetchPreferencias();
    fetchResidentes();
  }, []);

  useEffect(() => {
    if (!modalAberto) {
      fetchPreferencias();
    }
  }, [modalAberto]);

  const fetchResidentes = async () => {
    try {
      const { data, error } = await supabase
        .from('residente')
        .select('id, nome, quarto')
        .order('nome');
      if (error) throw error;
      setResidentes(data || []);
    } catch (err) {
      console.error('Erro ao carregar residentes:', err);
      toast.error('Erro ao carregar residentes.');
    }
  };

  const fetchPreferencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('preferencia')
        .select('*, residente:residente(id, nome, quarto)')
        .order('id', { ascending: false });
      if (error) throw error;
      setPreferencias((data || []) as Preferencia[]);
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
      toast.error('Erro ao carregar preferências.');
    } finally {
      setLoading(false);
    }
  };

  const excluirPreferencia = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta preferência?')) return;
    try {
      const { error } = await supabase.from('preferencia').delete().eq('id', id);
      if (error) throw error;
      setPreferencias(prev => prev.filter(p => p.id !== id));
      if (preferenciaSelecionada?.id === id) setPreferenciaSelecionada(null);
      toast.success('Preferência excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir preferência:', err);
      toast.error('Erro ao excluir preferência.');
    }
  };

  const preferenciasFiltradas = preferencias.filter(p => {
    // Filtro de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitulo = p.titulo.toLowerCase().includes(term);
      const matchDescricao = p.descricao.toLowerCase().includes(term);
      const matchResidente = p.residente?.nome.toLowerCase().includes(term);
      if (!matchTitulo && !matchDescricao && !matchResidente) return false;
    }

    // Filtro por categoria
    if (filtros.categoria && p.tipo_preferencia !== filtros.categoria) return false;
    
    // Filtro por residente
    if (filtros.residenteId && p.id_residente !== filtros.residenteId) return false;
    
    return true;
  });

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#e4edfdff',
            color: '#52323a',
            border: '1px solid #0036caff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#52323a',
              border: '1px solid #00c950',
            },
          },
          error: {
            style: {
              background: '#fce7e7ff',
              color: '#52323a',
              border: '1px solid #c90d00ff',
            },
          },
        }}
      />

      <ModalPreferencias
        preferencia={preferenciaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
      
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-center xl:justify-start items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
              Registro de Preferências
            </h1>
            <div className="relative">
              <button
                onMouseEnter={() => setInfoVisivel(true)}
                onMouseLeave={() => setInfoVisivel(false)}
                className="text-odara-dark hover:text-odara-secondary transition-colors duration-200"
              >
                <FaInfoCircle size={20} className="text-odara-accent hover:text-odara-secondary" />
              </button>
              {infoVisivel && (
                <div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
                  <h3 className="font-bold mb-2">Registro de Preferências</h3>
                  <p>Gerencie as preferências, hábitos e necessidades específicas de cada residente.</p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botão Nova Preferência */}
        <button
          type="button"
          onClick={() => { 
            setPreferenciaSelecionada(null); 
            setModalAberto(true); 
          }}
          className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10 mb-6"
        >
          <FaPlus className="mr-2" /> Nova Preferência
        </button>

        {/* Filtros */}
        <details className="group mb-8 w-full">
          <summary className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer">
            {/* Campo de busca */}
            <div className="flex-1 max-w-xl">
              <label className="block text-sm font-medium text-odara-dark mb-1">
                Buscar preferências
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onFocus={e => e.stopPropagation()}
                placeholder="Buscar por título, descrição ou residente..."
                className="w-full h-10 border border-odara-primary/40 rounded-lg px-3 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
              />
            </div>

            {/* Botão de filtros */}
            <div className="sm:w-40">
              <div className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen transition text-sm font-medium select-none">
                <FaFilter className="mr-2" /> Filtros
              </div>
            </div>
          </summary>

          {/* Painel de Filtros */}
          <form
            ref={formFiltrosRef}
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setFiltros({
                categoria: fd.get('categoria') as string || null,
                residenteId: fd.get('residente') ? Number(fd.get('residente')) : null,
              });
            }}
            className="mt-6 bg-white p-5 rounded-xl shadow border w-full animate-fade-in"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  name="categoria"
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                  defaultValue=""
                >
                  <option value="">Todas</option>
                  {Object.entries(categorias).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
                <select
                  name="residente"
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                  defaultValue=""
                >
                  <option value="">Todos</option>
                  {residentes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nome} {r.quarto ? `(Q ${r.quarto})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex md:items-end gap-2 pt-1 md:pt-0">
                <button
                  type="submit"
                  className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltros({ categoria: null, residenteId: null });
                    formFiltrosRef.current?.reset();
                  }}
                  className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  Limpar
                </button>
              </div>
            </div>

            {(filtros.categoria || filtros.residenteId) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {filtros.categoria && (
                  <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                    Categoria: {categorias[filtros.categoria]}
                  </span>
                )}
                {filtros.residenteId && (
                  <span className="bg-odara-primary text-white px-2 py-1 rounded-full">
                    Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
                  </span>
                )}
              </div>
            )}
          </form>
        </details>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odara-accent" />
          </div>
        )}

        {!loading && (
          <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <h2 className="text-2xl lg:text-4xl font-bold text-odara-dark">Preferências</h2>
              <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                Total: {preferenciasFiltradas.length}
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {preferenciasFiltradas.length === 0 ? (
                <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                  <p className="text-odara-dark/60">Nenhuma preferência encontrada</p>
                </div>
              ) : (
                preferenciasFiltradas.map(pref => {
                  const corCategoria = corCategorias[pref.tipo_preferencia] || corCategorias.alimentar;
                  
                  return (
                    <div key={pref.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                      {/* Header com categoria */}
                      <div className={`flex items-center justify-between p-3 rounded-t-lg ${corCategoria.border} ${corCategoria.bg}`}>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${corCategoria.bola}`}></div>
                          <p className={`text-sm sm:text-base ${corCategoria.text} font-semibold`}>
                            {categorias[pref.tipo_preferencia]}
                          </p>
                        </div>
                      </div>

                      {/* Corpo da preferência */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Foto pequena do residente */}
                            <div className="w-12 h-12 rounded-full flex-shrink-0 bg-odara-offwhite overflow-hidden border-2 border-odara-primary flex items-center justify-center">
                              {pref.foto_url ? (
                                <img
                                  src={pref.foto_url}
                                  alt={pref.residente?.nome || ''}
                                  className="w-full h-full object-cover"
                                  onError={e => { 
                                    (e.currentTarget as HTMLImageElement).style.display = 'none'; 
                                  }}
                                />
                              ) : (
                                <span className="text-odara-primary text-lg font-semibold">
                                  {pref.residente?.nome?.charAt(0) || '👤'}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-1">
                                {pref.titulo}
                              </h3>
                              <p className="text-sm text-odara-name mb-2">
                                <span className="bg-odara-accent text-white px-2 py-1 rounded-full text-xs font-medium">
                                  {pref.residente?.nome || 'Residente'}
                                </span>
                                {pref.residente?.quarto && ` • Quarto: ${pref.residente.quarto}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-3">
                            <button
                              onClick={() => {
                                setPreferenciaSelecionada(pref);
                                setModalAberto(true);
                              }}
                              className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                              title="Editar preferência"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => excluirPreferencia(pref.id)}
                              className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                              title="Excluir preferência"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="text-sm text-odara-dark">
                          <p className="line-clamp-3">{pref.descricao}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-xs text-odara-name">
                            ID: {pref.id}
                          </div>
                          <div className="text-xs text-odara-name">
                            Última atualização: {new Date().toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistroPreferencias;