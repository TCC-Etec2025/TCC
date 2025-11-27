import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import Calendar from 'react-calendar';
import { supabase } from '../../../lib/supabaseClient';
import ModalConsultas from './ModalConsultas';
import toast, { Toaster } from 'react-hot-toast';

type Consulta = {
  id: number;
  id_residente: number;
  data_consulta: string;
  horario: string;
  medico: string;
  motivo_consulta: string | null;
  tratamento_indicado: string | null;
  status: string;
  observacao: string | null;
  criado_em?: string;
  atualizado_em?: string;
  residente?: Residente;
};

type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

// Cores por status
const corStatus: Record<string, { bola: string; bg: string; text: string; border: string }> = {
  agendada: { bola: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-odara-dark font-semibold', border: 'border-b border-blue-200' },
  realizada: { bola: 'bg-green-500', bg: 'bg-green-50', text: 'text-odara-dark font-semibold', border: 'border-b border-green-200' },
  cancelada: { bola: 'bg-red-500', bg: 'bg-red-50', text: 'text-odara-dark font-semibold', border: 'border-b border-red-200' },
  remarcada: { bola: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-odara-dark font-semibold', border: 'border-b border-yellow-200' }
};

const RegistroConsultas = () => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [calendarioVisivel, setCalendarioVisivel] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);

  // Busca sempre visível
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros avançados dentro de <details>
  const formFiltrosRef = useRef<HTMLFormElement>(null);
  const [filtros, setFiltros] = useState<{ 
    residenteId: number | null; 
    status: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    residenteId: null,
    status: null,
    startDate: null,
    endDate: null
  });

  // Carregar residentes
  useEffect(() => {
    const fetchResidentes = async () => {
      const { data, error } = await supabase
        .from('residente')
        .select('id, nome, quarto')
        .order('nome');
      if (!error) setResidentes(data || []);
    };
    fetchResidentes();
  }, []);

  // Carregar consultas
  const carregarConsultas = async () => {
    const { data, error } = await supabase
      .from('consulta')
      .select(`*, residente:residente(id, nome, quarto)`)
      .order('data_consulta', { ascending: false })
      .order('horario', { ascending: true });

    if (error) {
      console.error('Erro ao carregar consultas:', error);
      toast.error('Erro ao carregar consultas.');
      return;
    }

    if (data) setConsultas(data);
  };

  useEffect(() => {
    carregarConsultas();
  }, []);

  // Excluir consulta
  const excluirConsulta = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta consulta?')) return;

    const { error } = await supabase
      .from('consulta')
      .delete()
      .eq('id', id);

    if (!error) {
      setConsultas(prev => prev.filter(c => c.id !== id));
      toast.success('Consulta excluída com sucesso!');
    } else {
      toast.error('Erro ao excluir consulta.');
    }
  };

  // Atualizar status
  const updateStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('consulta')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      setConsultas(prev => prev.map(c => (c.id === id ? { ...c, status } : c)));
      toast.success('Status atualizado!');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Falha ao atualizar status.');
    }
  };

  // Aplicar filtragem
  const consultasFiltradas = consultas
    .filter(c => {
      // Filtro de busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNome = c.residente?.nome.toLowerCase().includes(term);
        const matchMedico = c.medico.toLowerCase().includes(term);
        const matchMotivo = c.motivo_consulta?.toLowerCase().includes(term);
        if (!matchNome && !matchMedico && !matchMotivo) return false;
      }

      // Filtro por residente
      if (filtros.residenteId && c.residente?.id !== filtros.residenteId) return false;

      // Filtro por status
      if (filtros.status && filtros.status !== 'todos' && c.status !== filtros.status) return false;

      // Filtro por data
      if (filtros.startDate || filtros.endDate) {
        if (filtros.startDate && filtros.endDate) {
          if (c.data_consulta < filtros.startDate || c.data_consulta > filtros.endDate) return false;
        } else if (filtros.startDate && c.data_consulta !== filtros.startDate) return false;
        else if (filtros.endDate && c.data_consulta !== filtros.endDate) return false;
      }

      // Filtro por data selecionada no calendário
      if (dataSelecionada) {
        const dataCalendario = dataSelecionada.toISOString().split('T')[0];
        if (c.data_consulta !== dataCalendario) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.data_consulta !== b.data_consulta) return a.data_consulta.localeCompare(b.data_consulta);
      return a.horario.localeCompare(b.horario);
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
      
      <ModalConsultas
        consulta={consultaSelecionada}
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setConsultaSelecionada(null);
          carregarConsultas();
        }}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-center xl:justify-start items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
              Registro de Consultas Médicas
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
                  <h3 className="font-bold mb-2">Registro de Consultas Médicas</h3>
                  <p>Registro de consultas médicas realizadas pelos residentes. Você pode adicionar, editar ou excluir consultas conforme necessário.</p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setConsultaSelecionada(null);
              setModalAberto(true);
            }}
            className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
          >
            <FaPlus className="mr-2" /> Nova Consulta
          </button>
        </div>

        {/* Filtros */}
        <details className="group mb-8 w-full">
          <summary className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer">
            {/* Campo de busca */}
            <div className="flex-1 max-w-xl">
              <label className="block text-sm font-medium text-odara-dark mb-1">
                Buscar consultas
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onFocus={e => e.stopPropagation()}
                placeholder="Buscar por residente, médico ou motivo..."
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
                residenteId: fd.get('residente') ? Number(fd.get('residente')) : null,
                status: fd.get('status') as string || null,
                startDate: fd.get('startDate') as string || null,
                endDate: fd.get('endDate') as string || null
              });
            }}
            className="mt-6 bg-white p-5 rounded-xl shadow border w-full animate-fade-in"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue="todos"
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="remarcada">Remarcada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                <input 
                  type="date" 
                  name="startDate" 
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                <input 
                  type="date" 
                  name="endDate" 
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none" 
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="submit"
                className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium"
              >
                Aplicar Filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltros({ residenteId: null, status: null, startDate: null, endDate: null });
                  setDataSelecionada(null);
                  formFiltrosRef.current?.reset();
                }}
                className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium flex items-center gap-1"
              >
                <FaTimes size={12} /> Limpar
              </button>
            </div>

            {(filtros.residenteId || filtros.status || filtros.startDate || filtros.endDate || dataSelecionada) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {filtros.residenteId && (
                  <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                    Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
                  </span>
                )}
                {filtros.status && (
                  <span className="bg-odara-primary text-white px-2 py-1 rounded-full">
                    Status: {filtros.status}
                  </span>
                )}
                {filtros.startDate && filtros.endDate && (
                  <span className="bg-odara-accent text-white px-2 py-1 rounded-full">
                    Período: {filtros.startDate.split('-').reverse().join('/')} - {filtros.endDate.split('-').reverse().join('/')}
                  </span>
                )}
                {dataSelecionada && (
                  <span className="bg-purple-500 text-white px-2 py-1 rounded-full">
                    Data: {dataSelecionada.toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            )}
          </form>
        </details>

        {/* Lista de Consultas */}
        <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <h2 className="text-2xl lg:text-4xl font-bold text-odara-dark">Consultas</h2>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              Total: {consultasFiltradas.length}
            </span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {consultasFiltradas.length === 0 ? (
              <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                <p className="text-odara-dark/60">Nenhuma consulta encontrada</p>
              </div>
            ) : (
              consultasFiltradas.map(consulta => (
                <div key={consulta.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                  {/* Header com status */}
                  <div className={`flex items-center justify-between p-3 rounded-t-lg ${corStatus[consulta.status]?.border || 'border-b border-gray-200'} ${corStatus[consulta.status]?.bg || 'bg-gray-50'}`}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${corStatus[consulta.status]?.bola || 'bg-gray-500'}`}></div>
                      <p className={`text-sm sm:text-base ${corStatus[consulta.status]?.text || 'text-odara-dark font-semibold'}`}>
                        {consulta.data_consulta.split('-').reverse().join('/')} às {consulta.horario.slice(0, 5)}
                      </p>
                    </div>
                    <select
                      value={consulta.status}
                      onChange={e => updateStatus(consulta.id, e.target.value)}
                      className="text-odara-dark rounded-lg px-2 py-1 text-sm border border-gray-300"
                    >
                      <option value="agendada">Agendada</option>
                      <option value="realizada">Realizada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="remarcada">Remarcada</option>
                    </select>
                  </div>

                  {/* Corpo da consulta */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-1">
                          {consulta.residente?.nome}
                        </h3>
                        <p className="text-sm text-odara-name">
                          Dr(a). {consulta.medico}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setConsultaSelecionada(consulta);
                            setModalAberto(true);
                          }}
                          className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                          title="Editar consulta"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => excluirConsulta(consulta.id)}
                          className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                          title="Excluir consulta"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                      <div className="space-y-2">
                        {consulta.motivo_consulta && (
                          <div>
                            <strong className="text-odara-dark">Motivo:</strong>{' '}
                            <span className="text-odara-name ml-1">{consulta.motivo_consulta}</span>
                          </div>
                        )}
                        {consulta.tratamento_indicado && (
                          <div>
                            <strong className="text-odara-dark">Tratamento:</strong>{' '}
                            <span className="text-odara-name ml-1">{consulta.tratamento_indicado}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {consulta.observacao && (
                          <div>
                            <strong className="text-odara-dark">Observações:</strong>{' '}
                            <span className="text-odara-name ml-1">{consulta.observacao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                          {consulta.residente?.quarto ? `Quarto: ${consulta.residente.quarto}` : 'Consulta'}
                        </span>
                      </div>
                      <div className="text-xs text-odara-name">
                        Criado em: {consulta.criado_em ? new Date(consulta.criado_em).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroConsultas;