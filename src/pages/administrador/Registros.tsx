import { useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Search, HeartPulse, Pill, Microscope, ClipboardPlus, Star, Palette, Apple, Siren, UserRoundSearch, type LucideIcon } from 'lucide-react';

const Registros = () => {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  // Wrapper para ícones com configurações padrão
  const WrapperIcone = ({
    icone: Icone,
    tamanho = 24,
    className = ""
  }: {
    icone: LucideIcon;
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
      categoria: "saude",
    },
    {
      path: "/app/admin/registro/consultas",
      label: "Registro de Consultas",
      icon: ClipboardPlus,
      descricao: "Agendamento e histórico de consultas médicas",
      categoria: "saude",
    },
    {
      path: "/app/admin/registro/saudeInicial",
      label: "Registro de Saúde",
      icon: HeartPulse,
      descricao: "Monitoramento do estado de saúde dos residentes",
      categoria: "saude",
    },
    {
      path: "/app/admin/registro/exames",
      label: "Registro de Exames",
      icon: Microscope,
      descricao: "Controle e organização de exames médicos",
      categoria: "saude",
    },
    {
      path: "/app/admin/registro/preferencias",
      label: "Registro de Preferências",
      icon: Star,
      descricao: "Registro das preferências individuais dos residente",
      categoria: "rotina",
    },
    {
      path: "/app/admin/registro/atividades",
      label: "Registro de Atividades",
      icon: Palette,
      descricao: "Organização das atividades dos residentes",
      categoria: "rotina",
    },
    {
      path: "/app/admin/registro/alimentar",
      label: "Registro Alimentar",
      icon: Apple,
      descricao: "Controle de dieta e alimentação dos residentes",
      categoria: "rotina",
    },
    {
      path: "/app/admin/registro/ocorrencias",
      label: "Registro de Ocorrências",
      icon: Siren,
      descricao: "Registro de incidentes e situações especiais",
      categoria: "incidente",
    },
    {
      path: "/app/admin/registro/comportamento",
      label: "Registro de Comportamento",
      icon: UserRoundSearch,
      descricao: "Avaliação comportamental e acompanhamento psicológico",
      categoria: "incidente",
    },
  ];

    const opcoesFiltro = [
    {
      id: null,
      label: "Todas",
      icone: Filter,
    },
    {
      id: "saude",
      label: "Saúde",
      icone: HeartPulse,
    },
    {
      id: "incidente",
      label: "Incidentes",
      icone: Siren,
    },
    {
      id: "rotina",
      label: "Rotina",
      icone: Palette,
    },
  ];

    // Filtrar registros por busca
    const registrosFiltrados = registrosItems.filter(item => {
    const correspondeBusca =
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase());

    const correspondeCategoria =
      !categoriaFiltro || item.categoria === categoriaFiltro;

    return correspondeBusca && correspondeCategoria;
  });

  return (
    <div className="min-h-screen bg-odara-offwhite p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-odara-dark mb-2">Registros do Sistema</h1>
        <p className="text-odara-dark/60 text-xs sm:text-sm">
          Central de gerenciamento de todos os registros da instituição
        </p>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-odara-primary mr-3 h-4 w-4 shrink-0" />
          </div>

          <input
            type="text"
            placeholder="Buscar registros..."
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white rounded-xl border border-gray-200 text-odara-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-2 bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 text-odara-dark font-medium hover:bg-odara-primary/10 transition w-full sm:w-auto sm:min-w-48 justify-between"
            onClick={() => setFiltroAberto(!filtroAberto)}
          >
            <span className="text-sm sm:text-base">Ordenar por</span>
            <WrapperIcone icone={Filter} tamanho={18} className="text-odara-accent"/>
          </button>

        {filtroAberto && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden w-full sm:w-auto sm:min-w-48">
            {opcoesFiltro.map((filtro) => (
              <button
                key={filtro.id ?? "todas"}
                onClick={() => {
                  setCategoriaFiltro(filtro.id);
                  setFiltroAberto(false);
                }}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition
                  ${
                    categoriaFiltro === filtro.id
                      ? "bg-odara-primary/20 text-odara-primary font-semibold"
                      : "text-gray-700"
                  }`}
              >
                <WrapperIcone
                  icone={filtro.icone}
                  tamanho={16}
                  className={
                    categoriaFiltro === filtro.id
                      ? "text-odara-primary"
                      : "text-odara-accent"
                  }
                />
                <span>{filtro.label}</span>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Grid de registros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {registrosFiltrados.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-4 sm:p-6 flex flex-col group hover:border-odara-primary/30"
          >
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-odara-primary group-hover:scale-110 transition-transform`}>
                <WrapperIcone icone={item.icon} tamanho={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-odara-dark group-hover:text-odara-primary transition truncate">
                  {item.label}
                </h3>
                <p className="text-xs sm:text-sm text-odara-dark/60 mt-1 line-clamp-2">
                  {item.descricao}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-auto pt-3 sm:pt-4 border-t border-gray-100">
              <span className="text-odara-primary font-medium flex items-center gap-1 sm:gap-2 group-hover:gap-2 sm:group-hover:gap-3 transition-all text-sm sm:text-base">
                Acessar
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-xs sm:text-sm text-gray-400">
        Total de {registrosFiltrados.length} de {registrosItems.length} registros encontrados {searchTerm && (<span> para "{searchTerm}"</span>)}
      </div>

      {/* Mensagem quando não há registros quando mexer no filtro */}
      {registrosFiltrados.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-xl sm:rounded-2xl shadow-sm mt-4 sm:mt-6">
          <div className="p-3 sm:p-4 bg-odara-offwhite rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <Search className="text-odara-dark/40 text-xl sm:text-2xl" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-odara-dark mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-odara-dark/60 text-sm">
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