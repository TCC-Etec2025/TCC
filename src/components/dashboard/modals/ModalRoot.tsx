import { X } from "lucide-react";
import type { TipoModal } from "./types";
import { MedicamentosContent } from "./contents/MedicamentosContent";
import { AtividadesContent } from "./contents/AtividadesContent";
import { CardapioContent } from "./contents/CardapioContent";
import { ConsultasContent } from "./contents/ConsultasContent";
import { OcorrenciasContent } from "./contents/OcorrenciasContent";
import { ExamesContent } from "./contents/ExamesContent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipo: TipoModal;
  idResidente: number | null;
}

export const ModalRoot = ({ isOpen, onClose, tipo, idResidente  }: Props) => {
  if (!isOpen) return null;

  const renderContent = () => {
    if (!idResidente) return <p className="text-center p-8 text-gray-500">Residente não identificado.</p>;

    switch (tipo) {
      case 'MEDICAMENTOS': return <MedicamentosContent idResidente={idResidente} />;
      case 'ATIVIDADES': return <AtividadesContent idResidente={idResidente} />;
      case 'CARDAPIO': return <CardapioContent idResidente={idResidente} />;
      case 'CONSULTAS': return <ConsultasContent idResidente={idResidente} />;
      case 'OCORRENCIA': return <OcorrenciasContent idResidente={idResidente} />;
      case 'EXAMES': return <ExamesContent idResidente={idResidente} />;
      default: return null;
    }
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'MEDICAMENTOS': return 'Histórico de Medicamentos';
      case 'ATIVIDADES': return 'Agenda de Atividades';
      case 'CARDAPIO': return 'Agenda Alimentar';
      case 'CONSULTAS': return 'Agenda de Consultas';
      case 'OCORRENCIA': return 'Histórico de Ocorrências';
      case 'EXAMES': return 'Agenda de Exames';
      default: return 'Detalhes';
    }
  };

  return (
    <div className="fixed inset-0 bg-odara-offwhite/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-l-4 border-odara-primary">
        {/* Header */}
        <div className="border-b-1 border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{getTitulo()}</h2>

            {/* Botão fechar */}
            <button
              onClick={onClose}
              className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto custom-scrollbar bg-odara-offwhite flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};