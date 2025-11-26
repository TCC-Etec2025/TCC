import { useState } from 'react';
import { FaCheck, FaTimes, FaExclamationCircle } from 'react-icons/fa';

// Tipos para facilitar a tipagem
export type ResidenteInput = {
  id: number;
  nome: string;
  status: string;     // 'participou' | 'nao-participou' | 'pendente'
  observacao: string;
};

type ResultadoModal = {
  observacaoGeral: string;
  residentesAtualizados: ResidenteInput[];
} | null;

export const useConclusaoAtividadeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado local do modal
  const [observacaoGeral, setObservacaoGeral] = useState("");
  const [residentes, setResidentes] = useState<ResidenteInput[]>([]);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  const [resolvePromise, setResolvePromise] = useState<((value: ResultadoModal) => void) | null>(null);

  // Função para abrir o modal recebendo os dados atuais
  const openModalObservacoes = (
    obsGeralAtual: string, 
    residentesAtuais: ResidenteInput[]
  ) => {
    setObservacaoGeral(obsGeralAtual || "");
    // Clona o array para não alterar o estado pai diretamente
    setResidentes(residentesAtuais.map(r => ({...r}))); 
    setErroValidacao(null);
    setIsOpen(true);

    return new Promise<ResultadoModal>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  // Ações internas
  const toggleStatusResidente = (id: number) => {
    setResidentes(prev => prev.map(r => {
      if (r.id === id) {
        // Se estava 'participou' (ou pendente), vira 'nao-participou'. Se 'nao-participou', vira 'participou'
        const novoStatus = r.status === 'nao-participou' ? 'participou' : 'nao-participou';
        return { ...r, status: novoStatus };
      }
      return r;
    }));
    setErroValidacao(null); // Limpa erro ao mexer
  };

  const updateObsResidente = (id: number, texto: string) => {
    setResidentes(prev => prev.map(r => r.id === id ? { ...r, observacao: texto } : r));
    setErroValidacao(null);
  };

  const handleConfirm = () => {
    // 1. Validação: Encontrar residentes que não participaram E não têm observação
    const pendentesDeJustificativa = residentes.some(
      r => r.status === 'nao-participou' && !r.observacao.trim()
    );

    if (pendentesDeJustificativa) {
      setErroValidacao("É obrigatório justificar a ausência dos residentes marcados com 'Não Participou'.");
      return;
    }

    if (resolvePromise) {
      resolvePromise({
        observacaoGeral,
        residentesAtualizados: residentes
      });
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolvePromise) resolvePromise(null);
    setIsOpen(false);
  };

  const ObservacoesAtividade = isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-odara-dark">Concluir Atividade</h3>
          <p className="text-sm text-gray-500 mt-1">Confirme a presença e adicione observações.</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Observação Geral */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Observação Geral da Atividade</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-odara-primary outline-none"
              placeholder="Como foi a atividade como um todo?"
              rows={3}
              value={observacaoGeral}
              onChange={(e) => setObservacaoGeral(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-bold text-gray-800 mb-3 flex justify-between items-center">
                Residentes
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {residentes.length} vinculados
                </span>
            </h4>
            
            <div className="space-y-3">
              {residentes.map(res => {
                const naoParticipou = res.status === 'nao-participou';
                const erroNesse = erroValidacao && naoParticipou && !res.observacao.trim();

                return (
                  <div key={res.id} className={`p-3 rounded-lg border transition-colors ${naoParticipou ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      
                      {/* Botão de Toggle + Nome */}
                      <div 
                        className="flex items-center cursor-pointer select-none"
                        onClick={() => toggleStatusResidente(res.id)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors ${naoParticipou ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                          {naoParticipou ? <FaTimes /> : <FaCheck />}
                        </div>
                        <div>
                            <span className={`font-bold ${naoParticipou ? 'text-red-800' : 'text-green-800'}`}>
                                {res.nome}
                            </span>
                            <div className="text-xs text-gray-500">
                                {naoParticipou ? 'Não participou (Clique para alterar)' : 'Participou'}
                            </div>
                        </div>
                      </div>

                      {/* Input de Observação Individual */}
                      <div className="w-full sm:w-1/2">
                        <input 
                            type="text"
                            placeholder={naoParticipou ? "Motivo da ausência (Obrigatório)" : "Observação (Opcional)"}
                            className={`w-full text-sm border rounded px-3 py-2 outline-none
                                ${erroNesse 
                                    ? 'border-red-500 ring-1 ring-red-500 bg-white placeholder-red-300' 
                                    : 'border-gray-300 focus:border-odara-primary'}
                            `}
                            value={res.observacao || ''}
                            onChange={(e) => updateObsResidente(res.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer / Error Msg */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            {erroValidacao && (
                <div className="mb-4 flex items-center text-red-600 text-sm bg-red-100 p-2 rounded animate-pulse">
                    <FaExclamationCircle className="mr-2" />
                    {erroValidacao}
                </div>
            )}
            <div className="flex justify-end gap-3">
                <button 
                    onClick={handleCancel} 
                    className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleConfirm} 
                    className="px-5 py-2.5 bg-odara-dark text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                    Confirmar Conclusão
                </button>
            </div>
        </div>
      </div>
    </div>
  ) : null;

  return { openModalObservacoes, ObservacoesAtividade };
};