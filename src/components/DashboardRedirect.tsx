import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Este componente decide para qual dashboard redirecionar o usuário
// com base no perfil que já está carregado no AuthContext.
export default function DashboardRedirect() {
  const { perfil, loading } = useAuth();

  // Enquanto o perfil estiver carregando, podemos mostrar uma tela de loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando informações do usuário...
      </div>
    );
  }

  // Se por algum motivo não houver perfil, volta para o login
  if (!perfil) {
    return <Navigate to="/login" replace />;
  }

  // Agora, fazemos o redirecionamento com base no perfil
  const { role } = perfil;

  if (role === 'Admin') {
    return <Navigate to="/app/admin" replace />;
  }
  
  if (role === 'Responsavel') {
    return <Navigate to="/app/responsavel" replace />;
  }

  if (role === 'Cuidador' || role === 'Enfermagem') {
    return <Navigate to="/app/funcionario" replace />;
  }

  // Fallback: se o perfil for desconhecido, volta para o login
  // (O ideal seria também deslogar o usuário aqui)
  return <Navigate to="/login" replace />;
}