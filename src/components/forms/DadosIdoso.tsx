import type { UseFormReturn } from 'react-hook-form';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { InferType } from 'yup';
import { schema } from '../../pages/CadastroPaciente';

type FormValues = InferType<typeof schema>;

interface Props {
  methods: UseFormReturn<FormValues>;
  onNext: () => void;
  onBack: () => void;
}

export default function DadosIdoso({ methods, onNext, onBack }: Props) {
  const { register, formState: { errors } } = methods;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-3">
        2. Dados Básicos do Paciente
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo *
          </label>
          <input 
            {...register('idoso_nome_completo')} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Digite o nome completo"
          />
          {errors.idoso_nome_completo && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_nome_completo.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Nascimento *
          </label>
          <input 
            type="date" 
            {...register('idoso_data_nascimento')} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {errors.idoso_data_nascimento && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_data_nascimento.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CPF *
          </label>
          <input 
            {...register('idoso_cpf')} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="000.000.000-00"
          />
          {errors.idoso_cpf && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_cpf.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sexo *
          </label>
          <select 
            {...register('idoso_sexo')} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">Selecione o sexo...</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
          {errors.idoso_sexo && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {errors.idoso_sexo.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onBack}
          className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </button>
        
        <button 
          type="button" 
          onClick={onNext}
          className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Próximo
          <ArrowRight size={18} className="ml-2" />
        </button>
      </div>
    </div>
  );
}