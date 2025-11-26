import { useState } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">Observação</h3>
        <textarea
          className="w-full border rounded p-2 mb-4 h-32"
          placeholder="Digite a observação..."
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-odara-dark text-white rounded">
            {observacao ? "Editar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { openModal, ObservacaoModal };
};