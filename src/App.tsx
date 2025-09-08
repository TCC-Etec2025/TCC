import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ResponsavelDashboard from './pages/ResponsavelDashboard';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import RotaProtegida from './components/RotaProtegida';
import DashboardRedirect from './components/DashboardRedirect';
import ProtectedLayout from './layouts/ProtectedLayout';
import CadastroIdoso from './pages/CadastroPaciente';
import Residentes from './pages/Residentes';
import Familiares from './pages/Familiares';
import Funcionario from './pages/Funcionarios';
import CadastroPertences from './pages/CadastroPertences';

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
        <Route path="admin/pacientes/cadastrar" element={<CadastroIdoso />} />
        <Route path="admin/pertence/cadastrar" element={<CadastroPertences />} />
        <Route path="admin/pacientes" element={<Residentes />} />
        <Route path="admin/familiares" element={<Familiares />} />
        <Route path="admin/funcionarios" element={<Funcionario />} />

        {/* Outras rotas */}
        <Route path="responsavel" element={<ResponsavelDashboard />} />
        <Route path="funcionario" element={<FuncionarioDashboard />} />
      </Route>
    </Routes>
  );
}
