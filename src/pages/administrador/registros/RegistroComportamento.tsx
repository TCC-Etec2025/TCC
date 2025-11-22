// src/pages/RegistroComportamento.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaInfoCircle,
  FaCheck,
} from "react-icons/fa";
import { supabase } from "../../../lib/supabaseClient";
import ModalComportamento from "./ModalComportamento";

/* Constantes */
const CATEGORIAS = {
  POSITIVO: "positivo",
  NEGATIVO: "negativo",
  NEUTRO: "neutro",
} as const;

const ROTULOS_CATEGORIAS: Record<string, string> = {
  [CATEGORIAS.POSITIVO]: "Positivo",
  [CATEGORIAS.NEGATIVO]: "Negativo",
  [CATEGORIAS.NEUTRO]: "Neutro",
};

const CORES_CATEGORIAS: Record<string, string> = {
  [CATEGORIAS.POSITIVO]: "bg-odara-primary/60 text-odara-dark border-l-4 border-odara-primary",
  [CATEGORIAS.NEGATIVO]: "bg-odara-dropdown-accent/80 text-odara-dark border-l-4 border-odara-dropdown-accent",
  [CATEGORIAS.NEUTRO]: "bg-odara-secondary/60 text-odara-dark border-l-4 border-odara-secondary",
};

const CORES_PONTOS: Record<string, string> = {
  [CATEGORIAS.POSITIVO]: "bg-odara-primary",
  [CATEGORIAS.NEGATIVO]: "bg-odara-dropdown-accent",
  [CATEGORIAS.NEUTRO]: "bg-odara-secondary",
};

type Residente = {
  id: number;
  nome: string;
  foto?: string | null;
};

type Comportamento = {
  id: number;
  titulo: string;
  descricao?: string | null;
  data: Date;
  horario: string;
  id_residente: number | null;
  residente: Residente;
  id_funcionario: number | null;
  funcionario: Residente;
  categoria: string;
  status: boolean;
  criado_em?: string | null;
};

