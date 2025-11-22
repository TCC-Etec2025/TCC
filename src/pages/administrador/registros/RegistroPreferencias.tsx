import React, { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import ModalPreferencias from './ModalPreferencias';

type Preferencia = {
  id: number;
  id_residente: number;
  tipo_preferencia: string; // armazenado em minúsculo: alimentar | atividades | cuidador
  titulo: string;
  descricao: string;
  foto_url: string | null;
  residente?: { id: number; nome: string } | null;
};

type Residente = { id: number; nome: string };

const categorias: Record<string, string> = {
  'alimentar': 'Alimentar',
  'atividade': 'Atividades',
  'cuidador': 'Cuidador',
};

const corCategorias: Record<string, string> = {
  alimentar: 'bg-odara-primary/60 text-odara-dark border-l-4 border-odara-primary',
  atividade: 'bg-odara-accent/60 text-odara-dark border-l-4 border-odara-accent',
  cuidador: 'bg-odara-secondary/60 text-odara-dark border-l-4 border-odara-secondary',
};

const corPontos: Record<string, string> = {
  alimentar: 'bg-odara-primary',
  atividade: 'bg-odara-accent',
  cuidador: 'bg-odara-secondary',
};

const RegistroPreferencias: React.FC = () => {
  const [preferencias, setPreferencias] = useState<Preferencia[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [preferenciaSelecionada, setPreferenciaSelecionada] = useState<Preferencia | null>(null);
  const [hoverPreferencia, setHoverPreferencia] = useState<Preferencia | null>(null);

  const [filtros, setFiltros] = useState<{
    categoria: string | null;
    residenteId: number | null;
    busca: string;
  }>({ categoria: null, residenteId: null, busca: '' });

  const formFiltrosRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchPreferencias();
    fetchResidentes();
  }, []);

  useEffect(() => {
    if (!modalAberto) fetchPreferencias();
  }, [modalAberto]);

  const fetchResidentes = async () => {
    try {
      const { data, error } = await supabase
        .from('residente')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      setResidentes(data || []);
    } catch (err) {
      console.error('Erro ao carregar residentes:', err);
    }
  };

  const fetchPreferencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('preferencia')
        .select('*, residente:residente(id, nome)')
        .order('id', { ascending: false });
      if (error) throw error;
      setPreferencias((data || []) as Preferencia[]);
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
    } finally {
      setLoading(false);
    }
  };

  const excluirPreferencia = async (id: number) => {
    if (!window.confirm('Excluir esta preferência?')) return;
    try {
      const { error } = await supabase.from('preferencia').delete().eq('id', id);
      if (error) throw error;
      setPreferencias(prev => prev.filter(p => p.id !== id));
      if (preferenciaSelecionada?.id === id) setPreferenciaSelecionada(null);
    } catch (err) {
      console.error('Erro ao excluir preferência:', err);
    }
  };

  const preferenciasFiltradas = preferencias.filter(p => {
    if (filtros.categoria && p.tipo_preferencia !== filtros.categoria) return false;
    if (filtros.residenteId && p.id_residente !== filtros.residenteId) return false;
    if (filtros.busca) {
      const alvo = (p.titulo + ' ' + p.descricao + ' ' + (p.residente?.nome || '')).toLowerCase();
      if (!alvo.includes(filtros.busca.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <ModalPreferencias
        preferencia={preferenciaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
      <div className="flex-1 p-6 lg:p-10">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Preferências</h1>
            <div className="relative">
              <button className="text-odara-dark hover:text-odara-secondary transition">
                <FaInfoCircle size={20} className="text-odara-accent" />
              </button>
            </div>
          </div>
          <span className="text-sm text-odara-dark">
            Total: <strong>{preferencias.length}</strong>
          </span>
        </div>

        {/* Novo + Filtros */}
        <details className="group mb-8 w-full">
          <summary className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer">
            <button
              type="button"
              onClick={() => { setPreferenciaSelecionada(null); setModalAberto(true); }}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
            >
              <FaPlus className="mr-2" /> Nova Preferência
            </button>
            <div className="sm:w-40">
              <div className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded text-sm font-medium">
                <FaFilter className="mr-2" /> Filtros
              </div>
            </div>
          </summary>

          <form
            ref={formFiltrosRef}
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const categoria = fd.get('categoria') as string;
              const residente = fd.get('residente') as string;
              const busca = fd.get('busca') as string;
              setFiltros({
                categoria: categoria && categoria !== 'todas' ? categoria : null,
                residenteId: residente ? Number(residente) : null,
                busca: busca || '',
              });
            }}
            className="mt-6 bg-white p-5 rounded-xl shadow border w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  name="categoria"
                  defaultValue="todas"
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                >
                  <option value="todas">Todas</option>
                  {Object.keys(categorias).map(cat => (
                    <option key={cat} value={cat}>{categorias[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
                <select
                  name="residente"
                  defaultValue=""
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                >
                  <option value="">Todos</option>
                  {residentes.map(r => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Busca</label>
                <input
                  type="text"
                  name="busca"
                  placeholder="Título, descrição ou residente..."
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <div className="flex gap-2 w-full">
                  <button
                    type="submit"
                    className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium w-full"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFiltros({ categoria: null, residenteId: null, busca: '' });
                      formFiltrosRef.current?.reset();
                    }}
                    className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium w-full"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </details>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odara-accent" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lista */}
            <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-odara-dark mb-2 flex items-center">
                Lista de Preferências
                <span className="ml-2 text-sm font-normal text-odara-name/60">
                  ({preferenciasFiltradas.length} registros)
                </span>
              </h2>

              <div className="space-y-5 max-h-[600px] overflow-y-auto">
                {preferenciasFiltradas.length === 0 && (
                  <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                    <p className="text-odara-dark/60">Nenhuma preferência encontrada</p>
                  </div>
                )}

                {preferenciasFiltradas.map(pref => (
                  <div
                    key={pref.id}
                    className={`p-4 rounded-xl hover:shadow-md transition cursor-pointer ${corCategorias[pref.tipo_preferencia]} ${preferenciaSelecionada?.id === pref.id ? 'ring-2 ring-odara-primary' : ''}`}
                    onMouseEnter={() => setHoverPreferencia(pref)}
                    onClick={() => setPreferenciaSelecionada(pref)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${corPontos[pref.tipo_preferencia]}`}></span>
                        <h4 className="font-semibold text-odara-dark">
                          {pref.residente?.nome || 'Residente'}
                        </h4>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setPreferenciaSelecionada(pref);
                            setModalAberto(true);
                          }}
                          className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors p-2 rounded-full hover:bg-odara-dropdown"
                          title="Editar"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            excluirPreferencia(pref.id);
                          }}
                          className="text-odara-alerta hover:text-red-700 transition-colors p-2 rounded-full hover:bg-odara-alerta/50"
                          title="Excluir"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <h6 className="text-lg font-bold mb-1">{pref.titulo}</h6>
                    <p className="text-sm mb-3">{pref.descricao}</p>
                    <span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">
                      {categorias[pref.tipo_preferencia]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Painel lateral */}
            <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
              <h3 className="text-xl font-bold text-odara-dark mb-4">Residente</h3>
              <div className="text-center">
                <div className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-odara-offwhite overflow-hidden border-4 border-odara-primary">
                  {hoverPreferencia?.foto_url ? (
                    <img
                      src={hoverPreferencia.foto_url}
                      alt={hoverPreferencia.residente?.nome || ''}
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-odara-primary text-6xl">
                      {hoverPreferencia?.residente?.nome?.charAt(0) || '👤'}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-odara-dark mb-2">
                  {hoverPreferencia?.residente?.nome || 'Passe o mouse sobre uma preferência'}
                </h3>
                {hoverPreferencia && (
                  <p className="text-odara-name/60 max-w-xs mx-auto text-sm">
                    {hoverPreferencia.titulo}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-odara-primary/20">
                <h6 className="font-semibold text-odara-dark mb-3 text-center">
                  Legenda das Categorias
                </h6>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(categorias).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${corPontos[key]}`}></span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistroPreferencias;