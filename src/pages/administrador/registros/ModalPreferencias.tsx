import { useEffect, useState } from 'react';
import { FaTimes, FaSpinner, FaSave, FaPlus, FaExclamationCircle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { yupResolver } from '@hookform/resolvers/yup';
import { supabase } from '../../../lib/supabaseClient';

type Preferencia = {
    id: number;
    id_residente: number;
    tipo_preferencia: string;
    titulo: string;
    descricao: string;
    foto_url?: string | null;
    criado_em?: string | null;
    residente?: {
        id: number;
        nome: string;
    } | null;
};

type Residente = {
    id: number;
    nome: string;
};

type ModalPreferenciasProps = {
    preferencia: Preferencia | null;
    isOpen: boolean;
    onClose: () => void;
};

const categorias = {
    "alimentar": "Alimentar",
    "atividades": "Atividades",
    "cuidador": "Cuidador"
};

const schema = yup.object({
    id: yup.number().nullable(),
    id_residente: yup.number().required('Residente é obrigatório'),
    tipo_preferencia: yup.string().required('Categoria é obrigatória'),
    titulo: yup.string().required('Título é obrigatório'),
    descricao: yup.string().required('Descrição é obrigatória'),
    foto_url: yup.string().nullable()
}).required();

type FormValues = yup.InferType<typeof schema>;

const ModalPreferencias = ({ preferencia, isOpen, onClose }: ModalPreferenciasProps) => {
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
            tipo_preferencia: '',
            titulo: '',
            descricao: '',
            foto_url: ''
        }
    });

    useEffect(() => {
        if (!isOpen) return;

        const carregarResidentes = async () => {
            const { data, error } = await supabase
                .from('residente')
                .select('id, nome')
                .order('nome', { ascending: true });

            if (error) {
                console.error('Erro ao carregar residentes:', error);
                return;
            }
            setResidentes(data || []);
        };

        carregarResidentes();

        reset({
            id: preferencia ? preferencia.id : null,
            id_residente: preferencia ? preferencia.id_residente : 0,
            tipo_preferencia: preferencia ? preferencia.tipo_preferencia : '',
            titulo: preferencia ? preferencia.titulo : '',
            descricao: preferencia ? preferencia.descricao : '',
            foto_url: preferencia ? (preferencia.foto_url || '') : ''
        });
    }, [preferencia, isOpen, reset]);

    const onSubmit = async (values: FormValues) => {
        try {
            const id = Number(values.id);
            const payload = {
                id_residente: Number(values.id_residente),
                tipo_preferencia: values.tipo_preferencia,
                titulo: values.titulo,
                descricao: values.descricao,
                foto_url: values.foto_url || null
            };

            if (id) {
                const { error } = await supabase
                    .from('preferencia')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                toast.success('Preferência atualizada com sucesso!');
            } else {
                const { error } = await supabase
                    .from('preferencia')
                    .insert(payload);
                if (error) throw error;
                toast.success('Preferência criada com sucesso!');
            }

            setTimeout(() => onClose(), 500);
        } catch (err) {
            console.error('Erro ao salvar preferência:', err);
            toast.error('Erro ao salvar preferência.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: '#e4edfd',
                        color: '#52323a',
                        border: '1px solid #0036ca',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500'
                    },
                    success: {
                        style: {
                            background: '#f0fdf4',
                            border: '1px solid #00c950'
                        }
                    },
                    error: {
                        style: {
                            background: '#fce7e7',
                            border: '1px solid #c90d00'
                        }
                    }
                }}
            />
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-odara-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {preferencia ? 'Editar Preferência' : 'Nova Preferência'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <p className="text-odara-offwhite/80 mt-1 text-sm">
                        {preferencia
                            ? 'Atualize as informações da preferência'
                            : 'Preencha os dados para adicionar uma nova preferência'}
                    </p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <input type="hidden" {...register('id')} />

                        {/* Residente */}
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
                                        {r.nome}
                                    </option>
                                ))}
                            </select>
                            {errors.id_residente && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.id_residente.message}
                                </p>
                            )}
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Categoria *
                            </label>
                            <select
                                {...register('tipo_preferencia')}
                                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary"
                            >
                                <option value="">Selecione a categoria</option>
                                {Object.entries(categorias).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            {errors.tipo_preferencia && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.tipo_preferencia.message}
                                </p>
                            )}
                        </div>

                        {/* Título */}
                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Título *
                            </label>
                            <input
                                {...register('titulo')}
                                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                placeholder="Ex: Prefere refeições leves"
                            />
                            {errors.titulo && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.titulo.message}
                                </p>
                            )}
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Descrição *
                            </label>
                            <textarea
                                {...register('descricao')}
                                rows={4}
                                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                placeholder="Detalhe a preferência..."
                            />
                            {errors.descricao && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                    <FaExclamationCircle /> {errors.descricao.message}
                                </p>
                            )}
                        </div>

                        {/* Foto */}
                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Foto (URL no Storage)
                            </label>
                            <input
                                {...register('foto_url')}
                                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                placeholder="public/preferencias/exemplo.jpg"
                            />
                            <p className="text-xs text-odara-name mt-1">
                                Opcional. Caminho da imagem no storage.
                            </p>
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
                                        {preferencia ? 'Salvando...' : 'Adicionando...'}
                                    </>
                                ) : (
                                    <>
                                        {preferencia ? <FaSave /> : <FaPlus />}
                                        {preferencia ? 'Salvar Alterações' : 'Adicionar Preferência'}
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

export default ModalPreferencias;