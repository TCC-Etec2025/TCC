import React, { useEffect, useState } from 'react';
import { FaTimes, FaSave, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

type Residente = {
    id: number;
    nome: string;
};

type Consulta = {
    id: number;
    data_consulta: string;
    horario: string;
    medico?: string;
    id_residente?: number;
};

type Exame = {
    id: number;
    id_consulta: number | null;
    id_residente: number;
    tipo: string;
    laboratorio: string;
    data_prevista: string;
    horario_previsto: string;
    data_realizado: string | null;
    horario_realizado: string | null;
    resultado: string | null;
    arquivo_resultado: string | null;
    status: string;
    observacao: string | null;
    residente: Residente;
    consulta: Consulta | null;
};

type ModalExameProps = {
    exame: Exame | null;
    isOpen: boolean;
    onClose: () => void;
};

const schema = yup.object({
    id: yup.number().nullable(),
    id_residente: yup.number().required('Residente é obrigatório').min(1, 'Residente é obrigatório'),
    id_consulta: yup.number()
        .transform((value, originalValue) => {
            return originalValue === '' ? null : value;
        })
        .nullable(),
    tipo: yup.string().required('Tipo de exame é obrigatório'),
    laboratorio: yup.string().nullable(),
    data_prevista: yup.string().required('Data prevista é obrigatória'),
    horario_previsto: yup.string().required('Horário previsto é obrigatório').matches(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    data_realizado: yup.string().nullable(),
    horario_realizado: yup.string().nullable()
}).required();

type FormValues = yup.InferType<typeof schema>;

const ModalExame: React.FC<ModalExameProps> = ({ exame, isOpen, onClose }) => {
    const [residentes, setResidentes] = useState<Residente[]>([]);
    const [consultas, setConsultas] = useState<Consulta[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: null,
            id_residente: 0,
            id_consulta: null,
            tipo: '',
            laboratorio: '',
            data_prevista: new Date().toISOString().split('T')[0],
            horario_previsto: '',
            data_realizado: '',
            horario_realizado: ''
        }
    });

    useEffect(() => {
        const fetchResidentes = async () => {
            const { data, error } = await supabase.from('residente').select('id, nome').order('nome');
            if (error) console.error(error);
            setResidentes(data || []);
        };

        const fetchConsultas = async () => {
            const { data, error } = await supabase
                .from('consulta')
                .select('id, data_consulta, horario, medico, id_residente')
                .order('data_consulta', { ascending: false });
            if (error) console.error(error);
            setConsultas(data || []);
        };

        fetchResidentes();
        fetchConsultas();

        reset({
            id: exame ? exame.id : null,
            id_residente: exame ? exame.id_residente : 0,
            id_consulta: exame ? exame.id_consulta : null,
            tipo: exame ? exame.tipo : '',
            laboratorio: exame ? exame.laboratorio : '',
            data_prevista: exame ? exame.data_prevista : new Date().toISOString().split('T')[0],
            horario_previsto: exame ? exame.horario_previsto : '',
            data_realizado: exame ? exame.data_realizado : '',
            horario_realizado: exame ? exame.horario_realizado : ''
        });
    }, [exame, reset, isOpen]);

    const onSubmit = async (values: FormValues) => {
        try {
            const payload = {
                id_residente: values.id_residente,
                id_consulta: values.id_consulta || null,
                tipo: values.tipo,
                laboratorio: values.laboratorio || null,
                data_prevista: values.data_prevista,
                horario_previsto: values.horario_previsto,
                data_realizado: values.data_realizado || null,
                horario_realizado: values.horario_realizado || null,
            };

            if (values.id) {
                const { error } = await supabase.from('exame').update(payload).eq('id', values.id);
                if (error) throw error;
                toast.success('Exame atualizado.');
            } else {
                const { error } = await supabase.from('exame').insert(payload);
                if (error) throw error;
                toast.success('Exame criado.');
            }

            setTimeout(() => onClose(), 600);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar exame.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <Toaster position="top-center" />
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border-l-4 border-odara-primary max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-odara-accent">
                        {exame ? 'Editar Exame' : 'Novo Exame'}
                    </h2>
                    <button onClick={onClose} className="text-odara-primary hover:text-odara-secondary">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <input type="hidden" {...register('id')} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium text-odara-dark mb-1">Residente *</label>
                            <select
                                {...register('id_residente')}
                                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-odara-primary ${errors.id_residente ? 'border-red-600' : ''
                                    }`}
                            >
                                <option value="">Selecione um residente</option>
                                {residentes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                            {errors.id_residente && (
                                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.id_residente.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="flex text-sm font-medium text-odara-secondary mb-2 items-center gap-1">
                                Consulta (opcional)
                                <span
                                    className="text-odara-primary cursor-pointer relative group"
                                >
                                    <Info size={16} />
                                    <span className="absolute left-6 top-1 z-10 hidden group-hover:block bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-xs text-odara-dark w-56">
                                        Apenas consultas do residente selecionado serão exibidas aqui.
                                    </span>
                                </span>
                            </label>
                            <select {...register('id_consulta')} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-odara-primary">
                                <option value="">Nenhuma</option>
                                {consultas.map(c => {
                                    const selectedResidente = Number(watch('id_residente'));
                                    if (selectedResidente) {
                                        return c.id_residente === selectedResidente ? (
                                            <option key={c.id} value={c.id}>
                                                {c.medico} ∙ {c.data_consulta.split('-').reverse().join('/')} às {c.horario.slice(0, 5)}
                                            </option>
                                        ) : null;
                                    }
                                    return (
                                        <option key={c.id} value={c.id}>
                                            {c.data_consulta.split('-').reverse().join('/')} às {c.horario.slice(0, 5)}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium text-odara-dark mb-1">Tipo de Exame *</label>
                            <input
                                {...register('tipo')}
                                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-odara-primary ${errors.tipo ? 'border-red-600' : ''
                                    }`}
                            />
                            {errors.tipo && (
                                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.tipo.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block font-medium text-odara-dark mb-1">Data Prevista *</label>
                            <input
                                type="date"
                                {...register('data_prevista')}
                                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-odara-primary ${errors.data_prevista ? 'border-red-600' : ''
                                    }`}
                            />
                            {errors.data_prevista && (
                                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.data_prevista.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block font-medium text-odara-dark mb-1">Horário Previsto *</label>
                            <input
                                type="time"
                                {...register('horario_previsto')}
                                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-odara-primary ${errors.horario_previsto ? 'border-red-600' : ''
                                    }`}
                            />
                            {errors.horario_previsto && (
                                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.horario_previsto.message}
                                </p>
                            )}
                        </div>
                        {exame && (
                            <div>
                                <div>
                                    <label className="block font-medium text-odara-dark mb-1">Data Realizado</label>
                                    <input type="date" {...register('data_realizado')} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-odara-primary" />
                                </div>
                                <div>
                                    <label className="block font-medium text-odara-dark mb-1">Horário Realizado</label>
                                    <input type="time" {...register('horario_realizado')} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-odara-primary" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border-2 border-gray-300 text-odara-dark hover:bg-gray-50 font-medium transition-colors duration-200">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-odara-accent text-white font-medium hover:bg-odara-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2">
                            {isSubmitting ? <><FaSpinner className="animate-spin" /> Salvando...</> : <><FaSave /> Salvar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalExame;