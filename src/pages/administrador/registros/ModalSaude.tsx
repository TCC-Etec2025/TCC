import React, { useEffect, useState } from 'react';
import { X, Save, Plus, Loader, Info, User, Calendar, Clock, Activity, HeartPulse, Thermometer, Heart, Droplets, Scale, AlertCircle, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { supabase } from '../../../lib/supabaseClient';

import toast, { Toaster } from 'react-hot-toast';

/* Tipos */
type Residente = {
  id: number;
  nome: string;
  quarto?: string | null;
};

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
};

type Saude = {
  id: number;
  id_residente: number;
  id_funcionario: number;
  data: string;
  horario: string;
  categoria: string;
  valor: string;
  observacoes: string | null;
  criado_em?: string;
  atualizado_em?: string;
  residente?: Residente;
  funcionario?: Funcionario;
};

/* Props do Modal */
type ModalSaudeProps = {
  registro: Saude | null;
  isOpen: boolean;
  onClose: () => void;
};

/* Categorias disponíveis */
const CATEGORIAS = [
  { value: 'pressao_arterial', label: 'Pressão Arterial', icon: HeartPulse, placeholder: 'Ex: 120/80' },
  { value: 'temperatura', label: 'Temperatura', icon: Thermometer, placeholder: 'Ex: 36.5' },
  { value: 'glicemia', label: 'Glicemia', icon: Droplets, placeholder: 'Ex: 95' },
  { value: 'frequencia_cardiaca', label: 'Frequência Cardíaca', icon: Heart, placeholder: 'Ex: 75' },
  { value: 'saturacao_oxigenio', label: 'Saturação de Oxigênio', icon: Activity, placeholder: 'Ex: 98' },
  { value: 'peso', label: 'Peso', icon: Scale, placeholder: 'Ex: 65.5' },
  { value: 'outro', label: 'Outro', icon: AlertCircle, placeholder: 'Digite o valor' },
];

/* Schema de Validação */
const schema = yup.object({
  id: yup.number().nullable(),
  id_residente: yup.number()
    .required('Residente é obrigatório')
    .min(1, 'Selecione um residente'),
  id_funcionario: yup.number()
    .required('Funcionário é obrigatório')
    .min(1, 'Selecione um funcionário'),
  data: yup.string().required('Data é obrigatória'),
  horario: yup.string()
    .required('Horário é obrigatório')
    .matches(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  categoria: yup.string()
    .required('Categoria é obrigatória')
    .oneOf(CATEGORIAS.map(c => c.value), 'Categoria inválida'),
  valor: yup.string()
    .required('Valor é obrigatório')
    .test('valor-valido', 'Valor inválido para esta categoria', function(value) {
      const categoria = this.parent.categoria;
      
      if (!value || !categoria) return true;
      
      // Validações específicas por categoria
      switch (categoria) {
        case 'pressao_arterial':
          return /^\d{2,3}\/\d{2,3}$/.test(value); // Formato 120/80
        case 'temperatura':
          return /^\d{2}(\.\d{1,2})?$/.test(value) && parseFloat(value) >= 30 && parseFloat(value) <= 45;
        case 'glicemia':
          return /^\d{2,3}(\.\d{1,2})?$/.test(value) && parseFloat(value) >= 20 && parseFloat(value) <= 500;
        case 'frequencia_cardiaca':
          return /^\d{2,3}$/.test(value) && parseInt(value) >= 30 && parseInt(value) <= 200;
        case 'saturacao_oxigenio':
          return /^\d{2,3}$/.test(value) && parseInt(value) >= 70 && parseInt(value) <= 100;
        case 'peso':
          return /^\d{2,3}(\.\d{1,2})?$/.test(value) && parseFloat(value) >= 20 && parseFloat(value) <= 200;
        default:
          return value.length > 0; // Para 'outro', qualquer valor não vazio
      }
    }),
  observacoes: yup.string().nullable(),
}).required();

// Definir tipo explicitamente
interface FormValues {
  id?: number | null;
  id_residente: number;
  id_funcionario: number;
  data: string;
  horario: string;
  categoria: string;
  valor: string;
  observacoes?: string | null;
}

/* Componente Principal */
const ModalSaude: React.FC<ModalSaudeProps> = ({ registro, isOpen, onClose }) => {
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('pressao_arterial');

  /* Configuração do Form */
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: null,
      id_residente: 0,
      id_funcionario: 0,
      data: new Date().toISOString().split('T')[0],
      horario: new Date().toTimeString().slice(0, 5),
      categoria: 'pressao_arterial',
      valor: '',
      observacoes: ''
    }
  });

  const categoriaAtual = watch('categoria');
  const valorAtual = watch('valor');

  /* Efeitos */
  useEffect(() => {
    const fetchDados = async () => {
      try {
        // Carregar residentes
        const { data: residentesData, error: errorResidentes } = await supabase
          .from('residente')
          .select('id, nome, quarto')
          .order('nome', { ascending: true });

        if (errorResidentes) throw errorResidentes;
        setResidentes(residentesData || []);

        // Carregar funcionários
        const { data: funcionariosData, error: errorFuncionarios } = await supabase
          .from('funcionario')
          .select('id, nome, cargo')
          .order('nome', { ascending: true });

        if (errorFuncionarios) throw errorFuncionarios;
        setFuncionarios(funcionariosData || []);

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        toast.error('Erro ao carregar dados');
      }
    };

    if (isOpen) {
      fetchDados();

      // Resetar formulário com dados do registro ou valores padrão
      if (registro) {
        reset({
          id: registro.id,
          id_residente: registro.id_residente,
          id_funcionario: registro.id_funcionario,
          data: registro.data,
          horario: registro.horario,
          categoria: registro.categoria,
          valor: registro.valor,
          observacoes: registro.observacoes || ''
        });
        setCategoriaSelecionada(registro.categoria);
      } else {
        reset({
          id: null,
          id_residente: 0,
          id_funcionario: 0,
          data: new Date().toISOString().split('T')[0],
          horario: new Date().toTimeString().slice(0, 5),
          categoria: 'pressao_arterial',
          valor: '',
          observacoes: ''
        });
        setCategoriaSelecionada('pressao_arterial');
      }
    }
  }, [registro, reset, isOpen]);

  useEffect(() => {
    setCategoriaSelecionada(categoriaAtual);
  }, [categoriaAtual]);

  /* Handler de Submit */
  const onSubmit = async (values: FormValues) => {
    console.log('Salvando registro de saúde:', values);
    setIsSubmitting(true);

    try {
      const payload = {
        id_residente: values.id_residente,
        id_funcionario: values.id_funcionario,
        data: values.data,
        horario: values.horario,
        categoria: values.categoria,
        valor: values.valor,
        observacoes: values.observacoes || null
      };

      console.log('Payload enviado:', payload);

      if (values.id) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('saude')
          .update(payload)
          .eq('id', values.id);

        if (error) throw error;
        toast.success('Registro atualizado com sucesso!');
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('saude')
          .insert(payload);

        if (error) throw error;
        toast.success('Registro criado com sucesso!');
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      toast.error(`Erro ao salvar registro`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Obter informações da categoria atual */
  const categoriaInfo = CATEGORIAS.find(c => c.value === categoriaSelecionada);
  const IconeCategoria = categoriaInfo?.icon || HeartPulse;

  /* Formatar valor para exibição */
  const formatarValorParaExibicao = (categoria: string, valor: string): string => {
    if (!valor) return '';
    
    const formatos: Record<string, string> = {
      pressao_arterial: `${valor} mmHg`,
      temperatura: `${valor}°C`,
      glicemia: `${valor} mg/dL`,
      frequencia_cardiaca: `${valor} bpm`,
      saturacao_oxigenio: `${valor}%`,
      peso: `${valor} kg`,
    };
    return formatos[categoria] || valor;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-odara-offwhite/80 flex items-center justify-center p-4 z-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#e4edfdff',
            color: '#52323a',
            border: '1px solid #0036caff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#52323a',
              border: '1px solid #00c950',
            },
          },
          error: {
            style: {
              background: '#fce7e7ff',
              color: '#52323a',
              border: '1px solid #c90d00ff',
            },
          },
        }}
      />

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col border-l-4 border-odara-primary">
        {/* Header do Modal */}
        <div className="border-b border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {registro ? 'Editar Registro de Saúde' : 'Nova Aferição de Saúde'}
            </h2>

            {/* Botão fechar */}
            <button
              onClick={onClose}
              className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-odara-white text-sm">
            {registro
              ? "Atualize as informações da aferição"
              : "Preencha os dados para registrar uma nova aferição"}
          </p>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('id')} />

            {/* Linha 1 - Residente e Funcionário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <User size={16} className="text-odara-accent" />
                  Residente *
                </label>
                <select
                  {...register('id_residente', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                >
                  <option value="0">Selecione um residente...</option>
                  {residentes.map((r) => (
                    <option key={String(r.id)} value={String(r.id)}>
                      {r.nome} {r.quarto ? `(Q ${r.quarto})` : ''}
                    </option>
                  ))}
                </select>
                {errors.id_residente && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.id_residente.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <Users size={16} className="text-odara-accent" />
                  Funcionário Responsável *
                </label>
                <select
                  {...register('id_funcionario', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                >
                  <option value="0">Selecione um funcionário...</option>
                  {funcionarios.map((f) => (
                    <option key={String(f.id)} value={String(f.id)}>
                      {f.nome} {f.cargo ? `(${f.cargo})` : ''}
                    </option>
                  ))}
                </select>
                {errors.id_funcionario && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.id_funcionario.message}
                  </p>
                )}
              </div>
            </div>

            {/* Linha 2 - Data e Horário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <Calendar size={16} className="text-odara-accent" />
                  Data *
                </label>
                <input
                  type="date"
                  {...register('data')}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                />
                {errors.data && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.data.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <Clock size={16} className="text-odara-accent" />
                  Horário *
                </label>
                <input
                  type="time"
                  {...register('horario')}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                />
                {errors.horario && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.horario.message}
                  </p>
                )}
              </div>
            </div>

            {/* Linha 3 - Categoria e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <IconeCategoria size={16} className="text-odara-accent" />
                  Categoria *
                </label>
                <select
                  {...register('categoria')}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                  onChange={(e) => {
                    setValue('categoria', e.target.value);
                    setValue('valor', '');
                  }}
                >
                  {CATEGORIAS.map((categoria) => {
                    const Icone = categoria.icon;
                    return (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    );
                  })}
                </select>
                {errors.categoria && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.categoria.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <Activity size={16} className="text-odara-accent" />
                  Valor *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={categoriaInfo?.placeholder || "Digite o valor"}
                    {...register('valor')}
                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base pr-20"
                  />
                  {valorAtual && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-odara-accent font-medium">
                      {formatarValorParaExibicao(categoriaAtual, valorAtual)}
                    </div>
                  )}
                </div>
                {errors.valor && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.valor.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {categoriaSelecionada === 'pressao_arterial' && 'Formato: sistólica/diastólica (ex: 120/80)'}
                  {categoriaSelecionada === 'temperatura' && 'Valores normais: 36.0 - 37.5°C'}
                  {categoriaSelecionada === 'glicemia' && 'Valores normais: 70 - 140 mg/dL'}
                  {categoriaSelecionada === 'frequencia_cardiaca' && 'Valores normais: 60 - 100 bpm'}
                  {categoriaSelecionada === 'saturacao_oxigenio' && 'Valores normais: 95 - 100%'}
                  {categoriaSelecionada === 'peso' && 'Peso em quilogramas (ex: 65.5)'}
                </p>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                <AlertCircle size={16} className="text-odara-accent" />
                Observações
              </label>
              <textarea
                placeholder="Observações sobre a aferição, sintomas, condições especiais..."
                rows={3}
                {...register('observacoes')}
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 text-sm sm:text-base"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-max px-6 py-2 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    {registro ? 'Salvando...' : 'Registrando...'}
                  </>
                ) : (
                  <>
                    {registro ? <Save size={16} /> : <Plus size={16} />}
                    {registro ? 'Salvar Alterações' : 'Registrar Aferição'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalSaude;