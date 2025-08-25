<<<<<<< HEAD
export default function FuncionarioDashboard() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      
    </div>
=======
function FuncionarioDashboard() {
  const user = { name: 'Ana Santos', role: 'Cuidadora' };

  // O Funcionário tem o seu próprio conjunto de menus
  const menuItems = [
    { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, active: true },
    { name: 'Checklist Diário', icon: <ClipboardIcon className="w-5 h-5" /> },
    { name: 'Medicamentos', icon: <PillIcon className="w-5 h-5" /> },
    { name: 'Alimentação', icon: <UtensilsIcon className="w-5 h-5" /> },
    { name: 'Ocorrências', icon: <AlertTriangleIcon className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout 
      user={user} 
      menuItems={menuItems} 
      title="Dashboard do Funcionário"
      subtitle="Gerencie as tarefas do cuidado diário"
    >
      {/* Conteúdo específico do Funcionário vai aqui */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* ... cards de resumo de tarefas, residentes, etc ... */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ... checklist diário e outras ações ... */}
      </div>
    </DashboardLayout>
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
  );
}
