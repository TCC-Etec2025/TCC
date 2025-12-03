// hooks/useObservacaoModal.ts
import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  observacaoInicial: string;
  adminId?: number; // Adicionar adminId para saber qual administração atualizar
  status?: string; // Adicionar status para validação
}

interface UseObservacaoModalReturn {
  modalState: ModalState;
  validationError: string | null;
  openModal: (observacaoInicial: string, adminId?: number, status?: string) => Promise<string | null>;
  handleConfirm: (observacao: string) => void;
  handleCancel: () => void;
  closeModal: () => void;
  clearValidationError: () => void;
}

export const useObservacaoModal = (): UseObservacaoModalReturn => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    observacaoInicial: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: string | null) => void) | null>(null);

  const openModal = useCallback((observacaoInicial: string, adminId?: number, status?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        observacaoInicial,
        adminId,
        status
      });
      setValidationError(null);
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback((observacao: string) => {
    if (resolvePromise) {
      resolvePromise(observacao);
      setModalState(prev => ({ ...prev, isOpen: false }));
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(null);
      setModalState(prev => ({ ...prev, isOpen: false }));
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const closeModal = useCallback(() => {
    handleCancel(); // Fechar é o mesmo que cancelar
  }, [handleCancel]);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    modalState,
    validationError,
    openModal,
    handleConfirm,
    handleCancel,
    closeModal,
    clearValidationError,
  };
};