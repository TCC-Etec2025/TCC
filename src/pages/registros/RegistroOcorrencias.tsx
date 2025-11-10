import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaArrowLeft, FaTimes, FaAngleDown } from "react-icons/fa";
import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// ===== CONSTANTES =====
const CATEGORIAS = {
	ACIDENTE: "acidente",
	SAUDE: "saude",
	COMPORTAMENTAL: "comportamental",
	ESTRUTURAL: "estrutural",
	OUTRO: "outro",
};

const ROTULOS_CATEGORIAS = {
	[CATEGORIAS.ACIDENTE]: "Acidente",
	[CATEGORIAS.SAUDE]: "Saúde",
	[CATEGORIAS.COMPORTAMENTAL]: "Comportamental",
	[CATEGORIAS.ESTRUTURAL]: "Estrutural",
	[CATEGORIAS.OUTRO]: "Outro",
};

const CORES_CATEGORIAS = {
	[CATEGORIAS.ACIDENTE]: "bg-odara-dropdown-accent/80 text-odara-dark",
	[CATEGORIAS.SAUDE]: "bg-odara-primary/60 text-odara-dark",
	[CATEGORIAS.COMPORTAMENTAL]: "bg-odara-accent/60 text-odara-white",
	[CATEGORIAS.ESTRUTURAL]: "bg-odara-secondary/60 text-odara-white",
	[CATEGORIAS.OUTRO]: "bg-odara-contorno/60 text-odara-dark",
};

const CORES_CALENDARIO = {
	[CATEGORIAS.ACIDENTE]: "bg-odara-dropdown-accent",
	[CATEGORIAS.SAUDE]: "bg-odara-primary",
	[CATEGORIAS.COMPORTAMENTAL]: "bg-odara-accent",
	[CATEGORIAS.ESTRUTURAL]: "bg-odara-secondary",
	[CATEGORIAS.OUTRO]: "bg-odara-contorno",
};

const FILTROS = [
	{ id: "todos", label: "Todos" },
	...Object.values(CATEGORIAS).map((cat) => ({
		id: cat,
		label: ROTULOS_CATEGORIAS[cat],
	})),
];

const ROTULOS_STATUS = {
	pendente: "Pendente",
	resolvido: "Resolvido",
	todos: "Todos"
};

const STATUS_OPCOES = [
	{ id: "todos", label: "Todos" },
	{ id: "pendente", label: "Pendente" },
	{ id: "resolvido", label: "Resolvido" },
];

// ===== TIPOS =====
type ResidenteFuncionario = { id: number; nome: string };

type Ocorrencia = {
	id: number;
	titulo: string;
	descricao?: string | null;
	providencias?: string | null;
	data: Date;
	residente: ResidenteFuncionario;
	funcionario: ResidenteFuncionario;
	categoria: string;
	resolvido: boolean;
	status: string;
	criado_em?: string | null;
};

type FormValues = {
	id?: number;
	titulo: string;
	descricao?: string;
	providencias?: string;
	data: string;
	hora: string;
	residente: number;
	funcionario: number;
	categoria: string;
	resolvido?: boolean;
};

// ===== VALIDAÇÃO YUP =====
const schema = yup.object({
	titulo: yup.string().required("Título é obrigatório"),
	data: yup.string().required("Data é obrigatória"),
	hora: yup.string().required("Hora é obrigatória"),
	descricao: yup.string(),
	providencias: yup.string(),
	residente: yup.number().required("Residente é obrigatório"),
	funcionario: yup.number().required("Funcionário é obrigatório"),
	categoria: yup.string().required("Categoria é obrigatória"),
	resolvido: yup.boolean(),
}).required();

