import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaFilePdf, FaTimes } from 'react-icons/fa';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import ModalConsultas from './ModalConsultas';

type Consulta = {
  id: number;
  id_residente: number;
  sexo: string;
  data_consulta: string;
  horario: string;
  medico: string;
  motivo_consulta: string;
  idade: number;
  numero_prontuario: string;
  historico_clinico: string;
  tratamento_indicado: string;
  exames_solicitados: string;
  receitas_medicas: string;
  anexos_medicos: string;
  residente?: Residente;
  data?: Date; // adicionada para facilitar filtragem
}

type Residente = {
  id: number;
  nome: string;
}

const RegistroConsultas = () => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [residentes, setResidentes] = useState<Residente[]>([]);

  // FILTROS (removido dia específico, similar ao RegistroComportamento)
  const [filtros, setFiltros] = useState<{
    pacienteId: number | null;
    startDate: string | null;
    endDate: string | null;
  }>({ pacienteId: null, startDate: null, endDate: null });

  // Carrega residentes do banco
  useEffect(() => {
    const fetchResidentes = async () => {
      try {
        const { data, error } = await supabase
          .from('residente')
          .select('id, nome')
          .order('nome');
        if (error) throw error;
        setResidentes(data || []);
      } catch (error) {
        console.error('Erro ao carregar residentes:', error);
      }
    };
    fetchResidentes();
  }, []);

  // Carrega Consultas do banco
  useEffect(() => {
    const fetchConsultas = async () => {
      try {
        const { data, error } = await supabase
          .from('consultas_medicas')
          .select(`*, residente:residente(id, nome)`)
          .order('data_consulta', { ascending: false })
          .order('horario', { ascending: true });
        if (error) throw error;
        if (data) {
          const consultasComData = data.map(consulta => ({
            ...consulta,
            data: new Date(consulta.data_consulta + 'T00:00:00')
          }));
          setConsultas(consultasComData);
        }
      } catch (error) {
        console.error('Erro ao carregar consultas médicas:', error);
        alert('Erro ao carregar consultas médicas.');
      }
    };
    fetchConsultas();
  }, []);

  const excluirConsulta = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta consulta?')) return;
    try {
      const { error } = await supabase
        .from('consultas_medicas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setConsultas(prev => prev.filter(item => item.id !== id));
      alert('Consulta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir consulta:', error);
    }
  };

  // Filtragem (igual abordagem de RegistroComportamento, sem useMemo)
  const consultasFiltradas = consultas
    .filter(c => {
      if (!c.data) return false;
      const iso = `${c.data.getFullYear()}-${String(c.data.getMonth() + 1).padStart(2, '0')}-${String(c.data.getDate()).padStart(2, '0')}`;

      // Intervalo / datas únicas
      if (filtros.startDate || filtros.endDate) {
        if (filtros.startDate && filtros.endDate) {
          if (iso < filtros.startDate || iso > filtros.endDate) return false;
        } else if (filtros.startDate && iso !== filtros.startDate) {
          return false;
        } else if (filtros.endDate && iso !== filtros.endDate) {
          return false;
        }
      }

      if (filtros.pacienteId && c.residente?.id !== filtros.pacienteId) return false;
      return true;
    })
    .sort((a, b) => {
      const da = a.data?.getTime() || 0;
      const db = b.data?.getTime() || 0;
      if (da !== db) return da - db;
      return a.horario.localeCompare(b.horario);
    });

  const consultasMostradas = consultasFiltradas;

  const limparFiltros = () => {
    setFiltros({ pacienteId: null, startDate: null, endDate: null });
  };

  const resumoFiltros = [
    filtros.pacienteId ? `Paciente: ${residentes.find(r => r.id === filtros.pacienteId)?.nome || filtros.pacienteId}` : '',
    filtros.startDate && filtros.endDate
      ? `Período: ${filtros.startDate.split('-').reverse().join('/')} - ${filtros.endDate.split('-').reverse().join('/')}`
      : (filtros.startDate ? `Data: ${filtros.startDate.split('-').reverse().join('/')}` : (filtros.endDate ? `Data: ${filtros.endDate.split('-').reverse().join('/')}` : ''))
  ].filter(Boolean).join(' | ') || 'Nenhum ativo';

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
                  <h3 className="font-bold mb-2">Registro de Consultas Médicas</h3>
                  <p>
                    Registre nome, idade, sexo, prontuário, data/horário, profissional, motivo, histórico, tratamentos, exames, receitas e anexos.
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

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
              <div className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen transition text-sm font-medium select-none">
                <FaFilter className="mr-2" /> Filtros
              </div>
              <p className="text-[11px] mt-1 text-odara-name/70 truncate">{resumoFiltros}</p>
            </div>
          </summary>

          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const pacienteRaw = fd.get('paciente') as string;
              const startRaw = fd.get('startDate') as string;
              const endRaw = fd.get('endDate') as string;
              setFiltros({
                pacienteId: pacienteRaw && pacienteRaw !== 'todos' ? Number(pacienteRaw) : null,
                startDate: startRaw || null,
                endDate: endRaw || null
              });
            }}
            className="mt-6 bg-white p-5 rounded-xl shadow border w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select name="paciente" defaultValue="todos" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary">
                  <option value="todos">Todos</option>
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
              <div className="flex items-end">
                <div className="flex gap-2 w-full">
                  <button type="submit" className="flex-1 h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium">
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium flex items-center gap-1"
                  >
                    <FaTimes size={12} /> Limpar
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-odara-name/70">
              Use período (inicial/final) para filtrar por intervalo. Deixe vazio para ver todas.
            </p>
          </form>
        </details>

        {/* Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-odara-dark mb-2">
              Consultas
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {consultasMostradas.length === 0 ? (
                <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                  <p className="text-odara-dark/60">Nenhuma consulta com os filtros atuais</p>
                </div>
              ) : (
                consultasMostradas.map(consulta => (
                  <div key={consulta.id} className="p-4 rounded-xl hover:shadow-md bg-odara-offwhite">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-odara-accent"></span>
                        <p className="text-base font-semibold">
                          {consulta.data_consulta} às {consulta.horario}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setConsultaSelecionada(consulta); setModalAberto(true); }}
                          className="text-odara-secondary hover:text-odara-dropdown-accent p-2 rounded-full hover:bg-odara-dropdown"
                          title="Editar consulta"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => excluirConsulta(consulta.id)}
                          className="text-odara-alerta hover:text-red-700 p-2 rounded-full hover:bg-odara-alerta/50"
                          title="Excluir consulta"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <h6 className="text-xl font-bold mb-1">{consulta.residente?.nome}</h6>
                    <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                      <div><strong>Idade:</strong> {consulta.idade} anos</div>
                      <div><strong>Sexo:</strong> {consulta.sexo}</div>
                      <div><strong>Prontuário:</strong> {consulta.numero_prontuario}</div>
                      <div><strong>Médico:</strong> {consulta.medico}</div>
                    </div>
                    <div className="mb-2"><strong>Motivo:</strong> {consulta.motivo_consulta}</div>
                    {consulta.historico_clinico && <div className="mb-2"><strong>Histórico:</strong> {consulta.historico_clinico}</div>}
                    {consulta.tratamento_indicado && <div className="mb-2"><strong>Tratamento:</strong> {consulta.tratamento_indicado}</div>}
                    {consulta.exames_solicitados && <div className="mb-2"><strong>Exames:</strong> {consulta.exames_solicitados}</div>}
                    {consulta.receitas_medicas && <div className="mb-2"><strong>Receitas:</strong> {consulta.receitas_medicas}</div>}
                    {consulta.anexos_medicos && (
                      <div className="mb-2">
                        <strong>Anexos:</strong>
                        <div className="flex space-x-2 mt-1">
                          <div className="flex items-center text-odara-accent text-sm">
                            <FaFilePdf className="mr-1" />
                            <span>Documento médico</span>
                          </div>
                        </div>
                      </div>
                    )}
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