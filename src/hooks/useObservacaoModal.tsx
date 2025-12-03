import { useState } from 'react';
import { X, Save, AlertCircle, Edit2 } from 'lucide-react';

export const useObservacaoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [resolvePromise, setResolvePromise] = useState<((value: string | null) => void) | null>(null);

  const openModal = (initialText: string = "") => {
    setObservacao(initialText);
    setIsOpen(true);
    return new Promise<string | null>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) resolvePromise(observacao);
    setIsOpen(false);
    setObservacao("");
  };

  const handleCancel = () => {
    if (resolvePromise) resolvePromise(null);
    setIsOpen(false);
    setObservacao("");
  };

  const ObservacaoModal = isOpen ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-3 sm:p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-scale-in border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-odara-primary/5 to-odara-accent/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-odara-accent" />
            <h3 className="text-base sm:text-lg font-bold text-odara-dark">
              {observacao ? "Editar Observação" : "Adicionar Observação"}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Textarea */}
        <div className="p-4">
          <textarea
            className="w-full h-32 sm:h-36 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-odara-primary focus:border-transparent text-sm bg-gray-50"
            placeholder="Digite sua observação aqui..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-odara-accent hover:bg-odara-secondary text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            {observacao ? <Edit2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {observacao ? "Salvar Edição" : "Salvar Observação"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { openModal, ObservacaoModal };
};