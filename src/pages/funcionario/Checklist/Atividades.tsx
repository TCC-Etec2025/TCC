import { useState, useEffect, useMemo } from 'react';
import { 
  FaCheck, FaTimes, FaFilter, FaMapMarkerAlt,
  FaInfoCircle, FaCheckDouble, FaBan,
  FaChevronDown, FaChevronRight, FaExclamationCircle 
} from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import { useConclusaoAtividadeModal } from '../../../hooks/useConclusaoAtividadeModal';
import type { ResidenteInput } from '../../../hooks/useConclusaoAtividadeModal';
import { useObservacaoModal } from '../../../hooks/useObservacaoModal';

type ResidenteBase = {
  id: number;
  nome: string;
};

type ResidenteNaAtividade = ResidenteBase & {
  statusIndividual: string;
};

type Atividade = {
  id: number;
  residentes: ResidenteNaAtividade[];
  nome: string;
  categoria: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  local: string;
  observacao: string;
  status: string;
};

type AtividadeResidente = {
  id_atividade: number;
  id_residente: number;
  status: string;
  observacao: string;
};

const getTodayString = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const Atividades = () => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [residentesList, setResidentesList] = useState<ResidenteBase[]>([]);
  
  const [datesExpanded, setDatesExpanded] = useState<Record<string, boolean>>({});
  const [dateError, setDateError] = useState<string | null>(null);

  const { openModalObservacoes, ObservacoesAtividade } = useConclusaoAtividadeModal();
  const { openModal, ObservacaoModal } = useObservacaoModal();

  const [filtros, setFiltros] = useState({
    residente: null as number | null,
    status: 'pendente' as string | null,
    categoria: null as string | null,
    startDate: getTodayString() as string | null,
    endDate: getTodayString() as string | null,
  });

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { data: atividadesData, error: atvError } = await supabase.from('atividade').select('*');
        if (atvError) throw atvError;

        const { data: joinsData, error: joinError } = await supabase.from('atividade_residente').select('*');
        if (joinError) throw joinError;

        const { data: resData, error: resError } = await supabase.from('residente').select('id, nome');
        if (resError) throw resError;

        const allResidentes = (resData || []) as ResidenteBase[];
        const joins = (joinsData || []) as AtividadeResidente[];
        const baseAtividades = (atividadesData || []) as Atividade[];

        const atividadesCompletas: Atividade[] = baseAtividades.map(atv => {
          const relacoes = joins.filter(j => j.id_atividade === atv.id);
          const residentesMapeados: ResidenteNaAtividade[] = relacoes.map(j => {
            const dadosResidente = allResidentes.find(r => r.id === j.id_residente);
            return dadosResidente ? {
              ...dadosResidente,
              statusIndividual: j.status || 'pendente'
            } : null;
          }).filter((r): r is ResidenteNaAtividade => !!r);

          return { ...atv, residentes: residentesMapeados };
        });

        setAtividades(atividadesCompletas);
        setResidentesList(allResidentes);
      } catch (err) {
        console.error('Erro ao buscar atividades:', err);
      }
    };

    fetchAtividades();
  }, []);

  const gruposAtividades = useMemo(() => {
    const { residente, status, categoria, startDate, endDate } = filtros;

    const filtradas = atividades.filter(atv => {
      if (residente && !(atv.residentes || []).some(r => r.id === residente)) return false;
      if (status && status !== '' && atv.status !== status) return false;
      if (categoria && atv.categoria !== categoria) return false;
      
      if (startDate && endDate) {
        if (atv.data < startDate || atv.data > endDate) return false;
      } else if (startDate) {
        if (atv.data < startDate) return false;
      } else if (endDate) {
        if (atv.data > endDate) return false;
      }
      return true;
    });

    filtradas.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.horario_inicio.localeCompare(b.horario_inicio);
    });

    const grupos: Record<string, Atividade[]> = {};
    filtradas.forEach(atv => {
      const dataKey = atv.data || 'Sem Data';
      if (!grupos[dataKey]) grupos[dataKey] = [];
      grupos[dataKey].push(atv);
    });

    const listaGrupos = Object.keys(grupos).sort().map(dataKey => ({
      data: dataKey,
      dataFormatada: dataKey.split('-').reverse().join('/'),
      itens: grupos[dataKey],
      isExpandido: datesExpanded[dataKey] !== false 
    }));

    return listaGrupos;
  }, [atividades, filtros, datesExpanded]);

  const totalAtividades = gruposAtividades.reduce((acc, grupo) => acc + grupo.itens.length, 0);
  
  const toggleDate = (dataKey: string) => {
    setDatesExpanded(prev => ({
      ...prev,
      [dataKey]: !(prev[dataKey] !== false)
    }));
  };
  
  const toggleStatusResidente = async (idAtividade: number, idResidente: number, statusAtual: string) => {
    const novoStatus = statusAtual === 'participou' ? 'nao-participou' : 'participou';
    try {
      const obs = await openModal();
      if (obs && novoStatus === 'nao-participou') return;
      const { error } = await supabase
        .from('atividade_residente')
        .update({ status: novoStatus, observacao: obs || '' })
        .match({ id_atividade: idAtividade, id_residente: idResidente });

      if (error) throw error;

      setAtividades(prev => prev.map(atv => {
        if (atv.id !== idAtividade) return atv;
        const novosResidentes = atv.residentes.map(r =>
          r.id === idResidente ? { ...r, statusIndividual: novoStatus } : r
        );
        return { ...atv, residentes: novosResidentes };
      }));
    } catch {
      // cancelado
    }
  };

