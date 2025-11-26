// src/pages/RegistroComportamento.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaInfoCircle,
  FaArrowLeft,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// ================= CONFIG =================
// Troque o nome do bucket aqui se for outro no seu Supabase
const STORAGE_BUCKET = "comportamento_fotos";

// ===== CONSTANTES =====
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

// ===== TIPOS =====
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
  resolvido: boolean;
  criado_em?: string | null;
  foto?: string | null;
};

type FormValues = {
  id?: number;
  titulo: string;
  descricao?: string;
  data: string;
  horario: string;
  residente: number | string;
  funcionario: number | string;
  categoria: string;
  resolvido?: boolean;
  foto?: FileList;
};

// ===== VALIDAÇÃO YUP =====
const schema = yup
  .object({
    titulo: yup.string().required("Título é obrigatório"),
    data: yup.string().required("Data é obrigatória"),
    horario: yup.string().required("Horário é obrigatório"),
    descricao: yup.string().nullable(),
    residente: yup
      .mixed()
      .test("is-number", "Residente é obrigatório", (val) => val !== "" && val !== 0 && val !== "0")
      .required(),
    funcionario: yup
      .mixed()
      .test("is-number", "Funcionário é obrigatório", (val) => val !== "" && val !== 0 && val !== "0")
      .required(),
    categoria: yup.string().required("Categoria é obrigatória"),
    resolvido: yup.boolean(),
  })
  .required();

