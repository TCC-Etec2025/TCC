import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function RotaProtegida({ children }: { children: JSX.Element }) {
  const { usuario } = useUser();

  if (!usuario) {
    // Se não houver sessão, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se houver sessão, renderiza o conteúdo da página protegida
  return children;
}