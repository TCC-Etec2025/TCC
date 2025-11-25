import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle } from "react-icons/fa";
import { supabase } from "../../../lib/supabaseClient";
import ModalOcorrencias from "./ModalOcorrencias";

const CORES_CATEGORIAS: Record<string, string> = {
	"acidente": "bg-odara-dropdown-accent/80 text-odara-dark",
	"saude": "bg-odara-primary/60 text-odara-dark",
	"estrutural": "bg-odara-secondary/60 text-odara-white",
};

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

const CATEGORIAS = {
	todos: "Todos",
	acidente: "Acidente",
	saude: "Saúde",
	estrutural: "Estrutural"
};

const STATUS = {
	todos: "Todos",
	pendente: "Pendentes",
	resolvido: "Resolvidas"
};

const RegistroOcorrencias: React.FC = () => {
	const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
	const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
	const [loading, setLoading] = useState(false);
	const [modalAberto, setModalAberto] = useState(false);
	const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Ocorrencia | null>(null);
	const [infoVisivel, setInfoVisivel] = useState(false);

	const [filtros, setFiltros] = useState<{
		status: string | null;
		categoria: string | null;
		residenteId: number | null;
		startDate: string | null;
		endDate: string | null;
	}>({ status: null, categoria: null, residenteId: null, startDate: null, endDate: null });

	const contadorPendentes = ocorrencias.filter(o => !o.resolvido).length;
	const contadorResolvidas = ocorrencias.filter(o => o.resolvido).length;

	useEffect(() => {
		fetchOcorrencias();
		fetchResidentes();
	}, []);

	const fetchOcorrencias = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("ocorrencia")
				.select(`
					*,
					residente: residente!id_residente(id, nome),
					funcionario: funcionario!id_funcionario(id, nome)
					`)
				.order("data", { ascending: false });

			if (error) throw error;
			if (data) setOcorrencias(data as Ocorrencia[]);
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

	const handleDelete = async (id?: number) => {
		if (!id) return;
		const ok = confirm("Tem certeza que deseja excluir esta ocorrência?");
		if (!ok) return;
		try {
			setLoading(true);
			const { error } = await supabase.from("ocorrencia").delete().eq("id", id);
			if (error) throw error;
			setOcorrencias(prev => prev.filter(o => o.id !== id));
		} catch (err) {
			console.error("Erro ao deletar:", err);
			alert("Erro ao deletar ocorrência. Veja o console.");
		} finally {
			setLoading(false);
		}
	};

	const toggleResolvido = async (oc: Ocorrencia) => {
		try {
			setOcorrencias(prev => prev.map(p => p.id === oc.id ? { ...p, resolvido: !p.resolvido } : p));
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

	const ocorrenciasFiltradas = ocorrencias
		.filter(o => {
			if (filtros.status && filtros.status !== 'todos') {
				if (filtros.status === 'pendente' && o.resolvido) return false;
				if (filtros.status === 'resolvido' && !o.resolvido) return false;
			}
			if (filtros.categoria && filtros.categoria !== 'todos' && o.categoria !== filtros.categoria) return false;
			if (filtros.residenteId && o.residente.id !== filtros.residenteId) return false;

			const dataStr = o.data.includes('T') ? o.data.split('T')[0] : o.data.slice(0, 10);

			if (filtros.startDate && filtros.endDate) {
				if (dataStr < filtros.startDate || dataStr > filtros.endDate) return false;
			} else if (filtros.startDate && !filtros.endDate) {
				if (dataStr !== filtros.startDate) return false;
			} else if (!filtros.startDate && filtros.endDate) {
				if (dataStr !== filtros.endDate) return false;
			}
			return true;
		})
		.sort((a, b) => +new Date(b.data) - +new Date(a.data));

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

	return (
		<div className="flex min-h-screen bg-odara-offwhite">
			<ModalOcorrencias
				ocorrencia={ocorrenciaSelecionada}
				isOpen={modalAberto}
				onClose={() => setModalAberto(false)}
			/>
			<main className="flex-1 p-6 lg:p-10">
				<header className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-bold text-odara-dark">Registro de Ocorrências</h1>
						<div className="relative ml-2">
							<FaInfoCircle
								className="ml-2 text-odara-accent cursor-pointer"
								size={20}
								onMouseEnter={() => setInfoVisivel(true)}
								onMouseLeave={() => setInfoVisivel(false)}
							/>
							{infoVisivel && (
								<div className="absolute z-10 left-0 top-full mt-2 w-72 p-3 bg-odara-dropdown text-odara-name text-sm rounded-lg shadow-lg">
									<h3 className="font-bold mb-2">Registro de Ocorrências</h3>
									<p>Documenta incidentes, acidentes, saúde e situações relevantes para acompanhamento.</p>
								</div>
							)}
						</div>
					</div>
					<div className="text-sm text-gray-600">
						<strong>{contadorPendentes}</strong> pendentes / <strong>{contadorResolvidas}</strong> resolvidas
					</div>
				</header>

				{/* Painel de criação + filtros (modelo do RegistroAtividades) */}
				<details className="group mb-8 w-full">
					<summary className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer">
						<button
							type="button"
							onClick={e => { e.preventDefault(); setOcorrenciaSelecionada(null); setModalAberto(true); }}
							className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
						>
							<FaPlus className="mr-2" /> Novo Registro
						</button>
						<div className="sm:w-40">
							<div className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen transition text-sm font-medium select-none">
								<FaFilter className="mr-2" /> Filtros
							</div>
						</div>
					</summary>

					{/* Formulário de filtros */}
					<form
						onSubmit={e => {
							e.preventDefault();
							const fd = new FormData(e.currentTarget);
							const statusRaw = fd.get('status') as string;
							const catRaw = fd.get('categoria') as string;
							const resRaw = fd.get('residente') as string;
							const startRaw = fd.get('startDate') as string;
							const endRaw = fd.get('endDate') as string;
							setFiltros({
								status: statusRaw && statusRaw !== 'todos' ? statusRaw : null,
								categoria: catRaw && catRaw !== 'todos' ? catRaw : null,
								residenteId: resRaw ? Number(resRaw) : null,
								startDate: startRaw || null,
								endDate: endRaw || null
							});
						}}
						className="mt-6 bg-white p-5 rounded-xl shadow border w-full"
					>
						<div className="grid grid-cols-1 md:grid-cols-5 gap-5">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
								<select name="status" defaultValue="todos" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary">
									{Object.entries(STATUS).map(([key, label]) => (
										<option key={key} value={key}>{label}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
								<select name="categoria" defaultValue="todos" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary">
									{Object.entries(CATEGORIAS).map(([key, label]) => (
										<option key={key} value={key}>{label}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
								<select name="residente" defaultValue="" className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary">
									<option value="">Todos</option>
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
						</div>

						<div className="flex gap-2 mt-6">
							<button type="submit" className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium">
								Aplicar
							</button>
							<button
								type="button"
								onClick={() => setFiltros({ status: null, categoria: null, residenteId: null, startDate: null, endDate: null })}
								className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
							>
								Limpar
							</button>
						</div>
					</form>
				</details>

				{/* Lista */}
				<div className="bg-odara-white rounded-2xl border border-l-4 border-odara-primary shadow-lg p-6">
					<h2 className="text-2xl lg:text-4xl font-bold text-odara-dark mb-4">
						{filtros.status
							? (filtros.status === 'pendente' ? 'Ocorrências Pendentes'
								: filtros.status === 'resolvido' ? 'Ocorrências Resolvidas'
									: 'Ocorrências')
							: 'Ocorrências'}
					</h2>

					<div className="space-y-4 max-h-[600px] overflow-y-auto">
						{loading && <p className="text-center text-gray-500">Carregando...</p>}
						{!loading && ocorrenciasFiltradas.length === 0 && (
							<p className="text-center text-gray-500">Nenhuma ocorrência encontrada</p>
						)}

						{!loading && ocorrenciasFiltradas.map(o => {
							const { data, hora } = formatData(o.data);
							return (
								<div key={o.id} className="p-4 rounded-lg bg-white shadow flex items-start gap-4">
									<div className={`w-4 h-4 rounded-full mt-1 ${CORES_CATEGORIAS[o.categoria] || "bg-gray-400"}`} />
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
										<div className="flex space-x-2">
											<button
												onClick={() => { setOcorrenciaSelecionada(o); setModalAberto(true); }}
												className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
												title="Editar Ocorrência"
											>
												<FaEdit size={14} />
											</button>
											<button
												onClick={() => handleDelete(o.id)}
												className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
												title="Excluir Ocorrência"
											>
												<FaTrash size={14} />
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>

				</div>
			</main>
		</div>
	);
};

export default RegistroOcorrencias;