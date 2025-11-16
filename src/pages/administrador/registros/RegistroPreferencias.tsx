import React, { useEffect, useState } from 'react';
import { FaUtensils, FaWalking, FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

type Preferencia = {
  id: number;
  id_residente: number;
  tipo_preferencia: string;
  titulo: string;
  descricao: string;
  foto_url: string;
  residente?: string;
}

type Residente = {
  id: number;
  nome: string;
}

const RegistroPreferencias = () => {
  const [loading, setLoading] = useState(false);
  const [preferencias, setPreferencias] = useState<Preferencia[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState('');
  const [novaPreferencia, setNovaPreferencia] = useState({ 
    residente: '',
    titulo: '', 
    descricao: '',  
    foto: '' 
  });
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [residenteSelecionado, setResidenteSelecionado] = useState('');
  const [residenteAtual, setResidenteAtual] = useState<Preferencia | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState(false); 
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [sugestoesResidentes, setSugestoesResidentes] = useState<Residente[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [carregandoResidentes, setCarregandoResidentes] = useState(false);

  const CATEGORIAS = {
    ALIMENTAR: 'Alimentar',
    ATIVIDADES: 'Atividades',
    CUIDADOR: 'Cuidador'
  };

  const CATEGORIA_LABELS = {
    [CATEGORIAS.ALIMENTAR]: "Alimentar",
    [CATEGORIAS.ATIVIDADES]: "Atividades",
    [CATEGORIAS.CUIDADOR]: "Cuidador"
  };

  const CORES_CATEGORIAS = {
    [CATEGORIAS.ALIMENTAR]: 'bg-odara-primary/60 text-odara-dark',
    [CATEGORIAS.ATIVIDADES]: 'bg-odara-accent/60 text-odara-dark',
    [CATEGORIAS.CUIDADOR]: 'bg-odara-secondary/60 text-odara-dark'
  };

  const CORES_CALENDARIO = {
    [CATEGORIAS.ALIMENTAR]: 'bg-odara-primary',
    [CATEGORIAS.ATIVIDADES]: 'bg-odara-accent', 
    [CATEGORIAS.CUIDADOR]: 'bg-odara-secondary'
  };

  const FILTROS = [
    { id: 'todos', label: 'Todos' },
    { id: CATEGORIAS.ALIMENTAR, label: CATEGORIA_LABELS[CATEGORIAS.ALIMENTAR] },
    { id: CATEGORIAS.ATIVIDADES, label: CATEGORIA_LABELS[CATEGORIAS.ATIVIDADES] },
    { id: CATEGORIAS.CUIDADOR, label: CATEGORIA_LABELS[CATEGORIAS.CUIDADOR] }
  ];

  // Carrega residentes do banco
  useEffect(() => {
    const carregarResidentes = async () => {
      try {
        setCarregandoResidentes(true);
        const { data, error } = await supabase
          .from('residente')
          .select('id, nome')
          .order('nome');

        if (error) throw error;
        if (data) {
          setResidentes(data);
        }
      } catch (error) {
        console.error('Erro ao carregar residentes:', error);
      } finally {
        setCarregandoResidentes(false);
      }
    };

    carregarResidentes();
  }, []);

  // Carrega preferências do banco
  useEffect(() => {
    const fetchPreferencias = async () => {
      try {
        setLoading(true);
        
        // Busca preferências com JOIN para pegar o nome do residente
        const { data, error } = await supabase
          .from('preferencia')
          .select(`
            *,
            residente:residente(id, nome)
          `);

        if (error) throw error;

        if (data) {
          // Transforma os dados para incluir o nome do residente
          const preferenciasComNomes = data.map(pref => ({
            ...pref,
            residente: pref.residente?.nome || 'Residente não encontrado'
          }));
          setPreferencias(preferenciasComNomes);
        } else {
          setPreferencias([]);
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
        alert('Erro ao carregar preferências.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferencias();
  }, []);

  // Função para filtrar sugestões de residentes
  const filtrarSugestoes = (input: string) => {
    if (!input.trim()) {
      setSugestoesResidentes([]);
      setMostrarSugestoes(false);
      return;
    }

    const sugestoesFiltradas = residentes.filter(residente =>
      residente.nome.toLowerCase().includes(input.toLowerCase())
    );

    setSugestoesResidentes(sugestoesFiltradas.slice(0, 5));
    setMostrarSugestoes(sugestoesFiltradas.length > 0);
  };

  // Função para agrupar preferências por categoria
  const getPreferenciasPorCategoria = () => {
    const agrupadas = {
      [CATEGORIAS.ALIMENTAR]: preferencias.filter(p => p.tipo_preferencia === CATEGORIAS.ALIMENTAR),
      [CATEGORIAS.ATIVIDADES]: preferencias.filter(p => p.tipo_preferencia === CATEGORIAS.ATIVIDADES),
      [CATEGORIAS.CUIDADOR]: preferencias.filter(p => p.tipo_preferencia === CATEGORIAS.CUIDADOR)
    };
    return agrupadas;
  };

  const abrirModalAdicionar = (categoria: string) => {
    setCategoriaAtual(categoria);
    setNovaPreferencia({ titulo: '', descricao: '', residente: '', foto: '' });
    setEditando(false);
    setIdEditando(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (categoria: string, id: number) => {
    const preferenciasCategoria = getPreferenciasPorCategoria()[categoria];
    const preferenciaParaEditar = preferenciasCategoria.find(item => item.id === id);
    
    if (preferenciaParaEditar) {
      setCategoriaAtual(categoria);
      setNovaPreferencia({
        titulo: preferenciaParaEditar.titulo,
        descricao: preferenciaParaEditar.descricao,
        residente: preferenciaParaEditar.residente || '',
        foto: preferenciaParaEditar.foto_url
      });
      setEditando(true);
      setIdEditando(id);
      setModalAberto(true);
    }
  };

  const salvarPreferencia = async () => {
    if (!novaPreferencia.titulo || !novaPreferencia.descricao || !novaPreferencia.residente) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      setLoading(true);

      // Encontra o ID do residente selecionado
      const residenteSelecionado = residentes.find(r => 
        r.nome === novaPreferencia.residente
      );

      if (!residenteSelecionado) {
        alert('Residente não encontrado! Selecione um residente válido da lista.');
        return;
      }

      if (editando && idEditando) {
        // Atualizar preferência existente
        const { data, error } = await supabase
          .from('preferencia')
          .update({
            titulo: novaPreferencia.titulo,
            descricao: novaPreferencia.descricao,
            id_residente: residenteSelecionado.id,
            foto_url: novaPreferencia.foto,
            tipo_preferencia: categoriaAtual
          })
          .eq('id', idEditando)
          .select();

        if (error) throw error;

        if (data) {
          setPreferencias(prev => 
            prev.map(item => 
              item.id === idEditando 
                ? { ...data[0], residente: novaPreferencia.residente }
                : item
            )
          );
          alert('Preferência atualizada com sucesso!');
        }
      } else {
        // Criar nova preferência
        const { data, error } = await supabase
          .from('preferencia')
          .insert({
            titulo: novaPreferencia.titulo,
            descricao: novaPreferencia.descricao,
            id_residente: residenteSelecionado.id,
            foto_url: novaPreferencia.foto,
            tipo_preferencia: categoriaAtual
          })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          // Adiciona o nome do residente para exibição
          const novaPreferenciaComResidente = {
            ...data[0],
            residente: novaPreferencia.residente
          };
          setPreferencias(prev => [...prev, novaPreferenciaComResidente]);
          alert('Preferência criada com sucesso!');
        }
      }

      setModalAberto(false);
    } catch (error: any) {
      console.error('Erro ao salvar preferência:', error);
      alert(`Erro ao salvar preferência: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const excluirPreferencia = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta preferência?')) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('preferencia')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPreferencias(prev => prev.filter(item => item.id !== id));
      alert('Preferência excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir preferência:', error);
      alert(`Erro ao excluir preferência: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Residentes únicos para o filtro
  const residentesUnicos = Array.from(new Set(
    preferencias
      .map(item => item.residente)
      .filter(Boolean)
  ));

  // Preferências filtradas
  const preferenciasFiltradas = getPreferenciasPorCategoria();

  // Aplicar filtros
  const preferenciasParaExibir = Object.entries(preferenciasFiltradas)
    .filter(([categoria]) => filtroAtivo === 'todos' || filtroAtivo === categoria)
    .map(([categoria, items]) => ({
      categoria,
      items: items.filter(item => 
        !residenteSelecionado || item.residente === residenteSelecionado
      )
    }))
    .filter(({ items }) => items.length > 0);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-odara-offwhite items-center justify-center">
        <div className="text-odara-dark text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="flex items-center mb-1">
              <Link
                to="/gestao/PaginaRegistros"  
                className="text-odara-accent hover:text-odara-secondary transition-colors duration-200 flex items-center"
              >
                <FaArrowLeft className="mr-1" />
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Preferências</h1>
            <div className="relative">
              <button
                onMouseEnter={() => setInfoVisivel(true)}
                onMouseLeave={() => setInfoVisivel(false)}
                className="text-odara-dark hover:text-odara-secondary transition-colors duration-200"
              >
                <FaInfoCircle size={20} className='text-odara-accent hover:text-odara-secondary' />
              </button>
              {infoVisivel && (
                <div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
                  <h3 className="font-bold mb-2">Registro de Preferências</h3>
                  <p>
                    O Registro de Preferências é uma ficha na qual serão anotadas as preferências pessoais de cada residente, para que a equipe possa oferecer um cuidado mais humanizado. Ele é parte importante do prontuário de atendimento, garante o bem-estar do idoso respeitando seus gostos, como comidas e temperos de preferência, sua rotina diária em geral (horário que acorda, prefere tomar banho, ou praticar seus lazeres).
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="relative flex items-center gap-4 mb-6">
          {/* Botão Adicionar */}
          <button
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-emibold py-2 px-4 rounded-lg flex items-center transition duration-200"
          >
            <FaPlus className="mr-2 text-odara-white" /> Adicionar
          </button>

          {dropdownAberto && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {Object.values(CATEGORIAS).map(categoria => (
                <button
                  key={categoria}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50"
                  onClick={() => {
                    abrirModalAdicionar(categoria);
                    setDropdownAberto(false);
                  }}
                >
                  {CATEGORIA_LABELS[categoria]}
                </button>
              ))}
            </div>
          )}

          {/* Filtro por Categoria */}
          <div className="relative">
            <button
              className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition w-full justify-center"
              onClick={() => setFiltroAberto(!filtroAberto)}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Categoria
            </button>

            {filtroAberto && (
              <div className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {FILTROS.map(filtro => (
                  <button
                    key={filtro.id}
                    onClick={() => {
                      setFiltroAtivo(filtro.id);
                      setFiltroAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-indigo-50 ${filtroAtivo === filtro.id ? 'bg-indigo-100 font-semibold' : ''}`}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro por Residente */}
          <div className="relative">
            <select
              className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition w-full justify-center appearance-none cursor-pointer"
              value={residenteSelecionado || ''}
              onChange={(e) => setResidenteSelecionado(e.target.value)}
            >
              <option value="">Todos os residentes</option>
              {residentesUnicos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          {(filtroAtivo !== 'todos' || residenteSelecionado) && (
            <button
              onClick={() => {
                setFiltroAtivo('todos');
                setResidenteSelecionado('');
              }}
              className="flex items-center bg-odara-accent text-odara-white rounded-full px-4 py-2 shadow-sm font-medium hover:bg-odara-secondary transition"
            >
              <FaTimes className="mr-1" /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção de Preferências */}
          <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
              {filtroAtivo === 'todos' ? 'Todas as Preferências' : `Preferências - ${CATEGORIA_LABELS[filtroAtivo]}`}
            </h2>

            {/* Filtros ativos */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filtroAtivo !== 'todos' && (
                <span className="text-sm bg-odara-accent text-odara-white px-2 py-1 rounded-full">
                  Categoria: {CATEGORIA_LABELS[filtroAtivo]}
                </span>
              )}
              {residenteSelecionado && (
                <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
                  Residente: {residenteSelecionado}
                </span>
              )}
            </div>

            <p className="text-odara-name/60 mb-6">
              {filtroAtivo === 'todos' 
                ? 'Todas as preferências cadastradas' 
                : `Preferências da categoria ${CATEGORIA_LABELS[filtroAtivo].toLowerCase()}`
              }
            </p>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {preferenciasParaExibir.length > 0 ? (
                preferenciasParaExibir.map(({ categoria, items }) => (
                  <div key={categoria} className="mb-6">
                    <h3 className="text-lg font-semibold text-odara-dark mb-3 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${CORES_CALENDARIO[categoria]}`}></span>
                      {CATEGORIA_LABELS[categoria]}
                    </h3>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl hover:shadow-md transition-shadow duration-200 ${CORES_CATEGORIAS[categoria]}`}
                          onMouseEnter={() => setResidenteAtual(item)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${CORES_CALENDARIO[categoria]}`}></span>
                              <h4 className="font-semibold text-odara-dark">{item.residente}</h4>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => abrirModalEditar(categoria, item.id)}
                                className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
                                title="Editar preferência"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button 
                                onClick={() => excluirPreferencia(item.id)}
                                className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
                                title="Excluir preferência"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <h6 className="text-lg font-bold mb-1">{item.titulo}</h6>
                          <p className="text-base mb-2">{item.descricao}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">
                              {CATEGORIA_LABELS[categoria]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                  <p className="text-odara-dark/60">
                    Nenhuma preferência encontrada
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
            <h3 className="text-xl font-bold text-odara-dark mb-4">RESIDENTE</h3>
            <div className="text-center">
              <div className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-odara-offwhite">
                {residenteAtual?.foto_url ? (
                  <img 
                    src={residenteAtual.foto_url} 
                    alt={residenteAtual.residente} 
                    className="w-48 h-48 rounded-2xl object-cover" 
                  />
                ) : (
                  <span className="text-odara-primary text-6xl">👤</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-odara-dark mb-2">
                {residenteAtual?.residente || 'Nenhum residente selecionado'}
              </h3>
              {residenteAtual && (
                <p className="text-odara-name/60">
                  Passe o mouse sobre uma preferência para ver os detalhes do residente
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalAberto && (
          <div className="fixed inset-0 bg-odara-offwhite/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-l-4 border-odara-primary">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-odara-accent">
                  {editando ? 'Editar' : 'Adicionar'} Preferência - {CATEGORIA_LABELS[categoriaAtual]}
                </h2>
                <button 
                  onClick={() => setModalAberto(false)}
                  className="text-odara-dark hover:text-odara-secondary"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                salvarPreferencia();
              }} className="space-y-4">
                <div className="relative">
                  <label className="block text-odara-dark font-medium mb-2">Residente *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                    value={novaPreferencia.residente}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setNovaPreferencia({ ...novaPreferencia, residente: valor });
                      filtrarSugestoes(valor);
                    }}
                    onFocus={() => {
                      if (residentes.length > 0) {
                        setMostrarSugestoes(true);
                        // Mostra todas as sugestões quando foca
                        setSugestoesResidentes(residentes.slice(0, 5));
                      }
                    }}
                    onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                    placeholder="Digite o nome do residente ou clique para ver opções" 
                    required
                  />
                  
                  {/* Lista de sugestões */}
                  {mostrarSugestoes && sugestoesResidentes.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-odara-primary rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {sugestoesResidentes.map((residente) => (
                        <div
                          key={residente.id}
                          className="px-4 py-3 hover:bg-odara-primary hover:text-odara-white cursor-pointer transition-colors duration-200 border-b last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setNovaPreferencia({ 
                              ...novaPreferencia, 
                              residente: residente.nome 
                            });
                            setMostrarSugestoes(false);
                          }}
                        >
                          <div className="font-medium">{residente.nome}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {carregandoResidentes && (
                    <div className="absolute right-3 top-10 text-odara-primary text-sm">Carregando residentes...</div>
                  )}
                  
                  {!carregandoResidentes && residentes.length === 0 && (
                    <div className="text-sm text-red-500 mt-1">⚠️ Nenhum residente cadastrado no sistema</div>
                  )}
                </div>
                <div>
                  <label className="block text-odara-dark font-medium mb-2">Título *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                    value={novaPreferencia.titulo}
                    onChange={(e) => setNovaPreferencia({ ...novaPreferencia, titulo: e.target.value })}
                    placeholder="Digite o título" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-odara-dark font-medium mb-2">Descrição *</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                    rows="4"
                    value={novaPreferencia.descricao}
                    onChange={(e) => setNovaPreferencia({ ...novaPreferencia, descricao: e.target.value })}
                    placeholder="Digite a descrição"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-odara-dark font-medium mb-2">Foto do Residente</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                    value={novaPreferencia.foto}
                    onChange={(e) => setNovaPreferencia({ ...novaPreferencia, foto: e.target.value })}
                    placeholder="Link da foto" 
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2 border-2 border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary hover:text-odara-white transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-odara-accent text-odara-white rounded-lg hover:bg-odara-secondary transition-colors duration-200"
                    disabled={!novaPreferencia.titulo || !novaPreferencia.descricao || !novaPreferencia.residente}
                  >
                    {editando ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistroPreferencias;