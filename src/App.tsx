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

/* Delas */
import Registros from './pages/Registros'
import RegistroMedicamentos from './pages/registros/RegistroMedicamentos'
import RegistroSaudeInicial from './pages/registros/RegistroSaudeInicial'
import RegistroAtividades from './pages/registros/RegistroAtividades'
import RegistroOcorrencias from './pages/registros/RegistroOcorrencias'
import RegistroAlimentar from './pages/registros/RegistroAlimentar'
import RegistroComportamento from './pages/registros/RegistroComportamento'
import RegistroPreferencias from './pages/registros/RegistroPreferencias'
import RegistroConsultas from './pages/registros/RegistroConsultas'
import RegistroExames from './pages/registros/RegistroExames'
import Alimentacao from './pages/funcionario/Checklist/Alimentacao'
import MedicamentosCheck from './pages/funcionario/Checklist/Medicamentos'
import Atividades from './pages/funcionario/Checklist/Atividades'
import ExamesMedicos from './pages/funcionario/Checklist/ExamesMedicos'
import ConsultasMedicas from './pages/funcionario/Checklist/ConsultasMedicas'
import Ocorrencias from './pages/funcionario/Registros/Ocorrencias'
import Comportamento from './pages/funcionario/Registros/Comportamento'
import Preferencias from './pages/funcionario/Registros/Preferencias'
import SaudeCorporal from './pages/funcionario/Registros/SaudeCorporal'
import ResidentesFuncionario from './pages/funcionario/PaginaResidentes'; 
import Checklist from './pages/funcionario/Checklist/PaginaChecklist';
import Relatorios from './pages/funcionario/PaginaRelatorios';

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

        {/* Rotas delas */}
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
        <Route path="funcionario/residentes/funcionario" element={<ResidentesFuncionario />} />
        <Route path="funcionario/relatorios" element={<Relatorios />} />
        <Route path="funcionario/checklist" element={<Checklist />} />
        <Route path="funcionario/checklist/medicamentos/check" element={<MedicamentosCheck />} />
        <Route path="funcionario/checklist/atividades" element={<Atividades />} />
        <Route path="funcionario/registros/saude/corporal" element={<SaudeCorporal />} />
        <Route path="funcionario/registros/ocorrencias" element={<Ocorrencias />} />
        <Route path="funcionario/checklist/alimentacao" element={<Alimentacao />} />
        <Route path="funcionario/registros/comportamento" element={<Comportamento />} />
        <Route path="funcionario/registros/preferencias" element={<Preferencias />} />
        <Route path="funcionario/checklist/consultas/medicas" element={<ConsultasMedicas />} />
        <Route path="funcionario/checklist/exames/medicos" element={<ExamesMedicos />} />

      </Route>
    </Routes>
  );
}
