"use client";

import { useState, useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  Pill,
  ClipboardList,
  AlertTriangle,
  Hospital,
  Utensils,
  BarChart,
  Star,
  Stethoscope,
  Microscope,
} from "lucide-react";

const Home = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [showArrows, setShowArrows] = useState({
    hero: false,
    documentacao: false,
    sobre: false,
    contato: false,
  });

  const heroRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<HTMLDivElement | null>(null);
  const sobreRef = useRef<HTMLDivElement | null>(null);
  const contatoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShowArrows({
      hero: !!heroRef.current,
      documentacao: !!docRef.current,
      sobre: !!sobreRef.current,
      contato: !!contatoRef.current,
    });
  }, []);

  const scrollToSection = (
    refOrId: string | RefObject<HTMLDivElement>
  ): void => {
    const element =
      typeof refOrId === "string"
        ? document.getElementById(refOrId)
        : refOrId?.current ?? null;

    if (element) {
      setIsScrolling(true);
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => setIsScrolling(false), 600);
    }
  };

  const funcionalidades = [
    { nome: "Registro de medicamentos", icon: <Pill size={24} /> },
    { nome: "Registro de exames médicos", icon: <Microscope size={24} /> },
    { nome: "Registro de consultas médicas", icon: <Stethoscope size={24} /> },
    {
      nome: "Registro da saúde corporal",
      icon: <Hospital size={24} />,
    },
    { nome: "Registro de Ocorrências", icon: <AlertTriangle size={24} /> },
    { nome: "Registro de comportamento", icon: <BarChart size={24} /> },
    { nome: "Registro de Atividades", icon: <ClipboardList size={24} /> },
    { nome: "Registro de alimentação", icon: <Utensils size={24} /> },
    { nome: "Registro de preferências", icon: <Star size={24} /> },
  ];

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-odara-offwhite">
      {/* Hero */}
      <section
        id="hero"
        ref={heroRef}
        className="min-h-screen w-full bg-odara-primary text-white relative overflow-hidden flex items-center justify-center"
      >
        <div className="absolute inset-0 opacity-69">
          <img
            src="../images/landingPage.jpg"
            alt="Logo Odara Gestão"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).onerror = null;
            }}
          />
        </div>

        <div className="w-full px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold my-6 sm:my-8 md:my-10 animate-fade-in">
              Odara <span className="text-odara-name">Gestão</span>
            </h1>

            <div className="my-4 sm:my-6 backdrop-blur-sm p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8 md:mb-10 rounded-xl sm:rounded-2xl max-w-2xl mx-auto group hover:bg-odara-white/40 transition-all duration-200">
              <p className="text-lg sm:text-xl md:text-xl mb-4 sm:mb-6 group-hover:text-odara-accent font-bold animate-fade-in-delay">
                Sistema completo de gestão para cuidados especializados
              </p>
              <p className="text-sm sm:text-base md:text-lg text-odara-white group-hover:text-odara-dark text-justify max-w-4xl mx-auto leading-relaxed">
                A Odara Gestão é um Sistema de Gestão dedicado à administração
                de Instituições de Longa Permanência para Idosos (ILPIs). Nosso
                objetivo é facilitar o registro de informações por cuidadores e
                garantir que responsáveis estejam sempre cientes e conectados ao
                cuidado.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
              <button
                onClick={() => scrollToSection("documentacao")}
                disabled={isScrolling}
                className={`bg-odara-accent border-2 border-odara-contorno text-odara-contorno font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base ${isScrolling
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-odara-secondary/90"
                  }`}
              >
                Explorar Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection("contato")}
                disabled={isScrolling}
                className={`border-2 border-odara-contorno text-odara-contorno font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${isScrolling
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-white hover:text-odara-primary"
                  }`}
              >
                Solicitar Implementação
              </button>
            </div>
          </div>
        </div>

        {/* Setas de navegação (exemplo de uso de showArrows) 
        {showArrows.hero && (
          <button
            onClick={() => scrollToSection("documentacao")}
            aria-label="Ir para funcionalidades"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition"
          >
            ↓
          </button>
        )}*/}
      </section>

      {/* Documentação */}
      <section
        id="documentacao"
        ref={docRef}
        className="min-h-screen flex items-center py-8 sm:py-12 md:py-16 relative"
      >
        <div className="w-full px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-odara-accent mb-4 sm:mb-6">
                Funcionalidades Completas
              </h2>
              <p className="text-lg sm:text-xl text-odara-dark max-w-3xl mx-auto px-4">
                Descubra todas as ferramentas disponíveis para uma gestão
                eficiente e completa
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 px-2 sm:px-0">
              {funcionalidades.map((funcionalidade, index) => (
                <div
                  key={index}
                  className="group p-4 sm:p-6  bg-odara-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-odara-primary transform hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-3 my-1 sm:my-2">
                    <div className="text-xl text-odara-primary">
                      {funcionalidade.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-odara-dark text-base sm:text-lg leading-tight">
                        {funcionalidade.nome}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 sm:mt-12 px-4">
              <button
                onClick={() => (window.location.href = "/documentacao")}
                className="bg-odara-accent border-2 border-odara-contorno hover:bg-odara-secondary/90 text-odara-contorno font-bold py-3 px-6 sm:px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base w-full sm:w-auto min-w-60"
              >
                Confira mais sobre as funcionalidades
              </button>
            </div>
          </div>
        </div>

        {/* Setas de navegação (exemplo de uso de showArrows)
        {showArrows.documentacao && (
          <button
            onClick={() => scrollToSection("sobre")}
            aria-label="Ir para sobre"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-odara-primary text-white rounded-full p-2 hover:bg-odara-secondary transition"
          >
            ↓
          </button>
        )}*/}
      </section>

      {/* Sobre */}
      <section
        id="sobre"
        ref={sobreRef}
        className="min-h-screen bg-white flex items-center py-8 sm:py-12 relative"
      >
        <div className="w-full px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            {/* Cabeçalho */}
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-odara-accent mb-4">
                Sobre o Sistema
              </h2>
              <div className="w-20 h-1 bg-odara-primary mx-auto"></div>
            </div>

            <div className="space-y-8 sm:space-y-12">
              {/* Missão */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Imagem */}
                <div className="relative">
                  <div className="relative rounded-lg overflow-hidden shadow-md transform hover:scale-101 transition-transform duration-300">
                    <img
                      src="../images/OdaraMissao.jpg"
                      alt="Missão - Cuidado com idosos"
                      className="w-full h-48 sm:h-60 object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-br from-odara-primary/10 to-odara-secondary/10"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-odara-accent">
                    Nossa Missão
                  </h3>
                  <div className="space-y-2 text-odara-dark leading-relaxed text-sm sm:text-base">
                    <p>
                      Promover qualidade de vida, bem-estar e segurança dos
                      residentes de ILPIs através
                      de tecnologia inovadora no cuidado diário.
                    </p>
                    <p>
                      Plataforma acessível e confiável que apoia gestão
                      administrativa, monitoramento
                      de saúde e organização de rotinas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visão - Invertido */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 lg:order-1 order-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-odara-accent">
                    Nossa Visão
                  </h3>
                  <div className="space-y-2 text-odara-dark leading-relaxed text-sm sm:text-base">
                    <p>
                      Ser referência em inovação e humanização no cuidado à
                      terceira idade,
                      transformando a experiência de instituições, profissionais e
                      familiares.
                    </p>
                    <p>
                      Oferecer tecnologia que valorize autonomia, dignidade e laços
                      afetivos
                      em cada interação.
                    </p>
                  </div>
                </div>

                {/* Imagem */}
                <div className="relative lg:order-2 order-1">
                  <div className="relative rounded-lg overflow-hidden shadow-md transform hover:scale-101 transition-transform duration-300">
                    <img
                      src="../images/OdaraVisao.jpg"
                      alt="Visão - Futuro do cuidado"
                      className="w-full h-48 sm:h-60 object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-bl from-odara-secondary/10 to-odara-accent/10"></div>
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Imagem */}
                <div className="relative">
                  <div className="relative rounded-lg overflow-hidden shadow-md transform hover:scale-101 transition-transform duration-300">
                    <img
                      src="../images/OdaraValores.jpg"
                      alt="Valores - Princípios éticos"
                      className="w-full h-48 sm:h-60 object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-tr from-odara-accent/10 to-odara-primary/10"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-odara-accent">
                    Nossos Valores
                  </h3>
                  <div className="space-y-2 text-odara-dark leading-relaxed text-sm sm:text-base">
                    <p>
                      Humanização no centro do cuidado, respeito às individualidades
                      e
                      transparência nas informações.
                    </p>
                    <p>
                      Inovação como transformação positiva, acessibilidade inclusiva e
                      confiança com famílias e instituições.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setas de navegação (exemplo de uso de showArrows)
        {showArrows.sobre && (
          <button
            onClick={() => scrollToSection("contato")}
            aria-label="Ir para contato"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-odara-primary text-white rounded-full p-2 hover:bg-odara-secondary transition"
          >
            ↓
          </button>
        )}*/}
      </section>

      {/* Contato */}
      <section
        id="contato"
        ref={contatoRef}
        className="relative min-h-screen bg-odara-primary text-white flex items-center justify-center py-12 sm:py-16 md:py-20"
      >
        {/* Imagem de fundo */}
        <div className="absolute inset-0 opacity-50">
          <img
            src="../images/ceuContato.jpg"
            alt="Background contato"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).onerror = null;
            }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="space-y-8 sm:space-y-12">
            {/* Cabeçalho */}
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-odara-dark mb-4 sm:mb-6">
                Pronto para Implementar?
              </h2>
              <p className="text-lg sm:text-xl text-odara-white max-w-2xl mx-auto px-4">
                Entre em contato e vamos conversar sobre como o Odara pode
                transformar sua ILPI.
              </p>
            </div>

            {/* Botão Principal WhatsApp */}
            <div className="space-y-6">
              <a
                href="https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre a implementação do Odara Gestão"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 text-white font-bold text-base sm:text-lg py-4 sm:py-5 px-8 sm:px-12 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl w-full sm:w-auto"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.189-1.248-6.189-3.515-8.447" />
                </svg>
                <span>Falar no WhatsApp</span>
              </a>
            </div>

            {/* Opções Alternativas Simples */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-8 text-odara-white/80 text-sm sm:text-base">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-odara-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>suporte@odara.com</span>
              </div>

              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-odara-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>(12) 3456-7890</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;