type TopbarProps = {
    onToggleCollapse: () => void;
};

export default function Topbar({ onToggleCollapse }: TopbarProps) {
    return (
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
                <button onClick={onToggleCollapse} className="text-gray-600 hover:text-black">
                    ☰ {/* ícone de menu/hambúrguer */}
                </button>
            <h1 className="text-xl font-semibold text-gray-800">Minha Aplicação</h1>
            <div className="flex items-center gap-4">
                {/* Aqui você pode colocar avatar, botões, notificações etc */}
                <button className="text-sm text-gray-600 hover:text-gray-800"></button>
            </div>
        </div>
    );
}
