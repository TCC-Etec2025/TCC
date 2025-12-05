import React, { useEffect, useState, useRef, useCallback } from "react";
import { Plus, Edit, Trash, Info, ChevronDown, Check, Siren, Filter, Search, CheckCircle, Clock, RockingChair, UsersRound, AlertTriangle, type LucideIcon } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import ModalOcorrencias from "./ModalOcorrencias";
import toast, { Toaster } from "react-hot-toast";

/* Tipos */
type ResidenteFuncionario = {
	id: number;
	nome: string;
	quarto?: string | null;
};

// Atualize o tipo Ocorrencia - descricao não pode ser null
type Ocorrencia = {
	id: number;
	titulo: string;
	descricao: string; // ← Alterado: removido | null
	providencias?: string | null;
	data: string;
	residente: ResidenteFuncionario | null;
	funcionario: ResidenteFuncionario;
	categoria: string;
	status: boolean;
	criado_em?: string | null;
};

/* Constantes */
const COR_STATUS: Record<string, {
	bola: string;
	bg: string;
	text: string;
	border: string;
	icon: LucideIcon;
}> = {
	resolvido: {
		bola: 'bg-green-500',
		bg: 'bg-green-50',
		text: 'text-odara-dark',
		border: 'border-b border-green-200',
		icon: CheckCircle
	},
	pendente: {
		bola: 'bg-yellow-500',
		bg: 'bg-yellow-50',
		text: 'text-odara-dark',
		border: 'border-b border-yellow-200',
		icon: Clock
	},
};

const CATEGORIAS_FILTRO = [
	{ value: 'todos', label: 'Todas as categorias' },
	{ value: 'acidente', label: 'Acidente' },
	{ value: 'clinico', label: 'Clínico' },
	{ value: 'estrutural', label: 'Estrutural' },
	{ value: 'comportamental', label: 'Comportamental' },
	{ value: 'operacional', label: 'Operacional' },
	{ value: 'juridico', label: 'Jurídico' },
	{ value: 'social', label: 'Social' },
	{ value: 'seguranca', label: 'Segurança' }
];

const STATUS_FILTRO = [
	{ value: 'todos', label: 'Todos os status' },
	{ value: 'pendente', label: 'Pendentes' },
	{ value: 'resolvido', label: 'Resolvidas' }
];

