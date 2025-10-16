import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
/* Dashboards */
import AdminDashboard from './pages/AdminDashboard'
import ResponsavelDashboard from './pages/ResponsavelDashboard'
import FuncionarioDashboard from './pages/FuncionarioDashboard'
/* Componentes de Rota e Layout */
import RotaProtegida from './components/RotaProtegida'
import DashboardRedirect from './components/DashboardRedirect'
import ProtectedLayout from './layouts/ProtectedLayout'
/* Páginas de Listagem */
import Residentes from './pages/Residentes'
import Familiares from './pages/Responsaveis'
import Funcionario from './pages/Funcionarios'
import Usuarios from './pages/Usuarios'
/* Páginas de Formulário(Cadastro/Edição) */
import FormularioResidente from './pages/FormularioResidente'
import FormularioPertence from './pages/FormularioPertence'
import FormularioResponsavel from './pages/FormularioResponsavel'
import FormularioFuncionario from './pages/FormularioFuncionario'
/* Página de Perfil */
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
        <Route path="admin/residente/formulario" element={<FormularioResidente />} />
        <Route path="admin/responsavel/formulario" element={<FormularioResponsavel />} />
        <Route path="admin/funcionario/formulario" element={<FormularioFuncionario />} />
        <Route path="admin/pertence/formulario" element={<FormularioPertence />} />
        <Route path="admin/pertence/formulario" element={<FormularioPertence />} />

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
