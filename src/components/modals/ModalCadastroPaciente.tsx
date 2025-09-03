import { X, User, Box, Plus } from 'lucide-react';

interface ModalPosCadastroProps {
  isOpen: boolean;
  onClose: () => void;
  onSelecionarOpcao: (opcao: 'prontuario' | 'pertences' | 'nada') => void;
  nomeIdoso?: string;
}

export default function ModalCadastroPaciente({
  isOpen,
  onClose,
  onSelecionarOpcao,
  nomeIdoso
}: ModalPosCadastroProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Cadastro Realizado com Sucesso!</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-green-600 font-medium mb-2">
            ✓ Paciente cadastrado com sucesso
          </p>
          {nomeIdoso && (
            <p className="text-gray-700 mb-1">
              <strong>Nome:</strong> {nomeIdoso}
            </p>
          )}
          <p className="text-gray-600 mt-2">
            O que você gostaria de fazer agora?
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelecionarOpcao('prontuario')}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                <User size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Cadastrar Prontuário</div>
                <div className="text-sm text-gray-600">Informações médicas iniciais</div>
              </div>
            </div>
            <Plus size={20} className="text-gray-400 group-hover:text-blue-600" />
          </button>

          <button
            onClick={() => onSelecionarOpcao('pertences')}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                <Box size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Cadastrar Pertences</div>
                <div className="text-sm text-gray-600">Itens pessoais do paciente</div>
              </div>
            </div>
            <Plus size={20} className="text-gray-400 group-hover:text-green-600" />
          </button>

          <button
            onClick={() => onSelecionarOpcao('nada')}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            Agora não
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Você pode acessar essas opções posteriormente pelo menu do paciente
          </p>
        </div>
      </div>
    </div>
  );
}