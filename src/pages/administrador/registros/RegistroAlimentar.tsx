import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaInfoCircle,
  FaFilter,
} from "react-icons/fa";
import { supabase } from "../../../lib/supabaseClient";

type RegistroAlimentar = {
  id: number;
  data: Date;
  horario: string;
  refeicao: string;
  alimento: string;
  id_residente: number;
  concluido: boolean;
  id_funcionario: number;
  residente?: string;
  funcionario?: string;
};

const RegistroAlimentar = () => {
  const [registros, setRegistros] = useState([
    { id: 1, data: new Date(), horario: "07:30", refeicao: "Café da Manhã", alimento: "Pão, leite, fruta", residentes: "João Santos", concluido: true },
    { id: 2, data: new Date(), horario: "12:00", refeicao: "Almoço", alimento: "Arroz, feijão, frango", residentes: "Maria Oliveira", concluido: false },
    { id: 3, data: new Date(), horario: "15:30", refeicao: "Lanche", alimento: "Bolo e suco", residentes: "João Santos", concluido: false },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const { data, error } = await supabase
          .from('registro')
          .select('*')
          .order('data_registro', { ascending: false })
          .order('horario', { ascending: false });

        if (error) throw error;

        setRegistros(data);
        for (const registro of data) {
          const [funcionario, residente] = await Promise.all([
            supabase
              .from('residente')
              .select('nome')
              .eq('id', registro.id_residente)
              .single(),
            supabase
              .from('funcionario')
              .select('nome')
              .eq('id', registro.id_funcionario)
              .single()
          ]);

          registro.residente = residente.data?.nome;
          registro.funcionario = funcionario.data?.nome;
        }
      } catch (error) {
        console.error('Erro ao buscar registros alimentares:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistros();
  }, []);

  const [modalAberto, setModalAberto] = useState(false);
  const [novoRegistro, setNovoRegistro] = useState({
    data: new Date().toISOString().split("T")[0],
    horario: "",
    refeicao: "Café da Manhã",
    alimento: "",
    residentes: "",
  });
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [filtroResidente, setFiltroResidente] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [infoVisivel, setInfoVisivel] = useState(false);
  const [filtroResidenteAberto, setFiltroResidenteAberto] = useState(false);
  const [filtroStatusAberto, setFiltroStatusAberto] = useState(false);

  const REFEICOES = ["Café da Manhã", "Almoço", "Lanche", "Jantar"];
  const STATUS = ["Pendente", "Consumido", "Parcial", "Não Consumido"];
  const residentesUnicos = [...new Set(registros.map(r => r.residentes))];

  // Funções básicas
  const abrirModalAdicionar = () => {
    setNovoRegistro({
      data: new Date().toISOString().split("T")[0],
      horario: "",
      refeicao: "Café da Manhã",
      alimento: "",
      residentes: "",
    });
    setEditando(false);
    setIdEditando(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (id) => {
    const registro = registros.find(r => r.id === id);
    if (registro) {
      setNovoRegistro({
        data: registro.data.toISOString().split("T")[0],
        horario: registro.horario,
        refeicao: registro.refeicao,
        alimento: registro.alimento,
        residentes: registro.residentes,
      });
      setEditando(true);
      setIdEditando(id);
      setModalAberto(true);
    }
  };

  const salvarRegistro = () => {
    if (!novoRegistro.alimento) return;

    const dataObj = new Date(novoRegistro.data);
    if (editando && idEditando) {
      setRegistros(prev => prev.map(r => r.id === idEditando ? { ...r, ...novoRegistro, data: dataObj } : r));
    } else {
      const novo = { id: Date.now(), ...novoRegistro, data: dataObj, concluido: false };
      setRegistros(prev => [...prev, novo]);
    }
    setModalAberto(false);
  };

  const excluirRegistro = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      setRegistros(prev => prev.filter(r => r.id !== id));
    }
  };

  // Filtragem
  const registrosFiltrados = registros
    .filter(r => {
      const passaFiltroResidente = !filtroResidente || r.residentes === filtroResidente;
      const passaFiltroStatus = !filtroStatus || r.concluido === (filtroStatus === 'consumido');
      return passaFiltroResidente && passaFiltroStatus;
    })
    .sort((a, b) => a.data - b.data || a.horario.localeCompare(b.horario));

  return (
    <div className="flex min-h-screen bg-odara-offwhite">
      <div className="flex-1 p-6 lg:p-10">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
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
                    O Registro de Quadro Alimentar registra as refeições oferecidas aos residentes,
                    com horário, tipo de refeição, alimentos e residentes.
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
              className={`flex items-center bg-white rounded-full px-3 py-2 shadow-sm border-2 font-medium hover:border-2 hover:border-odara-primary transition text-sm
                ${filtroStatusAberto
                  ? 'border-odara-primary text-gray-700'
                  : 'border-odara-primary/40 text-gray-700'} 
              `}
              onClick={() => {
                setFiltroStatusAberto(!filtroStatusAberto);
              }}
            >
              <FaFilter className="text-odara-accent mr-2" />
              Status
            </button>
            {filtroStatusAberto && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-odara-primary z-10 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setFiltroStatus("");
                    setFiltroStatusAberto(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${!filtroStatus
                    ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                    : 'text-odara-dark'
                    }`}
                >
                  Todos
                </button>
                {STATUS.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setFiltroStatus(status);
                      setFiltroStatusAberto(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-odara-primary/20 transition-colors duration-200 ${filtroStatus === status
                      ? 'bg-odara-accent/20 font-semibold text-odara-accent'
                      : 'text-odara-dark'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão Limpar Filtros */}
          {(filtroResidente || filtroStatus) && (
            <button
              onClick={() => {
                setFiltroResidente('');
                setFiltroStatus('');
              }}
              className="flex items-center bg-odara-accent text-odara-white rounded-full px-3 py-2 shadow-sm font-medium hover:bg-odara-secondary transition text-sm"
            >
              <FaTimes className="mr-2" /> Limpar Filtros
            </button>
          )}
        </div>

        {/* Card Principal */}
        <div className="bg-odara-white border-l-4 border-odara-primary rounded-2xl shadow-lg p-4 sm:p-6">
          <h2 className="text-2xl lg:text-4xl md:text-4xl font-bold text-odara-dark">
            Todos os Registros
          </h2>

          {/* Filtros ativos */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filtroResidente && (
              <span className="text-sm bg-odara-secondary text-odara-white px-2 py-1 rounded-full">
                Residente: {filtroResidente}
              </span>
            )}

            {filtroStatus && (
              <span className="text-sm bg-odara-primary text-odara-white px-2 py-1 rounded-full">
                Status: {filtroStatus}
              </span>
            )}
          </div>


          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {registrosFiltrados.length === 0 ? (
              <div className="p-6 rounded-xl bg-odara-name/10 text-center">
                <p className="text-odara-dark/60">
                  Nenhum registro encontrado
                </p>
              </div>
            ) : (
              registrosFiltrados.map(r => (
                <div key={r.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                  {/* HEADER - Data */}
                  <div className="flex items-center justify-between p-3 rounded-t-lg bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center">
                      <p className="text-sm sm:text-base text-odara-dark font-semibold">
                        {r.data.getDate().toString().padStart(2, '0')}/
                        {(r.data.getMonth() + 1).toString().padStart(2, '0')}/
                        {r.data.getFullYear()} - {r.horario}
                      </p>
                    </div>
                  </div>

                  {/* CORPO - Conteúdo do registro */}
                  <div className="p-4">
                    <h6 className="text-xl font-bold mb-3 text-odara-dark">{r.refeicao}</h6>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                      <div className="space-y-2">
                        <div>
                          <strong className="text-odara-dark">Alimento:</strong>
                          <span className="text-odara-name ml-1">{r.alimento}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <strong className="text-odara-dark">Residente:</strong>
                          <span className="text-odara-name ml-1">{r.residentes}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER - Ações */}
                  <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <span className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                          {r.residentes}
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
              ))
            )}
          </div>
        </div>

        {/* Modal para adicionar/editar registro */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">

              {/* Header do Modal */}
              <div className="bg-odara-primary text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {editando ? "Editar Alimentação" : "Novo Alimento"}
                  </h2>

                  <button
                    onClick={() => {
                      setModalAberto(false);
                      setEditando(false);
                      setIdEditando(null);
                    }}
                    className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <p className="text-odara-offwhite/80 mt-1 text-sm">
                  {editando
                    ? "Atualize as informações do Alimento"
                    : "Preencha os dados para adicionar um novo Alimento"}
                </p>
              </div>

              {/* Corpo do Modal */}
              <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                <form className="space-y-6">

                  <div className="space-y-4">

                    {/* Data e Hora */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-odara-dark font-medium mb-2">
                          Data *
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                          value={novoRegistro.data}
                          onChange={(e) =>
                            setNovoRegistro({ ...novoRegistro, data: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-odara-dark font-medium mb-2">
                          Horário *
                        </label>
                        <input
                          type="time"
                          className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                          value={novoRegistro.horario}
                          onChange={(e) =>
                            setNovoRegistro({ ...novoRegistro, horario: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Refeição */}
                    <div>
                      <label className="block text-odara-dark font-medium mb-2">
                        Refeição *
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        value={novoRegistro.refeicao}
                        onChange={(e) =>
                          setNovoRegistro({ ...novoRegistro, refeicao: e.target.value })
                        }
                      >
                        {REFEICOES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Alimento */}
                    <div>
                      <label className="block text-odara-dark font-medium mb-2">
                        Alimento *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        value={novoRegistro.alimento}
                        onChange={(e) =>
                          setNovoRegistro({ ...novoRegistro, alimento: e.target.value })
                        }
                        placeholder="Descreva os alimentos"
                      />
                    </div>

                    {/* Residentes */}
                    <div>
                      <label className="block text-odara-dark font-medium mb-2">
                        Residente
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        value={novoRegistro.residentes}
                        onChange={(e) =>
                          setNovoRegistro({
                            ...novoRegistro,
                            residentes: e.target.value,
                          })
                        }
                        placeholder="Nome do residente"
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setModalAberto(false)}
                      className="px-4 py-2 border-2 border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary hover:text-odara-white transition-colors duration-200"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={salvarRegistro}
                      className="px-4 py-2 bg-odara-accent text-odara-white rounded-lg hover:bg-odara-secondary transition-colors duration-200"
                      disabled={!novoRegistro.alimento || !novoRegistro.horario}
                    >
                      {editando ? "Atualizar" : "Salvar"}
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

export default RegistroAlimentar;