import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaTimes,
  FaInfoCircle,
  FaFilter,
  FaCheck,
  FaClock,
  FaAngleDown,
} from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// ===== CONSTANTES =====

const STATUS = {
  ATIVOS: 'ativos',
  SUSPENSOS: 'suspensos',
  FINALIZADOS: 'finalizados'
};

const ROTULOS_STATUS = {
  [STATUS.ATIVOS]: "Ativos",
  [STATUS.SUSPENSOS]: "Suspensos",
  [STATUS.FINALIZADOS]: "Finalizados"
};

const ROTULOS_STATUS_SINGULAR = {
  [STATUS.ATIVOS]: "Ativo",
  [STATUS.SUSPENSOS]: "Suspenso",
  [STATUS.FINALIZADOS]: "Finalizado"
};

// Cores para status
const CORES_STATUS = {
  [STATUS.ATIVOS]: {
    bg: 'bg-green-500',
    text: 'text-white',
    hover: 'hover:bg-green-600',
    border: 'border-green-500'
  },
  [STATUS.SUSPENSOS]: {
    bg: 'bg-yellow-500',
    text: 'text-white',
    hover: 'hover:bg-yellow-600',
    border: 'border-yellow-500'
  },
  [STATUS.FINALIZADOS]: {
    bg: 'bg-gray-500',
    text: 'text-white',
    hover: 'hover:bg-gray-600',
    border: 'border-gray-500'
  }
};

// Constantes para controle
const CONTROLES = {
  TODOS: 'todos',
  CONCLUIDO: 'concluido',
  PENDENTE: 'pendente',
  ATRASADO: 'atrasado'
};

const ROTULOS_CONTROLES = {
  [CONTROLES.TODOS]: "Todos",
  [CONTROLES.CONCLUIDO]: "Concluído",
  [CONTROLES.PENDENTE]: "Pendente",
  [CONTROLES.ATRASADO]: "Atrasado"
};

// Configurações visuais para controle
const CONFIGS_CONTROLE = {
  [CONTROLES.CONCLUIDO]: {
    corBolinha: 'bg-green-500',
    corCheckbox: 'text-green-500 border-green-500',
    corTarja: 'bg-green-500 text-white',
    corFundo: 'bg-green-50',
    texto: 'Concluído',
    icone: <FaCheck size={10} />
  },
  [CONTROLES.PENDENTE]: {
    corBolinha: 'bg-yellow-500',
    corCheckbox: 'text-yellow-500 border-yellow-500',
    corTarja: 'bg-yellow-500 text-white',
    corFundo: 'bg-yellow-50',
    texto: 'Pendente',
    icone: <FaClock size={10} />
  },
  [CONTROLES.ATRASADO]: {
    corBolinha: 'bg-red-500',
    corCheckbox: 'text-red-500 border-red-500',
    corTarja: 'bg-red-500 text-white',
    corFundo: 'bg-red-50',
    texto: 'Atrasado',
    icone: <FaTimes size={10} />
  }
};

// ===== TIPOS =====
type ResidenteFuncionario = { id: number; nome: string };

type RegistroAlimentar = {
  id: number;
  data: Date;
  horario: string;
  alimento: string;
  residente: ResidenteFuncionario;
  funcionario: ResidenteFuncionario;
  status: string;
  concluido: boolean;
  criado_em?: string | null;
};

type FormValues = {
  id?: number;
  data: string;
  horario: string;
  alimento: string;
  residente: number;
  funcionario: number;
  status: string;
  concluido?: boolean;
};

// ===== VALIDAÇÃO YUP =====
const schema = yup.object({
  data: yup.string().required("Data é obrigatória"),
  horario: yup.string().required("Horário é obrigatório"),
  alimento: yup.string().required("Alimento é obrigatório"),
  residente: yup.number().required("Residente é obrigatório"),
  funcionario: yup.number().required("Funcionário é obrigatório"),
  status: yup.string().required("Status é obrigatório"),
  concluido: yup.boolean(),
}).required();

