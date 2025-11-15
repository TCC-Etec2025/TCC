// src/pages/RegistroComportamento.tsx
import React, { useEffect, useState } from "react";
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
import { supabase } from "../../lib/supabaseClient";
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

const FILTROS = [
  { id: "todos", label: "Todos" },
  ...Object.values(CATEGORIAS).map((cat) => ({
    id: cat,
    label: ROTULOS_CATEGORIAS[cat],
  })),
];

const STATUS_OPCOES = [
  { id: "todos", label: "Todos" },
  { id: "pendente", label: "Pendentes" },
  { id: "resolvido", label: "Resolvidos" },
];

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
  const [filtroAtivo, setFiltroAtivo] = useState("todos");
  const [filtroResidente, setFiltroResidente] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [comportamentoSelecionado, setComportamentoSelecionado] = useState<Comportamento | null>(null);

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
      if (comportamentoSelecionado?.id === id) setComportamentoSelecionado(null);
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

  const selecionarComportamento = (c: Comportamento) => {
    setComportamentoSelecionado(c);
  };

  // filtros e utilitários
  const residentesUnicos = Array.from(new Set(comportamentos.map((c) => c.residente?.nome))).filter(Boolean);

  const comportamentosFiltrados = comportamentos.filter((comportamento) => {
    const passaCategoria = filtroAtivo === "todos" || comportamento.categoria === filtroAtivo;
    const passaResidente = filtroResidente === "todos" || comportamento.residente.nome === filtroResidente;
    const passaStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "resolvido" && comportamento.resolvido) ||
      (filtroStatus === "pendente" && !comportamento.resolvido);

    return passaCategoria && passaResidente && passaStatus;
  });

  const limparFiltros = () => {
    setFiltroAtivo("todos");
    setFiltroResidente("todos");
    setFiltroStatus("todos");
  };

  const temFiltrosAtivos = filtroAtivo !== "todos" || filtroResidente !== "todos" || filtroStatus !== "todos";

  const contadorPendentes = comportamentos.filter((c) => !c.resolvido).length;
  const contadorConcluidos = comportamentos.filter((c) => c.resolvido).length;

  // Render
  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-10">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="flex items-center mb-1">
              <Link to="/gestao/PaginaRegistros" className="text-odara-accent hover:text-odara-secondary transition-colors duration-200 flex items-center">
                <FaArrowLeft className="mr-1" />
              </Link>
            </div>
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

        {/* Botão Novo Registro */}
        <div className="relative flex items-center gap-4 mb-6">
          <button onClick={abrirModalNovo} className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-200 text-sm sm:text-base">
            <FaPlus className="mr-2 text-odara-white" /> Novo Registro
          </button>
        </div>

        {/* Barra de filtros */}
        <div className="relative flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
          {/* Categoria */}
          <div className="relative dropdown-container">
            <button className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium transition text-sm ${filtroAberto ? "border-odara-primary text-gray-700" : "border-odara-primary/40 text-gray-700"}`} onClick={() => { setFiltroAberto(!filtroAberto); setFiltroResidenteAberto(false); setFiltroStatusAberto(false); }}>
              <FaFilter className="text-odara-accent mr-2" /> Categoria
            </button>
            {filtroAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                {FILTROS.map((f) => (
                  <button key={f.id} onClick={() => { setFiltroAtivo(f.id); setFiltroAberto(false); }} className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 ${filtroAtivo === f.id ? "bg-odara-accent/20 font-semibold text-odara-accent" : "text-odara-dark"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Residente */}
          <div className="relative dropdown-container">
            <button className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium transition text-sm ${filtroResidenteAberto ? "border-odara-primary text-gray-700" : "border-odara-primary/40 text-gray-700"}`} onClick={() => { setFiltroResidenteAberto(!filtroResidenteAberto); setFiltroAberto(false); setFiltroStatusAberto(false); }}>
              <FaFilter className="text-odara-accent mr-2" /> Residentes
            </button>
            {filtroResidenteAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10 max-h-60 overflow-y-auto">
                <button onClick={() => { setFiltroResidente("todos"); setFiltroResidenteAberto(false); }} className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 ${filtroResidente === "todos" ? "bg-odara-accent/20 font-semibold text-odara-accent" : "text-odara-dark"}`}>Todos</button>
                {residentesUnicos.map((r) => (
                  <button key={r} onClick={() => { setFiltroResidente(r); setFiltroResidenteAberto(false); }} className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 ${filtroResidente === r ? "bg-odara-accent/20 font-semibold text-odara-accent" : "text-odara-dark"}`}>{r}</button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="relative dropdown-container">
            <button className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium transition text-sm ${filtroStatusAberto ? "border-odara-primary text-gray-700" : "border-odara-primary/40 text-gray-700"}`} onClick={() => { setFiltroStatusAberto(!filtroStatusAberto); setFiltroResidenteAberto(false); setFiltroAberto(false); }}>
              <FaFilter className="text-odara-accent mr-2" /> Status
            </button>
            {filtroStatusAberto && (
              <div className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                {STATUS_OPCOES.map((s) => (
                  <button key={s.id} onClick={() => { setFiltroStatus(s.id); setFiltroStatusAberto(false); }} className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 ${filtroStatus === s.id ? "bg-odara-accent/20 font-semibold text-odara-accent" : "text-odara-dark"}`}>{s.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Limpar filtros */}
          {temFiltrosAtivos && (
            <button onClick={limparFiltros} className="flex items-center bg-odara-accent text-odara-white rounded-full px-4 py-2 shadow-sm font-medium hover:bg-odara-secondary transition">
              <FaTimes className="mr-1" /> Limpar Filtros
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odara-accent" />
          </div>
        )}

        {/* Grid Principal */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Esquerda - lista */}
            <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
                Lista de Comportamentos
                <span className="text-sm font-normal text-odara-name/60 ml-2">({comportamentosFiltrados.length} registros)</span>
              </h2>

              {temFiltrosAtivos && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filtroAtivo !== "todos" && <span className="text-sm bg-odara-primary text-odara-white px-2 py-1 rounded-full">Categoria: {ROTULOS_CATEGORIAS[filtroAtivo]}</span>}
                  {filtroResidente !== "todos" && <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">Residente: {filtroResidente}</span>}
                  {filtroStatus !== "todos" && <span className="text-sm bg-odara-dropdown-accent text-odara-white px-2 py-1 rounded-full">Status: {filtroStatus === "resolvido" ? "Resolvidos" : "Pendentes"}</span>}
                </div>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {comportamentosFiltrados.length === 0 ? (
                  <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                    <p className="text-odara-dark/60">Nenhum comportamento encontrado com os filtros atuais</p>
                  </div>
                ) : (
                  comportamentosFiltrados.map((comportamento) => (
                    <div key={comportamento.id} className={`p-4 rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer ${CORES_CATEGORIAS[comportamento.categoria]} ${comportamentoSelecionado?.id === comportamento.id ? "ring-2 ring-odara-primary" : ""}`} onClick={() => selecionarComportamento(comportamento)}>
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
                          <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(comportamento.id); }} className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown" title="Editar comportamento"><FaEdit size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); excluirComportamento(comportamento.id); }} className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50" title="Excluir comportamento"><FaTrash size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Direita - detalhes */}
            <div className="bg-odara-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
              <div className="flex flex-col items-center justify-center text-center">
                {comportamentoSelecionado ? (
                  <>
                    <h2 className="text-2xl font-bold text-odara-dark mb-4">Detalhes do Comportamento</h2>

                    <div className="w-32 h-32 bg-odara-offwhite rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-odara-primary">
                      {comportamentoSelecionado.residente.foto ? (
                        <img src={comportamentoSelecionado.residente.foto} alt={comportamentoSelecionado.residente.nome} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className="text-4xl text-odara-primary font-bold">{comportamentoSelecionado.residente.nome.charAt(0)}</span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-odara-dark mb-2">{comportamentoSelecionado.residente.nome}</h3>

                    <div className="w-full bg-odara-offwhite rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-odara-dark mb-2">Comportamento Registrado</h4>
                      <p className="text-odara-name font-medium mb-1">{comportamentoSelecionado.titulo}</p>
                      <p className="text-sm text-odara-name/70">{comportamentoSelecionado.descricao}</p>
                      <div className="flex justify-center mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${CORES_CATEGORIAS[comportamentoSelecionado.categoria]}`}>{ROTULOS_CATEGORIAS[comportamentoSelecionado.categoria]}</span>
                      </div>
                    </div>

                    <div className="w-full mt-4 space-y-2 text-sm text-left">
                      <div className="flex justify-between"><span className="text-odara-name/70">Data:</span><span className="font-medium">{comportamentoSelecionado.data.toLocaleDateString("pt-BR")}</span></div>
                      <div className="flex justify-between"><span className="text-odara-name/70">Horário:</span><span className="font-medium">{comportamentoSelecionado.horario}</span></div>
                      <div className="flex justify-between"><span className="text-odara-name/70">Status:</span><span className={`font-medium ${comportamentoSelecionado.resolvido ? "text-green-600" : "text-odara-accent"}`}>{comportamentoSelecionado.resolvido ? "Resolvido" : "Pendente"}</span></div>
                      <div className="flex justify-between"><span className="text-odara-name/70">Registrado por:</span><span className="font-medium">{comportamentoSelecionado.funcionario.nome}</span></div>
                    </div>

                    <div className="w-full mt-6">
                      <h4 className="font-semibold text-odara-dark mb-3 text-left">Histórico Recente</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {comportamentos.filter((c) => c.residente.id === comportamentoSelecionado.residente.id && c.id !== comportamentoSelecionado.id).slice(0, 3).map((c) => (
                          <div key={c.id} className="bg-white border border-odara-primary/20 rounded-lg p-3 text-left hover:bg-odara-offwhite cursor-pointer" onClick={() => setComportamentoSelecionado(c)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-odara-dark">{c.titulo}</p>
                                <p className="text-xs text-odara-name/60">{c.data.toLocaleDateString("pt-BR")} - {c.horario}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${CORES_CATEGORIAS[c.categoria]}`}>{ROTULOS_CATEGORIAS[c.categoria].charAt(0)}</span>
                            </div>
                          </div>
                        ))}
                        {comportamentos.filter((c) => c.residente.id === comportamentoSelecionado.residente.id && c.id !== comportamentoSelecionado.id).length === 0 && <p className="text-odara-name/60 text-sm text-center py-2">Nenhum outro registro</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-odara-offwhite rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaInfoCircle className="text-odara-primary text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-odara-dark mb-2">Nenhum comportamento selecionado</h3>
                    <p className="text-odara-name/60 text-sm">Clique em um registro da lista para visualizar os detalhes</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-odara-primary/20">
                <h6 className="font-semibold text-odara-dark mb-3 text-center">Legenda das Categorias</h6>
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

        {/* Modal adicionar/editar - mantém exatamente o visual que pediu */}
        {/* Modal adicionar/editar - mantém exatamente o visual que pediu */}
{modalAberto && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="relative bg-white text-odara-dark border-4 border-odara-primary rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 animate-in fade-in zoom-in duration-200">
      <button onClick={fecharModal} className="absolute top-3 right-3 text-odara-dark hover:text-odara-accent transition-colors">
        <FaTimes size={22} />
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center border-b border-odara-primary/30 pb-2">{editando ? "Editar Registro de Comportamento" : "Novo Registro de Comportamento"}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-odara-dark">Título</label>
          <input {...register("titulo")} className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition" placeholder="Ex: Comportamento cooperativo" />
          {errors.titulo && <p className="text-red-500 text-xs mt-1">{String(errors.titulo.message)}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-odara-dark">Descrição</label>
          <textarea {...register("descricao")} rows={3} className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-odara-primary focus:outline-none transition" placeholder="Descreva o comportamento observado..." />
        </div>

        {/* Data + Horário */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-odara-dark">Data</label>
            <input type="date" {...register("data")} className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-odara-dark">Horário</label>
            <input type="time" {...register("horario")} className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition" />
          </div>
        </div>

        {/* Residente (carregado do Supabase) */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-odara-dark">Residente *</label>
          <select 
            {...register("id_residente")} 
            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary bg-white" 
            required
          >
            <option value="">Selecione um residente</option>
            {residentes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          {errors.id_residente && <p className="text-red-500 text-xs mt-1">{String(errors.id_residente.message)}</p>}
        </div>

        {/* Foto do Residente (upload) */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-odara-dark">Foto do Residente</label>
          <input 
            type="file" 
            accept="image/*" 
            {...register("foto")} 
            className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm bg-white text-odara-dark focus:ring-2 focus:ring-odara-primary focus:outline-none transition file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-odara-accent file:text-white hover:file:bg-odara-secondary" 
          />
        </div>

        {/* Funcionário (carregado do Supabase) */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-odara-dark">Funcionário *</label>
          <select 
            {...register("id_funcionario")} 
            className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
            required
          >
            <option value="">Selecionar funcionário</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          {errors.id_funcionario && <p className="text-red-500 text-xs mt-1">{String(errors.id_funcionario.message)}</p>}
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-odara-dark">Categoria *</label>
          <select 
            {...register("categoria")} 
            className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
            required
          >
            <option value="">Selecionar categoria</option>
            <option value="Positivo">Positivo</option>
            <option value="Negativo">Negativo</option>
            <option value="Neutro">Neutro</option>
            
          </select>
          {errors.categoria && <p className="text-red-500 text-xs mt-1">{String(errors.categoria.message)}</p>}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-odara-primary/30">
          <button type="button" onClick={fecharModal} className="px-4 py-2 rounded-lg border border-odara-primary bg-odara-white hover:bg-odara-primary text-odara-primary hover:text-odara-white font-medium transition">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-odara-accent hover:bg-odara-secondary text-white text-sm font-medium transition">{editando ? "Salvar Alterações" : "Registrar"}</button>
        </div>
      </form>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default RegistroComportamento;
