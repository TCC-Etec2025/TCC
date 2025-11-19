import React, { useState, useEffect } from 'react';
import {FaPlus, FaEdit, FaTrash, FaFilter, FaInfoCircle,FaFilePdf, FaArrowLeft, FaChevronLeft, FaChevronRight, FaTimes} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';

type Consultas = {
  id: number;
  id_residente: number;
  sexo: string;
  data_consulta: string; 
  horario: string;      
  medico: string;
  motivo_consulta: string; 
  idade: number;
  numero_prontuario: string;
  historico_clinico: string;
  tratamento_indicado: string;
  exames_solicitados: string;
  receitas_medicas: string;
  anexos_medicos: string;
  residente?: { nome: string }; 
  data?: Date; // Conselho da IA para compatibilidade
}

type Residente = {
  id: number;
  nome: string;
}

type ConsultaEditando = Consultas | null;

const RegistroConsultas = () => {
  const [loading, setLoading] = useState(false);
  const [consultas, setConsultas] = useState<Consultas[]>([]);
  const [novaConsulta, setNovaConsulta] = useState({ 
    id_residente: '',     
    sexo: '',
    data_consulta: '',    
    horario: '',          
    medico: '',
    motivo_consulta: '',
    idade: '',
    numero_prontuario: '',
    historico_clinico: '',
    tratamento_indicado: '',
    exames_solicitados: '',
    receitas_medicas: '',
    anexos_medicos: ''
  });
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtroMes, setFiltroMes] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaEditando, setConsultaEditando] = useState<ConsultaEditando>(null); 
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState('todos');
  const [consultaSelecionada, setConsultaSelecionada] = useState<any>(null);
  const [dataAtual, setDataAtual] = useState(new Date());
  const [filtroDiaAtivo, setFiltroDiaAtivo] = useState(false);
  const [filtroDia, setFiltroDia] = useState<Date | null>(null);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [sugestoesResidentes, setSugestoesResidentes] = useState<Residente[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [carregandoResidentes, setCarregandoResidentes] = useState(false);

  // Carrega residentes do banco
  useEffect(() => {
    const carregarResidentes = async () => {
      try {
        setCarregandoResidentes(true);
        const { data, error } = await supabase
          .from('residente')
          .select('id, nome')
          .order('nome');

        if (error) throw error;
        if (data) {
          setResidentes(data);
        }
      } catch (error) {
        console.error('Erro ao carregar residentes:', error);
      } finally {
        setCarregandoResidentes(false);
      }
    };

    carregarResidentes();
  }, []);

  // Carrega Consultas do banco
  useEffect(() => {
    const fetchConsultas = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('consultas_medicas')
          .select(`
            *,
            residente:residente(id, nome)
          `)
          .order('data_consulta', { ascending: false })
          .order('horario', { ascending: true });

        if (error) throw error;
        if (data) {
          // Converter data_consulta para Date object para o calendário
          const consultasComData = data.map(consulta => ({
            ...consulta,
            data: new Date(consulta.data_consulta + 'T00:00:00') // Converte string para Date
          }));
          setConsultas(consultasComData);
        }
      } catch (error) {
        console.error('Erro ao carregar consultas médicas:', error);
        alert('Erro ao carregar consultas médicas.');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultas();
  }, []);

  const abrirModalAdicionar = () => {
    setConsultaEditando(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (consulta: Consultas) => {
    const copia = {
      ...consulta,
      data: consulta.data instanceof Date ? consulta.data.toISOString().split('T')[0] : consulta.data
    };
    setConsultaEditando(copia);
    setModalAberto(true);
  };

  const salvarConsulta = async (formData: any) => {
    try {
      setLoading(true);

      // Validar campos obrigatórios
      if (!formData.id_residente || !formData.data_consulta || !formData.horario || 
          !formData.medico || !formData.motivo_consulta) {
        alert('Preencha todos os campos obrigatórios!');
        return;
      }

      const dadosConsulta = {
        id_residente: parseInt(formData.id_residente),
        sexo: formData.sexo,
        data_consulta: formData.data_consulta,
        horario: formData.horario, 
        medico: formData.medico,
        motivo_consulta: formData.motivo_consulta,
        idade: formData.idade ? parseInt(formData.idade) : null,
        numero_prontuario: formData.numero_prontuario,
        historico_clinico: formData.historico_clinico,
        tratamento_indicado: formData.tratamento_indicado,
        exames_solicitados: formData.exames_solicitados,
        receitas_medicas: formData.receitas_medicas,
        anexos_medicos: formData.anexos_medicos
      };

      if (consultaEditando) {
        // ATUALIZAR consulta
        const { data, error } = await supabase
          .from('consultas_medicas')
          .update(dadosConsulta)
          .eq('id', consultaEditando.id)
          .select(`
            *,
            residente:residente(id, nome)
          `);

        if (error) throw error;

        if (data) {
          const consultaAtualizada = {
            ...data[0],
            data: new Date(data[0].data_consulta + 'T00:00:00')
          };
          setConsultas(prev => 
            prev.map(item => 
              item.id === consultaEditando.id ? consultaAtualizada : item
            )
          );
          alert('Consulta atualizada com sucesso!');
        }
      } else {
        // CRIAR nova consulta
        const { data, error } = await supabase
          .from('consultas_medicas')
          .insert(dadosConsulta)
          .select(`
            *,
            residente:residente(id, nome)
          `);

        if (error) throw error;

        if (data && data[0]) {
          const novaConsultaComData = {
            ...data[0],
            data: new Date(data[0].data_consulta + 'T00:00:00')
          };
          setConsultas(prev => [...prev, novaConsultaComData]);
          alert('Consulta criada com sucesso!');
        }
      }

      setModalAberto(false);
      setConsultaEditando(null);
    } catch (error: any) {
      console.error('Erro ao salvar consulta:', error);
      alert(`Erro ao salvar consulta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const excluirConsulta = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta consulta?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('consultas_medicas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConsultas(prev => prev.filter(item => item.id !== id));
      alert('Consulta excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir consulta:', error);
      alert(`Erro ao excluir consulta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Residentes únicos para o filtro
  const pacientes = Array.from(new Set(
    consultas.map(c => c.residente?.nome).filter(Boolean)
  ));

  // Filtros
  const consultasFiltradas = consultas.filter(consulta => {
    const dataConsulta = consulta.data; // Já é Date object
    if (!dataConsulta) return false;
    
    const mesConsulta = dataConsulta.getMonth();
    const passaMes = filtroMes === 'todos' || (mesIdParaIndex[filtroMes as keyof typeof mesIdParaIndex] === mesConsulta);
    const passaPaciente = pacienteSelecionado === 'todos' || consulta.residente?.nome === pacienteSelecionado;
    return passaMes && passaPaciente;
  }).sort((a,b) => {
    // Ordenar por data e horário
    if (!a.data || !b.data) return 0;
    const dataDiff = a.data.getTime() - b.data.getTime();
    if (dataDiff !== 0) return dataDiff;
    return a.horario.localeCompare(b.horario);
  });

  // Funções no calendário
  const mesesLista = [
    { id: 'todos', label: 'Todos os meses' },
    { id: 'janeiro', label: 'Janeiro' },
    { id: 'fevereiro', label: 'Fevereiro' },
    { id: 'marco', label: 'Março' },
    { id: 'abril', label: 'Abril' },
    { id: 'maio', label: 'Maio' },
    { id: 'junho', label: 'Junho' },
    { id: 'julho', label: 'Julho' },
    { id: 'agosto', label: 'Agosto' },
    { id: 'setembro', label: 'Setembro' },
    { id: 'outubro', label: 'Outubro' },
    { id: 'novembro', label: 'Novembro' },
    { id: 'dezembro', label: 'Dezembro' }
  ];

  const mesIdParaIndex = {
    janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
    julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
  };

  const alterarMes = (deslocamento: number) => {
    setDataAtual(ant => {
      const nova = new Date(ant);
      nova.setMonth(ant.getMonth() + deslocamento);
      return nova;
    });
  };

  const irParaMesAtual = () => {
    const hoje = new Date();
    setDataAtual(hoje);
    setFiltroDia(hoje);
    setFiltroDiaAtivo(true);
  };

  const irParaDiaAtual = () => {
    // Implementação vazia - pode ser removida se não for usada
  };

  const renderizarCabecalhoCalendario = () => {
    const nomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    return `${nomes[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;
  };

  const obterConsultasDoDia = (dia: number, mes: number, ano: number) => {
    return consultas.filter(c => {
      if (!(c.data instanceof Date)) return false;
      return c.data.getDate() === dia && c.data.getMonth() === mes && c.data.getFullYear() === ano;
    });
  };

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    let classes = [];

    const hoje = new Date();
    if (date.getDate() === hoje.getDate() &&
      date.getMonth() === hoje.getMonth() &&
      date.getFullYear() === hoje.getFullYear()) {
      classes.push('!bg-odara-primary/50 !text-dark !font-bold');
    }

    if (filtroDiaAtivo && filtroDia &&
      date.getDate() === filtroDia.getDate() &&
      date.getMonth() === filtroDia.getMonth() &&
      date.getFullYear() === filtroDia.getFullYear()) {
      classes.push('!bg-odara-secondary/70 !text-white !font-bold');
    }

    return classes.join(' ');
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const consultasDoDia = obterConsultasDoDia(date.getDate(), date.getMonth(), date.getFullYear());
    const count = consultasDoDia.length;
    
    if (count > 0) {
      return (
        <div className="mt-1 flex justify-center">
          <div className="w-6 h-6 rounded-full bg-odara-accent text-white text-xs font-bold flex items-center justify-center">
            {count}
          </div>
        </div>
      );
    }
    
    return null;
  };

  const handleDayClick = (value: Date) => {
    if (filtroDiaAtivo && filtroDia &&
      value.getDate() === filtroDia.getDate() &&
      value.getMonth() === filtroDia.getMonth() &&
      value.getFullYear() === filtroDia.getFullYear()) {
      setFiltroDiaAtivo(false);
      setFiltroDia(null);
      setConsultaSelecionada(null);
    } else {
      setFiltroDia(value);
      setFiltroDiaAtivo(true);
      setConsultaSelecionada({ dia: value });
    }
  };

  // Consultas mostradas
  const consultasMostradas = (() => {
    if (consultaSelecionada && consultaSelecionada.dia) {
      const dia = consultaSelecionada.dia;
      return consultas.filter(c => c.data instanceof Date &&
        c.data.getDate() === dia.getDate() &&
        c.data.getMonth() === dia.getMonth() &&
        c.data.getFullYear() === dia.getFullYear()
      ).sort((a,b)=> a.horario.localeCompare(b.horario));
    }
    return consultasFiltradas;
  })();

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-odara-dark mr-2">Registro de Consultas Médicas</h1>
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
                  <h3 className="font-bold mb-2">Registro de Consultas Médicas</h3>
                  <p>
                    O Registro de Consultas Médicas deve conter nome, idade, sexo, prontuário, data e horário, profissional, motivo, histórico, tratamentos, exames, receitas, e anexos.
                  </p>
                  <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="relative flex items-center gap-4 mb-6">
          {/* Botão Adicionar */}
          <button
            onClick={abrirModalAdicionar}
            className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-emibold py-2 px-4 rounded-lg flex items-center transition duration-200"
          >
            <FaPlus className="mr-2 text-odara-white" /> Nova Consulta
          </button>

          {/* Filtro por Mês */}
          <div className="relative">
            <button
              className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition w-full justify-center"
              onClick={() => setFiltroAberto(!filtroAberto)}
            >
              <FaFilter className="text-odara-accent mr-2" />
              {mesesLista.find(m => m.id === filtroMes)?.label || 'Mês'}
            </button>

            {filtroAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                {mesesLista.map(mes => (
                  <button
                    key={mes.id}
                    onClick={() => { 
                      setFiltroMes(mes.id); 
                      setFiltroAberto(false); 
                      setConsultaSelecionada(null);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-indigo-50 ${filtroMes === mes.id ? 'bg-indigo-100 font-semibold' : ''}`}
                  >
                    {mes.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro por Paciente */}
          <div className="relative">
            <select
              className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition w-full justify-center appearance-none cursor-pointer"
              value={pacienteSelecionado}
              onChange={(e) => { 
                setPacienteSelecionado(e.target.value); 
                setConsultaSelecionada(null); 
              }}
            >
              <option value="todos">Todos os pacientes</option>
              {pacientes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          {(filtroDiaAtivo || filtroMes !== 'todos' || pacienteSelecionado !== 'todos') && (
            <button
              onClick={() => { 
                setFiltroDiaAtivo(false); 
                setFiltroDia(null);
                setFiltroMes('todos'); 
                setPacienteSelecionado('todos'); 
                setConsultaSelecionada(null);
              }}
              className="flex items-center bg-odara-accent text-odara-white rounded-full px-4 py-2 shadow-sm font-medium hover:bg-odara-secondary transition"
            >
              <FaTimes className="mr-1" /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção de Consultas */}
          <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-odara-dark flex items-center mb-2">
              {filtroMes === 'todos' ? 'Todas as Consultas' : `Consultas - ${mesesLista.find(m => m.id === filtroMes)?.label}`}
              {consultaSelecionada && ` (Dia ${consultaSelecionada.dia.getDate()})`}
            </h2>

            {/* Filtros ativos */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filtroDiaAtivo && (
                <span className="text-sm bg-odara-accent text-odara-white px-2 py-1 rounded-full">
                  Dia: {filtroDia.getDate().toString().padStart(2, '0')}/{(filtroDia.getMonth() + 1).toString().padStart(2, '0')}
                </span>
              )}

              {filtroMes !== 'todos' && (
                <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
                  Mês: {mesesLista.find(m => m.id === filtroMes)?.label}
                </span>
              )}

              {pacienteSelecionado !== 'todos' && (
                <span className="text-sm bg-odara-dropdown-accent text-odara-white px-2 py-1 rounded-full">
                  Paciente: {pacienteSelecionado}
                </span>
              )}
            </div>

            <p className="text-odara-name/60 mb-6">
              {consultasMostradas.length === 0 
                ? 'Nenhuma consulta encontrada' 
                : `${consultasMostradas.length} consulta(s) encontrada(s)`
              }
            </p>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {consultasMostradas.length === 0 ? (
                <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                  <p className="text-odara-dark/60">
                    {filtroDiaAtivo 
                      ? 'Nenhuma consulta encontrada para este dia' 
                      : 'Nenhuma consulta encontrada'
                    }
                  </p>
                </div>
              ) : (
                consultasMostradas.map(consulta => (
                  <div
                    key={consulta.id}
                    className="p-4 rounded-xl hover:shadow-md transition-shadow duration-200 bg-odara-offwhite"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-odara-accent"></span>
                        <p className="text-base font-semibold">
                          {consulta.data instanceof Date 
                            ? `${consulta.data.getDate().toString().padStart(2,'0')}/${(consulta.data.getMonth()+1).toString().padStart(2,'0')}/${consulta.data.getFullYear()}`
                            : consulta.data_consulta
                          } às {consulta.horario}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => abrirModalEditar(consulta)}
                          className="text-odara-secondary hover:text-odara-dropdown-accent transition-colors duration-200 p-2 rounded-full hover:bg-odara-dropdown"
                          title="Editar consulta"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => excluirConsulta(consulta.id)}
                          className="text-odara-alerta hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-odara-alerta/50"
                          title="Excluir consulta"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>

                    <h6 className="text-xl font-bold mb-1">{consulta.residente?.nome}</h6>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                      <div>
                        <strong>Idade:</strong> {consulta.idade} anos
                      </div>
                      <div>
                        <strong>Sexo:</strong> {consulta.sexo}
                      </div>
                      <div>
                        <strong>Prontuário:</strong> {consulta.numero_prontuario}
                      </div>
                      <div>
                        <strong>Médico:</strong> {consulta.medico}
                      </div>
                    </div>

                    <div className="mb-2">
                      <strong>Motivo:</strong> {consulta.motivo_consulta}
                    </div>

                    {consulta.historico_clinico && (
                      <div className="mb-2">
                        <strong>Histórico:</strong> {consulta.historico_clinico}
                      </div>
                    )}

                    {consulta.tratamento_indicado && (
                      <div className="mb-2">
                        <strong>Tratamento:</strong> {consulta.tratamento_indicado}
                      </div>
                    )}

                    {consulta.exames_solicitados && (
                      <div className="mb-2">
                        <strong>Exames:</strong> {consulta.exames_solicitados}
                      </div>
                    )}

                    {consulta.receitas_medicas && (
                      <div className="mb-2">
                        <strong>Receitas:</strong> {consulta.receitas_medicas}
                      </div>
                    )}

                    {consulta.anexos_medicos && (
                      <div className="mb-2">
                        <strong>Anexos:</strong>
                        <div className="flex space-x-2 mt-1">
                          <div className="flex items-center text-odara-accent text-sm">
                            <FaFilePdf className="mr-1" />
                            <span>Documento médico</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="bg-odara-dropdown text-odara-dropdown-name/60 px-2 py-1 rounded-md text-xs">
                        {consulta.medico}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Calendário */}
          <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-6">
            <div className="flex justify-center mb-5">
              <button
                onClick={irParaMesAtual}
                className="bg-odara-accent hover:bg-odara-secondary text-odara-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Hoje
              </button>
            </div>

            <div className="flex justify-center border-2 border-odara-primary rounded-xl shadow-sm overflow-hidden max-w-md mx-auto">
              <Calendar
                value={dataAtual}
                onChange={setDataAtual}
                onClickDay={handleDayClick}
                tileClassName={getTileClassName}
                tileContent={getTileContent}
                locale="pt-BR"
                className="border-0"
                nextLabel={<FaChevronRight />}
                prevLabel={<FaChevronLeft />}
                next2Label={null}
                prev2Label={null}
                showNeighboringMonth={false}
              />
            </div>

            {/* Estatísticas do dia */}
            <div className="grid grid-cols-1 mt-4 p-3 bg-odara-offwhite rounded-lg max-w-md mx-auto text-center">
              <h6 className="font-semibold text-odara-dark mb-2">Estatísticas do Dia:</h6>
              {filtroDia ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Consultas:</span>
                    <span className="font-semibold">
                      {obterConsultasDoDia(filtroDia.getDate(), filtroDia.getMonth(), filtroDia.getFullYear()).length} registros
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pacientes:</span>
                    <span className="font-semibold">
                      {[...new Set(obterConsultasDoDia(filtroDia.getDate(), filtroDia.getMonth(), filtroDia.getFullYear()).map(c => c.residente?.nome))].length} pacientes
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-odara-name/60">Selecione um dia no calendário para ver as estatísticas</p>
              )}
              
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="flex justify-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-odara-accent"></div>
                    <span>Dia com consultas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Abrir Modal */}
        {modalAberto && (
          <ModalConsulta
            consulta={consultaEditando}
            onClose={() => { setModalAberto(false); setConsultaEditando(null); }}
            onSave={salvarConsulta}
            residentes={residentes}
          />
        )}
      </div>
    </div>
  );
};

// Componente Modal
type ModalConsultaProps = {
  consulta: ConsultaEditando;
  onClose: () => void;
  onSave: (formData: any) => void;
  residentes: Residente[];
};

const ModalConsulta = ({ consulta, onClose, onSave, residentes }: ModalConsultaProps) => {
  const initial = consulta ? {
    ...consulta,
    data_consulta: consulta.data instanceof Date ? consulta.data.toISOString().split('T')[0] : (consulta.data_consulta || '')
  } : {
    id_residente: '',
    idade: '',
    sexo: 'Masculino',
    numero_prontuario: '',
    data_consulta: '',
    horario: '',
    medico: '',
    motivo_consulta: '',
    historico_clinico: '',
    tratamento_indicado: '',
    exames_solicitados: '',
    receitas_medicas: '',
    anexos_medicos: ''
  };

  const [formData, setFormData] = useState(initial);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-odara-offwhite/80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 border-l-4 border-odara-primary max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-odara-accent">
            {consulta ? 'Editar' : 'Nova'} Consulta Médica
          </h2>
          <button
            onClick={onClose}
            className="text-odara-primary hover:text-odara-secondary transition-colors duration-200"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-odara-dark font-medium mb-2">Residente *</label>
              <select 
                name="id_residente" 
                value={formData.id_residente} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                required
              >
                <option value="">Selecione um residente</option>
                {residentes.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-odara-dark font-medium mb-2">Idade *</label>
              <input 
                name="idade" 
                type="number" 
                value={formData.idade} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                required 
              />
            </div>
            <div>
              <label className="block text-odara-dark font-medium mb-2">Sexo *</label>
              <select 
                name="sexo" 
                value={formData.sexo} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                required
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-odara-dark font-medium mb-2">Nº Prontuário *</label>
              <input 
                name="numero_prontuario" 
                value={formData.numero_prontuario} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                required 
              />
            </div>

            <div>
              <label className="block text-odara-dark font-medium mb-2">Data *</label>
              <input 
                name="data_consulta" 
                type="date" 
                value={formData.data_consulta} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                required 
              />
            </div>
            <div>
              <label className="block text-odara-dark font-medium mb-2">Horário *</label>
              <input 
                name="horario" 
                type="time" 
                value={formData.horario} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                required 
              />
            </div>

            <div>
              <label className="block text-odara-dark font-medium mb-2">Médico *</label>
              <input 
                name="medico" 
                value={formData.medico} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-odara-dark font-medium mb-2">Motivo da Consulta *</label>
            <textarea 
              name="motivo_consulta" 
              value={formData.motivo_consulta} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
              rows="3" 
              required 
            />
          </div>

          <div>
            <label className="block text-odara-dark font-medium mb-2">Histórico e Evolução Clínica</label>
            <textarea 
              name="historico_clinico" 
              value={formData.historico_clinico} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
              rows="3" 
            />
          </div>

          <div>
            <label className="block text-odara-dark font-medium mb-2">Tratamento Indicado</label>
            <textarea 
              name="tratamento_indicado" 
              value={formData.tratamento_indicado} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
              rows="2" 
            />
          </div>

          <div>
            <label className="block text-odara-dark font-medium mb-2">Exames Solicitados</label>
            <textarea 
              name="exames_solicitados" 
              value={formData.exames_solicitados} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
              rows="2" 
            />
          </div>

          <div>
            <label className="block text-odara-dark font-medium mb-2">Receitas Médicas</label>
            <textarea 
              name="receitas_medicas" 
              value={formData.receitas_medicas} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary" 
              rows="2" 
            />
          </div>

          <div>
            <label className="block text-odara-dark font-medium mb-2">Anexos Médicos</label>
            <input 
              name="anexos_medicos" 
              type="text" 
              value={formData.anexos_medicos} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
              placeholder="Descrição dos anexos médicos"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-odara-accent text-odara-white rounded-lg hover:bg-odara-secondary transition-colors duration-200"
            >
              {consulta ? 'Salvar Alterações' : 'Salvar Consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroConsultas;