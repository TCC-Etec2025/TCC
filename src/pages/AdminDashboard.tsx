function AdminDashboard() {
  const user = { name: 'Dr. Carlos Admin', role: 'Administrador' };
  
  // Apenas o Admin vê estes itens de menu
  const menuItems = [
    { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, active: true },
    { name: 'Usuários', icon: <UserIcon className="w-5 h-5" /> },
    { name: 'Residentes', icon: <UserIcon className="w-5 h-5" /> },
    { name: 'Relatórios', icon: <FileTextIcon className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout 
      user={user} 
      menuItems={menuItems} 
      title="Dashboard Administrativo"
      subtitle="Visão geral e controle do sistema ILPI"
    >
      {/* Conteúdo específico do Admin vai aqui */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* ... cards de estatísticas ... */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ... outras secções do dashboard do admin ... */}
      </div>
    </DashboardLayout>
  );
}