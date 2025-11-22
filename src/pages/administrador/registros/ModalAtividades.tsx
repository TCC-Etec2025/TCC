import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';


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
type Residente = {
    id: number;
    nome: string;
}
const schema = yup.object().shape({
    id: yup.number().nullable(),
    residentes: yup.array().of(yup.number()).min(1, 'Selecione ao menos um residente').required(),
    nome: yup.string().required('Nome da atividade é obrigatório'),
    categoria: yup.string().required(),
    data: yup.string().required('Data é obrigatória'),
    horario_inicio: yup.string(),
    horario_fim: yup.string(),
    observacao: yup.string(),
    local: yup.string(),
    status: yup.string().required()
});

type FormData = yup.InferType<typeof schema>;

type ModalAtividadesProps = {
    atividade: Atividade | null;
    isOpen: boolean;
    onClose: () => void;
};

const ModalAtividades = ({ atividade, isOpen, onClose }: ModalAtividadesProps) => {

    const [residentes, setResidentes] = useState<Residente[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: null,
            residentes: [],
            nome: '',
            categoria: '',
            data: (new Date()).toISOString().split('T')[0],
            horario_inicio: '',
            horario_fim: '',
            observacao: '',
            local: '',
            status: ''
        }
    });

    useEffect(() => {
        const fetchResidentes = async () => {
            const { data, error } = await supabase
                .from('residente')
                .select('id, nome')
                .order('nome', { ascending: true });

            if (error) {
                console.error('Erro ao buscar residentes:', error);
            } else {
                setResidentes(data || []);
            }
        };

        fetchResidentes();
        reset({
            id: atividade ? atividade.id : null,
            residentes: atividade ? atividade.residentes.map(r => r.id) : [],
            nome: atividade ? atividade.nome : '',
            categoria: atividade ? atividade.categoria : '',
            data: atividade ? atividade.data : (new Date()).toISOString().split('T')[0],
            horario_inicio: atividade ? atividade.horario_inicio : '',
            horario_fim: atividade ? atividade.horario_fim : '',
            observacao: atividade ? atividade.observacao : '',
            local: atividade ? atividade.local : '',
            status: atividade ? atividade.status : ''
        });
    }, [atividade, reset, isOpen]);

    const onSubmit = async (formData: FormData) => {

        const id = formData.id;
        const residentesInsert = formData.residentes || [];
        const dados = {
            nome: formData.nome,
            categoria: formData.categoria,
            data: formData.data,
            horario_inicio: formData.horario_inicio,
            horario_fim: formData.horario_fim,
            observacao: formData.observacao,
            local: formData.local,
            status: formData.status
        };

        try {
            if (id) {
                const { data, error } = await supabase
                    .from('atividade')
                    .update(dados)
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                if (data) {
                    const { error: deleteError } = await supabase
                        .from('atividade_residente')
                        .delete()
                        .eq('atividade', id);
                    if (deleteError) throw deleteError;
                    for (const residenteId of residentesInsert) {
                        const { error: insertError } = await supabase
                            .from('atividade_residente')
                            .insert({
                                id_atividade: data.id,
                                id_residente: residenteId
                            });
                        if (insertError) throw insertError;
                    }
                }
            } else {
                const { data, error } = await supabase
                    .from('atividade')
                    .insert(dados)
                    .select()
                    .single();
                if (error) throw error;
                if (data) {
                    for (const residenteId of residentesInsert) {
                        const { error: insertError } = await supabase
                            .from('atividade_residente')
                            .insert({
                                id_atividade: data.id,
                                id_residente: residenteId
                            });
                        if (insertError) throw insertError;
                    }
                }
            }
            console.log('Atividade (payload para o backend):', dados);
            onClose(); // fecha após salvar
        } catch (error) {
            console.error('Erro ao salvar atividade:', error);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-odara-offwhite/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 border-l-4 border-odara-primary max-h-[90vh] overflow-y-auto">
                {/* Cabeçalho do Modal */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-odara-accent">
                        {atividade ? 'Editar' : 'Adicionar'} Atividade
                    </h2>

                    {/* Botão fechar */}
                    <button
                        onClick={() => { onClose(); }}
                        className="text-odara-primary hover:text-odara-secondary transition-colors duration-200"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Formulário (react-hook-form) */}
                <div className="space-y-4">
                    {/* Linha 1: Residentes e Nome da Atividade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Residentes *</label>

                            {/* Campo de seleção de residentes (usa id agora) */}
                            <select
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base mb-2"
                                value={""}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (!isNaN(val)) {
                                        const atual = ((watch('residentes') || []) as number[]).map(r => Number(r));
                                        if (!atual.includes(val)) {
                                            reset({ ...watch(), residentes: [...atual, val] });
                                        }
                                    }
                                }}
                            >
                                <option value="">Selecione um residente...</option>
                                {residentes
                                    .filter(residente => !(((watch('residentes') || []) as number[]).map(r => Number(r)).includes(residente.id)))
                                    .map(residente => (
                                        <option key={residente.id} value={residente.id}>{residente.nome}</option>
                                    ))
                                }
                            </select>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {((watch('residentes') || []) as number[]).map((resId: number) => {
                                    const idNum = Number(resId);
                                    const residenteObj = residentes.find(r => r.id === idNum);
                                    const nomeExibicao = residenteObj?.nome;
                                    return (
                                        <span
                                            key={idNum}
                                            className="bg-odara-accent text-white px-3 py-1 rounded-full text-xs font-medium flex items-center"
                                        >
                                            {nomeExibicao}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const atual = ((watch('residentes') || []) as number[]).map(r => Number(r));
                                                    reset({ ...watch(), residentes: atual.filter((r: number) => r !== idNum) });
                                                }}
                                                className="ml-2 text-white hover:text-red-200"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </span>
                                    );
                                })
                                }
                            </div>

                            {/* Mensagem de validação */}
                            {errors.residentes && (
                                <p className="text-red-500 text-xs mt-1">{errors.residentes.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Nome da Atividade *</label>
                            <input
                                type="text"
                                {...register('nome')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                                placeholder="Nome da atividade"
                            />
                            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                        </div>
                    </div>

                    {/* Linha 2: Categoria e Período */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Categoria de Atividade</label>
                            <select
                                {...register('categoria')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                            >
                                <option value="fisica">Física</option>
                                <option value="cognitiva">Cognitiva</option>
                                <option value="social">Social</option>
                                <option value="criativa">Criativa</option>
                                <option value="lazer">Lazer</option>
                                <option value="terapeutica">Terapêutica</option>
                                <option value="outra">Outra</option>
                            </select>
                        </div>
                    </div>

                    {/* Linha 3: Data e Horário */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Data da Atividade *</label>
                            <input
                                type="date"
                                {...register('data')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                                placeholder="DD/MM/AAAA"
                            />
                            {errors.data && <p className="text-red-500 text-xs mt-1">{errors.data.message}</p>}
                        </div>

                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Horário de Início</label>
                            <input
                                type="time"
                                {...register('horario_inicio')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Horário de Fim</label>
                            <input
                                type="time"
                                {...register('horario_fim')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Linha 4: Duração e Local */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Local</label>
                            <input
                                type="text"
                                {...register('local')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                                placeholder="Local onde ocorrerá a atividade"
                            />
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-odara-dark font-medium mb-2">Observações</label>
                        <textarea
                            {...register('observacao')}
                            className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                            rows={3}
                            placeholder="Observações importantes sobre a atividade"
                        />
                    </div>

                    {/* Status */}
                    {atividade && (
                        <div>
                            <label className="block text-odara-dark font-medium mb-2">Status</label>
                            <select
                                {...register('status')}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-odara-secondary text-odara-secondary text-sm sm:text-base"
                            >
                                <option value="pendente">Pendente</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="concluida">Concluída</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={onClose}
                            type="button"
                            className="px-6 py-2 border border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary/10 transition-colors duration-200 text-sm sm:text-base"
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {atividade ? 'Salvar Alterações' : 'Adicionar Atividade'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAtividades;