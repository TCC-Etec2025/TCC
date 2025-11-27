import { X } from "lucide-react";
import type { TipoModal } from "./types";
import { MedicamentosContent } from "./contents/MedicamentosContent";
import { AtividadesContent } from "./contents/AtividadesContent";
import { CardapioContent } from "./contents/CardapioContent";
import { ConsultasContent } from "./contents/ConsultasContent";
import { OcorrenciasContent } from "./contents/OcorrenciasContent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipo: TipoModal;
  idResidente: number | null;
}

export const ModalRoot = ({ isOpen, onClose, tipo, idResidente }: Props) => {
  if (!isOpen) return null;

  const renderContent = () => {
    if (!idResidente) return <p className="text-center p-8 text-gray-500">Residente não identificado.</p>;

    switch (tipo) {
      case 'MEDICAMENTOS': return <MedicamentosContent idResidente={idResidente} />;
      case 'ATIVIDADES': return <AtividadesContent idResidente={idResidente} />;
      case 'CARDAPIO': return <CardapioContent idResidente={idResidente} />;
      case 'CONSULTAS': return <ConsultasContent idResidente={idResidente} />;
      case 'OCORRENCIA': return <OcorrenciasContent idResidente={idResidente} />;
      default: return null;
    }
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'MEDICAMENTOS': return 'Gestão de Medicamentos';
      case 'ATIVIDADES': return 'Calendário de Atividades';
      case 'CARDAPIO': return 'Histórico Alimentar';
      case 'CONSULTAS': return 'Agenda Médica';
      case 'OCORRENCIA': return 'Histórico de Ocorrências';
      default: return 'Detalhes';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{getTitulo()}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <X size={20} className="text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};