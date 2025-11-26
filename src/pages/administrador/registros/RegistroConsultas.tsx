import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaTimes } from 'react-icons/fa';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import ModalConsultas from './ModalConsultas';

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
};

const RegistroConsultas = () => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [residentes, setResidentes] = useState<Residente[]>([]);

  const [filtros, setFiltros] = useState<{
    pacienteId: number | null;
    startDate: string | null;
    endDate: string | null;
  }>({ pacienteId: null, startDate: null, endDate: null });

  useEffect(() => {
    const fetchResidentes = async () => {
      const { data, error } = await supabase
        .from('residente')
        .select('id, nome')
        .order('nome');
      if (!error) setResidentes(data || []);
    };
    fetchResidentes();
  }, []);

  useEffect(() => {
    const fetchConsultas = async () => {
      const { data, error } = await supabase
        .from('consulta')
        .select(`*, residente:residente(id, nome)`)
        .order('data_consulta', { ascending: false })
        .order('horario', { ascending: true });

      if (error) {
        console.error(error);
        alert('Erro ao carregar consultas.');
        return;
      }

      if (data) setConsultas(data);
    };

    fetchConsultas();
  }, []);

  const excluirConsulta = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta consulta?')) return;

    const { error } = await supabase
      .from('consulta')
      .delete()
      .eq('id', id);

    if (!error) {
      setConsultas(prev => prev.filter(c => c.id !== id));
      alert('Consulta excluída com sucesso!');
    }
  };

  const consultasFiltradas = consultas
    .filter(c => {
      if (filtros.startDate || filtros.endDate) {
        if (filtros.startDate && filtros.endDate) {
          if (c.data_consulta < filtros.startDate || c.data_consulta > filtros.endDate) return false;
        } else if (filtros.startDate && c.data_consulta !== filtros.startDate) return false;
        else if (filtros.endDate && c.data_consulta !== filtros.endDate) return false;
      }
      if (filtros.pacienteId && c.residente?.id !== filtros.pacienteId) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.data_consulta !== b.data_consulta) return a.data_consulta.localeCompare(b.data_consulta);
      return a.horario.localeCompare(b.horario);
    });

  const resumoFiltros =
    [
      filtros.pacienteId ? `Paciente: ${residentes.find(r => r.id === filtros.pacienteId)?.nome || filtros.pacienteId}` : '',
      filtros.startDate && filtros.endDate
        ? `Período: ${filtros.startDate.split('-').reverse().join('/')} - ${filtros.endDate.split('-').reverse().join('/')}`
        : filtros.startDate
          ? `Data: ${filtros.startDate.split('-').reverse().join('/')}`
          : filtros.endDate
            ? `Data: ${filtros.endDate.split('-').reverse().join('/')}`
            : ''
    ]
      .filter(Boolean)
      .join(' | ') || 'Nenhum ativo';

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <ModalConsultas
        consulta={consultaSelecionada}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />

      <div className="flex-1 p-6 lg:p-10">
        
        {/* Título */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-odara-dark mr-2">
              Registro de Consultas Médicas
            </h1>
            <div className="relative inline-block group">
              <button
                className="text-odara-dark hover:text-odara-secondary transition-colors duration-200"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <FaInfoCircle size={20} className="text-odara-accent hover:text-odara-secondary" />
              </button>

              <div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150">
                <h3 className="font-bold mb-2">Registro de Consultas Médicas</h3>
                <p>
                  Registre de consultas médicas realizadas pelos residentes. Você pode adicionar, editar ou excluir consultas conforme necessário. Utilize os filtros para facilitar a busca por registros específicos.
                </p>
                <div className="absolute -top-2 left-4 w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-odara-dropdown"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <details className="group mb-8 w-full">
          <summary className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer">
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                setConsultaSelecionada(null);
                setModalAberto(true);
              }}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
            >
              <FaPlus className="mr-2" /> Nova
            </button>

            <div className="sm:w-40">
              <div className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded text-sm">
                <FaFilter className="mr-2" /> Filtros
              </div>
              <p className="text-[11px] mt-1 text-odara-name/70 truncate">{resumoFiltros}</p>
            </div>
          </summary>

          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setFiltros({
                pacienteId: fd.get('paciente') !== 'todos' ? Number(fd.get('paciente')) : null,
                startDate: fd.get('startDate') as string || null,
                endDate: fd.get('endDate') as string || null
              });
            }}
            className="mt-6 bg-white p-5 rounded-xl shadow border w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select
                  name="paciente"
                  defaultValue="todos"
                  className="w-full h-10 border rounded px-2 text-sm"
                >
                  <option value="todos">Todos</option>
                  {residentes.map(r => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                <input type="date" name="startDate" className="w-full h-10 border rounded px-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                <input type="date" name="endDate" className="w-full h-10 border rounded px-2 text-sm" />
              </div>

              <div className="flex items-end">
                <div className="flex gap-2 w-full">
                  <button
                    type="submit"
                    className="flex-1 h-10 px-4 bg-odara-dark text-white rounded text-sm"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltros({ pacienteId: null, startDate: null, endDate: null })}
                    className="h-10 px-4 bg-gray-200 rounded text-sm flex items-center gap-1"
                  >
                    <FaTimes size={12} /> Limpar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </details>

        {/* LISTA DE CONSULTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-odara-dark mb-2">
              Consultas
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">

              {consultasFiltradas.length === 0 ? (
                <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                  <p className="text-odara-dark/60">Nenhuma consulta com os filtros atuais</p>
                </div>
              ) : (
                consultasFiltradas.map(consulta => (
                  <div key={consulta.id} className="p-4 rounded-xl hover:shadow-md bg-odara-offwhite">

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-odara-accent"></span>
                        <p className="text-base font-semibold">
                          {consulta.data_consulta.split('-').reverse().join('/')} às {consulta.horario.slice(0, 5)}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setConsultaSelecionada(consulta); setModalAberto(true); }}
                          className="text-odara-secondary hover:text-odara-dropdown-accent p-2 rounded-full hover:bg-odara-dropdown"
                        >
                          <FaEdit size={14} />
                        </button>

                        <button
                          onClick={() => excluirConsulta(consulta.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-200"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>

                    <h6 className="text-xl font-bold mb-1">{consulta.residente?.nome}</h6>

                    <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                      <div><strong>Médico:</strong> {consulta.medico}</div>
                      {consulta.motivo_consulta && (
                        <div className="col-span-2"><strong>Motivo:</strong> {consulta.motivo_consulta}</div>
                      )}
                      {consulta.tratamento_indicado && (
                        <div className="col-span-2"><strong>Tratamento:</strong> {consulta.tratamento_indicado}</div>
                      )}
                      {consulta.observacao && (
                        <div className="col-span-2"><strong>Obs:</strong> {consulta.observacao}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">
                        {consulta.medico}
                      </span>
                    </div>

                  </div>
                ))
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegistroConsultas;