import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Este componente decide para qual dashboard redirecionar o usuário
// com base no perfil que já está carregado no AuthContext.
export default function DashboardRedirect() {
  const { usuario} = useUser();

  // Se por algum motivo não houver perfil, volta para o login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Agora, fazemos o redirecionamento com base no perfil
  const role = usuario.role;

  if (role === 'Administrador') {
    return <Navigate to="/app/admin" replace />;
  }
  
  if (role === 'Responsavel') {
    return <Navigate to="/app/responsavel" replace />;
  }

  if (role === 'Funcionario') {
    return <Navigate to="/app/funcionario" replace />;
  }

  // Fallback: se o perfil for desconhecido, volta para o login
  // (O ideal seria também deslogar o usuário aqui)
  return <Navigate to="/login" replace />;
}