import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaArrowLeft, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";

import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const CORES_CATEGORIAS: Record<string, string> = {
	"acidente": "bg-odara-dropdown-accent/80 text-odara-dark",
	"saude": "bg-odara-primary/60 text-odara-dark",
	"estrutural": "bg-odara-secondary/60 text-odara-white",
};

const CORES_CALENDARIO: Record<string, string> = {
	"acidente": "bg-odara-dropdown-accent",
	"saude": "bg-odara-primary",
	"estrutural": "bg-odara-secondary",
};

// ===== TIPOS =====
type ResidenteFuncionario = { id: number; nome: string };

type Ocorrencia = {
	id: number;
	titulo: string;
	descricao?: string | null;
	providencias?: string | null;
	data: string;
	residente: ResidenteFuncionario;
	funcionario: ResidenteFuncionario;
	categoria: string;
	resolvido: boolean;
	criado_em?: string | null;
};

type FormValues = {
	id?: number;
	titulo: string;
	descricao?: string;
	providencias?: string;
	data: string; // YYYY-MM-DD
	hora: string; // HH:MM
	residente: string | number; // deixamos string (select) ou number
	funcionario: string | number;
	categoria: string;
	resolvido?: boolean;
};

// ===== VALIDAÇÃO YUP =====
const schema = yup.object({
	titulo: yup.string().required("Título é obrigatório"),
	data: yup.string().required("Data é obrigatória"),
	hora: yup.string().required("Hora é obrigatória"),
	descricao: yup.string().nullable(),
	providencias: yup.string().nullable(),
	// permitimos mixed porque os selects retornam strings
	residente: yup.mixed().required("Residente é obrigatório"),
	funcionario: yup.mixed().required("Funcionário é obrigatório"),
	categoria: yup.string().required("Categoria é obrigatória"),
	resolvido: yup.boolean(),
}).required();

// filtros estáticos (labels)
const FILTROS = [
	{ id: "todos", label: "Todos" },
	{ id: "acidente", label: "Acidente" },
	{ id: "saude", label: "Saúde" },
	{ id: "estrutural", label: "Estrutural" },
];

const STATUS_OPCOES = [
	{ id: "todos", label: "Todos" },
	{ id: "pendentes", label: "Pendentes" },
	{ id: "resolvidas", label: "Resolvidas" },
];

