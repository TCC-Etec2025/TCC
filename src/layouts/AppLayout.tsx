import { Outlet } from 'react-router-dom';

// Este componente irá renderizar as rotas filhas (os dashboards)
export default function AppLayout() {
  return (
    <div>
      <h1>Área Autenticada</h1>
      <main>
        <Outlet />
      </main>
    </div>
  );
}