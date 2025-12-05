import { useState, useRef, useEffect } from 'react';
import { Pill, ClipboardList, AlertTriangle, Hospital, Utensils, BarChart, Star, Stethoscope, Microscope } from "lucide-react"

const Documentacao = () => {
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null); 

  const funcionalidades = [
    {
      nome: 'Registro de Medicamentos',
      descricao: 'Controle de administração e estoque de medicamentos',
      icone: <Pill size={24} />,
      detalhes: [
        'Cadastro de medicamentos com dosagens e horários',
        'Histórico detalhado de administração',
        'Monitoramento contínuo do uso de cada medicação'
      ],
      beneficios: [
        'Redução de erros na medicação',
        'Otimização do tempo da equipe',
        'Maior segurança para os residentes'
      ]
    },
    {
      nome: 'Registro de Exames Médicos',
      descricao: 'Controle e organização de exames médicos',
      icone: <Microscope size={24} />,
      detalhes: [
        'Agendamento de exames futuros',
        'Alertas para exames pendentes',
        'Histórico completo dos exames'
      ],
      beneficios: [
        'Organização centralizada',
        'Monitoramento contínuo da saúde',
        'Acesso rápido às informações'
      ]
    },
    {
      nome: 'Registro de Consultas Médicas',
      descricao: 'Agendamento e histórico de consultas médicas',
      icone: <Stethoscope size={24} />,
      detalhes: [
        'Agendamento e controle de consultas',
        'Prescrições e orientações médicas',
        'Histórico de atendimentos'
      ],
      beneficios: [
        'Maior organização do histórico clínico',
        'Acesso rápido a prescrições antigas',
        'Melhor preparo antes de cada consulta'
      ]
    },
    {
      nome: 'Registro da Saúde Corporal',
      descricao: 'Monitoramento do estado de saúde dos residentes',
      icone: <Hospital size={24} />,
      detalhes: [
        'Registro de ferimentos e lesões',
        'Monitoramento de sinais vitais',
        'Controle de curativos e tratamentos'
      ],
      beneficios: [
        'Detecção precoce de problemas',
        'Acompanhamento visual da evolução',
        'Documentação do estado físico'
      ]
    },
    {
      nome: 'Registro de Ocorrências',
      descricao: 'Registro de incidentes e situações especiais',
      icone: <AlertTriangle size={24} />,
      detalhes: [
        'Categorização de incidentes',
        'Fluxo de notificação automática',
        'Acompanhamento de resolução'
      ],
      beneficios: [
        'Transparência com familiares',
        'Prevenção de recorrências',
        'Base legal para eventuais situações'
      ]
    },
    {
      nome: 'Registro de Comportamento',
      descricao: 'Avaliação comportamental e acompanhamento psicológico',
      icone: <BarChart size={24} />,
      detalhes: [
        'Registro de padrões diários',
        'Identificação de gatilhos',
        'Diário comportamental personalizável'
      ],
      beneficios: [
        'Cuidado personalizado',
        'Melhora na qualidade de vida',
        'Suporte a diagnósticos médicos'
      ]
    },
    {
      nome: 'Registro de Atividades',
      descricao: 'Organização das atividades dos residentes',
      icone: <ClipboardList size={24} />,
      detalhes: [
        'Controle de participação',
        'Customização por residente',
        'Organização de eventos regulares'
      ],
      beneficios: [
        'Estímulo cognitivo constante',
        'Socialização monitorada',
        'Rotina organizada e previsível'
      ]
    },
    {
      nome: 'Registro de Alimentação',
      descricao: 'Controle de dieta e alimentação dos residentes',
      icone: <Utensils size={24} />,
      detalhes: [
        'Controle de dietas especiais',
        'Monitoramento nutricuional',
        'Cardápios personalizados'
      ],
      beneficios: [
        'Adequação nutricional',
        'Prevenção de desidratação',
        'Identificação de dificuldades'
      ]
    },
    {
      nome: 'Registro de Preferências',
      descricao: 'Registro das preferências individuais dos residente',
      icone: <Star size={24} />,
      detalhes: [
        'Perfil completo de preferências',
        'Gostos alimentares específicos',
        'Atividades de preferência'
      ],
      beneficios: [
        'Cuidado humanizado',
        'Respeito à individualidade',
        'Maior conforto do residente'
      ]
    },
  ];

  // Efeito para rolar até os detalhes quando activeItem muda
  useEffect(() => {
    if (activeItem !== null) {
      setTimeout(() => {
        const el = detailsRef.current;
        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 50);
    }
  }, [activeItem]);

  const handleCloseDetails = () => {
    setActiveItem(null);
    // Rola para o topo após fechar os detalhes
    setTimeout(() => {
      if (topRef.current) {
        topRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        // Fallback: rola para o topo da página
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  return (
    <main className="min-h-screen bg-odara-offwhite font-sans">
      <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 max-w-6xl">
        {/* Ref para o topo da página */}
        <div ref={topRef} />
        
        {/* Cabeçalho */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-odara-accent mb-3 sm:mb-4">
            Funcionalidades do Sistema
          </h1>
          <h2 className="text-lg sm:text-xl text-odara-dark max-w-2xl mx-auto px-4">
            Explore todas as ferramentas disponíveis para gestão de ILPIs
          </h2>
        </header>

        {/* Lista de funcionalidades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {funcionalidades.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveItem(index)}
              className={`group text-odara-dark p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-lg text-left border-l-4 transition-all duration-300 ${
                activeItem === index 
                  ? 'bg-odara-dropdown border-odara-secondary shadow-md transform scale-105' 
                  : 'bg-white border-odara-primary hover:bg-odara-primary/10 hover:border-odara-accent transform hover:scale-105'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className={`text-lg shrink-0 mt-0.5 ${
                  activeItem === index ? 'text-odara-secondary' : 'text-odara-primary group-hover:text-odara-accent'
                }`}>
                  {item.icone}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold leading-tight ${
                    activeItem === index ? 'text-odara-dropdown-accent' : 'text-odara-dark group-hover:text-odara-dark'
                  }`}>
                    {item.nome}
                  </h3>
                  <p className="text-xs text-odara-dark/80 mt-1 line-clamp-2 leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Seção de detalhes */}
        <div ref={detailsRef}>
          {activeItem !== null && (
            <section className="bg-white rounded-2xl p-6 sm:p-8 mb-8 animate-fadeIn shadow-lg border border-odara-primary/10">
              {/* Cabeçalho da seção */}
              <div className="flex items-start mb-6 sm:mb-8">
                <span className="text-2xl sm:text-3xl mr-4 text-odara-primary bg-odara-primary/10 p-3 rounded-xl">
                  {funcionalidades[activeItem].icone}
                </span>
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-odara-accent mb-2">
                    {funcionalidades[activeItem].nome}
                  </h2>
                  <p className="text-lg text-odara-dark/90">
                    {funcionalidades[activeItem].descricao}
                  </p>
                </div>
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Recursos Principais */}
                <div className="bg-odara-offwhite rounded-xl p-6 shadow-sm border border-odara-primary/10">
                  <h3 className="text-xl font-bold text-odara-accent mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-3 text-odara-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Recursos Principais
                  </h3>
                  <ul className="space-y-3">
                    {funcionalidades[activeItem].detalhes.map((detalhe, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-odara-primary mr-3 mt-1 shrink-0">•</span>
                        <span className="text-odara-dark leading-relaxed">{detalhe}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefícios */}
                <div className="bg-odara-offwhite rounded-xl p-6 shadow-sm border border-odara-primary/10">
                  <h3 className="text-xl font-bold text-odara-accent mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-3 text-odara-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Benefícios
                  </h3>
                  <ul className="space-y-3">
                    {funcionalidades[activeItem].beneficios.map((beneficio, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-odara-primary mr-3 mt-1 shrink-0">✓</span>
                        <span className="text-odara-dark leading-relaxed font-medium">{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botão de fechar */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleCloseDetails}
                  className="bg-odara-accent hover:bg-odara-secondary/90 text-odara-contorno font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Fechar Detalhes
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Estado inicial - instrução */}
        {activeItem === null && (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-sm border border-odara-primary/10">
            <div className="max-w-md mx-auto px-4">
              <svg className="w-16 h-16 mx-auto text-odara-primary/60 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-odara-accent mb-2">
                Explore as Funcionalidades
              </h3>
              <p className="text-odara-dark/80 leading-relaxed">
                Selecione uma das funcionalidades acima para conhecer em detalhes 
                todos os recursos e benefícios disponíveis para sua ILPI.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Documentacao;