// src/components/RegistroMedicamentos.tsx
import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle, FaTimes, FaExclamationCircle, FaSpinner, FaSave, FaAngleDown, FaExclamationTriangle } from 'react-icons/fa';

import toast, { Toaster } from 'react-hot-toast';
import 'react-calendar/dist/Calendar.css';

import { supabase } from '../../../lib/supabaseClient';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

/* ===========================
   Types
   =========================== */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
};

type Administracao = {
  id: number;
  id_medicamento: number;
  data_prevista: string; // ISO
  data_real?: string | null;
  status: 'pendente' | 'dado' | 'atrasado' | 'omitido';
  id_funcionario?: number | null;
  observacoes?: string | null;
  funcionario?: Funcionario | null;
};

type Medicamento = {
  id: number;
  nome: string;
  dosagem: string;
  dose: string;
  data_inicio: string; // YYYY-MM-DD
  horario_inicio: string; // HH:MM
  data_fim?: string | null;
  recorrencia: string;
  intervalo: number;
  id_residente: number;
  efeitos_colaterais?: string | null;
  observacao?: string | null;
  saude_relacionada?: string | null;
  foto?: string | null;
  status: string;
  criado_em?: string;
  residente?: Residente | null;
  administracoes?: Administracao[];
};

/* ===========================
   Constantes visuais / domínio
   =========================== */
const STATUS = {
  ATIVO: 'ativo',
  SUSPENSO: 'suspenso',
  FINALIZADO: 'finalizado'
};

// Controla a cor do header dos cards de acordo com o status do medicamento
const corStatus: Record<string, { bola: string; bg: string; text: string; border: string }> = {
  'ativo': {
    bola: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-green-200'
  },

  'suspenso': {
    bola: 'bg-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-yellow-200'
  },

  'finalizado': {
    bola: 'bg-gray-500',
    bg: 'bg-gray-50',
    text: 'text-odara-dark font-semibold',
    border: 'border-b border-gray-200'
  },
};

const CONTROLES = {
  TODOS: 'todos',
  ADMINISTRADO: 'dado',
  ATRASADO: 'atrasado',
  PENDENTE: 'pendente',
  OMITIDO: 'omitido'
};

// novo: rótulos legíveis para tipos de recorrência
const RECORRENCIA_ROTULOS: Record<string, string> = {
  unico: 'único',
  horas: 'horas',
  dias: 'dias',
  meses: 'meses',
  vezes: 'vezes'
};

const schema = yup.object({
  id: yup.number().optional(),
  nome: yup.string().required('Nome do medicamento é obrigatório'),
  dosagem: yup.string().required('Dosagem é obrigatória'),
  dose: yup.string().required('Dose é obrigatória'),
  data_inicio: yup.string().required('Data de início é obrigatória'),
  horario_inicio: yup.string().required('Horário de início é obrigatório'),
  data_fim: yup.string().nullable(),
  recorrencia: yup.string().required('Recorrência é obrigatória'),
  intervalo: yup.number().required('Intervalo é obrigatório').min(1, 'Intervalo deve ser ao menos 1'),
  efeitos_colaterais: yup.string().nullable(),
  observacao: yup.string().nullable(),
  saude_relacionada: yup.string().nullable(),
  foto: yup.string().nullable(),
  id_residente: yup.number().required('Residente é obrigatório')
}).required();

type FormValues = yup.InferType<typeof schema>;

/* ===========================
   Componente
   =========================== */
