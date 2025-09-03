import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ResponsavelDashboard from './pages/ResponsavelDashboard';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import RotaProtegida from './components/RotaProtegida';
import DashboardRedirect from './components/DashboardRedirect';
import ProtectedLayout from './layouts/ProtectedLayout';
import CadastroIdoso from './pages/CadastroPaciente';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Login />} />
      
      <Route 
        path="/app" 
        element={
          <RotaProtegida>
            <ProtectedLayout />
          </RotaProtegida>
        }
      >
        {/* Rota de índice que redireciona para o dashboard correto */}
        <Route index element={<DashboardRedirect />} />
        
        {/* Rota para o dashboard do admin */}
        <Route path="admin" element={<AdminDashboard />} />
        
        {/* Rota para a página de cadastro de pacientes */}
        <Route 
          path="admin/pacientes/cadastrar" 
          element={<CadastroIdoso />} 
        />

        {/* Outras rotas */}
        <Route path="responsavel" element={<ResponsavelDashboard />} />
        <Route path="funcionario" element={<FuncionarioDashboard />} />
      </Route>
    </Routes>
  );
}
