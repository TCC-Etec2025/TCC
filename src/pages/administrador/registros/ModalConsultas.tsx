import React, { useEffect, useState } from 'react';
import { X, Save, Plus, Loader, Info, User, Calendar, Clock, Stethoscope, FileText, Pill, AlertCircle } from 'lucide-react';
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

type Consulta = {
  id: number;
  id_residente: number;
  data_consulta: string;
  horario: string;
  medico: string;
  motivo_consulta: string | null;
  tratamento_indicado: string | null;
  status: string;
  observacao: string | null;
  criado_em?: string;
  atualizado_em?: string;
  residente?: Residente;
};

/* Props do Modal */
type ModalConsultaProps = {
  consulta: Consulta | null;
  isOpen: boolean;
  onClose: () => void;
};

/* Schema de Validação */
const schema = yup.object({
  id: yup.number().nullable(),
  id_residente: yup.number()
    .required('Residente é obrigatório')
    .min(1, 'Selecione um residente'),
  data_consulta: yup.string().required('Data é obrigatória'),
  horario: yup.string()
    .required('Horário é obrigatório')
    .matches(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  medico: yup.string().required('Médico é obrigatório'),
  motivo_consulta: yup.string().required('Motivo da consulta é obrigatório'),
  tratamento_indicado: yup.string().nullable(),
  observacao: yup.string().nullable(),
  status: yup.string().default('agendada')
}).required();

// Definir tipo explicitamente
interface FormValues {
  id?: number | null;
  id_residente: number;
  data_consulta: string;
  horario: string;
  medico: string;
  motivo_consulta: string;
  tratamento_indicado?: string | null;
  observacao?: string | null;
  status: string;
}

/* Componente Principal */
const ModalConsultas: React.FC<ModalConsultaProps> = ({ consulta, isOpen, onClose }) => {
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Configuração do Form */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: null,
      id_residente: 0,
      data_consulta: new Date().toISOString().split('T')[0],
      horario: '',
      medico: '',
      motivo_consulta: '',
      tratamento_indicado: '',
      observacao: '',
      status: 'agendada'
    }
  });

  /* Efeitos */
  useEffect(() => {
    const fetchResidentes = async () => {
      try {
        const { data, error } = await supabase
          .from('residente')
          .select('id, nome, quarto')
          .order('nome', { ascending: true });

        if (error) throw error;
        setResidentes(data || []);
      } catch (err) {
        console.error('Erro ao carregar residentes:', err);
        toast.error('Erro ao carregar residentes');
      }
    };

    if (isOpen) {
      fetchResidentes();

      // Resetar formulário com dados da consulta ou valores padrão
      if (consulta) {
        reset({
          id: consulta.id,
          id_residente: consulta.id_residente,
          data_consulta: consulta.data_consulta,
          horario: consulta.horario,
          medico: consulta.medico,
          motivo_consulta: consulta.motivo_consulta || '',
          tratamento_indicado: consulta.tratamento_indicado || '',
          observacao: consulta.observacao || '',
          status: consulta.status || 'agendada'
        });
      } else {
        reset({
          id: null,
          id_residente: 0,
          data_consulta: new Date().toISOString().split('T')[0],
          horario: '',
          medico: '',
          motivo_consulta: '',
          tratamento_indicado: '',
          observacao: '',
          status: 'agendada'
        });
      }
    }
  }, [consulta, reset, isOpen]);

  /* Handler de Submit - SIMPLES E FUNCIONAL */
  const onSubmit = async (values: FormValues) => {
    console.log('Salvando consulta:', values);
    setIsSubmitting(true);

    try {
      const payload = {
        id_residente: values.id_residente,
        data_consulta: values.data_consulta,
        horario: values.horario,
        medico: values.medico,
        motivo_consulta: values.motivo_consulta,
        tratamento_indicado: values.tratamento_indicado || null,
        observacao: values.observacao || null,
        status: values.status
      };

      console.log('Payload enviado:', payload);

      if (values.id) {
        // Atualizar consulta existente
        const { error } = await supabase
          .from('consulta')
          .update(payload)
          .eq('id', values.id);

        if (error) throw error;
        toast.success('Consulta atualizada com sucesso!');
      } else {
        // Criar nova consulta
        const { error } = await supabase
          .from('consulta')
          .insert(payload);

        if (error) throw error;
        toast.success('Consulta criada com sucesso!');
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      toast.error(`Erro ao salvar consulta`);
    } finally {
      setIsSubmitting(false);
    }
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
              {consulta ? 'Editar Consulta Médica' : 'Nova Consulta Médica'}
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
            {consulta
              ? "Atualize as informações da consulta"
              : "Preencha os dados para agendar uma nova consulta"}
          </p>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('id')} />
            <input type="hidden" {...register('status')} />

            {/* Linha 1 - Residente */}
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

            {/* Linha 2 - Data, Horário e Médico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <Calendar size={16} className="text-odara-accent" />
                  Data *
                </label>
                <input
                  type="date"
                  {...register('data_consulta')}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                />
                {errors.data_consulta && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.data_consulta.message}
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

              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <Stethoscope size={16} className="text-odara-accent" />
                  Médico *
                </label>
                <input
                  type="text"
                  placeholder="Nome do médico"
                  {...register('medico')}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                />
                {errors.medico && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <Info size={14} /> {errors.medico.message}
                  </p>
                )}
              </div>
            </div>

            {/* Motivo da Consulta  */}
            <div>
              <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                <FileText size={16} className="text-odara-accent" />
                Título da Consulta *
              </label>
              <textarea
                placeholder="Escreva o título da consulta..."
                rows={3}
                {...register('motivo_consulta')}
                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
              />
              {errors.motivo_consulta && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <Info size={14} /> {errors.motivo_consulta.message}
                </p>
              )}
            </div>

            {/* Tratamento Indicado e Observações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <Pill size={16} className="text-odara-accent" />
                  Tratamento Indicado
                </label>
                <textarea
                  placeholder="Tratamento prescrito pelo médico..."
                  rows={3}
                  {...register('tratamento_indicado')}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-medium text-odara-dark mb-2 items-center gap-1">
                  <AlertCircle size={16} className="text-odara-accent" />
                  Observações
                </label>
                <textarea
                  placeholder="Observações adicionais..."
                  rows={3}
                  {...register('observacao')}
                  className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                />
              </div>
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
                    {consulta ? 'Salvando...' : 'Agendando...'}
                  </>
                ) : (
                  <>
                    {consulta ? <Save size={16} /> : <Plus size={16} />}
                    {consulta ? 'Salvar Alterações' : 'Agendar Consulta'}
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

export default ModalConsultas;