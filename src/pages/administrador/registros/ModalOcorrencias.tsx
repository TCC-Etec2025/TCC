import { useEffect, useState } from "react";
import { X, Loader, Info } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast, { Toaster } from "react-hot-toast";

/* Tipos */
type ResidenteFuncionario = {
    id: number;
    nome: string;
    quarto?: string | null;
};

type Ocorrencia = {
    id: number;
    titulo: string;
    descricao?: string | null;
    providencias?: string | null;
    data: string;
    residente: ResidenteFuncionario | null;
    funcionario: ResidenteFuncionario;
    categoria: string;
    status: boolean;
    criado_em?: string | null;
    horario?: string | null; // Adicionado para compatibilidade com o banco
};

type ModalOcorrenciasProps = {
    ocorrencia: Ocorrencia | null;
    isOpen: boolean;
    onClose: () => void;
};

/* Schema de Validação */
const schema = yup.object({
    id: yup.number().nullable(),
    titulo: yup.string().required("Título é obrigatório"),
    data: yup.string().required("Data é obrigatória"),
    hora: yup.string().required("Hora é obrigatória"),
    descricao: yup.string().required("Descrição é obrigatória"),
    providencias: yup.string().nullable(),
    id_residente: yup.number().nullable(),
    id_funcionario: yup.number()
        .required("Funcionário é obrigatório")
        .min(1, "Funcionário é obrigatório"),
    categoria: yup.string().required("Categoria é obrigatória")
}).required();

// Definir explicitamente o tipo FormValues
interface FormValues {
    id?: number | null;
    titulo: string;
    data: string;
    hora: string;
    descricao?: string | null;
    providencias?: string | null;
    id_residente?: number | null;
    id_funcionario: number;
    categoria: string;
}

const CATEGORIAS = [
    { value: 'acidente', label: 'Acidente' },
    { value: 'clinico', label: 'Clínico' },
    { value: 'estrutural', label: 'Estrutural' },
    { value: 'comportamental', label: 'Comportamental' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'juridico', label: 'Jurídico' },
    { value: 'social', label: 'Social' },
    { value: 'seguranca', label: 'Segurança' }
];

