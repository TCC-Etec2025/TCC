import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ResponsavelDashboard from './pages/ResponsavelDashboard'
import FuncionarioDashboard from './pages/FuncionarioDashboard'
import RotaProtegida from './components/RotaProtegida'
import DashboardRedirect from './components/DashboardRedirect'
import ProtectedLayout from './layouts/ProtectedLayout'
import CadastroIdoso from './pages/CadastroResidente'
import Residentes from './pages/Residentes'
import Familiares from './pages/Responsaveis'
import Funcionario from './pages/Funcionarios'
import CadastroPertences from './pages/CadastroPertences'
import CadastroResponsavel from './pages/CadastroResponsavel'
import CadastroFuncionario from './pages/CadastroFuncionario'
import Usuarios from './pages/Usuarios'
import Perfil from './pages/Perfil'

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
        
        {/* Rota para as páginas de cadastro/edição */}
        <Route path="admin/residente/formulario" element={<CadastroIdoso />} />
        <Route path="admin/responsavel/formulario" element={<CadastroResponsavel />} />
        <Route path="admin/funcionario/formulario" element={<CadastroFuncionario />} />
        <Route path="admin/pertence/formulario" element={<CadastroPertences />} />

        {/* Rotas as páginas de listagens*/}
        <Route path="admin/residentes" element={<Residentes />} />
        <Route path="admin/responsaveis" element={<Familiares />} />
        <Route path="admin/funcionarios" element={<Funcionario />} />
        <Route path="admin/usuarios" element={<Usuarios />} />

        <Route path="admin/perfil" element={<Perfil />} />

        {/* Outras rotas */}
        <Route path="responsavel" element={<ResponsavelDashboard />} />
        <Route path="funcionario" element={<FuncionarioDashboard />} />
      </Route>
    </Routes>
  );
}
