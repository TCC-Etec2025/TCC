import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Este componente decide para qual dashboard redirecionar o usuário
// com base no perfil que já está carregado no AuthContext.
export default function DashboardRedirect() {
  const { usuario } = useUser();

  // Se por algum motivo não houver perfil, volta para o login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Agora, fazemos o redirecionamento com base no perfil
  const role = usuario.papel;

  if (role === 'administrador') {
    return <Navigate to="/app/admin" replace />;
  } else if (role === 'responsavel') {
    return <Navigate to="/app/responsavel" replace />;
  } else if (role !== null) {
    return <Navigate to="/app/funcionario" replace />;
  }

  return <Navigate to="/login" replace />;
}