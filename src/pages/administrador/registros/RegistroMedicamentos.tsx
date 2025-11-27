import { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import ModalMedicamentos from './ModalMedicamentos';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Medicamento = {
  id: number;
  nome: string;
  dosagem: string;
  dose: string;
  data_inicio: string;
  horario_inicio: string;
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
};

/* Cores por status */
const corStatus: Record<string, { bola: string; bg: string; text: string; border: string }> = {
  ativo: { bola: 'bg-green-500', bg: 'bg-green-50', text: 'text-odara-dark font-semibold', border: 'border-b border-green-200' },
  suspenso: { bola: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-odara-dark font-semibold', border: 'border-b border-yellow-200' },
  finalizado: { bola: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-odara-dark font-semibold', border: 'border-b border-gray-200' }
};

const RegistroMedicamentos: React.FC = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState<Medicamento | null>(null);
  const [infoVisivel, setInfoVisivel] = useState(false);

  // Busca sempre visível
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros avançados dentro de <details>
  const formFiltrosRef = useRef<HTMLFormElement>(null);
  const [filtros, setFiltros] = useState<{ residenteId: number | null; status: string | null }>({
    residenteId: null,
    status: null
  });

  /* Carregar medicamentos + residente */
  const carregarMedicamentos = async () => {
    const { data, error } = await supabase
      .from('medicamento')
      .select(`
        *,
        residente:residente(id, nome, quarto)
      `)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar medicamentos:', error);
      return;
    }
    setMedicamentos(data || []);
  };

  useEffect(() => {
    carregarMedicamentos();
  }, []);

  /* Aplicar filtragem */
  const medicamentosFiltrados = medicamentos
    .filter(m => {
      if (searchTerm.trim() && !m.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filtros.residenteId && m.residente?.id !== filtros.residenteId) return false;
      if (filtros.status && filtros.status !== 'todos' && m.status !== filtros.status) return false;
      return true;
    })
    .sort((a, b) => {
      const ta = a.data_inicio ? new Date(a.data_inicio).getTime() : 0;
      const tb = b.data_inicio ? new Date(b.data_inicio).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return (a.residente?.quarto ?? '').localeCompare(b.residente?.quarto ?? '');
    });

  const updateStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase.from('medicamento').update({ status }).eq('id', id);
      if (error) throw error;
      setMedicamentos(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Falha ao atualizar status.');
    }
  };

  const removerMedicamento = async (id: number) => {
    if (!confirm('Excluir este medicamento?')) return;
    try {
      const { error } = await supabase.from('medicamento').delete().eq('id', id);
      if (error) throw error;
      setMedicamentos(prev => prev.filter(m => m.id !== id));
      toast.success('Medicamento excluído.');
    } catch (err) {
      console.error('Erro ao excluir medicamento:', err);
      toast.error('Erro ao excluir.');
    }
  };

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <Toaster />
      <ModalMedicamentos
        medicamento={medicamentoSelecionado}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Cabeçalho */}
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
                  <p>Controle de dosagens, horários, efeitos e observações dos tratamentos.</p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Botão Novo Medicamento */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); // evita abrir o details ao clicar
            setMedicamentoSelecionado(null);
            setModalAberto(true);
          }}
          className="bg-odara-accent hover:bg-odara-secondary text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm h-10"
        >
          <FaPlus className="mr-2" /> Novo
        </button>

        <details className="group mb-8 w-full">
          {/* SUMMARY = Linha com input de busca (não deve abrir/fechar ao digitar) + botão de filtros */}
          <summary
            className="flex flex-col sm:flex-row gap-4 items-end list-none [&::-webkit-details-marker]:hidden cursor-pointer"
          >

            {/* Campo de busca (impede toggle do details) */}
            <div className="flex-1 max-w-xl">
              <label className="block text-sm font-medium text-odara-dark mb-1">
                Buscar medicamento
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onFocus={e => e.stopPropagation()}
                placeholder="Digite o nome..."
                className="w-full h-10 border border-odara-primary/40 rounded-lg px-3 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
              />
            </div>

            {/* Botão de filtros (responsável por abrir/fechar) */}
            <div className="sm:w-40">
              <div
                className="h-10 w-full inline-flex items-center justify-center px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen transition text-sm font-medium select-none"
              >
                <FaFilter className="mr-2" /> Filtros
              </div>
            </div>
          </summary>

          {/* PAINEL DE FILTROS (APARECE ABAIXO DA LINHA TODA) */}
          <form
            ref={formFiltrosRef}
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const residenteRaw = fd.get('residente') as string;
              const statusRaw = fd.get('status') as string;
              setFiltros({
                residenteId: residenteRaw ? Number(residenteRaw) : null,
                status: statusRaw && statusRaw !== 'todos' ? statusRaw : null
              });
            }}
            className="mt-6 bg-white p-5 rounded-xl shadow border w-full animate-fade-in"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residente</label>
                <select
                  name="residente"
                  className="w-full h-10 border rounded px-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                  defaultValue=""
                >
                  <option value="">Todos</option>
                  {Array.from(
                    new Map(
                      medicamentos
                        .filter(m => m.residente)
                        .map(m => [m.residente!.id, m.residente!.nome])
                    )
                  ).map(([id, nome]) => (
                    <option key={id} value={id}>{nome}</option>
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
                  <option value="ativo">Ativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>

              <div className="flex md:items-end gap-2 pt-1 md:pt-0">
                <button
                  type="submit"
                  className="h-10 px-4 bg-odara-dark text-white rounded hover:bg-odara-darkgreen text-sm font-medium"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltros({ residenteId: null, status: null });
                    formFiltrosRef.current?.reset();
                  }}
                  className="h-10 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  Limpar
                </button>
              </div>
            </div>

            {(filtros.residenteId || filtros.status) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {filtros.residenteId && (
                  <span className="bg-odara-secondary text-white px-2 py-1 rounded-full">
                    Residente: {medicamentos.find(m => m.residente?.id === filtros.residenteId)?.residente?.nome}
                  </span>
                )}
                {filtros.status && (
                  <span className="bg-odara-primary text-white px-2 py-1 rounded-full">
                    Status: {filtros.status}
                  </span>
                )}
              </div>
            )}
          </form>
        </details>

        {/* Lista */}
        <div className="bg-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <h2 className="text-2xl lg:text-4xl font-bold text-odara-dark">Medicamentos</h2>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              Total: {medicamentosFiltrados.length}
            </span>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {medicamentosFiltrados.length === 0 ? (
              <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                <p className="text-odara-dark/60">Nenhum medicamento encontrado</p>
              </div>
            ) : (
              medicamentosFiltrados.map(med => (
                <div key={med.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                  <div className={`flex items-center justify-between p-3 rounded-t-lg ${corStatus[med.status].border} ${corStatus[med.status].bg}`}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${corStatus[med.status].bola}`}></div>
                      <p className={`text-sm sm:text-base ${corStatus[med.status].text}`}>
                        Início: {new Date(med.data_inicio).toLocaleDateString('pt-BR')}
                        {med.data_fim ? ` • Fim: ${new Date(med.data_fim).toLocaleDateString('pt-BR')}` : ' • Uso contínuo'}
                      </p>
                    </div>
                    <select
                      value={med.status}
                      onChange={e => updateStatus(med.id, e.target.value)}
                      className="text-odara-dark rounded-lg px-2 py-1 text-sm"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="suspenso">Suspenso</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-odara-dark">{med.nome}</h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setMedicamentoSelecionado(med);
                            setModalAberto(true);
                          }}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                      <div className="space-y-2">
                        <div><strong className="text-odara-dark">Dosagem:</strong> <span className="text-odara-name ml-1">{med.dosagem}</span></div>
                        <div><strong className="text-odara-dark">Dose:</strong> <span className="text-odara-name ml-1">{med.dose}</span></div>
                        <div><strong className="text-odara-dark">Recorrência:</strong> <span className="text-odara-name ml-1">{med.recorrencia}</span></div>
                      </div>
                      <div className="space-y-2">
                        {med.efeitos_colaterais && (
                          <div><strong className="text-odara-dark">Efeitos colaterais:</strong> <span className="text-odara-name ml-1">{med.efeitos_colaterais}</span></div>
                        )}
                        {med.observacao && (
                          <div><strong className="text-odara-dark">Observações:</strong> <span className="text-odara-name ml-1">{med.observacao}</span></div>
                        )}
                        {med.saude_relacionada && (
                          <div><strong className="text-odara-dark">Saúde relacionada:</strong> <span className="text-odara-name ml-1">{med.saude_relacionada}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                          {med.residente?.nome || 'Residente'}
                        </span>
                        <span>{med.residente?.quarto ? ' • Quarto: ' + med.residente.quarto : ''}</span>
                      </div>
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
      </div>
    </div>
  );
};

export default RegistroMedicamentos;