const handleConcluirAtividade = async (atividade: Atividade) => {
    const residentesParaModal: ResidenteInput[] = atividade.residentes.map(r => ({
      id: r.id,
      nome: r.nome,
      status: r.statusIndividual,
      observacao: ''
    }));
    residentesParaModal.sort((a, b) => a.nome.localeCompare(b.nome));

    const resultado = await openModalObservacoes(atividade.observacao, residentesParaModal);

    if (!resultado) return;

    try {
      const { error: errorAtv } = await supabase
        .from('atividade')
        .update({ 
            status: 'concluido',
            observacao: resultado.observacaoGeral 
        })
        .eq('id', atividade.id);

      if (errorAtv) throw errorAtv;

      const updates = resultado.residentesAtualizados.map(async (res) => {
        return supabase
          .from('atividade_residente')
          .update({ 
            status: res.status,
            observacao: res.observacao 
          })
          .match({ id_atividade: atividade.id, id_residente: res.id });
      });

      await Promise.all(updates);

      setAtividades(prev => prev.map(a => {
        if (a.id !== atividade.id) return a;
        
        return {
          ...a,
          status: 'concluido',
          observacao: resultado.observacaoGeral,
          residentes: a.residentes.map(r => {
             const atualizado = resultado.residentesAtualizados.find(x => x.id === r.id);
             return atualizado ? { ...r, statusIndividual: atualizado.status } : r;
          })
        };
      }));

    } catch {
      // cancelado
    }
  };

  const handleCancelarAtividade = async (atividade: Atividade) => {
      const residentesIds = atividades.find(a => a.id === atividade.id)?.residentes.map(r => r.id) || [];
      try {
        const obs = await openModal();
        if (obs) {
          const { error } = await supabase
            .from('atividade')
            .update({ status: 'cancelado' })
            .eq('id', atividade.id);
  
          if (error) throw error;
  
        const updates = residentesIds.map(async (idResidente) => {
          return supabase
            .from('atividade_residente')
            .update({ 
              status: 'cancelado',
              observacao: obs 
            })
            .match({ id_atividade: atividade.id, id_residente: idResidente });
        });
  
        await Promise.all(updates);
  
        setAtividades(prev => prev.map(a => {
          if (a.id !== atividade.id) return a;
          return { ...a, status: 'cancelado' };
        }));
      }
    } catch {
        // cancelado
    }
    };

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 flex flex-col items-center px-4 py-6 lg:px-10 lg:py-10">

        <div className="w-full max-w-6xl mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-odara-dark">
              Checklist de Atividades
            </h1>
          </div>
        </div>

        <div className="w-full max-w-6xl mb-4">
          <div className="mt-1 text-md text-gray-700">
            {filtros.startDate && filtros.endDate
              ? filtros.startDate === filtros.endDate
                ? `Atividades de ${filtros.startDate.split('-').reverse().join('/')}`
                : `Atividades de ${filtros.startDate.split('-').reverse().join('/')} até ${filtros.endDate.split('-').reverse().join('/')}`
              : "Todas as atividades"}
          </div>
        </div>

        {/* --- FILTROS --- */}
        <details className="mb-6 w-full max-w-6xl">
          <summary className="inline-flex items-center px-4 py-2 bg-odara-dark text-white rounded cursor-pointer text-sm font-medium select-none w-full lg:w-auto justify-center hover:bg-opacity-90 transition-opacity">
            <FaFilter className="mr-2" /> Filtrar Lista
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
                categoria: (form.get("categoria") as string) || null,
                startDate: startStr || null,
                endDate: endStr || null,
              });
              setDatesExpanded({}); 
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Residente</label>
                <select name="residente" className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-odara-primary">
                  <option value="">Todos</option>
                  {residentesList.map(r => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Status</label>
                <select name="status" className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-odara-primary" defaultValue="pendente">
                  <option value="">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Categoria</label>
                <select name="categoria" className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-odara-primary">
                    <option value="">Todas</option>
                    <option value="fisica">Física</option>
                    <option value="cognitiva">Cognitiva</option>
                    <option value="social">Social</option>
                    <option value="lazer">Lazer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Intervalo</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="startDate"
                    className={`w-1/2 border rounded px-1 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-odara-primary ${dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    defaultValue={getTodayString()}
                    onChange={() => setDateError(null)}
                  />
                  <input
                    type="date"
                    name="endDate"
                    className={`w-1/2 border rounded px-1 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-odara-primary ${dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
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

            <div className="mt-4 flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-odara-dark text-white rounded text-sm font-bold hover:opacity-90 transition-opacity">Aplicar</button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
                onClick={() => {
                  setFiltros({ residente: null, status: null, categoria: null, startDate: null, endDate: null });
                  setDateError(null);
                  (document.querySelector("form") as HTMLFormElement)?.reset();
                }}
              >
                Limpar
              </button>
            </div>
          </form>
        </details>

        <div className="w-full max-w-6xl bg-white rounded-lg shadow-md p-4 lg:p-6 border-l-4 border-odara-primary">
          
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Lista Diária</h2>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                Total: {totalAtividades}
            </span>
          </div>

          <div className="space-y-6">
            {gruposAtividades.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Nenhuma atividade encontrada para os filtros selecionados.</p>
            ) : (
                gruposAtividades.map(grupo => (
                    <div key={grupo.data} className="border rounded-lg overflow-hidden border-gray-200">
                        
                        <div 
                            onClick={() => toggleDate(grupo.data)}
                            className="bg-gray-50 hover:bg-gray-100 cursor-pointer p-4 flex items-center justify-between border-b border-gray-200 transition-colors select-none"
                        >
                            <div className="flex items-center gap-3">
                                {grupo.isExpandido ? <FaChevronDown className="text-gray-500" /> : <FaChevronRight className="text-gray-500" />}
                                <h3 className="font-bold text-lg text-gray-800">
                                    {grupo.dataFormatada}
                                </h3>
                                <span className="text-xs bg-white border border-gray-300 px-2 py-0.5 rounded-full text-gray-600">
                                    {grupo.itens.length} {grupo.itens.length === 1 ? 'atividade' : 'atividades'}
                                </span>
                            </div>
                        </div>

                        {grupo.isExpandido && (
                            <div className="p-4 space-y-6 bg-white">
                                {grupo.itens.map(atv => {
                                    const isCancelado = atv.status === 'cancelado';
                                    const isConcluido = atv.status === 'concluido';

                                    return (
                                        <div key={atv.id} className={`w-full bg-white relative group ${isCancelado ? 'opacity-60 grayscale-[30%]' : ''}`}>
                                            
                                            <div className="flex flex-wrap items-start mb-4 gap-3 sm:gap-4">
                                                <div className="flex flex-col items-start min-w-[70px]">
                                                    <span className="text-2xl font-bold text-gray-900 leading-none">
                                                        {atv.horario_inicio.slice(0, 5)}
                                                    </span>
                                                    {atv.horario_fim && (
                                                        <span className="text-xs text-gray-400 mt-0.5">até {atv.horario_fim.slice(0, 5)}</span>
                                                    )}
                                                </div>

                                                <span className="text-gray-300 text-2xl hidden sm:inline font-light">•</span>

                                                <div className="flex-1 pt-1">
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <h3 className="text-xl font-bold text-odara-dark">
                                                            {atv.nome}
                                                        </h3>
                                                        {atv.categoria && (
                                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                                                                {atv.categoria}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="mt-2">
                                                        {isCancelado && <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 border border-red-200 uppercase">[CANCELADA]</span>}
                                                        {isConcluido && <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-600 border border-green-200 uppercase">[CONCLUÍDA]</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3 gap-x-4 mb-6 ${isCancelado ? 'pointer-events-none' : ''}`}>
                                                {atv.residentes.map(res => {
                                                    const participou = res.statusIndividual === 'participou';
                                                    return (
                                                        <button
                                                            key={res.id}
                                                            onClick={() => toggleStatusResidente(atv.id, res.id, res.statusIndividual)}
                                                            className="flex items-center group/res focus:outline-none text-left"
                                                            title={participou ? "Presente" : "Marcar presença"}
                                                            disabled={isCancelado}
                                                        >
                                                            <div className={`
                                                                flex items-center justify-center w-5 h-5 mr-2 rounded text-[10px] transition-colors duration-200 border
                                                                ${participou 
                                                                    ? 'bg-green-100 border-green-200 text-green-600' 
                                                                    : 'bg-white border-gray-300 text-gray-300 group-hover/res:border-red-300 group-hover/res:text-red-300'}
                                                            `}>
                                                                {participou ? <FaCheck /> : <FaTimes />}
                                                            </div>
                                                            <span className={`text-sm ${participou ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                                {res.nome}
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                                {atv.residentes.length === 0 && (
                                                    <span className="text-gray-400 text-sm italic col-span-2">Nenhum residente vinculado.</span>
                                                )}
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-100">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <FaMapMarkerAlt className="text-odara-accent opacity-70" size={12} />
                                                            <span className="font-semibold text-gray-700">Local:</span> 
                                                            <span>{atv.local || 'Não informado'}</span>
                                                        </div>
                                                        {atv.observacao && (
                                                            <div className="flex items-start gap-2">
                                                                <FaInfoCircle className="text-odara-accent opacity-70 mt-1" size={12} />
                                                                <div>
                                                                    <span className="font-semibold text-gray-700">Obs:</span> 
                                                                    <span className="ml-1 italic">{atv.observacao}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="md:border-l md:pl-4 border-gray-200 flex flex-col justify-center min-w-[200px]">
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => handleConcluirAtividade(atv)}
                                                                    className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-2 rounded transition-colors text-xs font-bold uppercase"
                                                                >
                                                                    <FaCheckDouble /> Concluir
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleCancelarAtividade(atv)}
                                                                    className="flex-1 flex items-center justify-center gap-1 bg-white text-red-400 border border-red-100 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded transition-colors text-xs font-medium uppercase"
                                                                >
                                                                    <FaBan /> Cancelar
                                                                </button>
                                                            </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full h-px bg-gray-200 mt-6 mb-2 last:hidden"></div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))
            )}
          </div>
        </div>
        {ObservacoesAtividade}
        {ObservacaoModal}
      </div>
    </div>
  );
};

export default Atividades;