// ===== COMPONENTE =====
const RegistroComportamento: React.FC = () => {
  // estados
  const [comportamentos, setComportamentos] = useState<Comportamento[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Residente[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros e UI
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

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);

  // react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data: new Date().toISOString().split("T")[0],
      horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      residente: 0,
      funcionario: 0,
      categoria: CATEGORIAS.POSITIVO,
      resolvido: false,
      foto: undefined,
    },
  });

  // carregar dados iniciais
  useEffect(() => {
    fetchComportamentos();
    fetchResidentes();
    fetchFuncionarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== FETCHES =====
  const fetchComportamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comportamento")
        .select(
          `
            id,
            titulo,
            descricao,
            data,
            horario,
            categoria,
            foto,
            resolvido,
            criado_em,
            id_residente,
            id_funcionario,
            residente:residente(id, nome, foto),
            funcionario:funcionario(id, nome)
          `
        )
        .order("data", { ascending: false });

      if (error) throw error;
      if (!data) {
        setComportamentos([]);
        setLoading(false);
        return;
      }

      const mapped = (data as any[]).map((d) => {
        const residenteObj =
          Array.isArray(d.residente) && d.residente.length > 0
            ? d.residente[0]
            : d.residente || { id: d.id_residente, nome: "N/A", foto: null };
        const funcionarioObj =
          Array.isArray(d.funcionario) && d.funcionario.length > 0
            ? d.funcionario[0]
            : d.funcionario || { id: d.id_funcionario, nome: "N/A" };

        return {
          id: d.id,
          titulo: d.titulo,
          descricao: d.descricao,
          data: new Date(d.data),
          horario: d.horario,
          categoria: d.categoria,
          resolvido: d.resolvido,
          criado_em: d.criado_em,
          foto: d.foto ?? null,
          id_residente: d.id_residente ?? residenteObj?.id ?? null,
          id_funcionario: d.id_funcionario ?? funcionarioObj?.id ?? null,
          residente: {
            id: residenteObj?.id ?? -1,
            nome: residenteObj?.nome ?? "N/A",
            foto: residenteObj?.foto ?? null,
          },
          funcionario: {
            id: funcionarioObj?.id ?? -1,
            nome: funcionarioObj?.nome ?? "N/A",
          },
        } as Comportamento;
      });

      setComportamentos(mapped);
    } catch (err) {
      console.error("Erro ao buscar comportamentos:", err);
      alert("Erro ao buscar comportamentos. Veja o console.");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidentes = async () => {
    try {
      const { data, error } = await supabase.from("residente").select("id, nome, foto").order("nome");
      if (error) throw error;
      if (data) setResidentes(data as Residente[]);
    } catch (err) {
      console.error("Erro ao buscar residentes:", err);
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase.from("funcionario").select("id, nome").order("nome");
      if (error) throw error;
      if (data) setFuncionarios(data as Residente[]);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
    }
  };

  // abrir modal novo
  const abrirModalNovo = () => {
    reset({
      titulo: "",
      descricao: "",
      data: new Date().toISOString().split("T")[0],
      horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      residente: 0,
      funcionario: 0,
      categoria: CATEGORIAS.POSITIVO,
      resolvido: false,
      foto: undefined,
    });
    setEditando(false);
    setModalAberto(true);
  };

  // abrir modal editar (preenche form)
  const abrirModalEditar = (id: number) => {
    const item = comportamentos.find((c) => c.id === id);
    if (!item) return;
    reset({
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao ?? "",
      data: item.data.toISOString().split("T")[0],
      horario: item.horario,
      residente: item.id_residente ?? item.residente?.id ?? 0,
      funcionario: item.id_funcionario ?? item.funcionario?.id ?? 0,
      categoria: item.categoria,
      resolvido: item.resolvido ?? false,
      foto: undefined,
    });
    setEditando(true);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(false);
  };

  // ===== UPLOAD helper =====
  const uploadFotoSeHouver = async (fileList?: FileList, prefix = "foto") => {
    if (!fileList || fileList.length === 0) return null;
    const file = fileList[0];
    const ext = file.name.split(".").pop();
    const fileName = `${prefix}_${Date.now()}.${ext}`;
    const path = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError);
      throw uploadError;
    }

    const { publicURL } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return publicURL || null;
  };

  // onSubmit (criar/editar)
  const onSubmit = async (formData: FormValues) => {
    setLoading(true);
    try {
      // Upload foto (se houver)
      let fotoUrl: string | null = null;
      if (formData.foto && formData.foto.length > 0) {
        fotoUrl = await uploadFotoSeHouver(formData.foto, `comportamento_${formData.titulo?.replace(/\s+/g, "_")}`);
      }

      const payload: any = {
        titulo: formData.titulo,
        descricao: formData.descricao ?? "",
        data: formData.data,
        horario: formData.horario,
        categoria: formData.categoria,
        foto: fotoUrl,
        resolvido: !!formData.resolvido,
        id_residente: Number(formData.residente),
        id_funcionario: Number(formData.funcionario),
      };

      if (editando && formData.id) {
        // atualizar
        const { error } = await supabase.from("comportamento").update(payload).eq("id", formData.id);
        if (error) throw error;
      } else {
        // inserir
        const { error } = await supabase.from("comportamento").insert([payload]);
        if (error) throw error;
      }

      await fetchComportamentos();
      setModalAberto(false);
    } catch (err) {
      console.error("Erro ao salvar comportamento:", err);
      alert("Erro ao salvar comportamento. Veja o console.");
    } finally {
      setLoading(false);
    }
  };

  // excluir
  const excluirComportamento = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro de comportamento?")) return;
    try {
      const { error } = await supabase.from("comportamento").delete().eq("id", id);
      if (error) throw error;
      setComportamentos((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Erro ao excluir comportamento:", err);
      alert("Erro ao excluir comportamento. Veja o console.");
    }
  };

  // alternar resolvido
  const alternarResolvido = async (id: number) => {
    try {
      const item = comportamentos.find((c) => c.id === id);
      if (!item) return;
      const novo = !item.resolvido;

      // otimista
      setComportamentos((ant) => ant.map((c) => (c.id === id ? { ...c, resolvido: novo } : c)));

      const { error } = await supabase.from("comportamento").update({ resolvido: novo }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao alternar resolvido:", err);
      fetchComportamentos();
    }
  };

  // filtros e utilitários
  const comportamentosFiltrados = comportamentos
    .filter((comportamento) => {
      if (filtros.categoria && comportamento.categoria !== filtros.categoria) return false;
      if (filtros.residenteId && comportamento.residente?.id !== filtros.residenteId) return false;
      if (filtros.status) {
        const st = comportamento.resolvido ? "resolvido" : "pendente";
        if (st !== filtros.status) return false;
      }
      if (filtros.startDate || filtros.endDate) {
        const d = new Date(comportamento.data.getFullYear(), comportamento.data.getMonth(), comportamento.data.getDate());
        if (filtros.startDate && d < filtros.startDate) return false;
        if (filtros.endDate && d > filtros.endDate) return false;
      }
      return true;
    })
    .sort((a, b) => b.data.getTime() - a.data.getTime());

  const contadorPendentes = comportamentos.filter((c) => !c.resolvido).length;
  const contadorConcluidos = comportamentos.filter((c) => c.resolvido).length;

  const temFiltrosAtivos = filtros.categoria || filtros.residenteId || filtros.status || filtros.startDate || filtros.endDate;

  // Render
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-10">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Comportamento</h1>
            <div className="relative">
              <button onMouseEnter={() => setInfoVisivel(true)} onMouseLeave={() => setInfoVisivel(false)} className="text-odara-dark hover:text-odara-secondary transition-colors duration-200">
                <FaInfoCircle size={20} className="text-odara-accent hover:text-odara-secondary" />
              </button>
              {infoVisivel && (
                <div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
                  <h3 className="font-bold mb-2">Registro de Comportamento</h3>
                  <p>
                    O registro documenta comportamentos dos residentes, com categoria, responsável, data, horário e foto (opcional).
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-odara-dark">
            <strong>{contadorPendentes}</strong> pendentes / <strong>{contadorConcluidos}</strong> resolvidos
          </div>
        </div>

        {/* Novo + Filtros (details) - EXATAMENTE COMO NO ARQUIVO QUE VOCÊ MANDOU */}
        <details className="group mb-8 w-full">
          <summary
            className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer"
          >
            <button
              type="button"
              onClick={abrirModalNovo}
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

          {/* Painel de filtros - EXATAMENTE COMO NO ARQUIVO QUE VOCÊ MANDOU */}
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
                onClick={() => {
                  setFiltros({
                    categoria: null,
                    residenteId: null,
                    status: null,
                    startDate: null,
                    endDate: null
                  });
                  if (formFiltrosRef.current) {
                    formFiltrosRef.current.reset();
                  }
                }}
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

        {/* Lista de Comportamentos - Ocupa toda a largura */}
        {!loading && (
          <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
              Comportamento
              <span className="text-sm font-normal text-odara-name/60 ml-2">({comportamentosFiltrados.length} registros)</span>
            </h2>

            {/* Indicadores de filtros ativos */}
            {temFiltrosAtivos && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filtros.categoria && (
                  <span className="text-sm bg-odara-primary text-odara-white px-2 py-1 rounded-full">
                    Categoria: {ROTULOS_CATEGORIAS[filtros.categoria]}
                  </span>
                )}
                {filtros.residenteId && (
                  <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
                    Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
                  </span>
                )}
                {filtros.status && (
                  <span className="text-sm bg-odara-dropdown-accent text-odara-white px-2 py-1 rounded-full">
                    Status: {filtros.status === 'pendente' ? 'Pendentes' : 'Resolvidos'}
                  </span>
                )}
                {filtros.startDate && (
                  <span className="text-sm bg-gray-600 text-white px-2 py-1 rounded-full">
                    De: {filtros.startDate.toLocaleDateString('pt-BR')}
                  </span>
                )}
                {filtros.endDate && (
                  <span className="text-sm bg-gray-600 text-white px-2 py-1 rounded-full">
                    Até: {filtros.endDate.toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {comportamentosFiltrados.length === 0 ? (
                <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                  <p className="text-odara-dark/60">Nenhum comportamento encontrado com os filtros atuais</p>
                </div>
              ) : (
                comportamentosFiltrados.map((comportamento) => (
                  <div key={comportamento.id} className={`p-4 rounded-xl hover:shadow-md transition-shadow duration-200 ${CORES_CATEGORIAS[comportamento.categoria]}`}>
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

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={comportamento.resolvido} onChange={(e) => { e.stopPropagation(); alternarResolvido(comportamento.id); }} className="rounded border-odara-primary text-odara-accent focus:ring-odara-accent" />
                          <span className={comportamento.resolvido ? "text-green-600 font-semibold" : "text-odara-dark"}>{comportamento.resolvido ? "Resolvido" : "Pendente"}</span>
                        </label>
                      </div>
                    </div>

                    <h6 className="text-xl font-bold mb-1 flex items-center">
                      {comportamento.resolvido && <span className="text-green-500 mr-2"><FaCheck className="h-4 w-4" /></span>}
                      {comportamento.titulo}
                    </h6>

                    <p className="text-base mb-2">{comportamento.descricao}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">{ROTULOS_CATEGORIAS[comportamento.categoria]}</span>
                        {comportamento.residente && (<><span className="mx-2">•</span><span className="text-odara-name">{comportamento.residente.nome}</span></>)}
                        {comportamento.funcionario && (<><span className="mx-2">•</span><span className="text-odara-name">Registrado por: {comportamento.funcionario.nome}</span></>)}
                      </div>

                      <div className="flex space-x-2">
                        <button onClick={() => abrirModalEditar(comportamento.id)} className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown" title="Editar comportamento"><FaEdit size={14} /></button>
                        <button onClick={() => excluirComportamento(comportamento.id)} className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50" title="Excluir comportamento"><FaTrash size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal adicionar/editar */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col relative">

              {/* Header do Modal */}
              <div className="bg-odara-primary text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {editando ? "Editar Registro de Comportamento" : "Novo Registro de Comportamento"}
                  </h2>

                  {/* Botão fechar */}
                  <button
                    onClick={fecharModal}
                    className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <p className="text-odara-offwhite/80 mt-1 text-sm">
                  {editando
                    ? "Atualize as informações do comportamento"
                    : "Preencha os dados para registrar o comportamento"}
                </p>
              </div>

              {/* Corpo */}
              <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">

                {/* Form principal */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-odara-dark">Título</label>
                    <input
                      {...register("titulo")}
                      className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                      placeholder="Ex: Comportamento cooperativo"
                    />
                    {errors.titulo && (
                      <p className="text-red-500 text-xs mt-1">
                        {String(errors.titulo.message)}
                      </p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-odara-dark">Descrição</label>
                    <textarea
                      {...register("descricao")}
                      rows={3}
                      className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                      placeholder="Descreva o comportamento observado..."
                    />
                  </div>

                  {/* Data + Horário */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-odara-dark">Data</label>
                      <input
                        type="date"
                        {...register("data")}
                        className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-odara-dark">Horário</label>
                      <input
                        type="time"
                        {...register("horario")}
                        className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Residente */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-odara-dark">Residente *</label>
                    <select
                      {...register("id_residente")}
                      className="w-full px-4 py-2 border border-odara-primary rounded-lg bg-white text-odara-secondary focus:ring-2 focus:ring-odara-primary"
                      required
                    >
                      <option value="">Selecione um residente</option>
                      {residentes.map((r) => (
                        <option key={r.id} value={r.id}>{r.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Funcionário */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-odara-dark">Funcionário *</label>
                    <select
                      {...register("id_funcionario")}
                      required
                      className="w-full px-4 py-2 border border-odara-primary rounded-lg bg-white text-odara-secondary focus:ring-2 focus:ring-odara-primary"
                    >
                      <option value="">Selecionar funcionário</option>
                      {funcionarios.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-odara-dark">Categoria *</label>
                    <select
                      {...register("categoria")}
                      required
                      className="w-full px-4 py-2 border border-odara-primary rounded-lg bg-white text-odara-secondary focus:ring-2 focus:ring-odara-primary"
                    >
                      <option value="">Selecionar categoria</option>
                      <option value="Positivo">Positivo</option>
                      <option value="Negativo">Negativo</option>
                      <option value="Neutro">Neutro</option>
                    </select>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-odara-primary/30">
                    <button
                      type="button"
                      onClick={fecharModal}
                      className="px-4 py-2 rounded-lg border border-odara-primary bg-odara-white hover:bg-odara-primary text-odara-primary hover:text-odara-white font-medium transition"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-odara-accent hover:bg-odara-secondary text-white text-sm font-medium transition"
                    >
                      {editando ? "Salvar Alterações" : "Registrar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>

  );
};

export default RegistroComportamento;