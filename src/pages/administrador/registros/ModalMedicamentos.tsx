import { useState, useEffect } from 'react';
import 'react-calendar/dist/Calendar.css';
import { FaPlus, FaTimes, FaExclamationCircle, FaSpinner, FaSave } from 'react-icons/fa';

import toast, { Toaster } from 'react-hot-toast';
import 'react-calendar/dist/Calendar.css';

import { supabase } from '../../../lib/supabaseClient';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

type Residente = {
    id: number;
    nome: string;
    quarto?: string | null;
};

type Medicamento = {
    id: number;
    nome: string;
    dosagem: string;
    dose: string;
    data_inicio: string; // YYYY-MM-DD
    horario_inicio: string; // HH:MM
    data_fim?: string | null;
    recorrencia: string;
    intervalo: number;
    id_residente: number;
    efeitos_colaterais?: string | null;
    observacao?: string | null;
    saude_relacionada?: string | null;
    foto?: string | null;
    status: string;
    criado_em?: string;
    residente?: Residente | null;
};

const RECORRENCIA_ROTULOS: Record<string, string> = {
  unico: 'único',
  horas: 'horas',
  dias: 'dias',
  meses: 'meses',
  vezes: 'vezes'
};

const schema = yup.object({
    id: yup.number().nullable(),
    nome: yup.string().required('Nome do medicamento é obrigatório'),
    dosagem: yup.string().required('Dosagem é obrigatória'),
    dose: yup.string().required('Dose é obrigatória'),
    data_inicio: yup.string().required('Data de início é obrigatória'),
    horario_inicio: yup.string().required('Horário de início é obrigatório'),
    data_fim: yup.string().nullable(),
    recorrencia: yup.string().required('Recorrência é obrigatória'),
    intervalo: yup.number().required('Intervalo é obrigatório').min(1, 'Intervalo deve ser ao menos 1'),
    efeitos_colaterais: yup.string().nullable(),
    observacao: yup.string().nullable(),
    saude_relacionada: yup.string().nullable(),
    foto: yup.string().nullable(),
    id_residente: yup.number().required('Residente é obrigatório')
}).required();

type FormValues = yup.InferType<typeof schema>;

type ModalMedicamentosProps = {
    medicamento: Medicamento | null;
    isOpen: boolean;
    onClose: () => void;
};

