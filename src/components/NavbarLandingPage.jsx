import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Verifique se a rota está ativa
  const isActive = (path) => {
    return location.pathname.toLowerCase() === path.toLowerCase();
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHomePage, setIsHomePage] = useState(true);

  // Verifica se está na home page
  useEffect(() => {
    setIsHomePage(location.pathname === "/");
  }, [location.pathname]);

  const homeNavigationItems = [
    {
      id: "top",
      label: "Home",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "documentacao",
      label: "Funcionalidades",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "sobre",
      label: "Sobre",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "contato",
      label: "Contato",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    }
  ];

  const navigationItems = [
    {
      path: "/documentacao",
      label: "Documentação",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    }
  ];

  // Função para scroll suave para seções da Home
  const scrollToSection = (sectionId) => {
    if (sectionId === "top") {
      scrollToTop();
      return;
    }

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    if (location.pathname !== "/") {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-odara-primary text-white shadow-lg sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-0.5">
          <div className="flex justify-between items-center h-13">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 group">
              <div className="w-11 h-11 bg-odara-white rounded-full flex items-center justify-center overflow-hidden border-2 border-odara-contorno shadow-lg transition-transform">
                <img
                  src="../images/logo.png"
                  alt="Logo Odara Gestão"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                  }}
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white transition-transform">
                  Odara <span className="font-normal nome-empresa-pequeno">Gestão</span>
                </h1>
                <span className="text-xs text-odara-white hidden sm:block">Sistema de Gestão para ILPIs</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={scrollToTop}
                className={`
                  flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200 relative font-semibold text-odara-contorno transform
                  ease-in-out
                  ${isActive("/")
                    ? "bg-odara-secondary text-odara-contorno border-2 border-odara-contorno shadow-lg backdrop-blur-sm"
                    : "hover:bg-white hover:text-odara-primary hover:scale-100 hover:shadow-md hover:backdrop-blur-sm"
                  }
                `}
              >
                <span
                  className={`transition-colors ${isActive("/") ? "text-odara-white" : ""}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </span>
                <span>Home</span>
              </button>

              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200 relative group font-semibold text-odara-contorno transform
                    ease-in-out
                    ${isActive(item.path)
                      ? "bg-odara-secondary text-odara-contorno border-2 border-odara-contorno shadow-lg backdrop-blur-sm"
                      : "hover:bg-white hover:text-odara-primary hover:scale-100 hover:shadow-md hover:backdrop-blur-sm"
                    }
                  `}
                >
                  <span
                    className={`transition-colors ${isActive(item.path) ? "text-odara-white" : ""}`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-0.5 rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Botão do menu mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation - Menu expandido (visível apenas em mobile) */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-2">
              <div className="flex flex-col space-y-1">
                {/* Home com subitens no mobile */}
                <div className="px-2">
                  <button
                    onClick={scrollToTop}
                    className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-odara-contorno w-full text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span>Home</span>
                  </button>
                  <div className="ml-6 border-l-2 border-white/20 pl-2">
                    {homeNavigationItems.filter(item => item.id !== 'top').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="flex items-center space-x-3 px-4 py-3 text-sm font-medium transition duration-100 rounded-lg font-semibold text-odara-contorno transform ease-in-out w-full text-left hover:bg-white hover:text-odara-primary"
                      >
                        <span className="text-odara-primary">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outros itens no mobile */}
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition duration-100 rounded-lg mx-2 font-semibold text-odara-contorno transform ease-in-out ${
                      isActive(item.path)
                        ? "bg-odara-secondary text-odara-contorno border-2 border-odara-contorno shadow-md"
                        : "hover:bg-white hover:text-odara-primary"
                    }`}
                  >
                    <span className={`transition-colors ${isActive(item.path) ? "text-odara-white" : ""}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar Navigation*/}
      {isHomePage && (
        <div className="fixed right-3 top-1/3 transform -translate-y-1/2 z-30">
          <div className="bg-odara-primary/90 backdrop-blur-lg rounded-xl shadow-2xl border border-odara-secondary/40 p-2">
            <div className="flex flex-col space-y-2">
              {homeNavigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center justify-center w-10 h-10 text-odara-white hover:bg-odara-secondary/60 hover:scale-110 transition-all duration-300 rounded-lg relative group"
                  title={item.label}
                >
                  <span className="text-odara-white group-hover:text-odara-contorno">
                    {item.icon}
                  </span>
                  <span className="absolute right-full mr-2 px-2 py-1 bg-odara-dark/95 text-odara-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
                    {item.label}
                    <div className="absolute top-1/2 left-full -mt-1 border-3 border-transparent border-l-odara-dark/95"></div>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;