import { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import ModalExame from './ModalExames';

type Residente = { id: number; nome: string };
type Consulta = { id: number; data_consulta: string; horario: string, medico: string };
type Exame = {
  id: number;
  id_consulta: number | null;
  id_residente: number;
  tipo: string;
  laboratorio: string;
  data_prevista: string;
  horario_previsto: string;
  data_realizado: string | null;
  horario_realizado: string | null;
  resultado: string | null;
  arquivo_resultado: string | null;
  status: string;
  observacao: string | null;
  residente: Residente;
  consulta: Consulta | null;
};

const RegistroExames = () => {
  const [exames, setExames] = useState<Exame[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [exameSelecionado, setExameSelecionado] = useState<Exame | null>(null);
  const [filtros, setFiltros] = useState<
    {
      residenteId: number | null;
      status: string | null;
      startDate: string | null;
      endDate: string | null
    }>({
      residenteId: null,
      status: null,
      startDate: null,
      endDate: null
    });
  const formFiltrosRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchResidentes = async () => {
      const { data, error } = await supabase.from('residente').select('id, nome').order('nome');
      if (error) console.error(error);
      setResidentes(data || []);
    };
    fetchResidentes();
  }, []);

  useEffect(() => {
    const fetchExames = async () => {
      const { data, error } = await supabase
        .from('exame')
        .select(`*, residente:residente(id, nome), consulta:consulta(id, data_consulta, horario, medico)`)
        .order('data_prevista', { ascending: false })
        .order('horario_previsto', { ascending: true });
      if (error) console.error(error);
      else setExames(data || []);
    };
    fetchExames();
  }, []);

  const examesFiltrados = exames
    .filter(e => {
      if (filtros.status && filtros.status !== 'todos' && e.status !== filtros.status) return false;
      if (filtros.residenteId && e.id_residente !== filtros.residenteId) return false;
      const dataAtv = e.data_prevista;
      if (filtros.startDate && filtros.endDate) {
        if (dataAtv < filtros.startDate || dataAtv > filtros.endDate) return false;
      } else if (filtros.startDate && !filtros.endDate) {
        if (dataAtv !== filtros.startDate) return false;
      } else if (!filtros.startDate && filtros.endDate) {
        if (dataAtv !== filtros.endDate) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.data_prevista !== b.data_prevista) return a.data_prevista.localeCompare(b.data_prevista);
      return a.horario_previsto.localeCompare(b.horario_previsto);
    });

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <ModalExame exame={exameSelecionado} isOpen={modalAberto} onClose={() => setModalAberto(false)} />
      <div className="flex-1 p-6 lg:p-10">

        {/* Título */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Exames</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={e => { e.preventDefault(); setExameSelecionado(null); setModalAberto(true); }}
          className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
        >
          <FaPlus className="mr-2" /> Nova
        </button>

        {/* Filtros */}
        <details className="group mb-6 w-full">
          <summary className="inline-flex items-center px-4 py-2 bg-odara-dark text-white rounded cursor-pointer">
            <div className="h-10 w-40 inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen transition text-sm font-medium select-none">
              <FaFilter className="mr-2" /> Filtros
            </div>
          </summary>

          <form
            ref={formFiltrosRef}
            onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const residenteRaw = formData.get('residente') as string;
              const statusRaw = formData.get('status') as string;
              const startDateRaw = formData.get('startDate') as string;
              const endDateRaw = formData.get('endDate') as string;

              setFiltros({
                residenteId: residenteRaw ? Number(residenteRaw) : null,
                status: statusRaw && statusRaw !== 'todos' ? statusRaw : null,
                startDate: startDateRaw || null,
                endDate: endDateRaw || null
              });
            }}
            className="mt-4 bg-white p-5 rounded-xl shadow border w-full animate-fade-in"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
                <select
                  name="residente"
                  defaultValue=""
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary"
                >
                  <option value="">Todos</option>
                  {residentes.map(r => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue="todos"
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label>Intervalo de Datas</label>
                <div className="flex flex-col md:flex-row gap-2 items-center">
                  <input
                    type="date"
                    name="startDate"
                    className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary"
                  />
                  <input
                    type="date"
                    name="endDate"
                    className="w-full h-10 border rounded px-2 text-sm mt-2 focus:ring-2 focus:ring-odara-primary"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2 pt-1 md:pt-0">
                <button
                  type="submit"
                  className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltros({
                      residenteId: null,
                      status: null,
                      startDate: null,
                      endDate: null
                    });
                    formFiltrosRef.current?.reset();
                  }}
                  className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  Limpar
                </button>
              </div>
            </div>

            {(filtros.residenteId || filtros.status) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {filtros.residenteId && (
                  <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                    Residente: {residentes.find(residente => residente.id === filtros.residenteId)?.nome}
                  </span>
                )}
                {filtros.status && (
                  <span className="bg-odara-primary text-white px-2 py-1 rounded-full">
                    Status: {filtros.status}
                  </span>
                )}
              </div>
            )}
          </form>
        </details>

        {/* Lista de exames */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {examesFiltrados.length === 0 && (
            <div className="p-6 rounded-xl bg-odara-name/10 text-center">
              Nenhum exame encontrado.
            </div>
          )}
          {examesFiltrados.map(exame => (
            <div key={exame.id} className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">{exame.tipo}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setExameSelecionado(exame); setModalAberto(true); }}
                    className="text-odara-secondary hover:text-odara-dropdown-accent p-2 rounded-full hover:bg-odara-dropdown"
                  ><FaEdit size={14} /></button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Tem certeza que deseja excluir este exame?')) return;
                      const { error } = await supabase.from('exame').delete().eq('id', exame.id);
                      if (!error) setExames(prev => prev.filter(e => e.id !== exame.id));
                    }}
                    className="text-odara-alerta hover:text-red-700 p-2 rounded-full hover:bg-odara-alerta/50"
                  ><FaTrash size={14} /></button>
                </div>
              </div>
              <div className="text-sm mb-1"><strong>Residente:</strong> {exame.residente?.nome}</div>
              {exame.consulta && (
                <div className="text-sm mb-1"><strong>Consulta:</strong> {exame.consulta.data_consulta.split('-').reverse().join('/')} às {exame.consulta.horario.slice(0, 5)}</div>
              )}
              <div className="grid grid-cols-2 text-sm gap-2 mb-2">
                <div><strong>Laboratório:</strong> {exame.laboratorio || '-'}</div>
                <div><strong>Status:</strong> {exame.status}</div>
                <div><strong>Data Prevista:</strong> {exame.data_prevista.split('-').reverse().join('/')} {exame.horario_previsto.slice(0, 5)}</div>
                <div><strong>Data Realizado:</strong> {exame.data_realizado?.split('-').reverse().join('/')} {exame.horario_realizado?.slice(0, 5) ?? ''}</div>
              </div>
              {exame.resultado && <div className="mb-2"><strong>Resultado:</strong> {exame.resultado}</div>}
              {exame.observacao && <div className="mb-2"><strong>Observações:</strong> {exame.observacao}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegistroExames;