import { useState, useEffect, useMemo } from 'react';
import {
  FaExclamationCircle,
  FaFilter,
  FaChevronDown,
  FaChevronRight,
  FaRegCommentAlt,
  FaClock,
  FaUser,
  FaPills
} from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../context/UserContext';
import { useObservacaoModal } from '../../../hooks/useObservacaoModal';

type Administracao = {
  id: number;
  id_medicamento: number;
  data_prevista: string;
  horario_previsto: string;
  data_administracao: string | null;
  horario_administracao: string | null;
  status: string;
  id_funcionario: number;
  observacao: string | null;
};

type Medicamento = {
  id: number;
  nome: string;
  dosagem: string;
  id_residente: number;
};

type Residente = {
  id: number;
  nome: string;
};

type AdministracaoComDetalhes = Administracao & {
  medicamento: Medicamento;
  residente: Residente;
};

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Medicamentos = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [administracoes, setAdministracoes] = useState<Administracao[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  
  const [datesExpanded, setDatesExpanded] = useState<Record<string, boolean>>({});
  const [dateError, setDateError] = useState<string | null>(null);

  const { usuario } = useUser();
  const { openModal, ObservacaoModal } = useObservacaoModal();

  const [filtros, setFiltros] = useState({
    residente: null as number | null,
    status: 'pendente' as string | null,
    startDate: getTodayString() as string | null,
    endDate: getTodayString() as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: adminData, error: adminErr } = await supabase
          .from("administracao_medicamento")
          .select("*");

        if (adminErr) throw adminErr;
        setAdministracoes(adminData || []);

        const medicamentoIds = [...new Set(adminData.map(a => a.id_medicamento))];

        const { data: medsData, error: medsErr } = await supabase
          .from("medicamento")
          .select("*")
          .in("id", medicamentoIds);

        if (medsErr) throw medsErr;

        setMedicamentos(medsData || []);

        const { data: resData, error: resErr } = await supabase
          .from("residente")
          .select("id, nome");

        if (resErr) throw resErr;
        setResidentes(resData || []);

      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };

    fetchData();
  }, []);

  const listaCompleta = useMemo(() => {
    if (!administracoes.length || !medicamentos.length || !residentes.length) return [];

    return administracoes.map(admin => {
      const medicamento = medicamentos.find(m => m.id === admin.id_medicamento);
      if (!medicamento) return null;
      
      const residente = residentes.find(r => r.id === medicamento.id_residente);
      if (!residente) return null;

      return { ...admin, medicamento, residente };
    }).filter((item): item is AdministracaoComDetalhes => item !== null);
  }, [administracoes, medicamentos, residentes]);

  const gruposRenderizaveis = useMemo(() => {
    const { residente, status, startDate, endDate } = filtros;

    const filtradas = listaCompleta.filter(admin => {
      if (residente && admin.residente.id !== residente) return false;
      if (status && admin.status !== status) return false;

      if (startDate && endDate) {
        if (admin.data_prevista < startDate || admin.data_prevista > endDate) return false;
      } else if (startDate) {
        if (admin.data_prevista < startDate) return false;
      } else if (endDate) {
        if (admin.data_prevista > endDate) return false;
      }

      return true;
    });

    filtradas.sort((a, b) => {
      if (a.data_prevista !== b.data_prevista) return a.data_prevista.localeCompare(b.data_prevista);
      return a.horario_previsto.localeCompare(b.horario_previsto);
    });

    const grupos: Record<string, AdministracaoComDetalhes[]> = {};
    filtradas.forEach(item => {
      if (!grupos[item.data_prevista]) grupos[item.data_prevista] = [];
      grupos[item.data_prevista].push(item);
    });

    return Object.keys(grupos).sort().map(data => ({
      dataFormatada: data,
      itens: grupos[data],
      isExpandido: datesExpanded[data] !== false 
    }));

  }, [listaCompleta, filtros, datesExpanded]);

  const updateStatus = async (adminId: number, newStatus: string, observacao?: string) => {
    try {
      const now = new Date();
      const dataHoje = getTodayString();
      const horarioAgora = now.toTimeString().substring(0, 5);

      const { error } = await supabase
        .from("administracao_medicamento")
        .update({
          status: newStatus,
          id_funcionario: usuario?.id,
          observacao: observacao ?? null,
          data_administracao: dataHoje,
          horario_administracao: horarioAgora
        })
        .eq("id", adminId);

      if (error) throw error;

      setAdministracoes(prev =>
        prev.map(a =>
          a.id === adminId
            ? { ...a, status: newStatus, observacao: observacao ?? null, data_administracao: dataHoje, horario_administracao: horarioAgora }
            : a
        )
      );

    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const handleStatusClick = async (adminId: number, status: string) => {
    try {
      const obs = await openModal("");
      if (obs) updateStatus(adminId, status, obs);
      else if (status === "administrado") updateStatus(adminId, status);
    } catch {
      // cancelado
    }
  };

  const handleEditObservation = async (admin: AdministracaoComDetalhes) => {
    try {
      const novaObs = await openModal(admin.observacao || "");

      if (novaObs !== null && novaObs !== admin.observacao) {
        updateStatus(admin.id, admin.status, novaObs);
      }
    } catch {
      // cancelado
    }
  };

  const toggleDate = (date: string) => {
    setDatesExpanded(prev => {
        const isCurrentlyExpanded = prev[date] !== false; 
        return { ...prev, [date]: !isCurrentlyExpanded };
    });
  };

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 flex flex-col items-center px-2 py-4 lg:px-10 lg:py-10">

        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-center">Checklist de Medicamentos</h1>

        <div className="w-full max-w-4xl mb-4 text-center">
          <div className="mt-1 text-sm lg:text-md text-gray-700">
            {filtros.startDate && filtros.endDate
              ? filtros.startDate === filtros.endDate
                ? `Data: ${filtros.startDate.split('-').reverse().join('/')}`
                : `${filtros.startDate.split('-').reverse().join('/')} até ${filtros.endDate.split('-').reverse().join('/')}`
              : "Todas as datas"}
          </div>
        </div>


        {/* FILTROS */}
        <details className="mb-4 w-full max-w-4xl">
          <summary className="inline-flex items-center px-4 py-2 bg-odara-dark text-white rounded cursor-pointer">
            <FaFilter className="mr-2" /> Filtrar
          </summary>

          <form
            className="mt-3 bg-white p-4 rounded shadow-sm border"
            onSubmit={e => {
              e.preventDefault();
              const form = new FormData(e.target as HTMLFormElement);

              const startStr = form.get("startDate") as string;
              const endStr = form.get("endDate") as string;

              if (startStr && endStr && startStr > endStr) {
                setDateError("A data final não pode ser antes que a inicial.");
                return;
              }

              setDateError(null);
              setFiltros({
                residente: form.get("residente") ? Number(form.get("residente")) : null,
                status: (form.get("status") as string) || null,
                startDate: startStr || null,
                endDate: endStr || null,
              });
              
              setDatesExpanded({}); 
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
                <select name="residente" className="w-full border rounded px-2 py-1">
                  <option value="">Todos</option>
                  {residentes.map(r => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" className="w-full border rounded px-2 py-1" defaultValue="pendente">
                  <option value="">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="administrado">Administrado</option>
                  <option value="parcial">Parcial</option>
                  <option value="nao_administrado">Não Administrado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo de datas</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="startDate"
                    className={`w-1/2 border rounded px-2 py-1 ${dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    defaultValue={getTodayString()}
                    onChange={() => setDateError(null)}
                  />
                  <input
                    type="date"
                    name="endDate"
                    className={`w-1/2 border rounded px-2 py-1 ${dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    defaultValue={getTodayString()}
                    onChange={() => setDateError(null)}
                  />
                </div>
                {dateError && (
                  <div className="flex items-center mt-1 text-red-600 text-xs">
                    <FaExclamationCircle className="mr-1" />
                    {dateError}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-odara-dark text-white rounded">Aplicar</button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setFiltros({ residente: null, status: null, startDate: null, endDate: null });
                  setDateError(null);
                  (document.querySelector("form") as HTMLFormElement)?.reset();
                }}
              >
                Limpar
              </button>
            </div>
          </form>
        </details>

        <div className="w-full max-w-5xl">
          {gruposRenderizaveis.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              <FaPills className="mx-auto text-gray-300 mb-2" size={32} />
              <p>Nenhum medicamento encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gruposRenderizaveis.map(grupo => (
                <div key={`group-${grupo.dataFormatada}`} className="bg-white md:bg-transparent rounded-lg md:rounded-none shadow md:shadow-none overflow-hidden">
                  
                  <div 
                    className="bg-gray-100 p-3 md:bg-gray-200 md:rounded-t-lg border-b md:border border-gray-300 flex items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleDate(grupo.dataFormatada)}
                  >
                    <div className="flex items-center gap-2 font-bold text-gray-700">
                      {grupo.isExpandido ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
                      <span>{grupo.dataFormatada.split('-').reverse().join('/')}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                      {grupo.itens.length}
                    </span>
                  </div>

                  {grupo.isExpandido && (
                    <>
                      <div className="hidden md:block bg-white border-x border-gray-300">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                              <th className="px-4 py-2 text-center w-32">Horário</th>
                              <th className="px-4 py-2 text-left w-56">Residente</th>
                              <th className="px-4 py-2 text-left">Medicamento</th>
                              <th className="px-4 py-2 text-center w-56">Ação</th>
                            </tr>
                          </thead>
                        </table>
                      </div>

                      <div className="md:border-x md:border-b md:border-gray-300 md:bg-white md:rounded-b-lg">
                        {grupo.itens.map(admin => (
                          <div key={admin.id} className="contents">
                            
                            <table className="hidden md:table min-w-full text-sm">
                              <tbody>
                                <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                                  <td className="px-4 py-3 text-center align-middle w-32">
                                    {admin.status === "pendente" ? (
                                      <span className="font-bold text-gray-800">{admin.horario_previsto.slice(0, 5)}</span>
                                    ) : (
                                      <div className="flex flex-col text-sm">
                                        <span className="font-semibold text-gray-900">Prev: {admin.horario_previsto.slice(0, 5)}</span>
                                        <span className="text-gray-500 text-xs">
                                          Feito: {admin.horario_administracao?.slice(0, 5) || "--:--"}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 align-middle font-medium text-gray-800 w-56">
                                    {admin.residente.nome}
                                  </td>
                                  <td className="px-4 py-3 align-middle">
                                    <div className="font-semibold text-gray-900">{admin.medicamento.nome}</div>
                                    <div className="text-gray-500 text-xs">{admin.medicamento.dosagem}</div>
                                  </td>
                                  <td className="px-4 py-3 align-middle text-center w-56">
                                    <div className="flex justify-center gap-4 items-center">
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="radio"
                                          name={`status-${admin.id}-desk`}
                                          onChange={() => handleStatusClick(admin.id, "administrado")}
                                          checked={admin.status === "administrado"}
                                          className="cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700">Ok</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="radio"
                                          name={`status-${admin.id}-desk`}
                                          onChange={() => handleStatusClick(admin.id, "parcial")}
                                          checked={admin.status === "parcial"}
                                          className="cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700">Parcial</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="radio"
                                          name={`status-${admin.id}-desk`}
                                          onChange={() => handleStatusClick(admin.id, "nao_administrado")}
                                          checked={admin.status === "nao_administrado"}
                                          className="cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700">Não</span>
                                      </label>
                                      {admin.status !== "pendente" && (
                                        <button
                                          type="button"
                                          onClick={() => handleEditObservation(admin)}
                                          className={`ml-1 ${admin.observacao ? "text-blue-600 hover:text-blue-800" : "text-gray-400 hover:text-gray-600"} transition-colors`}
                                          title="Ver observação"
                                        >
                                          <FaRegCommentAlt size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <div className="md:hidden bg-white p-4 border-t border-gray-200 first:border-t-0">
                              
                              <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                                  <FaClock className="text-gray-400" size={13}/>
                                  {admin.status === "pendente" ? (
                                      <span className="font-bold text-gray-800">{admin.horario_previsto.slice(0, 5)}</span>
                                    ) : (
                                      <div className="flex flex-col text-sm">
                                        <span className="font-semibold text-gray-900">Prev: {admin.horario_previsto.slice(0, 5)}</span>
                                        <span className="text-gray-500 text-xs">
                                          Feito: {admin.data_administracao !== admin.data_prevista ? `${admin.data_administracao?.slice(0, 10).split("-").reverse().join("/")} às ${admin.horario_administracao?.slice(0, 5)}` : `${admin.horario_administracao?.slice(0, 5)}`}
                                        </span>
                                      </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-sm">
                                  <FaUser className="text-gray-400" size={13}/>
                                  <span>{admin.residente.nome}</span>
                                </div>
                              </div>

                              <div className="mb-4">
                                <div className="text-lg font-bold text-gray-900 leading-tight">
                                  {admin.medicamento.nome}
                                </div>
                                <div className="text-sm text-gray-500 mt-0.5">
                                  {admin.medicamento.dosagem}
                                </div>
                              </div>

                              <div className="flex justify-start gap-4 items-center">
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`status-${admin.id}-mob`}
                                    onChange={() => handleStatusClick(admin.id, "administrado")}
                                    checked={admin.status === "administrado"}
                                    className="cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700">Ok</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`status-${admin.id}-mob`}
                                    onChange={() => handleStatusClick(admin.id, "parcial")}
                                    checked={admin.status === "parcial"}
                                    className="cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700">Parcial</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`status-${admin.id}-mob`}
                                    onChange={() => handleStatusClick(admin.id, "nao_administrado")}
                                    checked={admin.status === "nao_administrado"}
                                    className="cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700">Não</span>
                                </label>
                                {admin.status !== "pendente" && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditObservation(admin)}
                                    className={`ml-1 ${admin.observacao ? "text-blue-600 hover:text-blue-800" : "text-gray-400 hover:text-gray-600"} transition-colors`}
                                    title="Ver observação"
                                  >
                                    <FaRegCommentAlt size={16} />
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {ObservacaoModal}
      </div>
    </div>
  );
};

export default Medicamentos;