import React, { useEffect, useState } from 'react';
import { X, Save, Plus, Loader, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';

import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { supabase } from '../../../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

import { useUser } from '../../../context/UserContext';

/* Tipos */
type Residente = {
    id: number;
    nome: string;
    quarto?: string | null;
};

type RegistroAlimentar = {
    id: number;
    data: string;
    horario: string;
    refeicao: string;
    alimento: string;
    id_residente: number;
    id_funcionario: number;
    observacao?: string; // Adicionado
    concluido?: boolean;
    criado_em?: string;
    atualizado_em?: string;
    residente?: Residente;
};

/* Props do Modal */
type ModalAlimentarProps = {
    alimentar: RegistroAlimentar | null;
    isOpen: boolean;
    onClose: () => void;
};

/* Constantes */
const REFEICOES = {
    'cafe-da-manha': 'Café da manhã',
    'lanche-manha': 'Lanche da manhã',
    'almoco': 'Almoço',
    'lanche-tarde': 'Lanche da tarde',
    'jantar': 'Jantar',
    'ceia': 'Ceia'
} as const;

/* Schema de Validação - atualizado com observacao */
const schema = yup.object({
    id: yup.number().nullable(),
    id_residente: yup.number()
        .required('Residente é obrigatório')
        .min(1, 'Selecione um residente'),
    data: yup.string().required('Data é obrigatória'),
    horario: yup.string().required('Horário é obrigatório'),
    refeicao: yup.string().required('Refeição é obrigatória'),
    alimento: yup.string().required('Alimento é obrigatório'),
    observacao: yup.string().optional(), // Campo opcional
    id_funcionario: yup.number()
        .required('Funcionário é obrigatório')
        .min(1, 'Funcionário inválido')
}).required();

/* Tipo do Formulário - atualizado com observacao */
interface FormValues {
    id?: number | null;
    id_residente: number;
    data: string;
    horario: string;
    refeicao: string;
    alimento: string;
    observacao?: string; // Adicionado
    id_funcionario: number;
}

/* Componente Principal */
const ModalAlimentar: React.FC<ModalAlimentarProps> = ({
    alimentar,
    isOpen,
    onClose
}) => {
    const [residentes, setResidentes] = useState<Residente[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { usuario } = useUser();

    /* Configuração do Formulário */
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            id: null,
            id_residente: 0,
            data: new Date().toISOString().split('T')[0],
            horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }),
            refeicao: '',
            alimento: '',
            observacao: '', // Valor padrão
            id_funcionario: usuario?.id || 0
        }
    });

    /* Efeito para carregar residentes e resetar formulário */
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

            // Resetar formulário com dados do registro alimentar ou valores padrão
            if (alimentar) {
                // Extrair horario da string de data
                let horario = "";
                try {
                    const dataObj = new Date(alimentar.data);
                    horario = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
                } catch {
                    horario = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
                }
                reset({
                    id: alimentar.id,
                    id_residente: alimentar.id_residente,
                    data: alimentar.data,
                    horario: horario,
                    refeicao: alimentar.refeicao,
                    alimento: alimentar.alimento,
                    observacao: alimentar.observacao || '', // Adicionado
                    id_funcionario: usuario?.id || 0
                });
            } else {
                reset({
                    id: null,
                    id_residente: 0,
                    data: new Date().toISOString().split('T')[0],
                    horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    refeicao: '',
                    alimento: '',
                    observacao: '', // Valor padrão
                    id_funcionario: usuario?.id || 0
                });
            }
        }
    }, [alimentar, reset, isOpen, usuario]);

    /* Handler para submit do formulário */
    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);

        try {
            const payload = {
                id_residente: values.id_residente,
                data: values.data,
                horario: values.horario,
                refeicao: values.refeicao,
                alimento: values.alimento,
                observacao: values.observacao || null, // Adicionado
                id_funcionario: values.id_funcionario
            };

            console.log("Dados sendo enviados:", payload);

            if (values.id) {
                // Atualizar registro existente
                const { error } = await supabase
                    .from('registro_alimentar')
                    .update(payload)
                    .eq('id', values.id);

                if (error) throw error;
                toast.success('Registro alimentar atualizado com sucesso!');
            } else {
                // Criar novo registro
                const { error } = await supabase
                    .from('registro_alimentar')
                    .insert(payload);

                if (error) throw error;
                toast.success('Registro alimentar criado com sucesso!');
            }

            setTimeout(() => {
                onClose();
            }, 500);

            // Fechar o modal imediatamente após sucesso
            onClose();
        } catch (err: any) {
            console.error('Erro ao salvar registro alimentar:', err);
            toast.error('Erro ao salvar registro alimentar');
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
                <div className="border-b-1 border-odara-primary bg-odara-primary/70 text-odara-accent p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {alimentar ? 'Editar Registro Alimentar' : 'Novo Registro Alimentar'}
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
                        {alimentar
                            ? "Atualize as informações do registro alimentar"
                            : "Preencha os dados para registrar a alimentação do residente"}
                    </p>
                </div>

                {/* Corpo do Modal */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <input type="hidden" {...register('id')} />
                        <input type="hidden" {...register('id_funcionario')} />

                        {/* Linha 1 - Residente */}
                        <div>
                            <label className="block text-medium text-odara-dark mb-2 flex items-center gap-1">
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

                        {/* Linha 2 - Data, Horário e Refeição */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2 flex items-center gap-1">
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
                                <label className="block text-medium text-odara-dark mb-2 flex items-center gap-1">
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
                                <label className="block text-medium text-odara-dark mb-2 flex items-center gap-1">
                                    Refeição *
                                </label>
                                <select
                                    {...register('refeicao')}
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                                >
                                    <option value="">Selecione uma refeição...</option>
                                    {Object.entries(REFEICOES).map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                                {errors.refeicao && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <Info size={14} /> {errors.refeicao.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Alimentos */}
                        <div>
                            <label className="block text-medium text-odara-dark mb-2 flex items-center gap-1">
                                Alimentos *
                            </label>
                            <textarea
                                placeholder="Descreva os alimentos da refeição..."
                                rows={3}
                                {...register('alimento')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                            />
                            {errors.alimento && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                    <Info size={14} /> {errors.alimento.message}
                                </p>
                            )}
                        </div>

                        {/* Observações - NOVO CAMPO */}
                        <div>
                            <label className="block text-medium text-odara-dark mb-2 flex items-center gap-1">
                                Observações
                            </label>
                            <textarea
                                placeholder="Observações adicionais sobre a refeição (opcional)..."
                                rows={2}
                                {...register('observacao')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Informações complementares sobre a refeição, aceitação, comportamento, etc.
                            </p>
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
                                        {alimentar ? 'Salvando...' : 'Registrando...'}
                                    </>
                                ) : (
                                    <>
                                        {alimentar ? <Save size={16} /> : <Plus size={16} />}
                                        {alimentar ? 'Salvar Alterações' : 'Registrar Alimentação'}
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

export default ModalAlimentar;