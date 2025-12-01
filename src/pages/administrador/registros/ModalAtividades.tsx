import { useState, useEffect } from 'react';
import { X, Info, Loader } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

/* Tipos */
type Residente = {
    id: number;
    nome: string;
};

type Atividade = {
    id: number;
    residentes: Residente[];
    nome: string;
    categoria: string;
    data: string;
    horario_inicio: string;
    horario_fim: string;
    local: string;
    observacao: string;
    status: string;
};

/* Schema de Validação */
const schema = yup.object({
    id: yup.number().nullable(),
    residentes: yup.array().of(yup.number()).min(1, 'Selecione ao menos um residente').required('Residentes são obrigatórios'),
    nome: yup.string().required('Nome da atividade é obrigatório'),
    categoria: yup.string().required('Categoria é obrigatória'),
    data: yup.string().required('Data é obrigatória'),
    horario_inicio: yup.string().required('Horário de início é obrigatório'),
    horario_fim: yup.string().required('Horário de fim é obrigatório'),
    local: yup.string(),
    observacao: yup.string()
}).required();

type FormValues = yup.InferType<typeof schema>;

/* Props do Componente */
type ModalAtividadesProps = {
    atividade: Atividade | null;
    isOpen: boolean;
    onClose: () => void;
};

const ModalAtividades = ({ atividade, isOpen, onClose }: ModalAtividadesProps) => {
    /* Estados */
    const [residentes, setResidentes] = useState<Residente[]>([]);

    /* Form Hook */
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: null,
            residentes: [],
            nome: '',
            categoria: '',
            data: new Date().toISOString().split('T')[0],
            horario_inicio: '',
            horario_fim: '',
            local: '',
            observacao: ''
        }
    });

    /* Efeitos */
    useEffect(() => {
        const fetchResidentes = async () => {
            const { data, error } = await supabase
                .from('residente')
                .select('id, nome')
                .order('nome', { ascending: true });

            if (error) {
                console.error('Erro ao buscar residentes:', error);
                toast.error('Erro ao carregar residentes');
            } else {
                setResidentes(data || []);
            }
        };

        if (isOpen) {
            fetchResidentes();
            reset({
                id: atividade ? atividade.id : null,
                residentes: atividade ? atividade.residentes.map(r => r.id) : [],
                nome: atividade ? atividade.nome : '',
                categoria: atividade ? atividade.categoria : '',
                data: atividade ? atividade.data : new Date().toISOString().split('T')[0],
                horario_inicio: atividade ? atividade.horario_inicio : '',
                horario_fim: atividade ? atividade.horario_fim : '',
                local: atividade ? atividade.local : '',
                observacao: atividade ? atividade.observacao : ''
            });
        }
    }, [atividade, reset, isOpen]);

    /* Handlers */
    const adicionarResidente = (residenteId: number) => {
        const residentesAtuais = watch('residentes') as number[];
        if (!residentesAtuais.includes(residenteId)) {
            setValue('residentes', [...residentesAtuais, residenteId]);
        }
    };

    const removerResidente = (residenteId: number) => {
        const residentesAtuais = watch('residentes') as number[];
        setValue('residentes', residentesAtuais.filter(id => id !== residenteId));
    };

    const onSubmit = async (values: FormValues) => {
        try {
            const id = Number(values.id);
            const residentesInsert = values.residentes || [];

            const dados = {
                nome: values.nome,
                categoria: values.categoria,
                data: values.data,
                horario_inicio: values.horario_inicio,
                horario_fim: values.horario_fim,
                local: values.local,
                observacao: values.observacao
            };

            if (id) {
                // Atualizar atividade existente
                const { data: atividadeData, error } = await supabase
                    .from('atividade')
                    .update(dados)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                // Atualizar relações com residentes
                if (atividadeData) {
                    const { error: deleteError } = await supabase
                        .from('atividade_residente')
                        .delete()
                        .eq('id_atividade', id);

                    if (deleteError) throw deleteError;

                    for (const residenteId of residentesInsert) {
                        const { error: insertError } = await supabase
                            .from('atividade_residente')
                            .insert({
                                id_atividade: atividadeData.id,
                                id_residente: residenteId
                            });
                        if (insertError) throw insertError;
                    }
                }

                toast.success('Atividade atualizada com sucesso!');
            } else {
                // Criar nova atividade
                const { data: atividadeData, error } = await supabase
                    .from('atividade')
                    .insert(dados)
                    .select()
                    .single();

                if (error) throw error;

                // Criar relações com residentes
                if (atividadeData) {
                    for (const residenteId of residentesInsert) {
                        const { error: insertError } = await supabase
                            .from('atividade_residente')
                            .insert({
                                id_atividade: atividadeData.id,
                                id_residente: residenteId
                            });
                        if (insertError) throw insertError;
                    }
                }

                toast.success('Atividade criada com sucesso!');
            }

            setTimeout(() => { onClose(); }, 500);
        } catch (error) {
            console.error('Erro ao salvar atividade:', error);
            toast.error('Erro ao salvar atividade');
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
                <div className="border-b-1 border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {atividade ? 'Editar Atividade' : 'Adicionar Nova Atividade'}
                        </h2>

                        {/* Botão fechar */}
                        <button
                            onClick={onClose}
                            className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-odara-white  text-sm">
                        {atividade ? 'Atualize as informações da atividade' : 'Preencha os dados para adicionar uma nova atividade'}
                    </p>
                </div>

                {/* Corpo do Modal */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <input type="hidden" {...register('id')} />

                        {/* Linha 1 - Residentes e Nome */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Residentes *
                                </label>

                                {/* Campo de seleção de residentes */}
                                <select
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    value=""
                                    onChange={(e) => {
                                        const residenteId = Number(e.target.value);
                                        if (residenteId) {
                                            adicionarResidente(residenteId);
                                        }
                                    }}
                                >
                                    <option value="">Selecione um residente...</option>
                                    {residentes
                                        .filter(residente => !((watch('residentes') as number[]).includes(residente.id)))
                                        .map(residente => (
                                            <option key={residente.id} value={residente.id}>
                                                {residente.nome}
                                            </option>
                                        ))
                                    }
                                </select>

                                {/* Tags dos residentes selecionados */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(watch('residentes') as number[]).map((residenteId: number) => {
                                        const residente = residentes.find(r => r.id === residenteId);
                                        return (
                                            <span
                                                key={residenteId}
                                                className="bg-odara-secondary text-white px-3 py-1 rounded-full text-xs font-medium flex items-center"
                                            >
                                                {residente?.nome}
                                                <button
                                                    type="button"
                                                    onClick={() => removerResidente(residenteId)}
                                                    className="ml-2 text-odara-primary hover:text-odara-contorno"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>

                                {errors.residentes && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.residentes.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Nome da Atividade *
                                </label>
                                <input
                                    {...register('nome')}
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    placeholder="Digite o nome da atividade"
                                />
                                {errors.nome && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.nome.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Linha 2 - Categoria e Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Categoria *
                                </label>
                                <select
                                    {...register('categoria')}
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                >
                                    <option value="">Selecione uma categoria...</option>
                                    <option value="fisica">Física</option>
                                    <option value="cognitiva">Cognitiva</option>
                                    <option value="social">Social</option>
                                    <option value="criativa">Criativa</option>
                                    <option value="lazer">Lazer</option>
                                    <option value="terapeutica">Terapêutica</option>
                                    <option value="outra">Outra</option>
                                </select>
                                {errors.categoria && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <Info size={14} /> {errors.categoria.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Data da Atividade *
                                </label>
                                <input
                                    type="date"
                                    {...register('data')}
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                />
                                {errors.data && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.data.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Linha 3 - Horários */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Horário de Início
                                </label>
                                <input
                                    type="time"
                                    {...register('horario_inicio')}
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                />
                                {errors.horario_inicio && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.horario_inicio.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Horário de Fim
                                </label>
                                <input
                                    type="time"
                                    {...register('horario_fim')}
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                />
                            </div>
                        </div>

                        {/* Linha 4 - Local e Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Local
                                </label>
                                <input
                                    {...register('local')}
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    placeholder="Local onde ocorrerá a atividade"
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <label className="block text-medium text-odara-dark mb-2">
                                Observações
                            </label>
                            <textarea
                                {...register('observacao')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                rows={3}
                                placeholder="Observações importantes sobre a atividade"
                            />
                        </div>

                        {/* Ações */}
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
                                className="w-max px-6 py-2 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader className="animate-spin inline mr-2" size={16} />
                                        {atividade ? 'Salvando...' : 'Adicionando...'}
                                    </>
                                ) : (
                                    <>
                                        {atividade ? 'Salvar Alterações' : 'Adicionar Atividade'}
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

export default ModalAtividades;