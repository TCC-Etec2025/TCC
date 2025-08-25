<<<<<<< HEAD
import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
=======
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
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
