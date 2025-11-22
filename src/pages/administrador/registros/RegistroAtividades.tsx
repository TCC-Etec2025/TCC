import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import ModalAtividades from './ModalAtividades';

type Residente = { id: number; nome: string; foto: string; };
type Atividade = {
  id: number;
  residentes: Residente[];
  nome: string;
  categoria: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  local: string;
  observacao: string;
  status: string;
};
type AtividadeResidente = { id_atividade: number; id_residente: number; };

const RegistroAtividades = () => {
  const categorias = {
    "fisica": "Física",
    "cognitiva": "Cognitiva",
    "social": "Social",
    "criativa": "Criativa",
    "lazer": "Lazer",
    "terapeutica": "Terapêutica"
  };
  const status = {
    "pendente": 'Pendente',
    "em_andamento": 'Em Andamento',
    "concluida": 'Concluída',
    "cancelada": 'Cancelada',
    "atrasada": 'Atrasada'
  };
  const CONFIGS_STATUS = {
    pendente: { corBolinha: 'bg-yellow-500', corBadge: 'bg-yellow-500 text-white', corFundo: 'bg-yellow-50', corBorda: 'border-b border-yellow-200', texto: 'Pendente' },
    em_andamento: { corBolinha: 'bg-blue-500', corBadge: 'bg-blue-500 text-white', corFundo: 'bg-blue-50', corBorda: 'border-b border-blue-200', texto: 'Em Andamento' },
    concluida: { corBolinha: 'bg-green-500', corBadge: 'bg-green-500 text-white', corFundo: 'bg-green-50', corBorda: 'border-b border-green-200', texto: 'Concluída' },
    cancelada: { corBolinha: 'bg-gray-500', corBadge: 'bg-gray-500 text-white', corFundo: 'bg-gray-50', corBorda: 'border-b border-gray-200', texto: 'Cancelada' },
    atrasada: { corBolinha: 'bg-red-500', corBadge: 'bg-red-500 text-white', corFundo: 'bg-red-50', corBorda: 'border-b border-red-200', texto: 'Atrasada' }
  } as const;

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);

  const [filtros, setFiltros] = useState<{
    status: string | null;
    categoria: string | null;
    residenteId: number | null;
    startDate: string | null;
    endDate: string | null;
  }>({ status: null, categoria: null, residenteId: null, startDate: null, endDate: null });

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { data: atividadesData, error: atividadesError } = await supabase.from('atividade').select('*');
        if (atividadesError) throw atividadesError;
        const baseAtividades = (atividadesData || []) as Atividade[];

        const { data: joinsData, error: joinError } = await supabase.from('atividade_residente').select('*');
        if (joinError) throw joinError;
        const joins = (joinsData || []) as AtividadeResidente[];

        const { data: residentesData, error: residentesError } = await supabase
          .from('residente')
          .select('id, nome, foto');
        if (residentesError) throw residentesError;

        setResidentes(residentesData || []);
        const allResidentes = (residentesData || []) as Residente[];

        const atividadesComResidentes: Atividade[] = baseAtividades.map(atv => {
          const relacionados = joins
            .filter(j => j.id_atividade === atv.id)
            .map(j => allResidentes.find(r => r.id === j.id_residente))
            .filter((r): r is Residente => !!r);
          return { ...atv, residentes: relacionados };
        });

        setAtividades(atividadesComResidentes);
      } catch (err) {
        console.error('Erro ao buscar atividades:', err);
      }
    };
    fetchAtividades();
  }, []);

  const alterarStatus = async (id: number, novoStatus: string) => {
    try {
      const { error } = await supabase.from('atividade').update({ status: novoStatus }).eq('id', id);
      if (error) throw error;
      setAtividades(a => a.map(x => x.id === id ? { ...x, status: novoStatus } : x));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const excluirAtividade = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
      supabase.from('atividade').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Erro ao excluir atividade:', error);
        else setAtividades(a => a.filter(x => x.id !== id));
      });
    }
  };

  const atividadesFiltradas = atividades
    .filter(a => {
      if (filtros.status && filtros.status !== 'todos' && a.status !== filtros.status) return false;
      if (filtros.categoria && filtros.categoria !== 'todos' && a.categoria !== filtros.categoria) return false;
      if (filtros.residenteId && !a.residentes?.some(r => r.id === filtros.residenteId)) return false;

      const dataAtv = a.data.split('T')[0];
      if (filtros.startDate && filtros.endDate) {
        if (dataAtv < filtros.startDate || dataAtv > filtros.endDate) return false;
      } else if (filtros.startDate && !filtros.endDate) {
        if (dataAtv !== filtros.startDate) return false;
      } else if (!filtros.startDate && filtros.endDate) {
        if (dataAtv !== filtros.endDate) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <ModalAtividades atividade={atividadeSelecionada} isOpen={modalAberto} onClose={() => setModalAberto(false)} />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-center xl:justify-start items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">Registro de Atividades</h1>
            <div className="relative">
              <button
                onMouseEnter={() => setInfoVisivel(true)}
                onMouseLeave={() => setInfoVisivel(false)}
                className="text-odara-dark hover:text-odara-secondary"
              >
                <FaInfoCircle size={20} className='text-odara-accent hover:text-odara-secondary' />
              </button>
              {infoVisivel && (
                <div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
                  <h3 className="font-bold mb-2">Registro de Atividades</h3>
                  <p>Documento para controle e planejamento das atividades dos residentes.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <details className="group mb-8 w-full">
          <summary className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer">
            <button
              type="button"
              onClick={e => { e.preventDefault(); setAtividadeSelecionada(null); setModalAberto(true); }}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
            >
              <FaPlus className="mr-2" /> Nova
            </button>
            <div className="sm:w-40">
              <div className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium select-none">
                <FaFilter className="mr-2" /> Filtros
              </div>
            </div>
          </summary>

          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const statusRaw = fd.get('status') as string;
              const catRaw = fd.get('categoria') as string;
              const resRaw = fd.get('residente') as string;
              const startRaw = fd.get('startDate') as string;
              const endRaw = fd.get('endDate') as string;
              setFiltros({
                status: statusRaw && statusRaw !== 'todos' ? statusRaw : null,
                categoria: catRaw && catRaw !== 'todos' ? catRaw : null,
                residenteId: resRaw ? Number(resRaw) : null,
                startDate: startRaw || null,
                endDate: endRaw || null
              });
            }}
            className="mt-6 bg-white p-5 rounded-xl shadow border w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" defaultValue="todos" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary">
                  <option value="todos">Todos</option>
                  {Object.entries(status).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select name="categoria" defaultValue="todos" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary">
                  <option value="todos">Todas</option>
                  {Object.entries(categorias).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
                <select name="residente" defaultValue="" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary">
                  <option value="">Todos</option>
                  {residentes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                <input type="date" name="startDate" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                <input type="date" name="endDate" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="submit" className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium">Aplicar</button>
              <button
                type="button"
                onClick={() => setFiltros({ status: null, categoria: null, residenteId: null, startDate: null, endDate: null })}
                className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
              >
                Limpar
              </button>
            </div>
          </form>
        </details>

        <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <h2 className="text-2xl lg:text-4xl font-bold text-odara-dark">
              {filtros.status ? `Atividades ${filtros.status}` : 'Todas as Atividades'}
            </h2>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              Total: {atividadesFiltradas.length}
            </span>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {atividadesFiltradas.length === 0 ? (
              <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                <p className="text-odara-dark/60">Nenhuma atividade encontrada</p>
              </div>
            ) : atividadesFiltradas.map(atividade => {
              const statusAtual = atividade.status;
              const configStatus = CONFIGS_STATUS[statusAtual as keyof typeof CONFIGS_STATUS] ?? CONFIGS_STATUS.pendente;
              return (
                <div key={atividade.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                  <div className={`flex items-center justify-between p-3 rounded-t-lg ${configStatus.corFundo} ${configStatus.corBorda}`}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${configStatus.corBolinha}`}></div>
                      <p className="text-sm sm:text-base text-odara-dark">
                        <span className='font-semibold'>
                          {new Date(atividade.data).toLocaleDateString('pt-BR')}
                        </span>
                        {atividade.horario_inicio && (
                          <span className="text-odara-accent ml-2">• {atividade.horario_inicio.replace(/:\d{2}$/, '')}</span>
                        )}
                      </p>
                    </div>
                    <select
                      value={atividade.status}
                      onChange={e => alterarStatus(atividade.id, e.target.value)}
                      className={`text-xs font-medium rounded-lg px-3 py-1 border ${configStatus.corBadge}`}
                    >
                      {Object.entries(status).map(([key, value]) => (
                        <option key={key} value={key} className="text-black">{value}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4">
                    <h6 className="text-lg sm:text-xl font-bold mb-3 text-odara-dark">{atividade.nome || 'Sem nome'}</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                      <div className="space-y-2">
                        <div><strong className="text-odara-dark">Categoria:</strong><span className="text-odara-name ml-1">{atividade.categoria}</span></div>
                        {atividade.local && <div><strong className="text-odara-dark">Local:</strong><span className="text-odara-name ml-1">{atividade.local}</span></div>}
                      </div>
                      <div className="space-y-2">
                        {atividade.horario_inicio && atividade.horario_fim && (
                          <div>
                            <strong className="text-odara-dark">Duração:</strong>
                            <span className="text-odara-name ml-1">
                              {(() => {
                                const [hi, mi] = atividade.horario_inicio.split(':').map(Number);
                                const [hf, mf] = atividade.horario_fim.split(':').map(Number);
                                if ([hi, mi, hf, mf].some(Number.isNaN)) return '—';
                                const start = hi * 60 + mi;
                                let end = hf * 60 + mf;
                                if (end < start) end += 1440;
                                const diff = end - start;
                                const h = Math.floor(diff / 60);
                                const m = diff % 60;
                                return `${h > 0 ? `${h}h` : ''}${h > 0 && m > 0 ? ' ' : ''}${m > 0 ? `${m}m` : h === 0 ? '0m' : ''}`;
                              })()}
                            </span>
                          </div>
                        )}
                        {atividade.observacao && (
                          <div>
                            <strong className="text-odara-dark">Observações:</strong>
                            <span className="text-odara-name ml-1">{atividade.observacao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center text-sm flex-wrap gap-1">
                        {atividade.residentes
                          .map(r => r?.nome)
                          .filter(Boolean)
                          .sort((a, b) => a!.localeCompare(b!))
                          .map(residente => (
                            <span key={residente} className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                              {residente}
                            </span>
                          ))}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setAtividadeSelecionada(atividade); setModalAberto(true); }}
                          className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                          title="Editar atividade"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => excluirAtividade(atividade.id)}
                          className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                          title="Excluir atividade"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroAtividades;