type Tab = {
    id: string;
    label: string;
};

type Props = {
    currentTab: string;
    onTabChange: (tabId: string) => void;
};

const tabs: Tab[] = [
    { id: "personal", label: "Pessoal" },
    { id: "address", label: "Endereço" },
    { id: "security", label: "Segurança" },
    { id: "notifications", label: "Notificações" },
    { id: "privacy", label: "Privacidade" },
];

export default function ProfileTabs({ currentTab, onTabChange }: Props) {
    return (
        <div className="border-b border-gray-200">
            <div className="overflow-x-auto">
                <nav className="flex space-x-4 p-2 min-w-max" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex-shrink-0 px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                                currentTab === tab.id 
                                    ? "bg-gray-100 text-gray-900" 
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}