// ===== COMPONENTE =====
const RegistroAlimentar: React.FC = () => {
  // ===== ESTADOS =====
  const [registros, setRegistros] = useState<RegistroAlimentar[]>([]);
  const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
  const [funcionarios, setFuncionarios] = useState<ResidenteFuncionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [dataAtual, setDataAtual] = useState<Date>(new Date());
  const [filtroDia, setFiltroDia] = useState<Date | null>(null);
  const [filtroDiaAtivo, setFiltroDiaAtivo] = useState(false);
  const [filtroResidente, setFiltroResidente] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [infoVisivel, setInfoVisivel] = useState(false);

  // Estados para controle ativo
  const [controleAtivo, setControleAtivo] = useState(false);
  const [filtroControle, setFiltroControle] = useState('todos');

  // Dropdown aberto
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroControleAberto, setFiltroControleAberto] = useState(false);
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
      data: new Date().toISOString().split('T')[0],
      horario: "",
      alimento: "",
      residente: 0,
      funcionario: 0,
      status: STATUS.ATIVOS,
      concluido: false,
    },
  });

  // === BUSCA ===
  useEffect(() => {
    fetchRegistros();
    fetchResidentes();
    fetchFuncionarios();
  }, []);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registro_alimentar")
        .select(`
          id,
          data,
          horario,
          alimento,
          status,
          concluido,
          criado_em,
          residente: residente!id_residente(id, nome),
          funcionario: funcionario!id_funcionario(id, nome)
        `)
        .order("data", { ascending: false })
        .order("horario", { ascending: false });

      if (error) {
        console.error("Erro ao buscar registros:", error);
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
            data: new Date(d.data),
            horario: d.horario,
            alimento: d.alimento,
            status: d.status,
            concluido: d.concluido,
            criado_em: d.criado_em,
            residente: getEntity(d.residente),
            funcionario: getEntity(d.funcionario),
          } as RegistroAlimentar;
        });

        setRegistros(formatted);
      }
    } catch (err) {
      console.error("Erro ao buscar registros:", err);
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
      data: new Date().toISOString().split('T')[0],
      horario: "",
      alimento: "",
      residente: 0,
      funcionario: 0,
      status: STATUS.ATIVOS,
      concluido: false,
    });
    setEditando(false);
    setModalAberto(true);
  };

  const abrirModalEditar = (id: number) => {
    const registroParaEditar = registros.find(registro => registro.id === id);
    if (registroParaEditar) {
      reset({
        id: registroParaEditar.id,
        data: registroParaEditar.data.toISOString().split('T')[0],
        horario: registroParaEditar.horario,
        alimento: registroParaEditar.alimento,
        residente: registroParaEditar.residente.id,
        funcionario: registroParaEditar.funcionario.id,
        status: registroParaEditar.status,
        concluido: registroParaEditar.concluido,
      });
      setEditando(true);
      setModalAberto(true);
    }
  };

  const onSubmit = async (formData: FormValues) => {
    setLoading(true);
    try {
      // Combina data e horário
      const combined = new Date(`${formData.data}T${formData.horario}:00`);
      
      const payload: any = {
        data: combined.toISOString(),
        horario: formData.horario,
        alimento: formData.alimento,
        status: formData.status,
        concluido: formData.concluido || false,
        id_residente: Number(formData.residente),
        id_funcionario: Number(formData.funcionario),
      };

      if (editando && formData.id) {
        const { error } = await supabase
          .from("registro_alimentar")
          .update(payload)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("registro_alimentar")
          .insert([payload]);
        if (error) throw error;
      }

      await fetchRegistros();
      setModalAberto(false);
    } catch (err) {
      console.error("Erro ao salvar registro:", err);
      alert("Erro ao salvar registro. Veja o console.");
    } finally {
      setLoading(false);
    }
  };

  // deletar
  const excluirRegistro = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      const { error } = await supabase
        .from("registro_alimentar")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setRegistros(anterior => anterior.filter(registro => registro.id !== id));
    } catch (err) {
      console.error("Erro ao excluir registro:", err);
      alert("Erro ao excluir registro. Verifique o console.");
    }
  };

  // alternar conclusão
  const alternarConclusao = async (id: number) => {
    try {
      const registro = registros.find(r => r.id === id);
      if (!registro) return;

      const novoConcluido = !registro.concluido;
      
      // Atualização otimista
      setRegistros(anterior => anterior.map(r => 
        r.id === id ? { ...r, concluido: novoConcluido } : r
      ));

      const { error } = await supabase
        .from("registro_alimentar")
        .update({ concluido: novoConcluido })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao alternar conclusão:", err);
      // Revert em caso de erro
      fetchRegistros();
    }
  };

  // alternar status
  const alterarStatus = async (id: number, novoStatus: string) => {
    try {
      // Atualização otimista
      setRegistros(anterior => anterior.map(r => 
        r.id === id ? { ...r, status: novoStatus } : r
      ));

      const { error } = await supabase
        .from("registro_alimentar")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) throw error;
      setDropdownStatusAberto(null);
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      // Revert em caso de erro
      fetchRegistros();
    }
  };

  // ===== FUNÇÕES AUXILIARES =====
  const toggleDropdownStatus = (registroId: number) => {
    setDropdownStatusAberto(dropdownStatusAberto === registroId ? null : registroId);
  };

  // Calcular residentes únicos a partir dos registros
  const residentesUnicos = [...new Set(registros.map(registro => registro.residente.nome))].filter(Boolean);

  // Toggle controle ativo
  const toggleControleAtivo = () => {
    const novoEstado = !controleAtivo;
    setControleAtivo(novoEstado);

    if (novoEstado) {
      if (!filtroDia) {
        setFiltroDia(new Date());
        setFiltroDiaAtivo(true);
      }
    } else {
      setFiltroControle('todos');
    }
  };

  // Função para verificar se está atrasado
  const estaAtrasado = (registro: RegistroAlimentar) => {
    if (registro.concluido) return false;

    const agora = new Date();
    const dataRegistro = new Date(registro.data);
    const [hora, minuto] = registro.horario.split(':').map(Number);

    dataRegistro.setHours(hora, minuto, 0, 0);

    return agora > dataRegistro;
  };

  // Função para obter status de controle
  const getStatusControle = (registro: RegistroAlimentar) => {
    if (registro.concluido) return CONTROLES.CONCLUIDO;
    if (estaAtrasado(registro)) return CONTROLES.ATRASADO;
    return CONTROLES.PENDENTE;
  };

  // ===== FUNÇÕES DE ESTATÍSTICAS =====
  const obterRegistrosDoDia = (data: Date) => {
    return registros.filter(registro =>
      registro.data.toDateString() === data.toDateString()
    );
  };

  const obterResidentesDoDia = (data: Date) => {
    const registrosDia = obterRegistrosDoDia(data);
    return [...new Set(registrosDia.map(r => r.residente.nome))].filter(Boolean);
  };

  const getEstatisticasDia = (dia: Date) => {
    const registrosDoDia = obterRegistrosDoDia(dia);
    const concluidas = registrosDoDia.filter(r => r.concluido).length;
    const pendentes = registrosDoDia.filter(r => !r.concluido && new Date(r.data) >= new Date()).length;
    const atrasadas = registrosDoDia.filter(r => !r.concluido && new Date(r.data) < new Date()).length;
    return { total: registrosDoDia.length, concluidas, pendentes, atrasadas };
  };

  // Estatísticas do mês
  const getEstatisticasMes = (data: Date) => {
    const ano = data.getFullYear();
    const mes = data.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    let totalRegistros = new Set();
    let totalResidentes = new Set();
    let totalRefeicoes = 0;
    let concluidas = 0;
    let atrasadas = 0;
    let pendentes = 0;

    for (let dia = new Date(primeiroDia); dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
      const registrosDoDia = obterRegistrosDoDia(new Date(dia));
      const estatisticasDia = getEstatisticasDia(new Date(dia));

      registrosDoDia.forEach(reg => totalRegistros.add(reg.id));
      registrosDoDia.forEach(reg => totalResidentes.add(reg.residente.nome));

      totalRefeicoes += estatisticasDia.total;
      concluidas += estatisticasDia.concluidas;
      atrasadas += estatisticasDia.atrasadas;
      pendentes += estatisticasDia.pendentes;
    }

    return {
      totalRegistros: totalRegistros.size,
      totalResidentes: totalResidentes.size,
      totalRefeicoes,
      concluidas,
      atrasadas,
      pendentes
    };
  };

  // ===== FILTROS =====
  const registrosFiltrados = registros
    .filter((r) => {
      // Filtro por dia
      const passaFiltroDia = !filtroDiaAtivo || (filtroDia && r.data.toDateString() === filtroDia.toDateString());

      // Filtro por residente
      const passaFiltroResidente = !filtroResidente || r.residente.nome === filtroResidente;

      // Filtro por status
      const passaFiltroStatus = filtroStatus === "todos" || r.status === filtroStatus;

      // Filtro por controle (apenas quando controle ativo)
      let passaFiltroControle = true;
      if (controleAtivo && filtroControle !== 'todos') {
        const statusControle = getStatusControle(r);
        passaFiltroControle = statusControle === filtroControle;
      }

      return passaFiltroDia && passaFiltroResidente && passaFiltroStatus && passaFiltroControle;
    })
    .sort((a, b) => a.data.getTime() - b.data.getTime() || a.horario.localeCompare(b.horario));

  const handleDayClick = (value: Date) => {
    if (filtroDiaAtivo && filtroDia && value.toDateString() === filtroDia.toDateString()) {
      setFiltroDiaAtivo(false);
      setFiltroDia(null);
    } else {
      setFiltroDia(value);
      setFiltroDiaAtivo(true);
    }
  };

  const irParaHoje = () => {
    const hoje = new Date();
    setDataAtual(hoje);
    setFiltroDia(hoje);
    setFiltroDiaAtivo(true);
  };

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';

    const hoje = new Date();
    const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dataTileNormalizada = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Destaca a data selecionada no filtro
    if (filtroDiaAtivo && filtroDia) {
      const dataSelecionadaNormalizada = new Date(filtroDia.getFullYear(), filtroDia.getMonth(), filtroDia.getDate());
      if (dataTileNormalizada.getTime() === dataSelecionadaNormalizada.getTime()) {
        return '!rounded !bg-odara-accent/20 !text-odara-accent !font-bold';
      }
    }

    // Destaca o dia atual
    if (dataTileNormalizada.getTime() === hojeNormalizado.getTime()) {
      return '!rounded !bg-odara-primary/20 !text-odara-primary !font-bold';
    }

    return '!border-1 !border-odara-contorno hover:!bg-odara-white hover:!border-odara-primary !rounded hover:!border-1';
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const registrosDoDia = registros.filter(r => r.data.toDateString() === date.toDateString());
    if (registrosDoDia.length === 0) return null;

    const estatisticas = getEstatisticasDia(date);
    let cor = 'bg-odara-accent';

    if (estatisticas.total > 0) {
      if (estatisticas.atrasadas > 0) cor = 'bg-red-500';
      else if (estatisticas.pendentes > 0) cor = 'bg-yellow-500';
      else cor = 'bg-green-500';
    }

    return (
      <div className="mt-1 flex justify-center">
        <div className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${cor}`}>
          {estatisticas.total}
        </div>
      </div>
    );
  };

  // Formatar data para legenda
  const formatarDataLegenda = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

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
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro Alimentar</h1>
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
                  <h3 className="font-bold mb-2">Registro Alimentar</h3>
                  <p>
                    O Registro de Quadro Alimentar registra os alimentos oferecidos aos residentes,
                    com horário, alimentos servidos e residentes envolvidos.
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botão Novo Registro */}
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
          
          {/* Botão Controle Ativo */}
          <button
            onClick={toggleControleAtivo}
            className={`flex items-center bg-white rounded-lg px-3 py-2 shadow-sm border-2 font-medium hover:border-2 transition text-sm ${controleAtivo
                ? 'border-odara-primary text-odara-primary'
                : 'border-gray-500 text-gray-500 hover:bg-gray-100'
              }`}
          >
            {controleAtivo ? <FaCheck className="mr-2" /> : <FaClock className="mr-2" />}
            Controle {controleAtivo ? 'Ativo' : 'Inativo'}
          </button>

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
                setFiltroControleAberto(false);
              }}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Residentes
            </button>
            {filtroResidenteAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setFiltroResidente("");
                    setFiltroResidenteAberto(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${!filtroResidente
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
                      setFiltroResidente(residente);
                      setFiltroResidenteAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroResidente === residente
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
                setFiltroControleAberto(false);
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
                {Object.entries(ROTULOS_STATUS).map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    onClick={() => {
                      setFiltroStatus(valor);
                      setFiltroStatusAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroStatus === valor
                        ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                        : 'text-odara-dark'
                      }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro de Controle (apenas quando controle está ativo) */}
          {controleAtivo && (
            <div className="relative dropdown-container">
              <button
                className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition w-40 justify-center"
                onClick={() => {
                  setFiltroControleAberto(!filtroControleAberto);
                  setFiltroResidenteAberto(false);
                  setFiltroStatusAberto(false);
                }}
              >
                <FaFilter className="text-odara-accent mr-2" />
                Controle
              </button>
              {filtroControleAberto && (
                <div className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                  {Object.entries(ROTULOS_CONTROLES).map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      onClick={() => {
                        setFiltroControle(valor);
                        setFiltroControleAberto(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroControle === valor
                          ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                          : 'text-odara-dark'
                        }`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botão Limpar Filtros */}
          {(filtroDiaAtivo || filtroResidente || filtroStatus !== "todos" || (controleAtivo && filtroControle !== 'todos')) && (
            <button
              onClick={() => {
                setFiltroDiaAtivo(false);
                setFiltroDia(null);
                setFiltroResidente('');
                setFiltroStatus('todos');
                if (controleAtivo) {
                  setFiltroControle('todos');
                }
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

        {/* Grid principal */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lista de Registros */}
            <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
                {filtroStatus === 'todos' ? 'Todos os Registros' : `Registros ${ROTULOS_STATUS[filtroStatus]}`}
                {controleAtivo && filtroControle !== 'todos' && ` (${ROTULOS_CONTROLES[filtroControle]})`}
              </h2>

              {/* Filtros ativos */}
              <div className="flex flex-wrap gap-2 mb-4">
                {filtroDiaAtivo && (
                  <span className="text-sm bg-odara-accent text-odara-white px-2 py-1 rounded-full">
                    Dia: {filtroDia.getDate().toString().padStart(2, '0')}/{(filtroDia.getMonth() + 1).toString().padStart(2, '0')}
                  </span>
                )}

                {filtroResidente && (
                  <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
                    Residente: {filtroResidente}
                  </span>
                )}

                {filtroStatus !== "todos" && (
                  <span className="text-sm bg-odara-dropdown-accent text-odara-white px-2 py-1 rounded-full">
                    Status: {ROTULOS_STATUS[filtroStatus]}
                  </span>
                )}

                {controleAtivo && filtroControle !== 'todos' && (
                  <span className="text-sm bg-odara-primary text-odara-white px-2 py-1 rounded-full">
                    Controle: {ROTULOS_CONTROLES[filtroControle]}
                  </span>
                )}

                {controleAtivo && (
                  <span className="text-sm bg-green-500 text-white px-2 py-1 rounded-full">
                    Modo Controle Ativo
                  </span>
                )}
              </div>

              <p className="text-odara-name/60 mb-6">
                {filtroStatus === 'todos'
                  ? 'Todos os registros alimentares'
                  : `Registros com status ${ROTULOS_STATUS[filtroStatus].toLowerCase()}`
                }
              </p>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {registrosFiltrados.length === 0 ? (
                  <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                    <p className="text-odara-dark/60">
                      {controleAtivo && !filtroDia
                        ? 'Selecione um dia para ver os registros'
                        : controleAtivo && filtroControle !== 'todos'
                          ? `Nenhum registro ${ROTULOS_CONTROLES[filtroControle].toLowerCase()} encontrado`
                          : 'Nenhum registro encontrado'
                      }
                    </p>
                  </div>
                ) : (
                  registrosFiltrados.map(r => {
                    const statusControle = getStatusControle(r);
                    const configControle = CONFIGS_CONTROLE[statusControle];
                    const classesStatus = CORES_STATUS[r.status];

                    return (
                      <div key={r.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                        {/* HEADER - Data e status */}
                        <div className={`flex items-center justify-between p-3 rounded-t-lg ${r.status === 'ativos' ? 'bg-green-50 border-b border-green-200' :
                            r.status === 'suspensos' ? 'bg-yellow-50 border-b border-yellow-200' :
                              'bg-gray-50 border-b border-gray-200'
                          }`}>
                          {/* Lado esquerdo: data e horário */}
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${r.status === 'ativos' ? 'bg-green-500' :
                                r.status === 'suspensos' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`}></div>
                            <p className="text-sm sm:text-base text-odara-dark font-semibold">
                              {r.data.getDate().toString().padStart(2, '0')}/
                              {(r.data.getMonth() + 1).toString().padStart(2, '0')}/
                              {r.data.getFullYear()} - {r.horario}
                            </p>
                          </div>

                          {/* Lado direito: dropdown de status */}
                          <div className="flex items-center gap-3 status-dropdown-container">
                            <div className="relative">
                              <button
                                onClick={() => toggleDropdownStatus(r.id)}
                                className={`flex items-center rounded-lg px-3 py-1 border-2 font-medium transition-colors duration-200 text-sm min-w-[100px] justify-center ${classesStatus.bg
                                  } ${classesStatus.text} ${classesStatus.border} ${classesStatus.hover}`}
                              >
                                <FaAngleDown className="mr-2 text-white" />
                                {ROTULOS_STATUS_SINGULAR[r.status]}
                              </button>

                              {/* Dropdown Menu */}
                              {dropdownStatusAberto === r.id && (
                                <div className="absolute mt-1 w-32 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-20 right-0">
                                  {Object.entries(ROTULOS_STATUS_SINGULAR).map(([valor, rotulo]) => (
                                    <button
                                      key={valor}
                                      onClick={() => alterarStatus(r.id, valor)}
                                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 transition-colors duration-200 ${r.status === valor
                                          ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                                          : 'text-odara-dark'
                                        } first:rounded-t-lg last:rounded-b-lg`}
                                    >
                                      {rotulo}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* CORPO - Conteúdo do registro */}
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                            <div className="space-y-2">
                              <div>
                                <strong className="text-odara-dark">Alimento:</strong>
                                <span className="text-odara-name ml-1">{r.alimento}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <strong className="text-odara-dark">Residente(s):</strong>
                                <span className="text-odara-name ml-1">{r.residente.nome}</span>
                              </div>
                            </div>
                          </div>

                          {/* Controle de conclusão */}
                          <div className="mt-4 p-4 bg-odara-white rounded-lg border border-odara-primary">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={r.concluido}
                                  onChange={() => alternarConclusao(r.id)}
                                  className="rounded border-gray-300 text-odara-accent focus:ring-odara-accent"
                                />
                                <span className={r.concluido ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
                                  {r.concluido ? "Concluído" : "Pendente"}
                                </span>
                              </label>

                              {controleAtivo && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${configControle.corTarja}`}>
                                  {configControle.texto}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* FOOTER - Ações */}
                        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm">
                              <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                                {r.residente.nome}
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => abrirModalEditar(r.id)}
                                className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
                                title="Editar registro"
                              >
                                <FaEdit size={14} />
                              </button>

                              <button
                                onClick={() => excluirRegistro(r.id)}
                                className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
                                title="Excluir registro"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                  onChange={handleDayClick}
                  value={filtroDia}
                  onActiveStartDateChange={({ activeStartDate }) => setDataAtual(activeStartDate)}
                  activeStartDate={dataAtual}
                  tileContent={getTileContent}
                  tileClassName={getTileClassName}
                  locale="pt-BR"
                  className="border-0 !w-full"
                />
              </div>

              {/* Legenda de Estatísticas */}
              <div className="grid grid-cols-1 mt-6 p-3 bg-odara-offwhite rounded-lg max-w-md mx-auto">
                <h5 className='font-bold text-odara-dark text-center mb-2 text-sm sm:text-base'>
                  {filtroDia
                    ? `Estatísticas para ${formatarDataLegenda(filtroDia)}`
                    : 'Selecione uma data para visualizar as estatísticas'
                  }
                </h5>

                {filtroDia ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0">
                    {/* Coluna da Esquerda - Estatísticas do Dia */}
                    <div className="sm:border-r border-gray-200 px-3 sm:pr-6">
                      <h6 className="font-semibold text-odara-dark mb-2 text-sm">Dia</h6>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Registros:</span>
                          <span className="font-semibold">{obterRegistrosDoDia(filtroDia).length}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Residentes:</span>
                          <span className="font-semibold">{obterResidentesDoDia(filtroDia).length}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Refeições totais:</span>
                          <span className="font-semibold">{getEstatisticasDia(filtroDia).total}</span>
                        </div>

                        <div className="flex justify-between gap-1 mt-2">
                          <div className="flex-1 border-1 border-green-500 text-green-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
                            {getEstatisticasDia(filtroDia).concluidas}
                          </div>

                          <div className="flex-1 border-1 border-yellow-500 text-yellow-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
                            {getEstatisticasDia(filtroDia).pendentes}
                          </div>

                          <div className="flex-1 border-1 border-red-500 text-red-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
                            {getEstatisticasDia(filtroDia).atrasadas}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna da Direita - Estatísticas do Mês */}
                    <div className='px-3 sm:pl-6'>
                      <h6 className="font-semibold text-odara-dark mb-2 text-sm">Mês</h6>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Registros: </span>
                          <span className="font-semibold">{getEstatisticasMes(dataAtual).totalRegistros}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Residentes: </span>
                          <span className="font-semibold">{getEstatisticasMes(dataAtual).totalResidentes}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Refeições totais: </span>
                          <span className="font-semibold">{getEstatisticasMes(dataAtual).totalRefeicoes}</span>
                        </div>

                        <div className="flex justify-between gap-1 mt-2">
                          <div className="flex-1 border-1 border-green-500 text-green-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
                            {getEstatisticasMes(dataAtual).concluidas}
                          </div>

                          <div className="flex-1 border-1 border-yellow-500 text-yellow-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
                            {getEstatisticasMes(dataAtual).pendentes}
                          </div>

                          <div className="flex-1 border-1 border-red-500 text-red-500 font-semibold px-1 py-0.5 rounded text-center text-xs">
                            {getEstatisticasMes(dataAtual).atrasadas}
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

        {/* Modal para adicionar/editar registro */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white text-odara-dark border-4 border-odara-primary rounded-lg py-2 p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">{editando ? "Editar Registro" : "Novo Registro"}</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    className={`border-odara-primary border rounded-lg px-3 py-2 flex-1 ${errors.data ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("data")} 
                  />
                  <input 
                    type="time" 
                    className={`border-odara-primary border rounded-lg px-3 py-2 flex-1 ${errors.horario ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("horario")} 
                  />
                </div>
                {(errors.data || errors.horario) && (
                  <p className="text-red-500 text-sm">{errors.data?.message || errors.horario?.message}</p>
                )}

                <input 
                  type="text" 
                  placeholder="Alimento" 
                  className={`w-full border-odara-primary border rounded-lg px-3 py-2 ${errors.alimento ? 'border-red-500' : 'border-odara-primary'}`} 
                  {...register("alimento")} 
                />
                {errors.alimento && <p className="text-red-500 text-sm">{errors.alimento.message}</p>}

                <div className="flex flex-col gap-2">
                  <select 
                    className={`flex-1 border-odara-primary border rounded-lg px-3 py-2 ${errors.residente ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("residente")}
                  >
                    <option value="">Selecionar Residente</option>
                    {residentes.map((r) => <option key={String(r.id)} value={String(r.id)}>{r.nome}</option>)}
                  </select>
                  {errors.residente && <p className="text-red-500 text-sm">{errors.residente.message}</p>}

                  <select 
                    className={`flex-1 border-odara-primary border rounded-lg px-3 py-2 ${errors.funcionario ? 'border-red-500' : 'border-odara-primary'}`} 
                    {...register("funcionario")}
                  >
                    <option value="">Selecionar Funcionário</option>
                    {funcionarios.map((f) => <option key={String(f.id)} value={String(f.id)}>{f.nome}</option>)}
                  </select>
                  {errors.funcionario && <p className="text-red-500 text-sm">{errors.funcionario.message}</p>}
                </div>

                <select 
                  className={`w-full border-odara-primary text-odara-dark border rounded-lg px-3 py-2 ${errors.status ? 'border-red-500' : 'border-odara-primary'}`} 
                  {...register("status")}
                >
                  <option value="">Selecionar Status</option>
                  <option value={STATUS.ATIVOS}>Ativos</option>
                  <option value={STATUS.SUSPENSOS}>Suspensos</option>
                  <option value={STATUS.FINALIZADOS}>Finalizados</option>
                </select>
                {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}

                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-odara-accent border-gray-300 rounded" {...register("concluido")} />
                  Registro Concluído
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

export default RegistroAlimentar;