import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AppLayout from './layouts/AppLayout';
import AdminDashboard from './pages/AdminDashboard';
import ResponsavelDashboard from './pages/ResponsavelDashboard';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import RotaProtegida from './components/RotaProtegida';

// Note que o <BrowserRouter> foi removido, pois já está no main.tsx
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Login />} /> {/* Rota para a raiz da aplicação */}
      
      {/* Rota "mãe" protegida */}
      <Route 
        path="/app" 
        element={
          <RotaProtegida>
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