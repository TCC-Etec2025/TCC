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
};

export type Consulta = {
    id?: number;
    id_residente: number;
    data_consulta: string;
    horario: string;
    medico: string;
    motivo_consulta: string;
    numero_prontuario: string;
    historico_clinico?: string | null;
    tratamento_indicado?: string | null;
    exames_solicitados?: string | null;
    receitas_medicas?: string | null;
    anexos_medicos?: string | null;
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
    numero_prontuario: yup.string().required('Nº prontuário é obrigatório'),
    data_consulta: yup.string().required('Data é obrigatória'),
    horario: yup.string()
        .required('Horário é obrigatório')
        .matches(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    medico: yup.string().required('Médico é obrigatório'),
    motivo_consulta: yup.string().required('Motivo é obrigatório'),
    historico_clinico: yup.string().nullable(),
    tratamento_indicado: yup.string().nullable(),
    exames_solicitados: yup.string().nullable(),
    receitas_medicas: yup.string().nullable(),
    anexos_medicos: yup.string().nullable()
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
            numero_prontuario: '',
            data_consulta: new Date().toISOString().split('T')[0],
            horario: '',
            medico: '',
            motivo_consulta: '',
            historico_clinico: '',
            tratamento_indicado: '',
            exames_solicitados: '',
            receitas_medicas: '',
            anexos_medicos: ''
        }
    });

    useEffect(() => {
        const fetchResidentes = async () => {
            const { data, error } = await supabase
                .from('residente')
                .select('id, nome')
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
            numero_prontuario: consulta ? consulta.numero_prontuario : '',
            data_consulta: consulta
                ? (consulta.data_consulta || new Date().toISOString().split('T')[0])
                : new Date().toISOString().split('T')[0],
            horario: consulta ? consulta.horario : '',
            medico: consulta ? consulta.medico : '',
            motivo_consulta: consulta ? consulta.motivo_consulta : '',
            historico_clinico: consulta?.historico_clinico || '',
            tratamento_indicado: consulta?.tratamento_indicado || '',
            exames_solicitados: consulta?.exames_solicitados || '',
            receitas_medicas: consulta?.receitas_medicas || '',
            anexos_medicos: consulta?.anexos_medicos || ''
        });
    }, [consulta, reset, isOpen]);

    const onSubmit = async (values: FormValues) => {
        try {
            const payload = {
                id_residente: values.id_residente,
                numero_prontuario: values.numero_prontuario,
                data_consulta: values.data_consulta,
                horario: values.horario,
                medico: values.medico,
                motivo_consulta: values.motivo_consulta,
                historico_clinico: values.historico_clinico || null,
                tratamento_indicado: values.tratamento_indicado || null,
                exames_solicitados: values.exames_solicitados || null,
                receitas_medicas: values.receitas_medicas || null,
                anexos_medicos: values.anexos_medicos || null
            };

            if (values.id) {
                const { error } = await supabase
                    .from('consulta')
                    .update(payload)
                    .eq('id', values.id);
                if (error) throw error;
                toast.success('Consulta atualizada.');
            } else {
                const { error } = await supabase
                    .from('consulta')
                    .insert(payload);
                if (error) throw error;
                toast.success('Consulta criada.');
            }
            setTimeout(() => onClose(), 600);
        } catch (err) {
            console.error('Erro ao salvar consulta:', err);
            toast.error('Falha ao salvar.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <Toaster position="top-center" />
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border-l-4 border-odara-primary max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-odara-accent">
                        {consulta ? 'Editar Consulta Médica' : 'Nova Consulta Médica'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-odara-primary hover:text-odara-secondary transition-colors duration-200"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <input type="hidden" {...register('id')} />

                    {/* Linha 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Residente *</label>
                            <select
                                {...register('id_residente')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                            >
                                <option value="">Selecione um residente</option>
                                {residentes.map(r => (
                                    <option key={r.id} value={r.id}>{r.nome}</option>
                                ))}
                            </select>
                            {errors.id_residente && <p className="text-sm text-red-600 mt-1 flex items-center gap-1"><FaExclamationCircle /> {errors.id_residente.message}</p>}
                        </div>

                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Nº Prontuário *</label>
                            <input
                                {...register('numero_prontuario')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                            />
                            {errors.numero_prontuario && <p className="text-sm text-red-600 mt-1 flex items-center gap-1"><FaExclamationCircle /> {errors.numero_prontuario.message}</p>}
                        </div>
                    </div>

                    {/* Linha 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Data *</label>
                            <input
                                type="date"
                                {...register('data_consulta')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                            />
                            {errors.data_consulta && <p className="text-sm text-red-600 mt-1 flex items-center gap-1"><FaExclamationCircle /> {errors.data_consulta.message}</p>}
                        </div>
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Horário *</label>
                            <input
                                type="time"
                                {...register('horario')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                            />
                            {errors.horario && <p className="text-sm text-red-600 mt-1 flex items-center gap-1"><FaExclamationCircle /> {errors.horario.message}</p>}
                        </div>
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Médico *</label>
                            <input
                                {...register('medico')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                            />
                            {errors.medico && <p className="text-sm text-red-600 mt-1 flex items-center gap-1"><FaExclamationCircle /> {errors.medico.message}</p>}
                        </div>
                    </div>

                    {/* Motivo */}
                    <div>
                        <label className="block text-odara-dark font-medium mb-2">Motivo da Consulta *</label>
                        <textarea
                            {...register('motivo_consulta')}
                            rows={3}
                            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        />
                        {errors.motivo_consulta && <p className="text-sm text-red-600 mt-1 flex items-center gap-1"><FaExclamationCircle /> {errors.motivo_consulta.message}</p>}
                    </div>

                    <div>
                        <label className="block text-odara-dark font-medium mb-2">Histórico e Evolução Clínica</label>
                        <textarea
                            {...register('historico_clinico')}
                            rows={3}
                            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        />
                    </div>

                    <div>
                        <label className="block text-odara-dark font-medium mb-2">Tratamento Indicado</label>
                        <textarea
                            {...register('tratamento_indicado')}
                            rows={2}
                            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        />
                    </div>

                    <div>
                        <label className="block text-odara-dark font-medium mb-2">Exames Solicitados</label>
                        <textarea
                            {...register('exames_solicitados')}
                            rows={2}
                            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        />
                    </div>

                    <div>
                        <label className="block text-odara-dark font-medium mb-2">Receitas Médicas</label>
                        <textarea
                            {...register('receitas_medicas')}
                            rows={2}
                            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                        />
                    </div>

                    <div>
                        <label className="block text-odara-dark font-medium mb-2">Anexos Médicos (descrição)</label>
                        <input
                            {...register('anexos_medicos')}
                            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary"
                            placeholder="Ex: link ou breve descrição"
                        />
                    </div>

                    {/* Ações */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                                    {consulta ? 'Salvando...' : 'Adicionando...'}
                                </>
                            ) : (
                                <>
                                    {consulta ? <FaSave /> : <FaPlus />}
                                    {consulta ? 'Salvar Alterações' : 'Salvar Consulta'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalConsultas;