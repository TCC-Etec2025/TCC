import { useState, useEffect, useMemo } from 'react';
import {
  FaExclamationCircle,
  FaFilter,
  FaChevronDown,
  FaChevronRight,
  FaClock,
  FaUser,
  FaUtensils,
  FaRegCommentAlt
} from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../context/UserContext';
import { useObservacaoModal } from '../../../hooks/useObservacaoModal';

type Refeicao = "cafe-da-manha" | "lanche-manha" | "almoco" | "lanche-tarde" | "jantar" | "ceia";

type RegistroAlimentar = {
  id: number;
  id_residente: number;
  id_funcionario: number;
  data: string;
  horario: string;
  refeicao: Refeicao;
  alimento: string;
  status: string;
  observacao: string | null;
};

type Residente = {
  id: number;
  nome: string;
};

type RegistroComDetalhes = RegistroAlimentar & {
  residente: Residente;
};

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Alimentacao = () => {
  const [registros, setRegistros] = useState<RegistroComDetalhes[]>([]);
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

  const refeicaoMap: Record<Refeicao, string> = {
    "cafe-da-manha": "Café da Manhã",
    "lanche-manha": "Lanche da Manhã",
    "almoco": "Almoço",
    "lanche-tarde": "Lanche da Tarde",
    "jantar": "Jantar",
    "ceia": "Ceia"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: foodData, error: foodErr } = await supabase
          .from("registro_alimentar")
          .select("*");

        if (foodErr) throw foodErr;

        const { data: resData, error: resErr } = await supabase
          .from("residente")
          .select("id, nome");

        if (resErr) throw resErr;

        const allResidentes = resData || [];
        setResidentes(allResidentes);

        const combinedData: RegistroComDetalhes[] = (foodData || []).map((item: RegistroAlimentar) => {
          const res = allResidentes.find(r => r.id === item.id_residente);
          return res ? { ...item, residente: res } : null;
        }).filter((item): item is RegistroComDetalhes => item !== null);

        setRegistros(combinedData);

      } catch (err) {
        console.error("Erro ao buscar dados de alimentação:", err);
      }
    };

    fetchData();
  }, []);

  const gruposRenderizaveis = useMemo(() => {
    const { residente, status, startDate, endDate } = filtros;

    const filtradas = registros.filter(reg => {
      if (residente && reg.residente.id !== residente) return false;
      if (status && reg.status !== status) return false;

      if (startDate && endDate) {
        if (reg.data < startDate || reg.data > endDate) return false;
      } else if (startDate) {
        if (reg.data < startDate) return false;
      } else if (endDate) {
        if (reg.data > endDate) return false;
      }

      return true;
    });

    filtradas.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.horario.localeCompare(b.horario);
    });

    const grupos: Record<string, RegistroComDetalhes[]> = {};
    filtradas.forEach(item => {
      if (!grupos[item.data]) grupos[item.data] = [];
      grupos[item.data].push(item);
    });

    return Object.keys(grupos).sort().map(data => ({
      dataFormatada: data,
      itens: grupos[data],
      isExpandido: datesExpanded[data] !== false 
    }));

  }, [registros, filtros, datesExpanded]);

  // Atualizar Status e Observação
  const updateStatus = async (id: number, newStatus: string, observacao?: string) => {
    try {
      const now = new Date();
      
      const { error } = await supabase
        .from("registro_alimentar")
        .update({
          status: newStatus,
          id_funcionario: usuario?.id,
          observacao: observacao ?? null,
          atualizado_em: now.toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setRegistros(prev =>
        prev.map(r =>
          r.id === id ? { ...r, status: newStatus, observacao: observacao !== undefined ? observacao : r.observacao } : r
        )
      );

    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // --- LÓGICA CORRIGIDA (IGUAL MEDICAMENTOS) ---

  const handleStatusClick = async (regId: number, status: string) => {
    try {
      // Passamos string vazia "" para garantir que o botão seja "Salvar"
      const obs = await openModal("");
      
      if (obs) {
        // Se digitou algo e salvou
        updateStatus(regId, status, obs);
      } else if (status === "aceitou") {
        // Se cancelou ou deixou vazio, mas era "aceitou" (não obriga obs)
        updateStatus(regId, status);
      }
      // Se era parcial/recusou e não digitou, não faz nada (obrigatoriedade implícita pelo fluxo)
    } catch {
      // cancelado
    }
  };

  const handleEditObservation = async (reg: RegistroComDetalhes) => {
    try {
      // Aqui passamos a obs existente, então se tiver texto, botão vira "Editar"
      const novaObs = await openModal(reg.observacao || "");

      if (novaObs !== null && novaObs !== reg.observacao) {
        updateStatus(reg.id, reg.status, novaObs);
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

        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-center">Checklist de Alimentação</h1>

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
                  <option value="aceitou">Aceitou</option>
                  <option value="parcial">Parcial</option>
                  <option value="recusou">Recusou</option>
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
              <FaUtensils className="mx-auto text-gray-300 mb-2" size={32} />
              <p>Nenhum registro alimentar encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gruposRenderizaveis.map(grupo => (
                <div key={`group-${grupo.dataFormatada}`} className="bg-white md:bg-transparent rounded-lg md:rounded-none shadow md:shadow-none overflow-hidden">
                  
                  {/* Cabeçalho da Data */}
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
                      {/* Tabela Desktop */}
                      <div className="hidden md:block bg-white border-x border-gray-300">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                              <th className="px-4 py-2 text-center w-32">Horário</th>
                              <th className="px-4 py-2 text-left w-56">Residente</th>
                              <th className="px-4 py-2 text-left">Refeição / Alimento</th>
                              <th className="px-4 py-2 text-center w-56">Aceitação</th>
                            </tr>
                          </thead>
                        </table>
                      </div>

                      <div className="md:border-x md:border-b md:border-gray-300 md:bg-white md:rounded-b-lg">
                        {grupo.itens.map(reg => (
                          <div key={reg.id} className="contents">
                            
                            {/* Linha Desktop */}
                            <table className="hidden md:table min-w-full text-sm">
                              <tbody>
                                <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                                  <td className="px-4 py-3 text-center align-middle w-32">
                                    <span className={`font-bold ${reg.status === 'pendente' ? 'text-gray-800' : 'text-gray-600'}`}>
                                      {reg.horario.slice(0, 5)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 align-middle font-medium text-gray-800 w-56">
                                    {reg.residente.nome}
                                  </td>
                                  <td className="px-4 py-3 align-middle">
                                    <div className="font-semibold text-gray-900">{refeicaoMap[reg.refeicao]}</div>
                                    <div className="text-gray-500 text-xs italic">{reg.alimento}</div>
                                  </td>
                                  <td className="px-4 py-3 align-middle text-center w-56">
                                    <div className="flex justify-center gap-4 items-center">
                                      {/* RADIO: ACEITOU */}
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="radio"
                                          name={`status-${reg.id}-desk`}
                                          onChange={() => handleStatusClick(reg.id, "aceitou")}
                                          checked={reg.status === "aceitou"}
                                          className="cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700">Ok</span>
                                      </label>

                                      {/* RADIO: PARCIAL */}
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="radio"
                                          name={`status-${reg.id}-desk`}
                                          onChange={() => handleStatusClick(reg.id, "parcial")}
                                          checked={reg.status === "parcial"}
                                          className="cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700">Parcial</span>
                                      </label>

                                      {/* RADIO: RECUSOU */}
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="radio"
                                          name={`status-${reg.id}-desk`}
                                          onChange={() => handleStatusClick(reg.id, "recusou")}
                                          checked={reg.status === "recusou"}
                                          className="cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700">Não</span>
                                      </label>
                                      
                                      {/* BOTÃO DE OBSERVAÇÃO */}
                                      { reg.status !== 'pendente' && (
                                      <button
                                          type="button"
                                          onClick={() => handleEditObservation(reg)}
                                          className={`ml-1 ${reg.observacao ? "text-blue-600 hover:text-blue-800" : "text-gray-400 hover:text-gray-600"} transition-colors`}
                                          title="Ver observação"
                                      >
                                          <FaRegCommentAlt size={16} />
                                      </button>
                                      ) }
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            {/* Card Mobile */}
                            <div className="md:hidden bg-white p-4 border-t border-gray-200 first:border-t-0">
                              
                              <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                                  <FaClock className="text-gray-400" size={13}/>
                                  <span className="font-bold text-gray-800">{reg.horario.slice(0, 5)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-sm">
                                  <FaUser className="text-gray-400" size={13}/>
                                  <span>{reg.residente.nome}</span>
                                </div>
                              </div>

                              <div className="mb-4">
                                <div className="text-lg font-bold text-gray-900 leading-tight">
                                  {refeicaoMap[reg.refeicao]}
                                </div>
                                <div className="text-sm text-gray-500 mt-0.5">
                                  {reg.alimento}
                                </div>
                              </div>

                              <div className="flex justify-start gap-4 items-center">
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`status-${reg.id}-mob`}
                                    onChange={() => handleStatusClick(reg.id, "aceitou")}
                                    checked={reg.status === "aceitou"}
                                    className="cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700">Ok</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`status-${reg.id}-mob`}
                                    onChange={() => handleStatusClick(reg.id, "parcial")}
                                    checked={reg.status === "parcial"}
                                    className="cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700">Parcial</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`status-${reg.id}-mob`}
                                    onChange={() => handleStatusClick(reg.id, "recusou")}
                                    checked={reg.status === "recusou"}
                                    className="cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700">Não</span>
                                </label>

                                {/* BALÃOZINHO MOBILE */}
                                { reg.status !== 'pendente' && (
                                <button
                                    type="button"
                                    onClick={() => handleEditObservation(reg)}
                                    className={`ml-1 ${reg.observacao ? "text-blue-600 hover:text-blue-800" : "text-gray-400 hover:text-gray-600"} transition-colors`}
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

export default Alimentacao;