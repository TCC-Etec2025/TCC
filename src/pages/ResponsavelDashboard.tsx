<<<<<<< HEAD
export default function ResponsavelDashboard() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      
    </div>
  );
}
=======
function ResponsavelDashboard() {
  const user = { name: 'Maria Silva', role: 'Responsável' };

  // O Responsável tem um menu completamente diferente
  const menuItems = [
    { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, active: true },
    { name: 'Meu Residente', icon: <UserIcon className="w-5 h-5" /> },
    { name: 'Medicamentos', icon: <PillIcon className="w-5 h-5" /> },
    { name: 'Cardápio', icon: <UtensilsIcon className="w-5 h-5" /> },
    { name: 'Ocorrências', icon: <AlertTriangleIcon className="w-5 h-5" /> },
    { name: 'Relatórios', icon: <FileTextIcon className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout 
      user={user} 
      menuItems={menuItems} 
      title="Dashboard do Responsável"
      subtitle="Acompanhe as informações do seu residente"
    >
        {/* Conteúdo específico do Responsável vai aqui */}
        <div className="bg-gray-900 p-4 rounded-2xl mb-6 flex items-center space-x-4">
            <img src="https://placehold.co/80x80/6366f1/ffffff?text=JS" alt="Foto do Residente" className="w-20 h-20 rounded-full border-4 border-gray-700" />
            <div>
                <h2 className="text-2xl font-bold text-white">João Silva</h2>
                <p className="text-gray-400">78 anos • Quarto 102A</p>
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full mt-2 inline-block">Diabetes Tipo 2</span>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* ... cards de medicamentos, cardápio, etc ... */}
        </div>
    </DashboardLayout>
  );
}
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