const ModalMedicamentos = ({
    medicamento,
    isOpen,
    onClose
}: ModalMedicamentosProps) => {

    const [residentes, setResidentes] = useState<Residente[]>([]);

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
            nome: '',
            dosagem: '',
            dose: '',
            data_inicio: new Date().toISOString().split('T')[0],
            horario_inicio: '',
            data_fim: '',
            recorrencia: '',
            intervalo: 1,
            id_residente: 0,
            efeitos_colaterais: '',
            observacao: '',
            saude_relacionada: '',
            foto: ''
        }
    });

    useEffect(() => {

        const fetchResidentes = async () => {
            const { data, error } = await supabase
                .from('residente')
                .select('id, nome, quarto')
                .order('nome', { ascending: true });
            if (error) {
                console.error('Erro ao carregar residentes:', error);
                return;
            }
            setResidentes(data || []);
        };

        fetchResidentes();
        reset({
            id: medicamento ? medicamento.id : null,
            nome: medicamento ? medicamento.nome : '',
            dosagem: medicamento ? medicamento.dosagem : '',
            dose: medicamento ? medicamento.dose : '',
            data_inicio: medicamento ? medicamento.data_inicio : new Date().toISOString().split('T')[0],
            horario_inicio: medicamento ? medicamento.horario_inicio : '',
            data_fim: medicamento ? medicamento.data_fim : '',
            recorrencia: medicamento ? medicamento.recorrencia : '',
            intervalo: medicamento ? medicamento.intervalo : 1,
            id_residente: medicamento ? medicamento.id_residente : 0,
            efeitos_colaterais: medicamento ? medicamento.efeitos_colaterais : '',
            observacao: medicamento ? medicamento.observacao : '',
            saude_relacionada: medicamento ? medicamento.saude_relacionada : '',
            foto: medicamento ? medicamento.foto : ''
        });
    }, [medicamento, reset, isOpen]);

    const onSubmit = async (values: FormValues) => {
        try {
            const id = Number(values.id);

            const data = {
                nome: values.nome,
                dosagem: values.dosagem,
                dose: values.dose,
                data_inicio: values.data_inicio,
                horario_inicio: values.horario_inicio,
                data_fim: values.data_fim || null,
                recorrencia: values.recorrencia,
                intervalo: Number(values.intervalo),
                id_residente: Number(values.id_residente),
                efeitos_colaterais: values.efeitos_colaterais || null,
                observacao: values.observacao || null,
                saude_relacionada: values.saude_relacionada || null,
                foto: values.foto || null
            };

            if (id) {
                const { error } = await supabase
                    .from('medicamento')
                    .update(data)
                    .eq('id', id);

                if (error) throw error;
                toast.success('Medicamento atualizado com sucesso!'); // NOTIFICAÇÃO DE SUCESSO
            } else {
                const { error } = await supabase
                    .from('medicamento')
                    .insert(data);

                if (error) throw error;
                toast.success('Medicamento criado com sucesso!'); // NOTIFICAÇÃO DE SUCESSO
            }
            setTimeout(() => { onClose(); }, 500);
        } catch (err) {
            console.error('Erro ao salvar medicamento:', err);
            toast.error("Erro ao salvar medicamento."); // NOTIFICAÇÃO DE ERRO
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
                            {medicamento ? 'Editar Medicamento' : 'Novo Medicamento'}
                        </h2>
                        <button
                            onClick={() => { onClose(); }}
                            className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <p className="text-odara-offwhite/80 mt-1 text-sm">
                        {medicamento ? 'Atualize as informações do medicamento' : 'Preencha os dados para adicionar um novo medicamento'}
                    </p>
                </div>

                {/* Corpo do Modal */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <input type="hidden" {...register('id')} />
                        {/* Linha 1 - Nome e Dosagem */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Nome do Medicamento *
                                </label>
                                <input
                                    {...register('nome')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="Digite o nome do medicamento"
                                />
                                {errors.nome && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.nome.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Linha 2 - Dose e Residente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Dosagem *
                                </label>
                                <input
                                    {...register('dosagem')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="Ex: 50mg, 100ml"
                                />
                                {errors.dosagem && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.dosagem.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Dose *
                                </label>
                                <input
                                    {...register('dose')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="Ex: 1 comprimido, 2 gotas"
                                />
                                {errors.dose && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.dose.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Linha 3 - Datas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Data Início *
                                </label>
                                <input
                                    type="date"
                                    {...register('data_inicio')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                />
                                {errors.data_inicio && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.data_inicio.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    {...register('data_fim')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                />
                                <p className="text-xs text-odara-name mt-1">Deixe em branco para uso contínuo</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Horário Início *
                                </label>
                                <input
                                    type="time"
                                    {...register('horario_inicio')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                />
                                {errors.horario_inicio && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <FaExclamationCircle /> {errors.horario_inicio.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Linha 4 - Recorrência e Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tipo */}
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Recorrência *
                                </label>
                                <select
                                    {...register('recorrencia', {
                                        onChange: (e) => {
                                            const v = e.target.value;
                                            // se for 'unico', força intervalo = 1; caso contrário, mantém intervalo atual
                                            if (v === 'unico') {
                                                reset({ ...watch(), recorrencia: v, intervalo: 1 });
                                            } else {
                                                reset({ ...watch(), recorrencia: v });
                                            }
                                        }
                                    })}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary"
                                >
                                    <option value="">Selecione o tipo</option>
                                    <option value="unico">Único</option>
                                    <option value="horas">Horas</option>
                                    <option value="dias">Dias</option>
                                    <option value="meses">Meses</option>
                                    <option value="vezes">Número de vezes</option>
                                </select>
                            </div>

                            {/* Quantidade */}
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    {watch('recorrencia') === 'vezes' ? 'Total de vezes' : 'Intervalo'} *
                                </label>
                                {/* input + rótulo do tipo ao final */}
                                <div className="relative">
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="1"
                                            {...register('intervalo', { valueAsNumber: true })}
                                            disabled={!watch('recorrencia') || watch('recorrencia') === 'unico'}
                                            className={`w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary transition-colors duration-200 pr-24 ${(!watch('recorrencia') || watch('recorrencia') === 'unico') ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        />
                                        <span className={`absolute right-3 text-sm text-odara-name whitespace-nowrap bg-white px-2 py-1 rounded-md ${watch('recorrencia') === 'unico' ? 'hidden' : ''}`}>
                                            {watch('recorrencia') ? RECORRENCIA_ROTULOS[watch('recorrencia')] : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Campos de Texto Grandes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Efeitos Colaterais
                                </label>
                                <textarea
                                    {...register('efeitos_colaterais')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    rows={3}
                                    placeholder="Descreva os possíveis efeitos colaterais..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Observações
                                </label>
                                <textarea
                                    {...register('observacao')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    rows={3}
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </div>

                        {/* Campos Individuais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Saúde Relacionada
                                </label>
                                <input
                                    {...register('saude_relacionada')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="Condição de saúde relacionada"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Foto (URL do Storage)
                                </label>
                                <input
                                    {...register('foto')}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-odara-primary focus:ring-2 focus:ring-odara-primary/20 transition-colors duration-200"
                                    placeholder="public/medicamentos/exemplo.jpg"
                                />
                                <p className="text-xs text-odara-name mt-1">Caminho no storage onde a foto está salva</p>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => { onClose(); }}
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
                                        {medicamento ? 'Salvando...' : 'Adicionando...'}
                                    </>
                                ) : (
                                    <>
                                        {medicamento ? <FaSave /> : <FaPlus />}
                                        {medicamento ? 'Salvar Alterações' : 'Adicionar Medicamento'}
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

export default ModalMedicamentos;