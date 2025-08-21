import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaProtegida({ children }: { children: JSX.Element }) {
  const { sessao } = useAuth();

  if (!sessao) {
    // Se não houver sessão, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se houver sessão, renderiza o conteúdo da página protegida
  return children;
}