const RegistroComportamento: React.FC = () => {
  const [comportamentos, setComportamentos] = useState<Comportamento[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [comportamentoSelecionado, setComportamentoSelecionado] = useState<Comportamento | null>(null);

  const [filtros, setFiltros] = useState<{
    categoria: string | null;
    residenteId: number | null;
    status: string | null;
    startDate: Date | null;
    endDate: Date | null;
  }>({
    categoria: null,
    residenteId: null,
    status: null,
    startDate: null,
    endDate: null,
  });

  const formFiltrosRef = useRef<HTMLFormElement>(null);

  /* Carregar dados iniciais */
  useEffect(() => {
    fetchComportamentos();
    fetchResidentes();
  }, []);

  const fetchComportamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comportamento")
        .select(`
          *,
          residente:residente(id, nome, foto),
          funcionario:funcionario(id, nome)
        `)
        .order("data", { ascending: false });

      if (error) throw error;

      setComportamentos(data?.map(c => ({
        ...c,
        data: new Date(c.data),
      })) as Comportamento[]);
    } catch (err) {
      console.error("Erro ao buscar comportamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResidentes = async () => {
    try {
      const { data, error } = await supabase
        .from("residente")
        .select("id, nome, foto")
        .order("nome");
      if (error) throw error;
      setResidentes((data || []) as Residente[]);
    } catch (err) {
      console.error("Erro ao buscar residentes:", err);
    }
  };

  const alternarStatus = async (id: number) => {
    const alvo = comportamentos.find(c => c.id === id);
    if (!alvo) return;
    const novo = !alvo.status;
    try {
      const { error } = await supabase
        .from("comportamento")
        .update({ status: novo })
        .eq("id", id);
      if (error) throw error;
      setComportamentos(prev =>
        prev.map(c => (c.id === id ? { ...c, status: novo } : c))
      );
      if (comportamentoSelecionado?.id === id) {
        setComportamentoSelecionado({ ...alvo, status: novo });
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const excluirComportamento = async (id: number) => {
    if (!window.confirm("Excluir este comportamento?")) return;
    try {
      const { error } = await supabase.from("comportamento").delete().eq("id", id);
      if (error) throw error;
      setComportamentos(prev => prev.filter(c => c.id !== id));
      if (comportamentoSelecionado?.id === id) setComportamentoSelecionado(null);
    } catch (err) {
      console.error("Erro ao excluir comportamento:", err);
    }
  };

  /* Contadores */
  const contadorConcluidos = comportamentos.filter(c => c.status).length;
  const contadorPendentes = comportamentos.length - contadorConcluidos;

  /* Filtragem */
  const comportamentosFiltrados = comportamentos
    .filter(c => {
      if (filtros.categoria && c.categoria !== filtros.categoria) return false;
      if (filtros.residenteId && c.residente?.id !== filtros.residenteId) return false;
      if (filtros.status) {
        const st = c.status ? "resolvido" : "pendente";
        if (st !== filtros.status) return false;
      }
      if (filtros.startDate || filtros.endDate) {
        const d = new Date(c.data.getFullYear(), c.data.getMonth(), c.data.getDate());
        if (filtros.startDate && d < filtros.startDate) return false;
        if (filtros.endDate && d > filtros.endDate) return false;
      }
      return true;
    })
    .sort((a, b) => b.data.getTime() - a.data.getTime());

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <ModalComportamento
        comportamento={comportamentoSelecionado}
        isOpen={modalAberto}
        onClose={() => { setModalAberto(false); }}
      />
      <div className="flex-1 p-6 lg:p-10">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Comportamento</h1>
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
                  <h3 className="font-bold mb-2">Registro de Comportamento</h3>
                  <p>Documenta comportamentos dos residentes (data, horário, categoria, responsável).</p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800" />
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-odara-dark">
            <strong>{contadorPendentes}</strong> pendentes / <strong>{contadorConcluidos}</strong> resolvidos
          </div>
        </div>

        {/* Novo + Filtros (details) */}
        <details className="group mb-8 w-full">
          <summary
            className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer"
          >
            <button
              type="button"
              onClick={() => { setComportamentoSelecionado(null); setModalAberto(true); }}
              className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
            >
              <FaPlus className="mr-2" /> Novo Registro
            </button>
            <div className="sm:w-40">
              <div className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen transition text-sm font-medium select-none">
                <FaFilter className="mr-2" /> Filtros
              </div>
            </div>
          </summary>

          {/* Painel de filtros */}
          <form
            ref={formFiltrosRef}
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const categoriaRaw = fd.get("categoria") as string;
              const residenteRaw = fd.get("residente") as string;
              const statusRaw = fd.get("status") as string;
              const startRaw = fd.get("startDate") as string;
              const endRaw = fd.get("endDate") as string;

              setFiltros({
                categoria: categoriaRaw && categoriaRaw !== "todas" ? categoriaRaw : null,
                residenteId: residenteRaw ? Number(residenteRaw) : null,
                status: statusRaw && statusRaw !== "todos" ? statusRaw : null,
                startDate: startRaw ? new Date(startRaw + "T00:00:00") : null,
                endDate: endRaw ? new Date(endRaw + "T00:00:00") : null,
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
                  {Object.entries(ROTULOS_CATEGORIAS).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>{rotulo}</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue="todos"
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="resolvido">Resolvidos</option>
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

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={() => setFiltros({ categoria: null, residenteId: null, status: null, startDate: null, endDate: null })}
                className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
              >
                Limpar
              </button>
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
            <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
                Lista de Comportamentos
                <span className="text-sm font-normal text-odara-name/60 ml-2">
                  ({comportamentosFiltrados.length} registros)
                </span>
              </h2>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {comportamentosFiltrados.length === 0 ? (
                  <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                    <p className="text-odara-dark/60">Nenhum comportamento encontrado</p>
                  </div>
                ) : (
                  comportamentosFiltrados.map(comportamento => (
                    <div
                      key={comportamento.id}
                      className={`p-4 rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer ${CORES_CATEGORIAS[comportamento.categoria]} ${comportamentoSelecionado?.id === comportamento.id ? "ring-2 ring-odara-primary" : ""
                        }`}
                      onClick={() => setComportamentoSelecionado(comportamento)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${CORES_PONTOS[comportamento.categoria]}`} />
                          <p className="text-base font-semibold">
                            {comportamento.data.getDate().toString().padStart(2, "0")}/
                            {(comportamento.data.getMonth() + 1).toString().padStart(2, "0")}/
                            {comportamento.data.getFullYear()}
                            {comportamento.horario && ` - ${comportamento.horario}`}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={comportamento.status}
                            onChange={e => {
                              e.stopPropagation();
                              alternarStatus(comportamento.id);
                            }}
                            className="rounded border-odara-primary text-odara-accent focus:ring-odara-accent"
                          />
                          <span
                            className={
                              comportamento.status
                                ? "text-green-600 font-semibold"
                                : "text-odara-dark"
                            }
                          >
                            {comportamento.status ? "Resolvido" : "Pendente"}
                          </span>
                        </label>
                      </div>

                      <h6 className="text-xl font-bold mb-1 flex items-center">
                        {comportamento.status && (
                          <span className="text-green-500 mr-2">
                            <FaCheck className="h-4 w-4" />
                          </span>
                        )}
                        {comportamento.titulo}
                      </h6>

                      <p className="text-base mb-2">{comportamento.descricao}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">
                            {ROTULOS_CATEGORIAS[comportamento.categoria]}
                          </span>
                          {comportamento.residente && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-odara-name">{comportamento.residente.nome}</span>
                            </>
                          )}
                          {comportamento.funcionario && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-odara-name">
                                Registrado por: {comportamento.funcionario.nome}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => { setComportamentoSelecionado(comportamento); setModalAberto(true); }}
                            className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
                            title="Editar comportamento"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              excluirComportamento(comportamento.id);
                            }}
                            className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
                            title="Excluir comportamento"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Painel de detalhes */}
            <div className="bg-odara-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
              <div className="flex flex-col items-center justify-center text-center">
                {comportamentoSelecionado ? (
                  <>
                    <h2 className="text-2xl font-bold text-odara-dark mb-4">
                      Detalhes do Comportamento
                    </h2>

                    <div className="w-32 h-32 bg-odara-offwhite rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-odara-primary">
                      {comportamentoSelecionado.residente.foto ? (
                        <img
                          src={comportamentoSelecionado.residente.foto}
                          alt={comportamentoSelecionado.residente.nome}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-4xl text-odara-primary font-bold">
                          {comportamentoSelecionado.residente.nome.charAt(0)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-odara-dark mb-2">
                      {comportamentoSelecionado.residente.nome}
                    </h3>

                    <div className="w-full bg-odara-offwhite rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-odara-dark mb-2">
                        Comportamento Registrado
                      </h4>
                      <p className="text-odara-name font-medium mb-1">
                        {comportamentoSelecionado.titulo}
                      </p>
                      <p className="text-sm text-odara-name/70">
                        {comportamentoSelecionado.descricao}
                      </p>
                      <div className="flex justify-center mt-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${CORES_CATEGORIAS[comportamentoSelecionado.categoria]}`}
                        >
                          {ROTULOS_CATEGORIAS[comportamentoSelecionado.categoria]}
                        </span>
                      </div>
                    </div>

                    <div className="w-full mt-4 space-y-2 text-sm text-left">
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Data:</span>
                        <span className="font-medium">
                          {comportamentoSelecionado.data.toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Horário:</span>
                        <span className="font-medium">{comportamentoSelecionado.horario}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Status:</span>
                        <span
                          className={`font-medium ${comportamentoSelecionado.status ? "text-green-600" : "text-odara-accent"
                            }`}
                        >
                          {comportamentoSelecionado.status ? "Resolvido" : "Pendente"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-odara-name/70">Registrado por:</span>
                        <span className="font-medium">
                          {comportamentoSelecionado.funcionario.nome}
                        </span>
                      </div>
                    </div>

                    <div className="w-full mt-6">
                      <h4 className="font-semibold text-odara-dark mb-3 text-left">
                        Histórico Recente
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {comportamentos
                          .filter(
                            c =>
                              c.residente.id === comportamentoSelecionado.residente.id &&
                              c.id !== comportamentoSelecionado.id
                          )
                          .slice(0, 3)
                          .map(c => (
                            <div
                              key={c.id}
                              className="bg-white border border-odara-primary/20 rounded-lg p-3 text-left hover:bg-odara-offwhite cursor-pointer"
                              onClick={() => setComportamentoSelecionado(c)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-odara-dark">{c.titulo}</p>
                                  <p className="text-xs text-odara-name/60">
                                    {c.data.toLocaleDateString("pt-BR")} - {c.horario}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${CORES_CATEGORIAS[c.categoria]}`}
                                >
                                  {ROTULOS_CATEGORIAS[c.categoria].charAt(0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        {comportamentos.filter(
                          c =>
                            c.residente.id === comportamentoSelecionado.residente.id &&
                            c.id !== comportamentoSelecionado.id
                        ).length === 0 && (
                            <p className="text-odara-name/60 text-sm text-center py-2">
                              Nenhum outro registro
                            </p>
                          )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-odara-offwhite rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaInfoCircle className="text-odara-primary text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-odara-dark mb-2">
                      Nenhum comportamento selecionado
                    </h3>
                    <p className="text-odara-name/60 text-sm">
                      Clique em um registro da lista para visualizar os detalhes
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-odara-primary/20">
                <h6 className="font-semibold text-odara-dark mb-3 text-center">
                  Legenda das Categorias
                </h6>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(ROTULOS_CATEGORIAS).map(([categoria, rotulo]) => (
                    <div key={categoria} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${CORES_PONTOS[categoria]}`} />
                      <span className="text-odara-name">{rotulo}</span>
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

export default RegistroComportamento;
