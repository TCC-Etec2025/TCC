import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

/* ------------------- Componentes de Rota e Layout */
import RotaProtegida from './components/RotaProtegida'
import DashboardRedirect from './components/DashboardRedirect'
import ProtectedLayout from './layouts/ProtectedLayout'

/* ------------------- Landing Page */
import LayoutLandingPage from './layouts/LayoutLandingPage'
import Home from './pages/landingPage/Home.tsx'
import Documentacao from './pages/landingPage/Documentacao.tsx'

/* ------------------- Página de Perfil e Login */
import Login from './pages/Login'
import Senha from './pages/senha'
import Perfil from './pages/Perfil'

/* ------------------- Páginas de Formulário (Cadastro/Edição) */
import FormularioResidente from './pages/formsCadastro/FormularioResidente'
import FormularioPertence from './pages/formsCadastro/FormularioPertence'
import FormularioResponsavel from './pages/formsCadastro/FormularioResponsavel'
import FormularioFuncionario from './pages/formsCadastro/FormularioFuncionario'

/* ------------------- Dashboards */
import AdminDashboard from './pages/administrador/AdminDashboard.tsx'
import ResponsavelDashboard from './pages/responsavel/ResponsavelDashboard'
import FuncionarioDashboard from './pages/funcionario/FuncionarioDashboard'

/* ------------------- Administrador - Listagens */
import Residentes from './pages/administrador/Residentes'
import Familiares from './pages/administrador/Responsaveis'
import Funcionario from './pages/administrador/Funcionarios'
import Usuarios from './pages/administrador/Usuarios'

/* ------------------- Registros (Administrador e Funcionários) */
import Registros from './pages/administrador/Registros'

/* Jamilly */
import RegistroOcorrencias from './pages/administrador/registros/RegistroOcorrencias'
import RegistroAlimentar from './pages/administrador/registros/RegistroAlimentar'
import RegistroComportamento from './pages/administrador/registros/RegistroComportamento'

/* Leticia */
import RegistroMedicamentos from './pages/administrador/registros/RegistroMedicamentos'
import RegistroSaudeInicial from './pages/administrador/registros/RegistroSaudeInicial'
import RegistroAtividades from './pages/administrador/registros/RegistroAtividades'

/* Lucas */
import RegistroExames from './pages/administrador/registros/RegistroExames'

/* Nicole */
import RegistroPreferencias from './pages/administrador/registros/RegistroPreferencias'
import RegistroConsultas from './pages/administrador/registros/RegistroConsultas'

/* ------------------- Funcionário - Listas */
import ResidentesFuncionario from './pages/funcionario/PaginaResidentes'
import Relatorios from './pages/funcionario/PaginaRelatorios'

/* ------------------- Checklists */
import Checklist from './pages/funcionario/Checklist/PaginaChecklist'

/* Jamilly */
import Alimentacao from './pages/funcionario/Checklist/Alimentacao'

/* Leticia */
import Medicamentos from './pages/funcionario/Checklist/Medicamentos'
import Atividades from './pages/funcionario/Checklist/Atividades'

/* Lucas */
import ExamesMedicos from './pages/funcionario/Checklist/ExamesMedicos'
import { ResidenteProntuario } from './pages/ResidenteProntuario.tsx'
import PermissoesFuncionario from './pages/PermissoesFuncionario.tsx'

export default function App() {
  return (
    <>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LayoutLandingPage />}>
          <Route index element={<Home />} />
          <Route path="documentacao" element={<Documentacao />} />
        </Route>

        {/* Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/senha" element={<Senha />} />

        <Route 
          path="/app"
          element={
            <RotaProtegida>
              <ProtectedLayout />
            </RotaProtegida>
          }
        >
          {/* Redirecionamento inicial */}
          <Route index element={<DashboardRedirect />} />

          {/* Dashboards */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="responsavel" element={<ResponsavelDashboard />} />
          <Route path="funcionario" element={<FuncionarioDashboard />} />

          {/* Formulários */}
          <Route path="admin/residente/formulario" element={<FormularioResidente />} />
          <Route path="admin/responsavel/formulario" element={<FormularioResponsavel />} />
          <Route path="admin/funcionario/formulario" element={<FormularioFuncionario />} />
          <Route path="admin/pertence/formulario" element={<FormularioPertence />} />
          <Route path="admin/funcionario/permissoes" element={<PermissoesFuncionario />} />

          {/* Listagens */}
          <Route path="admin/residentes" element={<Residentes />} />
          <Route path="admin/responsaveis" element={<Familiares />} />
          <Route path="admin/funcionarios" element={<Funcionario />} />
          <Route path="admin/usuarios" element={<Usuarios />} />

          {/* Perfil */}
          <Route path="admin/perfil" element={<Perfil />} />

          {/* Registros Admin e Funcionários */}
          <Route path="admin/registros" element={<Registros />} />
          <Route path="admin/registro/medicamentos" element={<RegistroMedicamentos />} />
          <Route path="admin/registro/saudeInicial" element={<RegistroSaudeInicial />} />
          <Route path="admin/registro/atividades" element={<RegistroAtividades />} />
          <Route path="admin/registro/ocorrencias" element={<RegistroOcorrencias />} />
          <Route path="admin/registro/alimentar" element={<RegistroAlimentar />} />
          <Route path="admin/registro/comportamento" element={<RegistroComportamento />} />
          <Route path="admin/registro/preferencias" element={<RegistroPreferencias />} />
          <Route path="admin/registro/consultas" element={<RegistroConsultas />} />
          <Route path="admin/registro/exames" element={<RegistroExames />} />
          <Route path="admin/residente/visualizar" element={<ResidenteProntuario />} />

          {/* Funcionário */}
          <Route path="funcionario/residentes/funcionario" element={<ResidentesFuncionario />} />
          <Route path="funcionario/relatorios" element={<Relatorios />} />

          {/* Checklists */}
          <Route path="funcionario/checklist" element={<Checklist />} />
          <Route path="funcionario/checklist/alimentacao" element={<Alimentacao />} />
          <Route path="funcionario/checklist/medicamentos" element={<Medicamentos />} />
          <Route path="funcionario/checklist/atividades" element={<Atividades />} />
          <Route path="funcionario/checklist/exames/medicos" element={<ExamesMedicos />} />
        </Route>
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 400,
          style: {
            background: '#e4edfd',
            color: '#52323a',
            border: '1px solid #0036ca',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500
          },
          success: {
            style: { background: '#f0fdf4', border: '1px solid #00c950' }
          },
          error: {
            style: { background: '#fce7e7', border: '1px solid #c90d00' }
          }
        }}
      />
    </>
  )
}
