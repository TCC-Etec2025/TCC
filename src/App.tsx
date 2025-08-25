import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
<<<<<<< HEAD
=======
import AppLayout from './layouts/AppLayout';
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
import AdminDashboard from './pages/AdminDashboard';
import ResponsavelDashboard from './pages/ResponsavelDashboard';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import RotaProtegida from './components/RotaProtegida';
<<<<<<< HEAD
import DashboardRedirect from './components/DashboardRedirect';
import ProtectedLayout from './layouts/ProtectedLayout';
import CadastroIdoso from './pages/CadastroIdoso';

=======

// Note que o <BrowserRouter> foi removido, pois já está no main.tsx
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
<<<<<<< HEAD
      <Route path="/" element={<Login />} />
      
=======
      <Route path="/" element={<Login />} /> {/* Rota para a raiz da aplicação */}
      
      {/* Rota "mãe" protegida */}
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
      <Route 
        path="/app" 
        element={
          <RotaProtegida>
<<<<<<< HEAD
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
=======
            <AppLayout />
          </RotaProtegida>
        }
      >
        {/* Rotas "filhas" que aparecem dentro do AppLayout */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="responsavel" element={<ResponsavelDashboard />} />
        <Route path="funcionario" element={<FuncionarioDashboard />} />
      </Route>

    </Routes>
  );
}
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
