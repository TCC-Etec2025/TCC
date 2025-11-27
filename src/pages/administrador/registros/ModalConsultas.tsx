import React, { useEffect, useState } from 'react';
import { FaTimes, FaPlus, FaSave, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

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

type ModalConsultaProps = {
    consulta: Consulta | null;
    isOpen: boolean;
    onClose: () => void;
};

const schema = yup.object({
    id: yup.number().nullable(),
    id_residente: yup.number().required('Residente é obrigatório').min(1, 'Selecione um residente'),
    data_consulta: yup.string().required('Data é obrigatória'),
    horario: yup.string()
        .required('Horário é obrigatório')
        .matches(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    medico: yup.string().required('Médico é obrigatório'),
    motivo_consulta: yup.string().required('Motivo é obrigatório'),
    tratamento_indicado: yup.string().nullable(),
    observacao: yup.string().nullable()
}).required();

type FormValues = yup.InferType<typeof schema>;

const ModalConsultas: React.FC<ModalConsultaProps> = ({ consulta, isOpen, onClose }) => {
    const [residentes, setResidentes] = useState<Residente[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
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
            observacao: ''
        }
    });

    useEffect(() => {
        const fetchResidentes = async () => {
            const { data, error } = await supabase
                .from('residente')
                .select('id, nome, quarto')
                .order('nome');
            if (error) {
                console.error('Erro ao carregar residentes:', error);
                return;
            }
            setResidentes(data || []);
        };
        fetchResidentes();

        reset({
            id: consulta ? consulta.id ?? null : null,
            id_residente: consulta ? consulta.id_residente : 0,
            data_consulta: consulta
                ? consulta.data_consulta
                : new Date().toISOString().split('T')[0],
            horario: consulta ? consulta.horario : '',
            medico: consulta ? consulta.medico : '',
            motivo_consulta: consulta ? consulta.motivo_consulta ?? '' : '',
            tratamento_indicado: consulta?.tratamento_indicado || '',
            observacao: consulta?.observacao || ''
        });
    }, [consulta, reset, isOpen]);

    const onSubmit = async (values: FormValues) => {
        try {
            const payload = {
                id_residente: values.id_residente,
                data_consulta: values.data_consulta,
                horario: values.horario,
                medico: values.medico,
                motivo_consulta: values.motivo_consulta,
                tratamento_indicado: values.tratamento_indicado || null,
                observacao: values.observacao || null
            };

            if (values.id) {
                const { error } = await supabase
                    .from('consulta')
                    .update(payload)
                    .eq('id', values.id);
                if (error) throw error;
                toast.success('Consulta atualizada com sucesso!');
            } else {
                const { error } = await supabase
                    .from('consulta')
                    .insert(payload);
                if (error) throw error;
                toast.success('Consulta criada com sucesso!');
            }
            setTimeout(() => onClose(), 600);
        } catch (err) {
            console.error('Erro ao salvar consulta:', err);
            toast.error('Erro ao salvar consulta.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header do Modal */}
                <div className="bg-odara-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {consulta ? 'Editar Consulta Médica' : 'Nova Consulta Médica'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <p className="text-odara-offwhite/80 mt-1 text-sm">
                        {consulta ? 'Atualize as informações da consulta' : 'Preencha os dados para agendar uma nova consulta'}
                    </p>
                </div>

                {/* Corpo do Modal */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <input type="hidden" {...register('id')} />

                        {/* Linha 1 - Residente */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Residente *
                                </label>
                                <select
                                    {...register('id_residente')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                >
                                    <option value="">Selecione um residente</option>
                                    {residentes.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.nome} {r.quarto ? `(Q ${r.quarto})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_residente && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.id_residente.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Linha 2 - Data, Horário e Médico */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Data *
                                </label>
                                <input
                                    type="date"
                                    {...register('data_consulta')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                />
                                {errors.data_consulta && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.data_consulta.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Horário *
                                </label>
                                <input
                                    type="time"
                                    {...register('horario')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                />
                                {errors.horario && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.horario.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Médico *
                                </label>
                                <input
                                    {...register('medico')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="Nome do médico"
                                />
                                {errors.medico && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.medico.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Motivo da Consulta */}
                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Motivo da Consulta *
                            </label>
                            <textarea
                                {...register('motivo_consulta')}
                                rows={3}
                                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                placeholder="Descreva o motivo da consulta..."
                            />
                            {errors.motivo_consulta && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.motivo_consulta.message}
                                </p>
                            )}
                        </div>

                        {/* Tratamento Indicado e Observações */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Tratamento Indicado
                                </label>
                                <textarea
                                    {...register('tratamento_indicado')}
                                    rows={3}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="Tratamento prescrito pelo médico..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Observações
                                </label>
                                <textarea
                                    {...register('observacao')}
                                    rows={3}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-odara-dark hover:bg-gray-50 font-medium transition-colors duration-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl bg-odara-accent text-white font-medium hover:bg-odara-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        {consulta ? 'Salvando...' : 'Agendando...'}
                                    </>
                                ) : (
                                    <>
                                        {consulta ? <FaSave /> : <FaPlus />}
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