import { useState } from "react";
import { Link } from "react-router-dom";
import { FaFilter } from "react-icons/fa";
import { Filter, Search, HeartPulse, Pill, Stethoscope, ClipboardPlus, Star, Palette, Apple, Siren, UserRoundSearch } from 'lucide-react';

const Registros = () => {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Wrapper para ícones com configurações padrão
  const WrapperIcone = ({
    icone: Icone,
    tamanho = 24,
    className = ""
  }: {
    icone: React.ComponentType<any>;
    tamanho?: number;
    className?: string;
  }) => (
    <Icone size={tamanho} className={className} />
  );

  const registrosItems = [
    {
      path: "/app/admin/registro/medicamentos",
      label: "Registro de Medicamentos",
      icon: Pill,
      descricao: "Controle de administração e estoque de medicamentos",
    },
    {
      path: "/app/admin/registro/consultas",
      label: "Registro de Consultas",
      icon: ClipboardPlus,
      descricao: "Agendamento e histórico de consultas médicas",
    },
    {
      path: "/app/admin/registro/saudeInicial",
      label: "Registro de Saúde",
      icon: HeartPulse,
      descricao: "Acompanhamento de condições de saúde e sinais vitais",
    },
    {
      path: "/app/admin/registro/exames",
      label: "Registro de Exames",
      icon: Stethoscope,
      descricao: "Controle de exames médicos e resultados",
    },
    {
      path: "/app/admin/registro/preferencias",
      label: "Registro de Preferências",
      icon: Star,
      descricao: "Preferências pessoais e hábitos dos residentes",
    },
    {
      path: "/app/admin/registro/atividades",
      label: "Registro de Atividades",
      icon: Palette,
      descricao: "Programação e acompanhamento de atividades",
    },
    {
      path: "/app/admin/registro/alimentar",
      label: "Registro Alimentar",
      icon: Apple,
      descricao: "Controle de dieta e alimentação dos residentes",
    },
    {
      path: "/app/admin/registro/ocorrencias",
      label: "Registro de Ocorrências",
      icon: Siren,
      descricao: "Registro de incidentes e situações especiais",
    },
    {
      path: "/app/admin/registro/comportamento",
      label: "Registro de Comportamento",
      icon: UserRoundSearch,
      descricao: "Avaliação comportamental e acompanhamento psicológico",
    },
  ];

  // Filtrar registros por busca
  const registrosFiltrados = registrosItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-odara-offwhite p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-odara-dark mb-2">Registros do Sistema</h1>
        <p className="text-odara-dark/60 text-sm">
          Central de gerenciamento de todos os registros da instituição
        </p>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-odara-primary mr-3 h-4 w-4 flex-shrink-" />
          </div>

          <input
            type="text"
            placeholder="Buscar registros..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition min-w-48 justify-between"
            onClick={() => setFiltroAberto(!filtroAberto)}
          >
            <span>Ordenar por</span>
            <WrapperIcone icone={Filter} tamanho={20} className="text-odara-accent"/>
          </button>

          {filtroAberto && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden min-w-48">
              <button
                onClick={() => setFiltroAberto(false)}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition text-gray-700 border-b border-gray-100"
              >
                Nome (A-Z)
              </button>
              <button
                onClick={() => setFiltroAberto(false)}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition text-gray-700"
              >
                Mais recentes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid de registros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {registrosFiltrados.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6 flex flex-col group hover:border-odara-primary/30"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl text-odara-primary group-hover:scale-110 transition-transform`}>
                <WrapperIcone icone={item.icon} tamanho={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-odara-dark group-hover:text-odara-primary transition">
                  {item.label}
                </h3>
                <p className="text-sm text-odara-dark/60 mt-1">
                  {item.descricao}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-auto pt-4 border-t border-gray-100">
              <span className="text-odara-primary font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                Acessar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-sm text-gray-400">
        Total de {registrosFiltrados.length} de {registrosItems.length} registros encontrados {searchTerm && (<span> para "{searchTerm}"</span>)}
      </div>

      {/* Mensagem quando não há registros quando mexer no filtro */}
      {registrosFiltrados.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <div className="p-4 bg-odara-offwhite rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Search className="text-odara-dark/40 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-odara-dark mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-odara-dark/60">
            {searchTerm
              ? "Tente ajustar os termos da busca"
              : "Não há registros disponíveis no momento"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Registros;