// ===== COMPONENTE =====
const RegistroOcorrencias: React.FC = () => {
	// ===== ESTADOS =====
	const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
	const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
	const [funcionarios, setFuncionarios] = useState<ResidenteFuncionario[]>([]);
	const [loading, setLoading] = useState(false);
	const [filtroStatus, setFiltroStatus] = useState("todos");
	const [filtroAtivo, setFiltroAtivo] = useState("todos");
	const [residenteSelecionado, setResidenteSelecionado] = useState("");
	const [filtroAberto, setFiltroAberto] = useState(false);
	const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
	const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
	const [modalAberto, setModalAberto] = useState(false);
	const [editando, setEditando] = useState(false);
	const [dataAtual, setDataAtual] = useState<Date>(new Date());
	const [infoVisivel, setInfoVisivel] = useState(false);
	const [dropdownStatusAberto, setDropdownStatusAberto] = useState<number | null>(null);

	// React Hook Form
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			titulo: "",
			descricao: "",
			providencias: "",
			data: new Date().toISOString().split('T')[0],
			hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
			residente: 0,
			funcionario: 0,
			categoria: CATEGORIAS.OUTRO,
			resolvido: false,
		},
	});

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
						data: new Date(d.data),
						categoria: d.categoria,
						resolvido: d.resolvido,
						status: d.resolvido ? "resolvido" : "pendente",
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

	// ===== FUNÇÕES DO MODAL =====
	const abrirModalAdicionar = () => {
		reset({
			titulo: "",
			descricao: "",
			providencias: "",
			data: new Date().toISOString().split('T')[0],
			hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
			residente: 0,
			funcionario: 0,
			categoria: CATEGORIAS.OUTRO,
			resolvido: false,
		});
		setEditando(false);
		setModalAberto(true);
	};

	const abrirModalEditar = (id: number) => {
		const ocorrenciaParaEditar = ocorrencias.find(ocorrencia => ocorrencia.id === id);
		if (ocorrenciaParaEditar) {
			reset({
				id: ocorrenciaParaEditar.id,
				titulo: ocorrenciaParaEditar.titulo,
				descricao: ocorrenciaParaEditar.descricao || "",
				providencias: ocorrenciaParaEditar.providencias || "",
				data: ocorrenciaParaEditar.data.toISOString().split('T')[0],
				hora: ocorrenciaParaEditar.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
				residente: ocorrenciaParaEditar.residente.id,
				funcionario: ocorrenciaParaEditar.funcionario.id,
				categoria: ocorrenciaParaEditar.categoria,
				resolvido: ocorrenciaParaEditar.resolvido,
			});
			setEditando(true);
			setModalAberto(true);
		}
	};

	const onSubmit = async (formData: FormValues) => {
		setLoading(true);
		try {
			// Combina data e hora
			const combined = new Date(`${formData.data}T${formData.hora}:00`);
			
			const payload: any = {
				titulo: formData.titulo,
				descricao: formData.descricao || null,
				providencias: formData.providencias || null,
				data: combined.toISOString(),
				categoria: formData.categoria,
				resolvido: formData.resolvido || false,
				id_residente: Number(formData.residente),
				id_funcionario: Number(formData.funcionario),
			};

			if (editando && formData.id) {
				const { error } = await supabase
					.from("ocorrencia")
					.update(payload)
					.eq("id", formData.id);
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from("ocorrencia")
					.insert([payload]);
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
	const excluirOcorrencia = async (id: number) => {
		if (!window.confirm('Tem certeza que deseja excluir esta ocorrência?')) return;

		try {
			const { error } = await supabase
				.from("ocorrencia")
				.delete()
				.eq("id", id);

			if (error) throw error;
			
			setOcorrencias(anterior => anterior.filter(ocorrencia => ocorrencia.id !== id));
		} catch (err) {
			console.error("Erro ao excluir ocorrência:", err);
			alert("Erro ao excluir ocorrência. Verifique o console.");
		}
	};

	// alterna resolvido local + no banco
	const alterarStatus = async (id: number, novoStatus: string) => {
		try {
			const resolvido = novoStatus === "resolvido";
			
			// Atualização otimista
			setOcorrencias(anterior => anterior.map(ocorrencia => 
				ocorrencia.id === id 
					? { ...ocorrencia, status: novoStatus, resolvido } 
					: ocorrencia
			));

			const { error } = await supabase
				.from("ocorrencia")
				.update({ resolvido })
				.eq("id", id);

			if (error) throw error;
		} catch (err) {
			console.error("Erro ao alterar status:", err);
			// Revert em caso de erro
			fetchOcorrencias();
		}
	};

	// ===== FUNÇÕES AUXILIARES =====
	const handleDayClick = (value: Date) => {
		setDataAtual(value);
	};

	const irParaHoje = () => setDataAtual(new Date());

	const toggleDropdownStatus = (ocorrenciaId: number) => {
		setDropdownStatusAberto(dropdownStatusAberto === ocorrenciaId ? null : ocorrenciaId);
	};

	// Calcular residentes únicos a partir das ocorrências
	const residentesUnicos = [...new Set(ocorrencias.map(ocorrencia => ocorrencia.residente.nome))].filter(Boolean);

	// ===== FUNÇÕES DE ESTATÍSTICAS =====
	const obterOcorrenciasDoDia = (data: Date) => {
		return ocorrencias.filter(ocorrencia =>
			ocorrencia.data.toDateString() === data.toDateString()
		);
	};

	const obterResidentesDoDia = (data: Date) => {
		const ocorrenciasDia = obterOcorrenciasDoDia(data);
		return [...new Set(ocorrenciasDia.map(oc => oc.residente.nome))].filter(Boolean);
	};

	const getEstatisticasDia = (data: Date) => {
		const ocorrenciasDia = obterOcorrenciasDoDia(data);
		const pendentes = ocorrenciasDia.filter(oc => oc.status === 'pendente').length;
		const resolvidas = ocorrenciasDia.filter(oc => oc.status === 'resolvido').length;

		return {
			total: ocorrenciasDia.length,
			pendentes,
			resolvidas
		};
	};

	const getEstatisticasMes = (data: Date) => {
		const mes = data.getMonth();
		const ano = data.getFullYear();

		const ocorrenciasMes = ocorrencias.filter(oc =>
			oc.data.getMonth() === mes && oc.data.getFullYear() === ano
		);

		const pendentes = ocorrenciasMes.filter(oc => oc.status === 'pendente').length;
		const resolvidas = ocorrenciasMes.filter(oc => oc.status === 'resolvido').length;
		const residentesUnicosMes = [...new Set(ocorrenciasMes.map(oc => oc.residente.nome))].filter(Boolean);

		return {
			totalRegistros: ocorrenciasMes.length,
			totalResidentes: residentesUnicosMes.length,
			pendentes,
			resolvidas
		};
	};

	const formatarDataLegenda = (data: Date) => {
		return data.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	};

	// ===== FILTROS =====
	const ocorrenciasFiltradas = ocorrencias
		.filter((o) => {
			const passaFiltroStatus = filtroStatus === "todos" || o.status === filtroStatus;
			const passaFiltroCategoria = filtroAtivo === "todos" || o.categoria === filtroAtivo;
			const passaFiltroResidente = residenteSelecionado === "" || o.residente.nome === residenteSelecionado;
			return passaFiltroStatus && passaFiltroCategoria && passaFiltroResidente;
		})
		.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

	const getTileContent = ({ date, view }: { date: Date; view: string }) => {
		if (view !== "month") return null;
		const ocorrenciasDia = ocorrencias.filter(
			(o) => o.data.toDateString() === date.toDateString()
		);
		if (ocorrenciasDia.length === 0) return null;
		const categoriasDia = [...new Set(ocorrenciasDia.map((o) => o.categoria))];
		return (
			<div className="flex justify-center gap-1 mt-1 flex-wrap">
				{categoriasDia.map((c) => (
					<div
						key={c}
						className={`w-2 h-2 rounded-full ${CORES_CALENDARIO[c]}`}
						title={ROTULOS_CATEGORIAS[c]}
					/>
				))}
			</div>
		);
	};

	const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
		const classes: string[] = [];
		const hoje = new Date();

		// Dia atual
		if (date.toDateString() === hoje.toDateString()) {
			classes.push('!bg-odara-primary/50 !text-dark !font-bold');
		}

		// Dia selecionado
		if (date.toDateString() === dataAtual.toDateString()) {
			classes.push('!bg-odara-secondary/70 !text-white !font-bold');
		}

		return classes.join(' ');
	};

	// Contadores para o header
	const contadorPendentes = ocorrencias.filter(o => !o.resolvido).length;
	const contadorResolvidas = ocorrencias.filter(o => o.resolvido).length;

	// === RENDER ===
	return (
		<div className="flex min-h-screen bg-odara-offwhite">
			<div className="flex-1 p-6 lg:p-10">
				{/* Cabeçalho */}
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center">
						<div className="flex items-center mb-1">
							<Link
								to="/gestao/PaginaRegistros"
								className="text-odara-accent hover:text-odara-secondary transition-colors duration-200 flex items-center"
							>
								<FaArrowLeft className="mr-1" />
							</Link>
						</div>
						<h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Ocorrências</h1>
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
									<h3 className="font-bold mb-2">Registro de Ocorrências</h3>
									<p>
										O registro de ocorrências serve para documentar todos os
										incidentes, acidentes, problemas de saúde ou situações
										relevantes envolvendo residentes e funcionários. Isso
										garante acompanhamento, prevenção e transparência.
									</p>
									<div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
								</div>
							)}
						</div>
					</div>
					
					{/* Contador de Status */}
					<div className="text-sm text-gray-600">
						<strong>{contadorPendentes}</strong> pendentes / <strong>{contadorResolvidas}</strong> resolvidas
					</div>
				</div>

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
										key={residente}
										onClick={() => {
											setResidenteSelecionado(residente);
											setFiltroResidenteAberto(false);
										}}
										className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${residenteSelecionado === residente
											? 'bg-odara-accent/20 font-semibold text-odara-accent'
											: 'text-odara-dark'
											}`}
									>
										{residente}
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
								{FILTROS.map((filtro) => (
									<button
										key={filtro.id}
										onClick={() => {
											setFiltroAtivo(filtro.id);
											setFiltroAberto(false);
										}}
										className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroAtivo === filtro.id
											? 'bg-odara-accent/20 font-semibold text-odara-accent'
											: 'text-odara-dark'
											}`}
									>
										{filtro.label}
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
								<button
									onClick={() => {
										setFiltroStatus("todos");
										setFiltroStatusAberto(false);
									}}
									className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroStatus === "todos"
										? 'bg-odara-accent/20 font-semibold text-odara-accent'
										: 'text-odara-dark'
										}`}
								>
									Todos
								</button>
								{STATUS_OPCOES.filter(opt => opt.id !== 'todos').map((opcao) => (
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
							className="flex items-center bg-odara-accent text-odara-white rounded-full px-4 py-2 shadow-sm font-medium hover:bg-odara-secondary transition"
						>
							<FaTimes className="mr-1" /> Limpar Filtros
						</button>
					)}
				</div>

				{/* Loading State */}
				{loading && (
					<div className="flex justify-center items-center py-8">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odara-accent"></div>
					</div>
				)}

				{/* Grid de Ocorrências e Calendário */}
				{!loading && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Lista de Ocorrências */}
						<div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
							<h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
								{filtroStatus === 'todos' ? 'Todas as Ocorrências' :
									`Ocorrências ${filtroStatus === 'pendente' ? 'Pendentes' : 'Resolvidas'}`}
							</h2>

							{/* Filtros ativos */}
							<div className="flex flex-wrap gap-2 mb-4">
								{filtroStatus !== 'todos' && (
									<span className="text-sm bg-odara-dropdown-accent text-odara-white px-2 py-1 rounded-full">
										Status: {filtroStatus === 'pendente' ? 'Pendente' : 'Resolvido'}
									</span>
								)}
								{filtroAtivo !== 'todos' && (
									<span className="text-sm bg-odara-primary text-odara-white px-2 py-1 rounded-full">
										Categoria: {ROTULOS_CATEGORIAS[filtroAtivo]}
									</span>
								)}
								{residenteSelecionado && (
									<span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
										Residente: {residenteSelecionado}
									</span>
								)}
							</div>

							<p className="text-odara-name/60 mb-6">
								{filtroStatus === 'todos'
									? 'Todas as ocorrências registradas'
									: filtroStatus === 'resolvido'
										? 'Ocorrências que foram resolvidas e finalizadas'
										: 'Ocorrências que ainda precisam de atenção e acompanhamento'
								}
							</p>

							<div className="space-y-4 max-h-[600px] overflow-y-auto">
								{ocorrenciasFiltradas.length === 0 ? (
									<div className="p-6 rounded-xl bg-odara-name/10 text-center">
										<p className="text-odara-dark/60">
											{filtroStatus === 'resolvido'
												? 'Nenhuma ocorrência resolvida encontrada'
												: filtroStatus === 'pendente'
													? 'Nenhuma ocorrência pendente encontrada'
													: 'Nenhuma ocorrência encontrada'
											}
										</p>
									</div>
								) : (
									ocorrenciasFiltradas.map((ocorrencia) => (
										<div
											key={ocorrencia.id}
											className={`p-4 rounded-xl hover:shadow-md transition-shadow duration-200 ${CORES_CATEGORIAS[ocorrencia.categoria]}`}
										>
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2.5">
													<span className={`w-2.5 h-2.5 rounded-full ${CORES_CALENDARIO[ocorrencia.categoria]}`}></span>
													<p className="text-base font-semibold">
														{ocorrencia.data.getDate().toString().padStart(2, '0')}/
														{(ocorrencia.data.getMonth() + 1).toString().padStart(2, '0')}/
														{ocorrencia.data.getFullYear()}
														{` - ${ocorrencia.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
													</p>
												</div>

												{/* Dropdown de Status no Card */}
												<div className="flex items-center gap-3 status-dropdown-container">
													<div className="relative">
														<button
															onClick={() => toggleDropdownStatus(ocorrencia.id)}
															className={`flex items-center rounded-lg px-3 py-1 border-2 font-medium transition-colors duration-200 text-sm min-w-[120px] justify-center ${ocorrencia.status === 'resolvido'
																? 'bg-odara-primary text-white border-odara-primary hover:bg-odara-primary/90'
																: 'bg-odara-accent text-white border-odara-accent hover:bg-odara-accent/90'
																}`}
														>
															<FaAngleDown className="mr-2 text-white" />
															{ocorrencia.status === 'resolvido' ? 'Resolvido' : 'Pendente'}
														</button>

														{/* Dropdown Menu */}
														{dropdownStatusAberto === ocorrencia.id && (
															<div className="absolute mt-1 w-32 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-20 right-0">
																<button
																	onClick={() => alterarStatus(ocorrencia.id, 'pendente')}
																	className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 transition-colors duration-200 ${ocorrencia.status === 'pendente'
																		? 'bg-odara-accent/20 font-semibold text-odara-accent'
																		: 'text-odara-dark'
																		} first:rounded-t-lg`}
																>
																	Pendente
																</button>
																<button
																	onClick={() => alterarStatus(ocorrencia.id, 'resolvido')}
																	className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 transition-colors duration-200 ${ocorrencia.status === 'resolvido'
																		? 'bg-odara-accent/20 font-semibold text-odara-accent'
																		: 'text-odara-dark'
																		} last:rounded-b-lg`}
																>
																	Resolvido
																</button>
															</div>
														)}
													</div>
												</div>
											</div>

											<h6 className="text-xl font-bold mb-1 flex items-center">
												{ocorrencia.status === 'resolvido' && (
													<span className="text-green-500 mr-2">
														<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
														</svg>
													</span>
												)}
												{ocorrencia.titulo}
											</h6>

											<p className="text-base mb-2">{ocorrencia.descricao}</p>

											{ocorrencia.providencias && (
												<div className="mb-2">
													<p className="text-sm font-semibold text-odara-dark">Providências tomadas:</p>
													<p className="text-base italic">{ocorrencia.providencias}</p>
												</div>
											)}

											<div className="flex items-center justify-between">
												<div className="flex items-center text-sm">
													<span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">
														{ROTULOS_CATEGORIAS[ocorrencia.categoria]}
													</span>

													{ocorrencia.residente && (
														<>
															<span className="mx-2">•</span>
															<span className="text-odara-name">{ocorrencia.residente.nome}</span>
														</>
													)}

													{ocorrencia.funcionario && (
														<>
															<span className="mx-2">•</span>
															<span className="text-odara-name">Registrado por: {ocorrencia.funcionario.nome}</span>
														</>
													)}
												</div>

												{/* Botões de editar e excluir */}
												<div className="flex space-x-2">
													<button
														onClick={() => abrirModalEditar(ocorrencia.id)}
														className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
														title="Editar ocorrência"
													>
														<FaEdit size={14} />
													</button>

													<button
														onClick={() => excluirOcorrencia(ocorrencia.id)}
														className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
														title="Excluir ocorrência"
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

						{/* Calendário e Estatísticas */}
						<div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
							<div className="flex justify-center mb-5">
								<button
									onClick={irParaHoje}
									className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
								>
									Hoje
								</button>
							</div>

							<div className="flex justify-center border-2 border-odara-primary rounded-xl shadow-sm overflow-hidden max-w-md mx-auto">
								<Calendar
									onChange={(date) => setDataAtual(date as Date)}
									value={dataAtual}
									onClickDay={handleDayClick}
									tileContent={getTileContent}
									tileClassName={getTileClassName}
									locale="pt-BR"
									className="border-0"
									showNeighboringMonth={false}
								/>
							</div>

							{/* Legenda de Estatísticas */}
							<div className="grid grid-cols-1 mt-6 p-3 bg-odara-offwhite rounded-lg max-w-md mx-auto">
								<h5 className='font-bold text-odara-dark text-center mb-2 text-sm sm:text-base'>
									{dataAtual
										? `Estatísticas para ${formatarDataLegenda(dataAtual)}`
										: 'Selecione uma data para visualizar as estatísticas'
									}
								</h5>

								{dataAtual ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0">
										{/* Coluna da Esquerda - Estatísticas do Dia */}
										<div className="sm:border-r border-gray-200 px-3 sm:pr-6">
											<h6 className="font-semibold text-odara-dark mb-2 text-sm">Dia</h6>
											<div className="space-y-2 text-xs">
												<div className="flex justify-between">
													<span>Ocorrências:</span>
													<span className="font-semibold">{obterOcorrenciasDoDia(dataAtual).length}</span>
												</div>

												<div className="flex justify-between">
													<span>Residentes:</span>
													<span className="font-semibold">{obterResidentesDoDia(dataAtual).length}</span>
												</div>

												<div className="flex justify-between gap-1 mt-2">
													<div className="flex-1 border-1 border-green-500 text-green-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
														{getEstatisticasDia(dataAtual).resolvidas}
													</div>

													<div className="flex-1 border-1 border-yellow-500 text-yellow-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
														{getEstatisticasDia(dataAtual).pendentes}
													</div>
												</div>
											</div>
										</div>

										{/* Coluna da Direita - Estatísticas do Mês */}
										<div className='px-3 sm:pl-6'>
											<h6 className="font-semibold text-odara-dark mb-2 text-sm">Mês</h6>
											<div className="space-y-2 text-xs">
												<div className="flex justify-between">
													<span>Ocorrências: </span>
													<span className="font-semibold">{getEstatisticasMes(dataAtual).totalRegistros}</span>
												</div>

												<div className="flex justify-between">
													<span>Residentes: </span>
													<span className="font-semibold">{getEstatisticasMes(dataAtual).totalResidentes}</span>
												</div>

												<div className="flex justify-between gap-1 mt-2">
													<div className="flex-1 border-1 border-green-500 text-green-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
														{getEstatisticasMes(dataAtual).resolvidas}
													</div>

													<div className="flex-1 border-1 border-yellow-500 text-yellow-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
														{getEstatisticasMes(dataAtual).pendentes}
													</div>
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className="text-center py-4">
										<p className="text-odara-name/60 text-sm">Selecione um dia no calendário para ver as estatísticas</p>
									</div>
								)}
							</div>

							{/* Legenda de cores */}
							<div className="mt-6 pt-6 border-t border-gray-200">
								<div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs">
									<div className="flex items-center gap-1 text-gray-500">
										<div className="w-3 h-3 rounded-full bg-green-500"></div>
										<span>Concluídos</span>
									</div>

									<div className="flex items-center gap-1 text-gray-500">
										<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
										<span>Pendentes</span>
									</div>

									<div className="flex items-center gap-1 text-gray-500">
										<div className="w-3 h-3 rounded-full bg-red-500"></div>
										<span>Atrasados</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Modal para adicionar/editar ocorrência */}
				{modalAberto && (
					<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
						<div className="bg-white text-odara-dark border-4 border-odara-primary rounded-lg py-2 p-6 w-full max-w-lg">
							<h2 className="text-xl font-bold mb-4">{editando ? "Editar Ocorrência" : "Nova Ocorrência"}</h2>

							<form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
								<input 
									type="text" 
									placeholder="Título" 
									className={`w-full border rounded-lg px-3 py-2 ${errors.titulo ? 'border-red-500' : 'border-odara-primary'}`} 
									{...register("titulo")} 
								/>
								{errors.titulo && <p className="text-red-500 text-sm">{errors.titulo.message}</p>}

								<textarea 
									placeholder="Descrição" 
									className="w-full border-odara-primary border rounded-lg px-3 py-2" 
									{...register("descricao")} 
								/>

								<textarea 
									placeholder="Providências" 
									className="w-full border-odara-primary border rounded-lg px-3 py-2" 
									{...register("providencias")} 
								/>

								<div className="flex gap-2">
									<input 
										type="date" 
										className={`border rounded-lg px-3 py-2 flex-1 ${errors.data ? 'border-red-500' : 'border-odara-primary'}`} 
										{...register("data")} 
									/>
									<input 
										type="time" 
										className={`border rounded-lg px-3 py-2 flex-1 ${errors.hora ? 'border-red-500' : 'border-odara-primary'}`} 
										{...register("hora")} 
									/>
								</div>
								{(errors.data || errors.hora) && (
									<p className="text-red-500 text-sm">{errors.data?.message || errors.hora?.message}</p>
								)}

								<div className="flex flex-col gap-2">
									<select 
										className={`flex-1 border rounded-lg px-3 py-2 ${errors.residente ? 'border-red-500' : 'border-odara-primary'}`} 
										{...register("residente")}
									>
										<option value="">Selecionar Residente</option>
										{residentes.map((r) => <option key={String(r.id)} value={String(r.id)}>{r.nome}</option>)}
									</select>
									{errors.residente && <p className="text-red-500 text-sm">{errors.residente.message}</p>}

									<select 
										className={`flex-1 border rounded-lg px-3 py-2 ${errors.funcionario ? 'border-red-500' : 'border-odara-primary'}`} 
										{...register("funcionario")}
									>
										<option value="">Selecionar Funcionário</option>
										{funcionarios.map((f) => <option key={String(f.id)} value={String(f.id)}>{f.nome}</option>)}
									</select>
									{errors.funcionario && <p className="text-red-500 text-sm">{errors.funcionario.message}</p>}
								</div>

								<select 
									className={`w-full border-odara-primary text-odara-dark border rounded-lg px-3 py-2 ${errors.categoria ? 'border-red-500' : 'border-odara-primary'}`} 
									{...register("categoria")}
								>
									<option value="">Selecionar Categoria</option>
									<option value={'acidente'}>Acidente</option>
									<option value={'saude'}>Saúde</option>
									<option value={'comportamental'}>Comportamental</option>
									<option value={'estrutural'}>Estrutural</option>
									<option value={'outro'}>Outro</option>
								</select>
								{errors.categoria && <p className="text-red-500 text-sm">{errors.categoria.message}</p>}

								<label className="flex items-center gap-2">
									<input type="checkbox" className="w-4 h-4 text-odara-accent border-gray-300 rounded" {...register("resolvido")} />
									Ocorrência Resolvida
								</label>

								<div className="mt-4 flex justify-end gap-2">
									<button 
										type="button" 
										className="px-4 border-odara-primary border py-2 rounded-lg text-odara-primary hover:text-odara-white hover:bg-odara-primary" 
										onClick={() => setModalAberto(false)}
									>
										Cancelar
									</button>
									<button 
										type="submit" 
										className="px-4 py-2 bg-odara-accent hover:bg-odara-secondary text-odara-white rounded-lg" 
										disabled={isSubmitting || loading}
									>
										{isSubmitting || loading ? "Salvando..." : "Salvar"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default RegistroOcorrencias;