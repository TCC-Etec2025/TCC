import { Outlet } from 'react-router-dom';
import Navbar from '../components/NavbarLandingPage';
import Footer from '../components/FooterLandingPage';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <div className="w-full">
        <Navbar />
      </div>
      
      {/* Conteúdo principal que se expande totalmente */}
      <main className="flex grow w-full max-w-[100vw] bg-gray-50">
        <div className="mx-auto w-full">
          <Outlet /> {/* Aqui serão renderizadas as páginas de gestão */}
        </div>
      </main>
      
      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};