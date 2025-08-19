import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';

// Importando todas as páginas que criamos
import { Login } from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal agora leva para a tela de Login */}
        <Route 
          path="/" 
          element={<Login />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