const RegistroOcorrencias: React.FC = () => {
	// Estados principais
	const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
	const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
	const [loading, setLoading] = useState(false);

	// Estados do modal
	const [modalAberto, setModalAberto] = useState(false);
	const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Ocorrencia | null>(null);

	// Estados de exclusão
	const [modalExclusaoAberto, setModalExclusaoAberto] = useState<boolean>(false);
	const [ocorrenciaParaExcluir, setOcorrenciaParaExcluir] = useState<number | null>(null);

	// Estados de busca e filtros
	const [searchTerm, setSearchTerm] = useState('');
	const [filtros, setFiltros] = useState<{
		categoria: string | null;
		status: string | null;
		residenteId: number | null;
		startDate: string | null;
		endDate: string | null;
	}>({
		categoria: null,
		status: null,
		residenteId: null,
		startDate: null,
		endDate: null
	});

	// Estados de UI
	const [filtroCategoriaAberto, setFiltroCategoriaAberto] = useState(false);
	const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
	const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
	const [filtrosAberto, setFiltrosAberto] = useState(false);

	// Refs para dropdowns
	const filtroCategoriaRef = useRef<HTMLDivElement>(null);
	const filtroStatusRef = useRef<HTMLDivElement>(null);
	const filtroResidenteRef = useRef<HTMLDivElement>(null);

	/* Utilitários */
	const formatarData = (dataString: string) => {
		try {
			const data = new Date(dataString);
			return {
				data: data.toLocaleDateString("pt-BR"),
				hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
			};
		} catch {
			return { data: "-", hora: "-" };
		}
	};

	const formatarDataParaExibicao = (data: string) => {
		return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
	};

	const obterResidentesUnicos = () => {
		const residentesMap = new Map<number, ResidenteFuncionario>();
		ocorrencias
			.filter(o => o.residente) // Filtra apenas os que têm residente
			.forEach(o => {
				if (o.residente) {
					residentesMap.set(o.residente.id, o.residente);
				}
			});
		return Array.from(residentesMap.values());
	};

	/* Efeitos */
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (filtroCategoriaRef.current && !filtroCategoriaRef.current.contains(event.target as Node)) {
				setFiltroCategoriaAberto(false);
			}
			if (filtroStatusRef.current && !filtroStatusRef.current.contains(event.target as Node)) {
				setFiltroStatusAberto(false);
			}
			if (filtroResidenteRef.current && !filtroResidenteRef.current.contains(event.target as Node)) {
				setFiltroResidenteAberto(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	/* Carregar Dados */
	const carregarOcorrencias = useCallback(async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("ocorrencia")
				.select(`
					*,
					residente:residente!id_residente(id, nome, quarto),
					funcionario:funcionario!id_funcionario(id, nome)
				`)
				.order("data", { ascending: false })
				.order("horario", { ascending: false });

			if (error) throw error;

			// Combina data e horário em uma string ISO para o frontend
			const ocorrenciasFormatadas = (data || []).map(item => ({
				...item,
				data: `${item.data}T${item.horario}`,
				descricao: item.descricao || "", // ← Garante que descricao não seja null
				residente: item.residente || null
			})) as Ocorrencia[];

			setOcorrencias(ocorrenciasFormatadas);
		} catch (err) {
			console.error("Erro ao buscar ocorrências:", err);
			toast.error("Erro ao carregar ocorrências");
		} finally {
			setLoading(false);
		}
	}, []);

	const carregarResidentes = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("residente")
				.select("id, nome, quarto")
				.order("nome", { ascending: true });

			if (error) throw error;
			setResidentes(data || []);
		} catch (err) {
			console.error("Erro ao buscar residentes:", err);
			toast.error("Erro ao carregar residentes");
		}
	}, []);

	useEffect(() => {
		carregarOcorrencias();
		carregarResidentes();
	}, [carregarOcorrencias, carregarResidentes]);

	/* Handlers de Operações */
	const alternarStatusResolvido = async (ocorrencia: Ocorrencia) => {
		try {
			const novoStatus = !ocorrencia.status;

			// Atualizar localmente primeiro para feedback imediato
			setOcorrencias(prev =>
				prev.map(o =>
					o.id === ocorrencia.id ? { ...o, status: novoStatus } : o
				)
			);

			// Atualizar no banco
			const { error } = await supabase
				.from("ocorrencia")
				.update({ status: novoStatus })
				.eq("id", ocorrencia.id);

			if (error) throw error;

			toast.success(`Ocorrência ${novoStatus ? 'resolvida' : 'marcada como pendente'}`);
		} catch (err) {
			console.error("Erro ao alternar status:", err);
			toast.error("Erro ao atualizar status");
			// Reverter mudança local em caso de erro
			carregarOcorrencias();
		}
	};

	/* Handlers de Exclusão */
	const abrirModalExclusao = (id: number) => {
		setOcorrenciaParaExcluir(id);
		setModalExclusaoAberto(true);
	};

	const fecharModalExclusao = () => {
		setModalExclusaoAberto(false);
		setOcorrenciaParaExcluir(null);
	};

	const executarExclusao = async () => {
		if (!ocorrenciaParaExcluir) return;

		try {
			const { error } = await supabase
				.from("ocorrencia")
				.delete()
				.eq("id", ocorrenciaParaExcluir);

			if (error) throw error;

			// Atualiza a lista localmente
			setOcorrencias(prev => prev.filter(o => o.id !== ocorrenciaParaExcluir));
			toast.success('Ocorrência excluída com sucesso!');
		} catch (err) {
			console.error('Erro ao excluir ocorrência:', err);
			toast.error('Erro ao excluir ocorrência');
		} finally {
			fecharModalExclusao();
		}
	};

	/* Handlers de UI */
	const abrirModalEdicao = (ocorrencia: Ocorrencia) => {
		setOcorrenciaSelecionada(ocorrencia);
		setModalAberto(true);
	};

	const abrirModalNova = () => {
		setOcorrenciaSelecionada(null);
		setModalAberto(true);
	};

	const fecharModal = () => {
		setModalAberto(false);
		setOcorrenciaSelecionada(null);
		carregarOcorrencias();
	};

	const toggleFiltros = () => {
		setFiltrosAberto(!filtrosAberto);
	};

	const selecionarCategoria = (categoria: string | null) => {
		setFiltros(prev => ({ ...prev, categoria: categoria === 'todos' ? null : categoria }));
		setFiltroCategoriaAberto(false);
	};

	const selecionarStatus = (status: string | null) => {
		setFiltros(prev => ({ ...prev, status: status === 'todos' ? null : status }));
		setFiltroStatusAberto(false);
	};

	const selecionarResidente = (residenteId: number | null) => {
		setFiltros(prev => ({ ...prev, residenteId }));
		setFiltroResidenteAberto(false);
	};

	const limparFiltros = () => {
		setFiltros({
			categoria: null,
			status: null,
			residenteId: null,
			startDate: null,
			endDate: null
		});
		setSearchTerm('');
		setFiltroStatusAberto(false);
		setFiltroCategoriaAberto(false);
		setFiltroResidenteAberto(false);
	};

	/* Filtragem */
	const ocorrenciasFiltradas = ocorrencias.filter(ocorrencia => {
		// Filtro por texto (busca em título, descrição, nome do residente e categoria)
		if (searchTerm.trim()) {
			const termo = searchTerm.toLowerCase();
			const buscaTitulo = ocorrencia.titulo?.toLowerCase().includes(termo) || false;
			const buscaDescricao = ocorrencia.descricao.toLowerCase().includes(termo); // ← Agora é obrigatório
			const buscaResidente = ocorrencia.residente?.nome.toLowerCase().includes(termo) || false;
			const buscaCategoria = ocorrencia.categoria.toLowerCase().includes(termo) || false;

			if (!buscaTitulo && !buscaDescricao && !buscaResidente && !buscaCategoria) {
				return false;
			}
		}

		// Filtro por categoria
		if (filtros.categoria && ocorrencia.categoria !== filtros.categoria) {
			return false;
		}

		// Filtro por status
		if (filtros.status) {
			if (filtros.status === 'pendente' && ocorrencia.status) return false;
			if (filtros.status === 'resolvido' && !ocorrencia.status) return false;
		}

		// Filtro por residente
		if (filtros.residenteId) {
			if (!ocorrencia.residente || ocorrencia.residente.id !== filtros.residenteId) {
				return false;
			}
		}

		// Filtro por data
		if (filtros.startDate || filtros.endDate) {
			if (filtros.startDate && ocorrencia.data < filtros.startDate) return false;
			if (filtros.endDate && ocorrencia.data > filtros.endDate) return false;
		}

		return true;
	});

	/* Componentes de UI */
	const FiltroDropdown = ({
		titulo,
		aberto,
		setAberto,
		ref,
		valorSelecionado,
		onSelecionar,
		tipo
	}: {
		titulo: string;
		aberto: boolean;
		setAberto: (aberto: boolean) => void;
		ref: React.RefObject<HTMLDivElement>;
		valorSelecionado: string | number | null;
		onSelecionar: (value: string | number | null) => void;
		tipo: 'categoria' | 'status' | 'residente';
	}) => {
		const opcoes = tipo === 'categoria' ? CATEGORIAS_FILTRO :
			tipo === 'status' ? STATUS_FILTRO :
				[];

		const residentesUnicos = obterResidentesUnicos();

		return (
			<div className="relative" ref={ref}>
				<button
					type="button"
					onClick={() => setAberto(!aberto)}
					className="flex items-center justify-between w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors text-odara-dark"
				>
					<span className="truncate">
						{tipo === 'residente'
							? valorSelecionado
								? residentesUnicos.find(r => r.id === valorSelecionado)?.nome
								: titulo
							: tipo === 'categoria'
								? valorSelecionado
									? CATEGORIAS_FILTRO.find(opt => opt.value === valorSelecionado)?.label
									: titulo
								: tipo === 'status'
									? valorSelecionado
										? STATUS_FILTRO.find(opt => opt.value === valorSelecionado)?.label
										: titulo
									: titulo
						}
					</span>
					<ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500 shrink-0" />
				</button>

				{aberto && (
					<div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
						{tipo === 'residente' ? (
							<>
								<button
									onClick={() => onSelecionar(null)}
									className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${!valorSelecionado
										? 'bg-odara-primary/20 text-odara-primary font-semibold'
										: 'text-gray-700'
										}`}
								>
									<span>Todos os residentes</span>
									{!valorSelecionado && <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
								</button>
								{residentesUnicos.map((residente) => (
									<button
										key={residente.id}
										onClick={() => onSelecionar(residente.id)}
										className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${valorSelecionado === residente.id
											? 'bg-odara-primary/20 text-odara-primary font-semibold'
											: 'text-gray-700'
											}`}
									>
										<span className="truncate">{residente.nome} {residente.quarto ? `(Q ${residente.quarto})` : ''}</span>
										{valorSelecionado === residente.id && <Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />}
									</button>
								))}
							</>
						) : (
							opcoes.map((opcao) => (
								<button
									key={opcao.value}
									onClick={() => onSelecionar(opcao.value)}
									className={`flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-odara-primary/10 transition ${(opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value
										? 'bg-odara-primary/20 text-odara-primary font-semibold'
										: 'text-gray-700'
										}`}
								>
									<span>{opcao.label}</span>
									{((opcao.value === 'todos' && !valorSelecionado) || valorSelecionado === opcao.value) && (
										<Check className="ml-auto text-odara-primary w-3 h-3 sm:w-3.5 sm:h-3.5" />
									)}
								</button>
							))
						)}
					</div>
				)}
			</div>
		);
	};

	const SecaoFiltros = () => {
		if (!filtrosAberto) return null;

		return (
			<div className="mb-6 bg-white p-4 sm:p-5 rounded-xl shadow border border-gray-200 animate-fade-in">
				{/* Primeira Linha */}
				<div className="flex flex-col md:flex-row gap-4 sm:gap-5 w-full">
					<div className='flex flex-col md:flex-row flex-1 gap-4 sm:gap-5 w-full'>
						{/* Filtro de Categoria */}
						<div className="flex-1 min-w-0">
							<div className='flex gap-1 items-center ml-1 mb-1'>
								<Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
								<label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Categoria</label>
							</div>

							<FiltroDropdown
								titulo="Todas as categorias"
								aberto={filtroCategoriaAberto}
								setAberto={setFiltroCategoriaAberto}
								ref={filtroCategoriaRef}
								valorSelecionado={filtros.categoria || 'todos'}
								onSelecionar={selecionarCategoria as (value: string | number | null) => void}
								tipo="categoria"
							/>
						</div>

						{/* Filtro de Status */}
						<div className="flex-1 min-w-0">
							<div className='flex gap-1 items-center ml-1 mb-1'>
								<Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
								<label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Status</label>
							</div>

							<FiltroDropdown
								titulo="Todos os status"
								aberto={filtroStatusAberto}
								setAberto={setFiltroStatusAberto}
								ref={filtroStatusRef}
								valorSelecionado={filtros.status || 'todos'}
								onSelecionar={selecionarStatus as (value: string | number | null) => void}
								tipo="status"
							/>
						</div>

						{/* Filtro de Residente */}
						<div className="flex-1 min-w-0">
							<div className='flex gap-1 items-center ml-1 mb-1'>
								<Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
								<label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Residente</label>
							</div>

							<FiltroDropdown
								titulo="Todos os residentes"
								aberto={filtroResidenteAberto}
								setAberto={setFiltroResidenteAberto}
								ref={filtroResidenteRef}
								valorSelecionado={filtros.residenteId}
								onSelecionar={selecionarResidente as (value: string | number | null) => void}
								tipo="residente"
							/>
						</div>
					</div>

					{/* Botões de ação dos filtros */}
					<div className="flex md:items-end gap-2 pt-1 md:pt-0 md:shrink-0">
						<button
							onClick={limparFiltros}
							className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full md:w-auto justify-center"
						>
							Limpar Filtros
						</button>
					</div>
				</div>

				{/* Segunda Linha */}
				{/* Filtros de data */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200">
					{/* A Partir da Data */}
					<div>
						<div className='flex gap-1 items-center ml-1 mb-1'>
							<Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
							<label className="block text-xs sm:text-sm font-semibold text-odara-secondary">A Partir da Data</label>
						</div>

						<input
							type="date"
							value={filtros.startDate || ''}
							onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value || null }))}
							className="w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
						/>
					</div>

					{/* Até a Data */}
					<div>
						<div className='flex gap-1 items-center ml-1 mb-1'>
							<Filter size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
							<label className="block text-xs sm:text-sm font-semibold text-odara-secondary">Até a Data</label>
						</div>

						<input
							type="date"
							value={filtros.endDate || ''}
							onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value || null }))}
							className="w-full h-9 sm:h-10 border border-gray-300 rounded-lg px-3 text-xs sm:text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
						/>
					</div>
				</div>
			</div>
		);
	};

	const ModalConfirmacaoExclusao = () => {
		if (!modalExclusaoAberto) return null;

		// Obter o título da ocorrência para exibir no modal
		const ocorrencia = ocorrenciaParaExcluir
			? ocorrencias.find(o => o.id === ocorrenciaParaExcluir)
			: null;
		const tituloOcorrencia = ocorrencia?.titulo || '';

		return (
			<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4 animate-fade-in">
				<div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full animate-scale-in">
					<div className="text-center">
						{/* Ícone de alerta */}
						<div className="mx-auto flex items-center justify-center h-12 sm:h-14 w-12 sm:w-14 rounded-full bg-odara-alerta/10 mb-3 sm:mb-4">
							<AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-odara-alerta" />
						</div>

						{/* Textos do modal */}
						<h3 className="text-lg sm:text-xl font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
						<p className="text-odara-name text-sm sm:text-base mb-3 sm:mb-4">
							Tem certeza que deseja excluir esta ocorrência?
						</p>

						{/* Detalhes da ocorrência */}
						{tituloOcorrencia && (
							<div className="bg-odara-offwhite rounded-lg p-3 mb-3 sm:mb-4 border border-gray-200">
								<p className="text-sm font-medium text-odara-dark">Ocorrência:</p>
								<p className="text-sm font-semibold text-odara-name truncate" title={tituloOcorrencia}>
									{tituloOcorrencia}
								</p>
							</div>
						)}

						<p className="text-xs sm:text-sm text-odara-alerta mb-4 sm:mb-6 font-medium">
							Esta ação não pode ser desfeita.
						</p>

						{/* Botões de ação */}
						<div className="flex gap-2 sm:gap-3 justify-center">
							<button
								onClick={fecharModalExclusao}
								className="px-4 sm:px-6 py-2 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 flex-1 text-sm"
								autoFocus
							>
								Cancelar
							</button>
							
							<button
								onClick={executarExclusao}
								className="px-4 sm:px-5 py-2 bg-odara-alerta text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex-1 text-sm"
							>
								Excluir
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const CardOcorrencia = ({ ocorrencia }: { ocorrencia: Ocorrencia }) => {
		const { data, hora } = formatarData(ocorrencia.data);
		const coresStatus = ocorrencia.status ? COR_STATUS.resolvido : COR_STATUS.pendente;
		const IconeStatus = coresStatus.icon;

		// Encontrar o label da categoria
		const categoriaInfo = CATEGORIAS_FILTRO.find(cat => cat.value === ocorrencia.categoria);
		const categoriaLabel = categoriaInfo?.label || ocorrencia.categoria;

		return (
			<div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
				{/* Header do Card */}
				<div className={`flex flex-wrap justify-center sm:justify-between gap-2 items-center p-2 sm:p-3 rounded-t-lg ${coresStatus.border} ${coresStatus.bg}`}>
					<div className="flex items-center">
						<div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 ${coresStatus.bola}`}></div>
						<p className="text-xs sm:text-sm md:text-base text-odara-dark">
							<span className='font-semibold'>
								{data}
							</span>
							<span className="text-odara-accent ml-1 sm:ml-2">• {' ' + hora}
							</span>
						</p>
					</div>

					{/* Status */}
					<button
						onClick={() => alternarStatusResolvido(ocorrencia)}
						className="flex items-center gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
					>
						<IconeStatus size={12} className="sm:w-3.5 sm:h-3.5 text-odara-accent" />
						<span className="text-odara-dark capitalize">
							{ocorrencia.status ? "Resolvido" : "Pendente"}
						</span>
						<ChevronDown size={10} className="sm:w-3 sm:h-3 text-gray-500" />
					</button>
				</div>

				{/* Corpo do Card */}
				<div className="p-3 sm:p-4 flex-1 flex flex-col">
					{/* Título e Data/Hora */}
					<div className="flex items-start justify-between mb-2 sm:mb-3">
						<div className="flex-1">
							<h3 className="text-sm sm:text-base md:text-lg font-bold text-odara-dark line-clamp-2">
								{ocorrencia.titulo}
							</h3>
						</div>

						{/* Botões de ação */}
						<div className="flex items-center gap-1 ml-2">
							<button
								onClick={() => abrirModalEdicao(ocorrencia)}
								className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-dropdown-accent"
								title="Editar ocorrência"
							>
								<Edit size={12} className="sm:w-3.5 sm:h-3.5" />
							</button>
							<button
								onClick={() => abrirModalExclusao(ocorrencia.id)}
								className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-1.5 sm:p-2 rounded-full hover:bg-odara-alerta"
								title="Excluir ocorrência"
							>
								<Trash size={12} className="sm:w-3.5 sm:h-3.5" />
							</button>
						</div>
					</div>

					{/* GRID 2 COLUNAS + DESCRIÇÃO ABAIXO */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

						{/* Categoria */}
						{ocorrencia.categoria && (
							<div>
								<strong className="text-odara-dark text-xs sm:text-sm">Categoria:</strong>
								<span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
									{categoriaLabel}
								</span>
							</div>
						)}

						{/* Providências */}
						{ocorrencia.providencias && (
							<div>
								<strong className="text-odara-dark text-xs sm:text-sm">Providências:</strong>
								<span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
									{ocorrencia.providencias}
								</span>
							</div>
						)}

					</div>

					{/* Descrição (linha inteira) */}
					<div className="mt-3">
						<strong className="text-odara-dark text-xs sm:text-sm">Descrição:</strong>
						<span className="text-odara-name mt-0.5 sm:mt-1 text-xs sm:text-sm block">
							{ocorrencia.descricao}
						</span>
					</div>
				</div>

				{/* Footer */}
				<div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
					<div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2 text-xs">
						{/* Lado esquerdo: Residente e Funcionário*/}
						<div className="flex items-center flex-wrap gap-1 justify-center sm:justify-start">
							{ocorrencia.residente?.nome ? (
								<>
									<span className="inline-flex items-center gap-1 bg-odara-accent text-white px-2 py-1 rounded-full text-xs font-medium">
										<RockingChair size={10} className="sm:w-3 sm:h-3" />
										{ocorrencia.residente.nome}
										{ocorrencia.residente?.quarto && (
											<span className="ml-1 text-xs opacity-75">
												(Q {ocorrencia.residente.quarto})
											</span>
										)}
									</span>
									<span className="text-odara-accent mx-1 hidden sm:inline">•</span>
								</>
							) : ''}

							<span className="text-xs text-odara-dark inline-flex items-center gap-1">
								<UsersRound size={9} className="sm:w-2.5 sm:h-2.5 text-odara-accent" />
								{ocorrencia.funcionario?.nome || "Não informado"}
							</span>
						</div>

						{/* Lado direito: Data de criação - alinhado à direita */}
						<div className="text-xs text-odara-name flex items-center gap-1 justify-center sm:justify-start mt-1 sm:mt-0">
							<Clock size={9} className="sm:w-2.5 sm:h-2.5" />
							Criado: {ocorrencia.criado_em ? new Date(ocorrencia.criado_em).toLocaleDateString('pt-BR') : 'N/A'}
						</div>
					</div>
				</div>
			</div>
		);
	};

	const Cabecalho = () => {
		const [infoVisivel, setInfoVisivel] = useState(false);

		return (
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div className="flex items-start sm:items-center gap-3 w-full">
					<Siren size={24} className='sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-odara-accent shrink-0 mt-1 sm:mt-0' />
					
					<div className="flex-1 min-w-0 relative">
						<div className="flex items-center gap-0.1 sm:gap-2">
							<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-odara-dark flex-1 truncate">
								Registro de Ocorrências
							</h1>
							
							<button
								onClick={() => setInfoVisivel(!infoVisivel)}
								className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ml-1"
								aria-label="Informações"
							>
								<Info size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-odara-accent" />
							</button>
						</div>
						
						{infoVisivel && (
							<div className="absolute z-10 top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-80 bg-blue-50 border border-blue-100 rounded-lg shadow-lg animate-fade-in">
								<div className="p-3 sm:p-4">
									<p className="text-xs sm:text-sm text-odara-dark">
										<strong className="font-semibold">Como usar:</strong> Documenta incidentes, acidentes, complicações e situações relevantes para acompanhamento.
									</p>
									<button
										onClick={() => setInfoVisivel(false)}
										className="mt-2 text-xs sm:text-sm text-odara-accent hover:text-odara-secondary font-medium"
									>
										Entendi
									</button>
								</div>
								{/* Seta do tooltip para desktop */}
								<div className="hidden sm:block absolute -top-2 right-4 w-4 h-4 bg-blue-50 border-t border-l border-blue-100 transform rotate-45"></div>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	const BotaoNovaOcorrencia = () => {
		return (
			<button
				onClick={abrirModalNova}
				className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-3 sm:px-4 rounded-lg flex items-center transition text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-max justify-center"
			>
				<Plus className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" /> Nova Ocorrência
			</button>
		);
	};

	const ListaOcorrencias = () => {
		return (
			<div className="bg-white border-l-4 border-odara-primary rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
					<h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-odara-dark">Ocorrências</h2>
					<span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
						Total: {ocorrenciasFiltradas.length} de {ocorrencias.length}
					</span>
				</div>

				{/* Tags de filtros ativos */}
				{(filtros.categoria || filtros.status || filtros.residenteId || filtros.startDate || filtros.endDate || searchTerm) && (
					<div className="mb-3 flex flex-wrap justify-center sm:justify-start gap-1 text-xs">
						{searchTerm && (
							<span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
								Busca: "{searchTerm}"
							</span>
						)}
						{filtros.categoria && (
							<span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
								Categoria: {filtros.categoria}
							</span>
						)}
						{filtros.status && (
							<span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
								Status: {filtros.status === 'pendente' ? 'Pendentes' : 'Resolvidas'}
							</span>
						)}
						{filtros.residenteId && (
							<span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
								<RockingChair size={10} />
								Residente: {residentes.find(r => r.id === filtros.residenteId)?.nome}
							</span>
						)}
						{(filtros.startDate || filtros.endDate) && (
							<span className="bg-odara-secondary text-white px-2 py-1 rounded-full text-xs">
								Data: {filtros.startDate ? ` ${formatarDataParaExibicao(filtros.startDate)}` : ''}
								{filtros.endDate ? ' até' + ` ${formatarDataParaExibicao(filtros.endDate)}` : ''}
							</span>
						)}
					</div>
				)}

				{/* Lista ou mensagem de vazio */}
				{loading ? (
					<div className="p-6 text-center">
						<p className="text-odara-dark/60 text-sm sm:text-lg">Carregando ocorrências...</p>
					</div>
				) : ocorrenciasFiltradas.length === 0 ? (
					<div className="p-6 rounded-lg sm:rounded-xl bg-odara-name/10 text-center">
						<p className="text-odara-dark/60 text-sm sm:text-lg">
							{ocorrencias.length === 0 ? 'Nenhuma ocorrência registrada' : 'Nenhuma ocorrência encontrada'}
						</p>
						{ocorrencias.length > 0 && (
							<p className="text-odara-dark/40 text-xs sm:text-sm mt-1 sm:mt-2">
								Tente ajustar os termos da busca ou os filtros
							</p>
						)}
					</div>
				) : (
					<div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
						{ocorrenciasFiltradas.map(ocorrencia => (
							<CardOcorrencia
								key={ocorrencia.id}
								ocorrencia={ocorrencia}
							/>
						))}
					</div>
				)}
			</div>
		);
	};

	/* Renderização Principal */
	return (
		<div className="min-h-screen bg-odara-offwhite overflow-x-hidden">
			{/* Modal de Ocorrências */}
			<ModalOcorrencias
				ocorrencia={ocorrenciaSelecionada}
				isOpen={modalAberto}
				onClose={fecharModal}
			/>

			{/* Modal de Confirmação de Exclusão */}
			<ModalConfirmacaoExclusao />

			{/* Toaster para notificações */}
			<Toaster
				position="top-center"
				toastOptions={{
					duration: 4000,
					style: {
						background: '#e4edfdff',
						color: '#52323a',
						border: '1px solid #0036caff',
						borderRadius: '12px',
						fontSize: '14px',
						fontWeight: '500',
					},
					success: {
						style: {
							background: '#f0fdf4',
							color: '#52323a',
							border: '1px solid #00c950',
						},
					},
					error: {
						style: {
							background: '#fce7e7ff',
							color: '#52323a',
							border: '1px solid #c90d00ff',
						},
					},
				}}
			/>

			<div className="p-3 sm:p-6 lg:p-8 max-w-full overflow-hidden">
				{/* Cabeçalho e Botão Novo */}
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6'>
					<Cabecalho />
					<div className="w-full sm:w-auto">
						<BotaoNovaOcorrencia />
					</div>
				</div>

				{/* Barra de Busca e Filtros */}
				<div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
					{/* Barra de Busca */}
					<div className="flex-1 relative min-w-0">
						<div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
							<Search className="text-odara-primary h-3 w-3 sm:h-4 sm:w-4" />
						</div>

						<input
							type="text"
							placeholder="Buscar por título, descrição, residente ou categoria..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-2 bg-white rounded-lg border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent text-xs sm:text-sm"
						/>
					</div>

					{/* Botão ativador do modal de filtros */}
					<div className="flex gap-2">
						<button
							onClick={toggleFiltros}
							className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-2 sm:px-4 py-2 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition w-full sm:w-max justify-center text-xs sm:text-sm"
						>
							<Filter size={16} className="sm:w-5 sm:h-5 text-odara-accent" />
							<span>
								{!filtrosAberto ? 'Abrir ' : 'Fechar '} Filtros
							</span>
						</button>
					</div>
				</div>

				{/* Seção de Filtros */}
				<SecaoFiltros />

				{/* Lista de Ocorrências */}
				<ListaOcorrencias />

				{/* Contador de resultados */}
				<div className="mt-3 text-xs sm:text-sm text-gray-400">
					Total de {ocorrenciasFiltradas.length} ocorrência(s) encontrada(s) de {ocorrencias.length}
					{searchTerm && <span> para "{searchTerm}"</span>}
				</div>
			</div>
		</div>
	);
};

export default RegistroOcorrencias;