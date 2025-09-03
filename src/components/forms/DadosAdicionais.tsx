import type { UseFormReturn } from 'react-hook-form';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { InferType } from 'yup';
import { schema } from '../../pages/CadastroPaciente';

type FormValues = InferType<typeof schema>;

interface Props {
  methods: UseFormReturn<FormValues>;
  onBack: () => void;
  isLoading: boolean;
  formMessage: { type: 'success' | 'error'; text: string } | null;
}

export default function DadosAdicionais({ methods, onBack, isLoading, formMessage }: Props) {
  const { register, formState: { errors } } = methods;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-3">
        3. Dados Adicionais do Paciente
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado Civil *
          </label>
          <select 
            {...register('idoso_estado_civil')} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">Selecione o estado civil...</option>
            <option value="Solteiro">Solteiro</option>
            <option value="Casado">Casado</option>
            <option value="Divorciado">Divorciado</option>
            <option value="Viúvo">Viúvo</option>
          </select>
          {errors.idoso_estado_civil && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_estado_civil.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização do Quarto
          </label>
          <input 
            {...register('idoso_localizacao_quarto')} 
            placeholder="Ex: Quarto 12A, Ala B" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {errors.idoso_localizacao_quarto && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_localizacao_quarto.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nível de Dependência
          </label>
          <select 
            {...register('idoso_nivel_dependencia')} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">Selecione o nível...</option>
            <option value="Baixo">Baixo</option>
            <option value="Médio">Médio</option>
            <option value="Alto">Alto</option>
          </select>
          {errors.idoso_nivel_dependencia && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_nivel_dependencia.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parentesco com o Responsável *
          </label>
          <input 
            {...register('idoso_responsavel_parentesco')} 
            placeholder="Ex: Filho(a), Neto(a), Irmão(ã)" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {errors.idoso_responsavel_parentesco && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_responsavel_parentesco.message}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL da Foto de Perfil (opcional)
          </label>
          <input 
            {...register('idoso_foto_perfil_url')} 
            placeholder="https://exemplo.com/foto.jpg" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {errors.idoso_foto_perfil_url && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_foto_perfil_url.message}
            </p>
          )}
        </div>
      </div>

      {formMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          formMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {formMessage.type === 'success' ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-red-600" />
          )}
          <span className="font-medium">{formMessage.text}</span>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </button>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Cadastrando...
            </>
          ) : (
            'Finalizar Cadastro'
          )}
        </button>
      </div>
    </div>
  );
}