const ModalOcorrencias = ({ ocorrencia, isOpen, onClose }: ModalOcorrenciasProps) => {
    const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
    const [funcionarios, setFuncionarios] = useState<ResidenteFuncionario[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: null,
            titulo: "",
            descricao: "",
            providencias: "",
            data: new Date().toISOString().split("T")[0],
            hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            id_residente: 0,
            id_funcionario: 0,
            categoria: ""
        },
    });

    /* Carregar residentes e funcionários */
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Carregar residentes
                const { data: residentesData, error: residentesError } = await supabase
                    .from("residente")
                    .select("id, nome, quarto")
                    .order("nome", { ascending: true });

                if (residentesError) throw residentesError;
                setResidentes(residentesData || []);

                // Carregar funcionários
                const { data: funcionariosData, error: funcionariosError } = await supabase
                    .from("funcionario")
                    .select("id, nome")
                    .order("nome", { ascending: true });

                if (funcionariosError) throw funcionariosError;
                setFuncionarios(funcionariosData || []);

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                toast.error("Erro ao carregar dados");
            }
        };

        if (isOpen) {
            fetchData();

            // Resetar formulário com dados da ocorrência ou valores padrão
            if (ocorrencia) {
                // Extrair hora da string de data
                let hora = "";
                try {
                    const dataObj = new Date(ocorrencia.data);
                    hora = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                } catch {
                    hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                }

                reset({
                    id: ocorrencia.id,
                    titulo: ocorrencia.titulo || "",
                    descricao: ocorrencia.descricao || "",
                    providencias: ocorrencia.providencias || "",
                    data: ocorrencia.data.includes('T')
                        ? ocorrencia.data.split('T')[0]
                        : new Date().toISOString().split("T")[0],
                    hora: hora,
                    id_residente: ocorrencia.residente?.id || 0,
                    id_funcionario: ocorrencia.funcionario?.id || 0,
                    categoria: ocorrencia.categoria || ""
                });
            } else {
                reset({
                    id: null,
                    titulo: "",
                    descricao: "",
                    providencias: "",
                    data: new Date().toISOString().split("T")[0],
                    hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    id_residente: 0,
                    id_funcionario: 0,
                    categoria: ""
                });
            }
        }
    }, [ocorrencia, reset, isOpen]);

    /* Handler de submit */
    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);

        try {
            // Formatar a data e hora corretamente
            const dataHora = `${values.data}T${values.hora}:00`;
            const dataISO = new Date(dataHora).toISOString();

            const dados = {
                titulo: values.titulo,
                descricao: values.descricao,
                providencias: values.providencias || null,
                id_residente: values.id_residente === 0 ? null : values.id_residente, // ← Corrigir: 0 para null
                id_funcionario: values.id_funcionario,
                categoria: values.categoria,
                data: dataISO,
                horario: values.hora
            };

            console.log("Dados sendo enviados:", dados);

            if (values.id) {
                // Atualizar ocorrência existente
                const { error } = await supabase
                    .from("ocorrencia")
                    .update(dados)
                    .eq("id", values.id);

                if (error) throw error;
                toast.success("Ocorrência atualizada com sucesso!");
            } else {
                // Criar nova ocorrência
                const { error } = await supabase
                    .from("ocorrencia")
                    .insert(dados);

                if (error) throw error;
                toast.success("Ocorrência criada com sucesso!");
            }

            setTimeout(() => {
                onClose();
            }, 500);

        } catch (err) {
            console.error("Erro detalhado ao salvar ocorrência:", err);
            toast.error("Erro ao salvar ocorrência");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-odara-offwhite/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
                            {ocorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}
                        </h2>

                        {/* Botão fechar */}
                        <button
                            onClick={onClose}
                            className="text-odara-accent transition-colors duration-200 p-1 rounded-full hover:text-odara-secondary"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-odara-white mt-1 text-sm">
                        {ocorrencia
                            ? "Atualize as informações da ocorrência"
                            : "Preencha os dados para registrar uma nova ocorrência"}
                    </p>
                </div>

                {/* Corpo do Modal */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <input type="hidden" {...register('id')} />

                        {/* Título da Ocorrência */}
                        <div>
                            <label className="block text-medium text-odara-dark mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                placeholder="Título da ocorrência"
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                {...register("titulo")}
                            />

                            {errors.titulo && (
                                <p className="text-sm text-red-600  flex items-center gap-1">
                                    <Info size={14} /> {errors.titulo.message}
                                </p>
                            )}
                        </div>

                        {/* Data e Hora */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Data *
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    {...register("data")}
                                />

                                {errors.data && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.data.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Hora *
                                </label>
                                <input
                                    type="time"
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    {...register("hora")}
                                />

                                {errors.hora && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.hora.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Residente e Funcionário */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Funcionário *
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    {...register("id_funcionario", { valueAsNumber: true })}
                                >
                                    <option value="0">Selecione um Funcionário...</option>
                                    {funcionarios.map((f) => (
                                        <option key={String(f.id)} value={String(f.id)}>
                                            {f.nome}
                                        </option>
                                    ))}
                                </select>

                                {errors.id_funcionario && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.id_funcionario.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Residente
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    {...register("id_residente", { valueAsNumber: true })}
                                >
                                    <option value="0">Selecione um Residente...</option>
                                    {residentes.map((r) => (
                                        <option key={String(r.id)} value={String(r.id)}>
                                            {r.nome} {r.quarto ? `(Q ${r.quarto})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Categoria */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-medium text-odara-dark mb-2">
                                    Categoria *
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                    {...register("categoria")}
                                >
                                    <option value="">Selecione uma Categoria...</option>
                                    {CATEGORIAS.map((categoria) => (
                                        <option key={categoria.value} value={categoria.value}>
                                            {categoria.label}
                                        </option>
                                    ))}
                                </select>

                                {errors.categoria && (
                                    <p className="text-sm text-red-600  flex items-center gap-1">
                                        <Info size={14} /> {errors.categoria.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-medium text-odara-dark mb-2">
                                Descrição *
                            </label>
                            <textarea
                                placeholder="Descreva a ocorrência..."
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                rows={3}
                                {...register("descricao")}
                            />

                            {errors.descricao && (
                                <p className="text-sm text-red-600  flex items-center gap-1">
                                    <Info size={14} /> {errors.descricao.message}
                                </p>
                            )}
                        </div>

                        {/* Providências */}
                        <div>
                            <label className="block text-medium text-odara-dark mb-2">
                                Providências
                            </label>
                            <textarea
                                placeholder="Providências tomadas..."
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg focus:border-transparent focus:outline-none focus:ring-odara-secondary focus:ring-2 text-odara-secondary text-sm sm:text-base mb-2"
                                rows={3}
                                {...register("providencias")}
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
                                className="w-max px-6 py-2 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader className="animate-spin inline mr-2" size={16} />
                                        {ocorrencia ? 'Salvando...' : 'Criando...'}
                                    </>
                                ) : (
                                    <>
                                        {ocorrencia ? 'Salvar Alterações' : 'Criar Ocorrência'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default ModalOcorrencias;