// ===== COMPONENTE =====
const RegistroOcorrencias: React.FC = () => {
	const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
	const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
	const [funcionarios, setFuncionarios] = useState<ResidenteFuncionario[]>([]);
	const [loading, setLoading] = useState(false);
	const [dataAtual, setDataAtual] = useState<Date>(new Date());
	const [modalAberto, setModalAberto] = useState(false);
	const [editando, setEditando] = useState(false);
	const [infoVisivel, setInfoVisivel] = useState(false);

	// filtros de UI
	const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
	const [filtroAberto, setFiltroAberto] = useState(false);
	const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
	const [residenteSelecionado, setResidenteSelecionado] = useState<string | number>("");
	const [filtroAtivo, setFiltroAtivo] = useState<string>("todos");
	const [filtroStatus, setFiltroStatus] = useState<string>("todos");

	// react-hook-form
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: yupResolver(schema),
		defaultValues: {
			titulo: "",
			descricao: "",
			providencias: "",
			data: new Date().toISOString().split("T")[0], // YYYY-MM-DD
			hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
			residente: "",
			funcionario: "",
			categoria: "",
			resolvido: false,
		},
	});

	// residentes/funcionarios únicos (para selects) — pegamos do endpoint separado
	const residentesUnicos = residentes;
	const funcionariosUnicos = funcionarios;

	// contadores simples
	const contadorPendentes = ocorrencias.filter((o) => !o.resolvido).length;
	const contadorResolvidas = ocorrencias.filter((o) => o.resolvido).length;

	// === BUSCA ===
	useEffect(() => {
		fetchOcorrencias();
		fetchResidentes();
		fetchFuncionarios();
	}, []);

	const fetchOcorrencias = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("ocorrencia")
				.select(`
          id,
          titulo,
          descricao,
          providencias,
          data,
          categoria,
          resolvido,
          criado_em,
          residente: residente!id_residente(id, nome),
          funcionario: funcionario!id_funcionario(id, nome)
        `)
				.order("data", { ascending: false });

			if (error) {
				console.error("Erro supabase select:", error);
				setLoading(false);
				return;
			}

			if (data) {
				const formatted = (data as any[]).map((d) => {
					const getEntity = (raw: any): ResidenteFuncionario => {
						if (Array.isArray(raw) && raw.length > 0) return { id: raw[0].id, nome: raw[0].nome };
						if (typeof raw === "object" && raw !== null) return { id: raw.id ?? -1, nome: raw.nome ?? "N/A" };
						return { id: -1, nome: "N/A" };
					};

					return {
						id: d.id,
						titulo: d.titulo,
						descricao: d.descricao,
						providencias: d.providencias,
						data: d.data,
						categoria: d.categoria,
						resolvido: d.resolvido,
						criado_em: d.criado_em,
						residente: getEntity(d.residente),
						funcionario: getEntity(d.funcionario),
					} as Ocorrencia;
				});

				setOcorrencias(formatted);
			}
		} catch (err) {
			console.error("Erro ao buscar ocorrências:", err);
		} finally {
			setLoading(false);
		}
	};

	const fetchResidentes = async () => {
		try {
			const { data, error } = await supabase.from("residente").select("id, nome").order("nome");
			if (error) throw error;
			if (data) setResidentes(data as ResidenteFuncionario[]);
		} catch (err) {
			console.error("Erro ao buscar residentes:", err);
		}
	};

	const fetchFuncionarios = async () => {
		try {
			const { data, error } = await supabase.from("funcionario").select("id, nome").order("nome");
			if (error) throw error;
			if (data) setFuncionarios(data as ResidenteFuncionario[]);
		} catch (err) {
			console.error("Erro ao buscar funcionários:", err);
		}
	};

	// abrir modal novo/editar
	const abrirModal = (oc?: Ocorrencia | null) => {
		if (oc) {
			setEditando(true);
			const date = oc.data ? new Date(oc.data) : new Date();
			reset({
				id: oc.id,
				titulo: oc.titulo,
				descricao: oc.descricao ?? "",
				providencias: oc.providencias ?? "",
				data: date.toISOString().split("T")[0],
				hora: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
				residente: String(oc.residente.id),
				funcionario: String(oc.funcionario.id),
				categoria: oc.categoria,
				resolvido: oc.resolvido,
			} as FormValues);
		} else {
			setEditando(false);
			reset({
				titulo: "",
				descricao: "",
				providencias: "",
				data: new Date().toISOString().split("T")[0],
				hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
				residente: "",
				funcionario: "",
				categoria: "",
				resolvido: false,
			});
		}
		setModalAberto(true);
	};

	const abrirModalAdicionar = () => abrirModal(null);

	// salvar (insert / update) — combina data + hora em timestamp ISO
	const onSubmit = async (form: FormValues) => {
		setLoading(true);
		try {
			const combined = new Date(`${form.data}T${form.hora}:00`);
			const payload: any = {
				titulo: form.titulo,
				descricao: form.descricao ?? null,
				providencias: form.providencias ?? null,
				categoria: form.categoria,
				resolvido: form.resolvido ?? false,
				data: combined.toISOString(),
			};

			// residente / funcionario: passa id se for numérico
			if (form.residente) {
				if (!Number.isNaN(Number(form.residente))) payload.id_residente = Number(form.residente);
				else payload.residente_nome = form.residente;
			}
			if (form.funcionario) {
				if (!Number.isNaN(Number(form.funcionario))) payload.id_funcionario = Number(form.funcionario);
				else payload.funcionario_nome = form.funcionario;
			}

			if (form.id) {
				const { error } = await supabase.from("ocorrencia").update(payload).eq("id", form.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("ocorrencia").insert([payload]);
				if (error) throw error;
			}

			await fetchOcorrencias();
			setModalAberto(false);
		} catch (err) {
			console.error("Erro ao salvar ocorrência:", err);
			alert("Erro ao salvar ocorrência. Veja o console.");
		} finally {
			setLoading(false);
		}
	};

	// deletar
	const handleDelete = async (id?: number) => {
		if (!id) return;
		const ok = confirm("Tem certeza que deseja excluir esta ocorrência?");
		if (!ok) return;
		try {
			setLoading(true);
			const { error } = await supabase.from("ocorrencia").delete().eq("id", id);
			if (error) throw error;
			setOcorrencias((prev) => prev.filter((o) => o.id !== id));
		} catch (err) {
			console.error("Erro ao deletar:", err);
			alert("Erro ao deletar ocorrência. Veja o console.");
		} finally {
			setLoading(false);
		}
	};

	// alterna resolvido local + no banco
	const toggleResolvido = async (oc: Ocorrencia) => {
		try {
			setOcorrencias((prev) => prev.map((p) => (p.id === oc.id ? { ...p, resolvido: !p.resolvido } : p)));
			const { error } = await supabase
				.from("ocorrencia")
				.update({ resolvido: !oc.resolvido })
				.eq("id", oc.id);
			if (error) throw error;
		} catch (err) {
			console.error("Erro ao alternar resolvido:", err);
			fetchOcorrencias();
		}
	};

	// filtros e contadores
	const ocorrenciasFiltradas = ocorrencias
		.filter((o) => {
			// status
			if (filtroStatus === "pendentes" && o.resolvido) return false;
			if (filtroStatus === "resolvidas" && !o.resolvido) return false;
			// categoria
			if (filtroAtivo !== "todos" && o.categoria !== filtroAtivo) return false;
			// residente
			if (residenteSelecionado && String(o.residente.id) !== String(residenteSelecionado) && o.residente.nome !== residenteSelecionado) return false;
			return true;
		})
		.sort((a, b) => +new Date(b.data) - +new Date(a.data));

	// calendário: usa o campo data (string) para criar Date na exibição
	const getTileContent = ({ date, view }: { date: Date; view: string }) => {
		if (view !== "month") return null;
		const ocorrenciasDia = ocorrencias.filter((o) => {
			const d = new Date(o.data);
			return d.toDateString() === date.toDateString();
		});
		if (ocorrenciasDia.length === 0) return null;
		const categoriasDia = [...new Set(ocorrenciasDia.map((o) => o.categoria))];
		return (
			<div className="flex justify-center gap-1 mt-0.5 flex-wrap">
				{categoriasDia.map((c) => (
					<div key={c} className={`w-2.5 h-2.5 rounded-full shadow-sm ${CORES_CALENDARIO[c]}`} title={c} />
				))}
			</div>
		);
	};

	const getTileClassName = ({ date }: { date: Date }) => {
		const classes: string[] = [];
		const hoje = new Date();
		if (date.toDateString() === hoje.toDateString()) classes.push("bg-odara-primary/10 font-semibold rounded-lg");
		if (date.toDateString() === dataAtual.toDateString()) classes.push("outline outline-2 outline-odara-accent rounded-lg");
		return classes.join(" ");
	};

	// helper para exibição (separa data/hora da string timestamp)
	const formatData = (ts: string) => {
		try {
			const d = new Date(ts);
			const data = d.toLocaleDateString("pt-BR");
			const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
			return { data, hora };
		} catch {
			return { data: "-", hora: "-" };
		}
	};

	// === RENDER ===
	return (
		<div className="flex min-h-screen bg-odara-offwhite">
			<main className="flex-1 p-6 lg:p-10">
				{/* header */}
				<header className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-bold text-odara-dark">Registro de Ocorrências</h1>

						<div className="relative ml-2">
							<FaInfoCircle className="ml-2 text-odara-accent cursor-pointer" size={20} onMouseEnter={() => setInfoVisivel(true)} onMouseLeave={() => setInfoVisivel(false)} />
							{infoVisivel && (
								<div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
									<h3 className="font-bold mb-2">Registro de Ocorrências</h3>
									<p>Documenta incidentes, acidentes, problemas de saúde ou situações relevantes envolvendo residentes e funcionários — garantindo acompanhamento e transparência.</p>
								</div>
							)}
						</div>
					</div>

					<div className="text-sm text-gray-600">
						<strong>{contadorPendentes}</strong> pendentes / <strong>{contadorResolvidas}</strong> resolvidas
					</div>
				</header>

				{/* Botão novo registro */}
				<div className="relative flex items-center gap-4 mb-6">
					<button
						onClick={abrirModalAdicionar}
						className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-200 text-sm sm:text-base"
					>
						<FaPlus className="mr-2 text-odara-white" /> Novo Registro
					</button>
				</div>

				{/* Barra de Filtros */}
				<div className="relative flex flex-wrap items-center gap-2 sm:gap-4 mb-6">

					{/* Filtro por Residente */}
					<div className="relative dropdown-container">
						<button
							className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroResidenteAberto
									? 'border-odara-primary text-gray-700'
									: 'border-odara-primary/40 text-gray-700'} 
                `}
							onClick={() => {
								setFiltroResidenteAberto(!filtroResidenteAberto);
								setFiltroStatusAberto(false);
								setFiltroAberto(false);
							}}
						>
							<FaFilter className="text-odara-accent mr-2" />
							Residentes
						</button>
						{filtroResidenteAberto && (
							<div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10 max-h-60 overflow-y-auto">
								<button
									onClick={() => {
										setResidenteSelecionado("");
										setFiltroResidenteAberto(false);
									}}
									className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${!residenteSelecionado
										? 'bg-odara-accent/20 font-semibold text-odara-accent'
										: 'text-odara-dark'
										}`}
								>
									Todos
								</button>
								{residentesUnicos.map(residente => (
									<button
										key={residente.id}
										onClick={() => {
											setResidenteSelecionado(String(residente.id));
											setFiltroResidenteAberto(false);
										}}
										className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${String(residenteSelecionado) === String(residente.id)
											? 'bg-odara-accent/20 font-semibold text-odara-accent'
											: 'text-odara-dark'
											}`}
									>
										{residente.nome}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Filtro Categoria */}
					<div className="relative dropdown-container">
						<button
							className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroAberto
									? 'border-odara-primary text-gray-700'
									: 'border-odara-primary/40 text-gray-700'} 
                `}
							onClick={() => {
								setFiltroAberto(!filtroAberto);
								setFiltroResidenteAberto(false);
								setFiltroStatusAberto(false);
							}}
						>
							<FaFilter className="text-odara-accent mr-2" />
							Categoria
						</button>
						{filtroAberto && (
							<div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
								{FILTROS.map((f) => (
									<button
										key={f.id}
										onClick={() => {
											setFiltroAtivo(f.id);
											setFiltroAberto(false);
										}}
										className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroAtivo === f.id
											? 'bg-odara-accent/20 font-semibold text-odara-accent'
											: 'text-odara-dark'
											}`}
									>
										{f.label}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Filtro por Status */}
					<div className="relative dropdown-container">
						<button
							className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 
                ${filtroStatusAberto
									? 'border-odara-primary text-gray-700'
									: 'border-odara-primary/40 text-gray-700'} 
                font-medium hover:border-2 hover:border-odara-primary transition text-sm`}
							onClick={() => {
								setFiltroStatusAberto(!filtroStatusAberto);
								setFiltroResidenteAberto(false);
								setFiltroAberto(false);
							}}
						>
							<FaFilter className="text-odara-accent mr-2" />
							Status
						</button>
						{filtroStatusAberto && (
							<div className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
								{STATUS_OPCOES.map((opcao) => (
									<button
										key={opcao.id}
										onClick={() => {
											setFiltroStatus(opcao.id);
											setFiltroStatusAberto(false);
										}}
										className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroStatus === opcao.id
											? 'bg-odara-accent/20 font-semibold text-odara-accent'
											: 'text-odara-dark'
											}`}
									>
										{opcao.label}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Botão Limpar Filtros */}
					{(filtroAtivo !== 'todos' || residenteSelecionado || filtroStatus !== 'todos') && (
						<button
							onClick={() => {
								setFiltroAtivo('todos');
								setResidenteSelecionado('');
								setFiltroStatus('todos');
							}}
							className="flex items-center bg-odara-accent text-odara-white rounded-full px-3 py-2 shadow-sm font-medium hover:bg-odara-secondary transition text-sm"
						>
							<FaTimes className="mr-2" /> Limpar Filtros
						</button>
					)}
				</div>

				{/* conteúdo */}
				 <div className="bg-odara-white rounded-2xl shadow-lg p-4 sm:p-1">
					{/* lista */}
					<div className="bg-white border-l-4 border-odara-primary rounded-2xl w-290 shadow-lg p-6">
						<h2 className="text-2xl lg:text-4xl md:text-4xl font-bold text-odara-dark">{filtroStatus === 'resolvidas' ? "Ocorrências Resolvidas" : filtroStatus === 'pendentes' ? "Ocorrências Pendentes" : "Ocorrências"}</h2>

						<div className="space-y-4 max-h-[600px] overflow-y-auto">
							{loading && (
								<p className="text-center text-gray-500">Carregando...</p>
							)}

							{!loading && ocorrenciasFiltradas.length === 0 && (
								<p className="text-center text-gray-500">Nenhuma ocorrência encontrada</p>
							)}

							{!loading &&
								ocorrenciasFiltradas.map((o) => {
									const { data, hora } = formatData(o.data);

									return (
										<div
											key={o.id}
											className="p-4 rounded-lg bg-white shadow flex items-start gap-4"
										>
											{/* bolinha colorida */}
											<div
												className={`w-4 h-4 rounded-full mt-1 ${CORES_CATEGORIAS[o.categoria] || "bg-gray-400"}`}
											></div>

											{/* conteúdo */}
											<div className="flex-1 space-y-2">
												<div className="flex items-center justify-between">
													<div className="text-sm text-odara-dark">
														<span className="font-semibold text-odara-dark">{data}</span>
														{hora && ` - ${hora}`}
													</div>

													<label className="flex items-center text-odara-dark gap-2 text-sm">
														<input
															type="checkbox"
															checked={o.resolvido}
															onChange={() => toggleResolvido(o)}
														/>
														{o.resolvido ? "Resolvido" : "Pendente"}
													</label>
												</div>

												<h3 className="text-lg text-odara-dark font-bold">{o.titulo}</h3>

												<p className="text-sm text-odara-dark">{o.descricao}</p>



												{o.providencias && (
													<p className="text-sm italic text-odara-dark">
														Providências: {o.providencias}
													</p>
												)}

												<p className="text-xs text-odara-dark">
													<strong>Categoria:</strong>{" "}
													{o.categoria === "acidente" && "Acidente"}
													{o.categoria === "saude" && "Saúde"}
													{o.categoria === "estrutural" && "Estrutural"}
												</p>


												<p className="text-xs text-odara-dark">
													<strong>Residente:</strong> {o.residente.nome} |{" "}
													<strong>Funcionário:</strong> {o.funcionario.nome}
												</p>

												<div className="flex justify-end gap-2 pt-2">
													<button
														onClick={() => abrirModal(o)}
														className="px-1 py-1 text-white bg-blue-200 rounded hover:bg-blue-400"
													>
														<FaEdit />
													</button>
													<button
														onClick={() => handleDelete(o.id)}
														className="px-1 py-1  text-white bg-red-300 rounded hover:bg-red-400"
													>
														<FaTrash />
													</button>
												</div>
											</div>
										</div>
									);
								})}
						</div>

					</div>




					{/* modal */}
					{modalAberto && (
						<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
							<div className="bg-white text-odara-dark border-4 border-odara-primary rounded-lg py-2 p-6 w-full max-w-lg">
								<h2 className="text-xl font-bold mb-4">{editando ? "Editar Ocorrência" : "Nova Ocorrência"}</h2>

								<form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
									<input type="text" placeholder="Título" className="w-full border-odara-primary border rounded-lg px-3 py-2" {...register("titulo")} />
									{errors.titulo && <p className="text-red-500 text-sm">{(errors.titulo as any).message}</p>}

									<textarea placeholder="Descrição" className="w-full border-odara-primary border rounded-lg px-3 py-2" {...register("descricao")} />

									<textarea placeholder="Providências" className="w-full border-odara-primary border rounded-lg px-3 py-2" {...register("providencias")} />

									<div className="flex gap-2">
										<input type="date" className="border-odara-primary border rounded-lg px-3 py-2 flex-1" {...register("data")} />
										<input type="time" className="border-odara-primary border rounded-lg px-3 py-2 flex-1" {...register("hora")} />
									</div>
									{errors.data && <p className="text-red-500 text-sm">{(errors.data as any).message}</p>}

									<div className="flex flex-col gap-2">
										<select className="flex-1 border-odara-primary border rounded-lg px-3 py-2" {...register("residente")}>
											<option value="">Selecionar Residente</option>
											{residentes.map((r) => <option key={String(r.id)} value={String(r.id)}>{r.nome}</option>)}
										</select>

										<select className="flex-1 border-odara-primary border rounded-lg px-3 py-2" {...register("funcionario")}>
											<option value="">Selecionar Funcionário</option>
											{funcionarios.map((f) => <option key={String(f.id)} value={String(f.id)}>{f.nome}</option>)}
										</select>
									</div>

									<select className="w-full border-odara-primary text-odara-dark border rounded-lg px-3 py-2" {...register("categoria")}>
										<option value="">Selecionar Categoria</option>
										<option value={'acidente'}>Acidente</option>
										<option value={'saude'}>Saúde</option>
										<option value={'estrutural'}>Estrutural</option>
									</select>

									<label className="flex items-center gap-2">
										<input type="checkbox" className="w-4 h-4 text-odara-accent border-gray-300 rounded" {...register("resolvido")} />
										Ocorrência Resolvida
									</label>

									<div className="mt-4 flex justify-end gap-2">
										<button type="button" className="px-4 border-odara-primary border py-2 rounded-lg text-odara-primary hover:text-odara-white hover:bg-odara-primary" onClick={() => setModalAberto(false)}>Cancelar</button>
										<button type="submit" className="px-4 py-2 bg-odara-accent hover:bg-odara-secondary text-odara-white rounded-lg" disabled={isSubmitting || loading}>
											{isSubmitting || loading ? "Salvando..." : "Salvar"}
										</button>
									</div>
								</form>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default RegistroOcorrencias;
