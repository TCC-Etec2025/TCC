import { useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Search, CheckCircle, Clock, AlertTriangle, Pill, ClipboardPlus, Apple, Palette, Microscope, Users, ArrowRight } from 'lucide-react';

const PaginaChecklist = () => {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

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

  const checklistsItems = [
    {
      id: 1,
      path: "consultas/medicas",
      label: "Consultas Médicas",
      icon: ClipboardPlus,
      status: "pendente",
      residentes: 3,
      prazo: "Hoje",
      descricao: "Registro de consultas e acompanhamentos médicos"
    },
    {
      id: 2,
      path: "alimentacao",
      label: "Alimentação",
      icon: Apple,
      status: "concluido",
      residentes: 8,
      prazo: "Hoje",
      descricao: "Controle de refeições e dieta dos residentes"
    },
    {
      id: 3,
      path: "exames/medicos",
      label: "Exames Médicos",
      icon: Microscope,
      status: "atrasado",
      residentes: 2,
      prazo: "Ontem",
      descricao: "Controle de exames e resultados médicos"
    },
    {
      id: 4,
      path: "medicamentos",
      label: "Medicamentos",
      icon: Pill,
      status: "pendente",
      residentes: 6,
      prazo: "Hoje",
      descricao: "Administração e controle de medicamentos"
    },
    {
      id: 5,
      path: "atividades",
      label: "Atividades",
      icon: Palette,
      status: "concluido",
      residentes: 8,
      prazo: "Hoje",
      descricao: "Registro de atividades recreativas e terapêuticas"
    },
  ];

  const opcoesFiltro = [
    { id: "todos", label: "Todos os Checklists", icone: Filter },
    { id: "pendente", label: "Pendentes", icone: Clock },
    { id: "concluido", label: "Concluídos", icone: CheckCircle },
    { id: "atrasado", label: "Atrasados", icone: AlertTriangle },
  ];

  // Filtrar checklists por busca e status
  const checklistsFiltrados = checklistsItems.filter(item => {
    const correspondeBusca = item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const correspondeStatus = filtroStatus === "todos" || item.status === filtroStatus;
    
    return correspondeBusca && correspondeStatus;
  });

  // Calcula estatísticas em tempo real
  const estatisticas = {
    total: checklistsItems.length,
    pendentes: checklistsItems.filter(item => item.status === "pendente").length,
    concluidos: checklistsItems.filter(item => item.status === "concluido").length,
    atrasados: checklistsItems.filter(item => item.status === "atrasado").length,
  };

  // Retorna as classes CSS para o status
  const obterCorStatus = (status: string) => {
    switch (status) {
      case "concluido": return "bg-green-100 text-green-700";
      case "pendente": return "bg-yellow-100 text-yellow-700";
      case "atrasado": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Retorna o texto do status
  const obterTextoStatus = (status: string) => {
    switch (status) {
      case "concluido": return "Concluído";
      case "pendente": return "Pendente";
      case "atrasado": return "Atrasado";
      default: return "Pendente";
    }
  };

  // Retorna o ícone do status
  const obterIconeStatus = (status: string) => {
    switch (status) {
      case "concluido": return CheckCircle;
      case "pendente": return Clock;
      case "atrasado": return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-odara-offwhite p-6 lg:p-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-odara-dark mb-2">Meus Checklists</h1>
        <p className="text-odara-dark/60 text-sm">
          Checklist diários dos residentes sob sua responsabilidade
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-odara-dropdown/50 rounded-lg flex items-center justify-center mr-4">
              <WrapperIcone icone={Filter} className="text-odara-dropdown-accent text-xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-odara-dark">{estatisticas.total}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center mr-4">
              <WrapperIcone icone={Clock} className="text-yellow-500 text-xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-odara-dark">{estatisticas.pendentes}</div>
              <div className="text-sm text-gray-400">Pendentes</div>
            </div>
          </div>
        </div>

        {/* Concluídos */}
        <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mr-4">
              <WrapperIcone icone={CheckCircle} className="text-green-500 text-xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-odara-dark">{estatisticas.concluidos}</div>
              <div className="text-sm text-gray-400">Concluídos</div>
            </div>
          </div>
        </div>

        {/* Atrasados */}
        <div className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-odara-alerta/10 rounded-lg flex items-center justify-center mr-4">
              <WrapperIcone icone={AlertTriangle} className="text-odara-alerta text-xl" />
            </div>
            <div>
              <div className="text-2xl font-bold text-odara-dark">{estatisticas.atrasados}</div>
              <div className="text-sm text-gray-400">Atrasados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <WrapperIcone icone={Search} className="text-odara-primary mr-3 h-4 w-4 flex-shrink-0" />
          </div>

          <input
            type="text"
            placeholder="Buscar checklists por nome ou descrição..."
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
            <span>{opcoesFiltro.find(filtro => filtro.id === filtroStatus)?.label}</span>
            <WrapperIcone icone={Filter} tamanho={20} className="text-odara-accent" />
          </button>

          {filtroAberto && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden min-w-48">
              {opcoesFiltro.map(filtro => (
                <button
                  key={filtro.id}
                  onClick={() => { 
                    setFiltroStatus(filtro.id); 
                    setFiltroAberto(false); 
                  }}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-odara-primary/10 transition ${
                    filtroStatus === filtro.id
                      ? 'bg-odara-primary/20 text-odara-primary font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  <WrapperIcone 
                    icone={filtro.icone} 
                    tamanho={16} 
                    className={filtroStatus === filtro.id ? "text-odara-primary" : "text-odara-accent"} 
                  />
                  <span>{filtro.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid de checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checklistsFiltrados.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6 flex flex-col group hover:border-odara-primary/30"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-odara-primary/10 text-odara-primary group-hover:bg-odara-primary/20 transition">
                <WrapperIcone icone={item.icon} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-odara-dark group-hover:text-odara-primary transition">
                  {item.label}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <WrapperIcone 
                    icone={obterIconeStatus(item.status)} 
                    tamanho={16} 
                    className={
                      item.status === "concluido" ? "text-green-500" :
                      item.status === "pendente" ? "text-yellow-500" :
                      item.status === "atrasado" ? "text-red-500" : "text-gray-400"
                    } 
                  />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${obterCorStatus(item.status)}`}>
                    {obterTextoStatus(item.status)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-odara-dark/70 mb-4 flex-1">{item.descricao}</p>

            <div className="flex justify-between text-sm text-odara-dark/60 mb-4">
              <div className="flex items-center gap-2">
                <WrapperIcone icone={Users} tamanho={16} className="text-odara-primary" />
                <span>{item.residentes} residente(s)</span>
              </div>
              <div className={`flex items-center gap-2 ${
                item.status === "atrasado" ? "text-red-600 font-medium" : ""
              }`}>
                <WrapperIcone icone={Clock} tamanho={14} />
                <span>{item.prazo}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <span className="text-odara-primary font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                {item.status === "concluido" ? "Ver Checklist" : "Preencher Checklist"}
                <WrapperIcone icone={ArrowRight} tamanho={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-sm text-gray-400">
        Total de {checklistsFiltrados.length} de {checklistsItems.length} checklists encontrados 
        {searchTerm && <span> para "{searchTerm}"</span>}
        {filtroStatus !== "todos" && <span> - Filtro: {opcoesFiltro.find(f => f.id === filtroStatus)?.label}</span>}
      </div>

      {/* Mensagem quando não há checklists */}
      {checklistsFiltrados.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <div className="p-4 bg-odara-offwhite rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <WrapperIcone icone={Filter} className="text-odara-dark/40 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-odara-dark mb-2">
            Nenhum checklist encontrado
          </h3>
          <p className="text-odara-dark/60">
            {searchTerm || filtroStatus !== "todos" 
              ? "Tente ajustar os termos da busca ou o filtro de status" 
              : "Todos os checklists estão em dia!"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PaginaChecklist;