const RegistroMedicamentos: React.FC = () => {

  /* Estados de dados */
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);

  /* Estados UI (preserva visual) */
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [infoVisivel, setInfoVisivel] = useState(false);

  const [filtroResidente, setFiltroResidente] = useState<string | 'todos'>('todos');
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string | 'todos'>('todos');
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);
  const [filtroControle, setFiltroControle] = useState<string>(CONTROLES.TODOS);
  const [filtroControleAberto, setFiltroControleAberto] = useState(false);
  const [filtroDia, setFiltroDia] = useState<Date | null>(null);
  const [filtroDiaAtivo, setFiltroDiaAtivo] = useState(false);

  /* React Hook Form */
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: 0,
      nome: '',
      dosagem: '',
      dose: '',
      data_inicio: new Date().toISOString().split('T')[0],
      horario_inicio: '',
      data_fim: '',
      recorrencia: '',
      intervalo: 1,
      id_residente: 0,
      efeitos_colaterais: '',
      observacao: '',
      saude_relacionada: '',
      foto: ''
    }
  });

  /* ---------------------------
     Fetch inicial: residentes, funcionarios, medicamentos (+ administracoes)
     --------------------------- */
  const carregarResidentes = async () => {
    const { data, error } = await supabase.from('residente').select('id, nome, quarto').order('nome');
    if (error) {
      console.error('Erro ao carregar residentes:', error);
      return;
    }
    setResidentes(data || []);
  };

  const carregarMedicamentos = async () => {
    // traz medicamento + residente + administracoes (com funcionario)
    const { data, error } = await supabase
      .from('medicamento')
      .select(`
        *,
        residente:residente(id, nome, quarto),
        administracoes:administracao_medicamento(*, funcionario:funcionario(id, nome))
      `)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar medicamentos:', error);
      return;
    }

    const meds = (data || []).map((m: any) => ({
      ...m,
      residente: Array.isArray(m.residente) ? (m.residente[0] ?? null) : m.residente ?? null,
      administracoes: m.administracoes || []
    })) as Medicamento[];

    setMedicamentos(meds);
  };

  useEffect(() => {
    carregarResidentes();
    carregarMedicamentos();
  }, []);

  /* ---------------------------
     Abrir modal adicionar / editar (preservando visual)
     --------------------------- */
  const abrirModal = (med?: Medicamento) => {
    if (med) {
      reset({
        id: med.id,
        nome: med.nome,
        dosagem: med.dosagem,
        dose: med.dose,
        data_inicio: med.data_inicio || new Date().toISOString().split('T')[0],
        horario_inicio: med.horario_inicio || '',
        data_fim: med.data_fim || '',
        recorrencia: med.recorrencia || '',
        intervalo: med.intervalo || 1,
        id_residente: med.id_residente,
        efeitos_colaterais: med.efeitos_colaterais || '',
        observacao: med.observacao || '',
        saude_relacionada: med.saude_relacionada || '',
        foto: med.foto || ''
      });
      setEditando(true);
      setIdEditando(med.id);
    } else {
      reset({
        id: 0,
        nome: '',
        dosagem: '',
        dose: '',
        data_inicio: new Date().toISOString().split('T')[0],
        horario_inicio: '',
        data_fim: '',
        recorrencia: '',
        intervalo: 1,
        id_residente: 0,
        efeitos_colaterais: '',
        observacao: '',
        saude_relacionada: '',
        foto: ''
      });
      setEditando(false);
      setIdEditando(null);
    }
    setModalAberto(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const id = Number(values.id ?? idEditando ?? 0);

      const data = {
        nome: values.nome,
        dosagem: values.dosagem,
        dose: values.dose,
        data_inicio: values.data_inicio,
        horario_inicio: values.horario_inicio,
        data_fim: values.data_fim || null,
        recorrencia: values.recorrencia,
        intervalo: Number(values.intervalo),
        id_residente: Number(values.id_residente),
        efeitos_colaterais: values.efeitos_colaterais || null,
        observacao: values.observacao || null,
        saude_relacionada: values.saude_relacionada || null,
        foto: values.foto || null
      };

      if (id) {
        const { error } = await supabase
          .from('medicamento')
          .update(data)
          .eq('id', id);

        if (error) throw error;
        toast.success('Medicamento atualizado com sucesso!'); // NOTIFICAÇÃO DE SUCESSO
      } else {
        const { data: inserted, error } = await supabase
          .from('medicamento')
          .insert([data])
          .select();

        if (error) throw error;
        if (inserted && inserted[0]) {
          setMedicamentos(prev => [...prev, inserted[0]]);
        }
        toast.success('Medicamento criado com sucesso!'); // NOTIFICAÇÃO DE SUCESSO
      }

      await carregarMedicamentos();
      setModalAberto(false);
      setEditando(false);
      setIdEditando(null);
    } catch (err: any) {
      console.error('Erro ao salvar medicamento:', err);
      toast.error('Erro ao salvar medicamento: ' + (err?.message ?? String(err))); // NOTIFICAÇÃO DE ERRO
    }
  };

  /* ---------------------------
   Excluir medicamento com confirmação
   --------------------------- */
  const removerMedicamento = async (id: number) => {
    // Modal de confirmação customizado
    const confirmarExclusao = () => {
      return new Promise((resolve) => {
        // Criar overlay e modal
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4';

        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-2xl shadow-lg p-6 max-w-md w-full';
        modal.innerHTML = `
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <FaExclamationTriangle class="h-6 w-6 text-red-600" />
          </div>
          <h3 class="text-lg font-bold text-odara-dark mb-2">Confirmar exclusão</h3>
          <p class="text-odara-name mb-6">Tem certeza que deseja excluir este medicamento? Esta ação não pode ser desfeita.</p>
          <div class="flex gap-3 justify-center">
            <button id="cancel-btn" class="px-4 py-2 border border-gray-300 text-odara-dark rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button id="confirm-btn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Excluir</button>
          </div>
        </div>
      `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event listeners para os botões
        modal.querySelector('#confirm-btn')?.addEventListener('click', () => {
          document.body.removeChild(overlay);
          resolve(true);
        });

        modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
          document.body.removeChild(overlay);
          resolve(false);
        });
      });
    };

    const usuarioConfirmou = await confirmarExclusao();
    if (!usuarioConfirmou) return;

    try {
      const { error } = await supabase.from('medicamento').delete().eq('id', id);
      if (error) throw error;

      await carregarMedicamentos();
      toast.success('Medicamento excluído com sucesso!'); // NOTIFICAÇÃO DE SUCESSO
    } catch (error: any) {
      console.error('Erro ao remover medicamento:', error);
      toast.error('Erro ao excluir medicamento: ' + (error?.message ?? String(error))); // NOTIFICAÇÃO DE ERRO
    }
  };

  /* ---------------------------
     Util estatísticas / status administrações (mantém lógica original)
     --------------------------- */
  const estaAtrasado = (iso: string | undefined | null) => {
    if (!iso) return false;
    const agora = new Date();
    const d = new Date(iso);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dDia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dDia.getTime() < hoje.getTime()) return true;
    if (dDia.getTime() === hoje.getTime()) {
      return (agora.getTime() - d.getTime()) > 10 * 60 * 1000;
    }
    return false;
  };

  const getStatusAdministracao = (med: Medicamento, iso: string) => {
    const adm = med.administracoes?.find(a => a.data_prevista === iso);
    if (adm && adm.status === 'dado') return CONTROLES.ADMINISTRADO;
    if (estaAtrasado(iso)) return CONTROLES.ATRASADO;
    return CONTROLES.PENDENTE;
  };

  /* ---------------------------
     Filtros (mantendo visual e comportamento)
     --------------------------- */
  const medicamentosFiltrados = medicamentos.filter(medicamento => {
    const passaResidente = filtroResidente === 'todos' || medicamento.residente?.nome === filtroResidente;
    const passaStatus = filtroStatus === 'todos' || medicamento.status === filtroStatus;

    let passaFiltroDia = true;
    if (filtroDiaAtivo && filtroDia) {
      passaFiltroDia = (medicamento.administracoes || []).some(adm => estaNoDia(adm.data_prevista, filtroDia));
    }

    let passaFiltroControle = true;
    if (filtroControle !== CONTROLES.TODOS && filtroDia) {
      const administracoes = medicamento.administracoes || [];
      passaFiltroControle = administracoes.some(adm => {
        const statusAdm = getStatusAdministracao(medicamento, adm.data_prevista);
        return statusAdm === filtroControle;
      });
    }

    return passaResidente && passaStatus && passaFiltroDia && passaFiltroControle;
  }).sort((a, b) => {
    const ta = a.data_inicio ? new Date(a.data_inicio).getTime() : 0;
    const tb = b.data_inicio ? new Date(b.data_inicio).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return (a.residente?.quarto ?? '').localeCompare(b.residente?.quarto ?? '');
  });

  const updateStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('medicamento')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setMedicamentos(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      {/* Componente Toaster para notificações */}
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

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* ===== SEÇÃO 1: CABEÇALHO DA PÁGINA ===== */}
        <div className="flex flex-col sm:flex-row justify-center xl:justify-start items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center">

            <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mr-2">
              Registro de Medicamentos
            </h1>

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
                  <h3 className="font-bold mb-2">Registro de Medicamentos</h3>
                  <p>
                    O Registro de Medicamentos é um documento essencial para o controle e administração segura de medicamentos aos residentes. Ele permite o acompanhamento de dosagens, horários, efeitos colaterais e observações importantes sobre cada tratamento medicamentoso.
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== SEÇÃO 2: BOTÃO ADICIONAR ===== */}
        <div className="relative flex items-center justify-center xl:justify-start gap-4 mb-6">
          <button
            onClick={() => abrirModal()}
            className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-200 text-sm sm:text-base"
          >
            <FaPlus className="mr-2 text-odara-white" /> Novo Medicamento
          </button>
        </div>

        {/* ===== SEÇÃO 3: BARRA DE FILTROS ===== */}
        <div className="relative flex flex-wrap items-center justify-center xl:justify-start gap-2 sm:gap-4 mb-6">
          {/* Filtro status */}
          <div className="relative dropdown-container">
            <button
              className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroStatusAberto ? 'border-odara-primary text-gray-700' : 'border-odara-primary/40 text-gray-700'}`}
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
              <div className="absolute mt-2 w-32 sm:w-36 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10">
                <button onClick={() => { setFiltroStatus('todos'); setFiltroStatusAberto(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 ${filtroStatus === 'todos' ? 'bg-odara-accent/20 font-semibold' : 'border border-odara-contorno rounded'}`}>
                  Todos
                </button>
                <button onClick={() => { setFiltroStatus(STATUS.ATIVO); setFiltroStatusAberto(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 ${filtroStatus === STATUS.ATIVO ? 'bg-odara-accent/20 font-semibold' : 'border border-odara-contorno rounded'}`}>
                  Ativos
                </button>
                <button onClick={() => { setFiltroStatus(STATUS.SUSPENSO); setFiltroStatusAberto(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 ${filtroStatus === STATUS.SUSPENSO ? 'bg-odara-accent/20 font-semibold' : 'border border-odara-contorno rounded'}`}>
                  Suspensos
                </button>
                <button onClick={() => { setFiltroStatus(STATUS.FINALIZADO); setFiltroStatusAberto(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 ${filtroStatus === STATUS.FINALIZADO ? 'bg-odara-accent/20 font-semibold' : 'border border-odara-contorno rounded'}`}>
                  Finalizados
                </button>
              </div>
            )}
          </div>

          {/* Filtro residentes */}
          <div className="relative dropdown-container">
            <button
              className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroResidenteAberto ? 'border-odara-primary text-gray-700' : 'border-odara-primary/40 text-gray-700'}`}
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
              <div className="absolute mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10 max-h-60 overflow-y-auto">
                <button onClick={() => { setFiltroResidente('todos'); setFiltroResidenteAberto(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 ${filtroResidente === 'todos' ? 'bg-odara-accent/20 font-semibold' : 'border border-odara-contorno rounded'}`}>
                  Todos
                </button>
                {medicamentos.map(r => (
                  <button key={r.id_residente}
                    onClick={() => { setFiltroResidente(r.residente?.nome || ''); setFiltroResidenteAberto(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-odara-primary/20 ${filtroResidente === r.residente?.nome ? 'bg-odara-accent/20 font-semibold' : 'border border-odara-contorno rounded'}`}>
                    {r.residente?.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Limpar filtros */}
          {(filtroDiaAtivo || filtroResidente !== 'todos' || filtroStatus !== 'todos' || (filtroControle !== CONTROLES.TODOS)) && (
            <button onClick={() => {
              setFiltroDiaAtivo(false);
              setFiltroDia(null);
              setFiltroResidente('todos');
              setFiltroStatus('todos');
            }}
              className="flex items-center bg-odara-accent text-odara-white rounded-full px-3 py-2 shadow-sm font-medium hover:bg-odara-secondary transition text-sm">
              <FaTimes className="mr-1" /> Limpar Filtros
            </button>
          )}
        </div>

        {/* LISTA (CARDS) */}
        <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
          {/* Cabeçalho da lista com título e contador */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 text-center justify-center xl:justify-start sm:text-left">
            <h2 className="text-2xl lg:text-4xl md:text-4xl font-bold text-odara-dark">
              Medicamentos
            </h2>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              Total: {medicamentosFiltrados.length}
            </span>
          </div>

          {/* Lista de Medicamentos */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {medicamentosFiltrados.length === 0 ? (
              <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                <p className="text-odara-dark/60">Nenhum medicamento encontrado</p>
              </div>
            ) : (
              medicamentosFiltrados.map(med => (
                <div
                  key={med.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200"
                >
                  {/* HEADER - Data de início e informações básicas */}
                  <div className={`flex items-center justify-between p-3 rounded-t-lg ${corStatus[med.status].border} ${corStatus[med.status].bg}`}>
                    {/* Lado esquerdo: data de início */}
                    <div className="flex items-center">
                      {/* Bolinha indicadora de status ativo */}
                      <div className={`w-3 h-3 rounded-full mr-3 ${corStatus[med.status].bola}`}></div>
                      {/* Texto com datas */}
                      <p className={`text-sm sm:text-base ${corStatus[med.status].text}`}>
                        <span>
                          Início: {new Date(med.data_inicio).getDate()}/
                          {(new Date(med.data_inicio).getMonth() + 1)}/
                          {new Date(med.data_inicio).getFullYear()}
                        </span>
                        {med.data_fim ? (
                          <>
                            {' • '}
                            Fim: {new Date(med.data_fim).getDate()}/
                            {(new Date(med.data_fim).getMonth() + 1)}/
                            {new Date(med.data_fim).getFullYear()}
                          </>
                        ) : (
                          <span className="text-odara-accent ml-2">• Uso contínuo</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={med.status}
                        onChange={e => updateStatus(med.id, e.target.value)}
                        className='text-odara-dark rounded-lg px-2 py-1 text-sm'
                      >
                        <FaAngleDown className="mr-2 text-white" />
                        <option value='ativo'>Ativo</option>
                        <option value='suspenso'>Suspenso</option>
                        <option value='finalizado'>Finalizado</option>
                      </select>
                    </div>
                  </div>

                  {/* CORPO - Conteúdo principal do medicamento */}
                  <div className="p-4">
                    {/* título do Card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className='flex items-center justify-between w-full'>
                        {/* Lado esquerdo: Nome do Medicamento */}
                        <h3 className="text-lg sm:text-xl font-bold text-odara-dark">{med.nome}</h3>

                        {/* Lado direito: ações rápidas */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => abrirModal(med)}
                            className="text-odara-dropdown-accent hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown-accent"
                            title="Editar medicamento"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => removerMedicamento(med.id)}
                            className="text-odara-alerta hover:text-odara-white transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta"
                            title="Excluir medicamento"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Grid com informações do medicamento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                      {/* Coluna da esquerda */}
                      <div className="space-y-2">
                        <div>
                          <strong className="text-odara-dark">Dosagem:</strong>
                          <span className="text-odara-name ml-1">{med.dosagem}</span>
                        </div>
                        <div>
                          <strong className="text-odara-dark">Dose:</strong>
                          <span className="text-odara-name ml-1">{med.dose}</span>
                        </div>
                        <div>
                          <strong className="text-odara-dark">Recorrência:</strong>
                          <span className="text-odara-name ml-1">{med.recorrencia}</span>
                        </div>
                      </div>

                      {/* Coluna da direita */}
                      <div className="space-y-2">
                        {/* Efeitos colaterais se existirem */}
                        {med.efeitos_colaterais && (
                          <div>
                            <strong className="text-odara-dark">Efeitos colaterais:</strong>
                            <span className="text-odara-name ml-1">{med.efeitos_colaterais}</span>
                          </div>
                        )}

                        {/* Observações se existirem */}
                        {med.observacao && (
                          <div>
                            <strong className="text-odara-dark">Observações:</strong>
                            <span className="text-odara-name ml-1">{med.observacao}</span>
                          </div>
                        )}

                        {/* Saúde relacionada se existir */}
                        {med.saude_relacionada && (
                          <div>
                            <strong className="text-odara-dark">Saúde relacionada:</strong>
                            <span className="text-odara-name ml-1">{med.saude_relacionada}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FOOTER - Informações adicionais */}
                  <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Badge do residente com quarto*/}
                      <div>
                        <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                          {med.residente?.nome || 'Residente'}
                        </span>

                        <span>{med.residente?.quarto ? '• Quarto: ' + med.residente?.quarto : ""}</span>
                      </div>

                      {/* Informações adicionais se necessário */}
                      <div className="text-xs text-odara-name">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODAL: Form (mantive visual / organização original do modal) */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header do Modal */}
              <div className="bg-odara-primary text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {editando ? 'Editar Medicamento' : 'Novo Medicamento'}
                  </h2>
                  <button
                    onClick={() => { setModalAberto(false); setEditando(false); setIdEditando(null); }}
                    className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
                <p className="text-odara-offwhite/80 mt-1 text-sm">
                  {editando ? 'Atualize as informações do medicamento' : 'Preencha os dados para adicionar um novo medicamento'}
                </p>
              </div>

              {/* Corpo do Modal */}
              <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <input type="hidden" {...register('id')} />
                  {/* Linha 1 - Nome e Dosagem */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Residente *
                      </label>
                      <select
                        {...register('id_residente')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                      >
                        <option value="">Selecione um residente</option>
                        {residentes.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nome} {r.quarto ? `(Q ${r.quarto})` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.id_residente && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <FaExclamationCircle /> {errors.id_residente.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Nome do Medicamento *
                      </label>
                      <input
                        {...register('nome')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                        placeholder="Digite o nome do medicamento"
                      />
                      {errors.nome && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <FaExclamationCircle /> {errors.nome.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Linha 2 - Dose e Residente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Dosagem *
                      </label>
                      <input
                        {...register('dosagem')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                        placeholder="Ex: 50mg, 100ml"
                      />
                      {errors.dosagem && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <FaExclamationCircle /> {errors.dosagem.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Dose *
                      </label>
                      <input
                        {...register('dose')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                        placeholder="Ex: 1 comprimido, 2 gotas"
                      />
                      {errors.dose && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <FaExclamationCircle /> {errors.dose.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Linha 3 - Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Data Início *
                      </label>
                      <input
                        type="date"
                        {...register('data_inicio')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                      />
                      {errors.data_inicio && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <FaExclamationCircle /> {errors.data_inicio.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Data Fim
                      </label>
                      <input
                        type="date"
                        {...register('data_fim')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                      />
                      <p className="text-xs text-odara-name mt-1">Deixe em branco para uso contínuo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Horário Início *
                      </label>
                      <input
                        type="time"
                        {...register('horario_inicio')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                      />
                      {errors.horario_inicio && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <FaExclamationCircle /> {errors.horario_inicio.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Linha 4 - Recorrência e Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Recorrência *
                      </label>
                      <select
                        {...register('recorrencia', {
                          onChange: (e) => {
                            const v = e.target.value;
                            // se for 'unico', força intervalo = 1; caso contrário, mantém intervalo atual
                            if (v === 'unico') {
                              reset({ ...watch(), recorrencia: v, intervalo: 1 });
                            } else {
                              reset({ ...watch(), recorrencia: v });
                            }
                          }
                        })}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="unico">Único</option>
                        <option value="horas">Horas</option>
                        <option value="dias">Dias</option>
                        <option value="meses">Meses</option>
                        <option value="vezes">Número de vezes</option>
                      </select>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        {watch('recorrencia') === 'vezes' ? 'Total de vezes' : 'Intervalo'} *
                      </label>
                      {/* input + rótulo do tipo ao final */}
                      <div className="relative">
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            {...register('intervalo')}
                            disabled={!watch('recorrencia') || watch('recorrencia') === 'unico'}
                            className={`w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary transition-colors duration-200 pr-24 ${(!watch('recorrencia') || watch('recorrencia') === 'unico') ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          />
                          <span className={`absolute right-3 text-sm text-odara-name whitespace-nowrap bg-white px-2 py-1 rounded-md ${watch('recorrencia') === 'unico' ? 'hidden' : ''}`}>
                            {watch('recorrencia') ? RECORRENCIA_ROTULOS[watch('recorrencia')] : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campos de Texto Grandes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Efeitos Colaterais
                      </label>
                      <textarea
                        {...register('efeitos_colaterais')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                        rows={3}
                        placeholder="Descreva os possíveis efeitos colaterais..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Observações
                      </label>
                      <textarea
                        {...register('observacao')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                        rows={3}
                        placeholder="Observações adicionais..."
                      />
                    </div>
                  </div>

                  {/* Campos Individuais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Saúde Relacionada
                      </label>
                      <input
                        {...register('saude_relacionada')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                        placeholder="Condição de saúde relacionada"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-odara-dark mb-2">
                        Foto (URL do Storage)
                      </label>
                      <input
                        {...register('foto')}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                        placeholder="public/medicamentos/exemplo.jpg"
                      />
                      <p className="text-xs text-odara-name mt-1">Caminho no storage onde a foto está salva</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => { setModalAberto(false); setEditando(false); setIdEditando(null); }}
                      className="px-6 py-3 rounded-xl border-2 border-gray-300 text-odara-dark hover:bg-gray-50 font-medium transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl bg-odara-accent text-white font-medium hover:bg-odara-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          {editando ? 'Salvando...' : 'Adicionando...'}
                        </>
                      ) : (
                        <>
                          {editando ? <FaSave /> : <FaPlus />}
                          {editando ? 'Salvar Alterações' : 'Adicionar Medicamento'}
                        </>
                      )}
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

export default RegistroMedicamentos;