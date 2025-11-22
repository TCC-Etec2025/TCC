import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { supabase } from "../../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

type Ocorrencia = {
    id: number;
    titulo: string;
    descricao?: string | null;
    providencias?: string | null;
    data: string;
    residente: ResidenteFuncionario;
    funcionario: ResidenteFuncionario;
    categoria: string;
    resolvido: boolean;
    criado_em?: string | null;
};
type ResidenteFuncionario = { id: number; nome: string };
type ModalOcorrenciasProps = {
    ocorrencia: Ocorrencia | null;
    isOpen: boolean;
    onClose: () => void;
};

const schema = yup.object({
    id: yup.number().nullable(),
    titulo: yup.string().required("Título é obrigatório"),
    data: yup.string().required("Data é obrigatória"),
    hora: yup.string().required("Hora é obrigatória"),
    descricao: yup.string().nullable(),
    providencias: yup.string().nullable(),
    id_residente: yup.number().required("Residente é obrigatório"),
    id_funcionario: yup.number().required("Funcionário é obrigatório"),
    categoria: yup.string().required("Categoria é obrigatória")
}).required();
type FormValues = yup.InferType<typeof schema>;

const ModalOcorrencias = ({ ocorrencia, isOpen, onClose }: ModalOcorrenciasProps) => {
    const [residentes, setResidentes] = useState<ResidenteFuncionario[]>([]);
    const [funcionarios, setFuncionarios] = useState<ResidenteFuncionario[]>([]);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: null,
            titulo: "",
            descricao: "",
            providencias: "",
            data: new Date().toISOString().split("T")[0], // YYYY-MM-DD
            hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            id_residente: 0,
            id_funcionario: 0,
            categoria: ""
        },
    });

    useEffect(() => {
        const fetchResidentes = async () => {
            const { data, error } = await supabase
                .from("residente")
                .select("id, nome")
                .order("nome", { ascending: true });
            if (error) {
                console.error("Erro ao buscar residentes:", error);
            } else {
                setResidentes(data || []);
            }
        };

        const fetchFuncionarios = async () => {
            const { data, error } = await supabase
                .from("funcionario")
                .select("id, nome")
                .order("nome", { ascending: true });
            if (error) {
                console.error("Erro ao buscar funcionários:", error);
            } else {
                setFuncionarios(data || []);
            }
        };
        reset({
            id: ocorrencia ? ocorrencia.id : null,
            titulo: ocorrencia ? ocorrencia.titulo : "",
            descricao: ocorrencia ? ocorrencia.descricao || "" : "",
            providencias: ocorrencia ? ocorrencia.providencias || "" : "",
            data: ocorrencia ? new Date(ocorrencia.data).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            hora: ocorrencia ? new Date(ocorrencia.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            id_residente: ocorrencia ? ocorrencia.residente.id : 0,
            id_funcionario: ocorrencia ? ocorrencia.funcionario.id : 0,
            categoria: ocorrencia ? ocorrencia.categoria : ""
        });

        fetchResidentes();
        fetchFuncionarios();
    }, [ocorrencia, reset, isOpen]);

    const onSubmit = async (values: FormValues) => {
        try {
            const id = ocorrencia?.id;
            const data = {
                titulo: values.titulo,
                descricao: values.descricao,
                providencias: values.providencias,
                id_residente: values.id_residente,
                id_funcionario: values.id_funcionario,
                categoria: values.categoria,
                data: new Date(`${values.data}T${values.hora}:00`).toISOString(),
            };

            if (id) {
                const { error } = await supabase
                    .from("ocorrencia")
                    .update(data)
                    .eq("id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("ocorrencia")
                    .insert(data);
                if (error) throw error;
            }
            onClose();
        } catch (err) {
            console.error("Erro ao salvar ocorrência:", err);
            alert("Erro ao salvar ocorrência. Veja o console.");
        }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">

                {/* HEADER */}
                <div className="bg-odara-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {ocorrencia ? "Editar Ocorrência" : "Nova Ocorrência"}
                        </h2>

                        <button
                            onClick={() => { onClose(); }}
                            className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <p className="text-odara-offwhite/80 mt-1 text-sm">
                        {ocorrencia
                            ? "Atualize as informações da ocorrência"
                            : "Preencha os dados para registrar uma nova ocorrência"}
                    </p>
                </div>

                {/* CORPO DO MODAL */}
                <div className="p-6 bg-odara-offwhite/30 max-h-[70vh] overflow-y-auto">

                    {/* FORM */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* TÍTULO */}
                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Título
                            </label>
                            <input
                                type="text"
                                placeholder="Título"
                                className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                {...register("titulo")}
                            />
                            {errors.titulo && (
                                <p className="text-red-500 text-sm">
                                    {(errors.titulo).message}
                                </p>
                            )}
                        </div>

                        {/* DESCRIÇÃO */}
                        <label className="block text-sm font-semibold text-odara-dark mb-2">
                            Descrição
                        </label>
                        <textarea
                            placeholder="Descrição"
                            className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                            {...register("descricao")}
                        />

                        {/* PROVIDÊNCIAS */}
                        <label className="block text-sm font-semibold text-odara-dark mb-2">
                            Providências
                        </label>
                        <textarea
                            placeholder="Providências"
                            className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                            {...register("providencias")}
                        />

                        {/* DATA + HORA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                    {...register("data")}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-2">
                                    Hora
                                </label>

                                <input
                                    type="time"
                                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                    {...register("hora")}
                                />
                            </div>
                            {errors.data && (
                                <p className="text-red-500 text-sm">
                                    {(errors.data).message}
                                </p>
                            )}
                        </div>

                        {/* RESIDENTE + FUNCIONÁRIO */}
                        <div className="flex flex-col gap-3">
                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Residente
                            </label>
                            <select
                                className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                {...register("id_residente")}
                            >
                                <option value="">Selecionar Residente</option>
                                {residentes.map((r) => (
                                    <option key={String(r.id)} value={String(r.id)}>
                                        {r.nome}
                                    </option>
                                ))}
                            </select>

                            <label className="block text-sm font-semibold text-odara-dark mb-2">
                                Funcionário
                            </label>

                            <select
                                className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                {...register("id_funcionario")}
                            >
                                <option value="">Selecionar Funcionário</option>
                                {funcionarios.map((f) => (
                                    <option key={String(f.id)} value={String(f.id)}>
                                        {f.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* CATEGORIA */}
                        <label className="block text-sm font-semibold text-odara-dark mb-2">
                            categoria
                        </label>
                        <select
                            className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                            {...register("categoria")}
                        >
                            <option value="">Selecionar Categoria</option>
                            <option value="acidente">Acidente</option>
                            <option value="saude">Saúde</option>
                            <option value="estrutural">Estrutural</option>
                        </select>

                        {/* BOTÕES */}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-4 border-odara-primary border py-2 rounded-lg text-odara-primary hover:text-odara-white hover:bg-odara-primary"
                                onClick={() => { onClose(); }}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="px-4 py-2 bg-odara-accent hover:bg-odara-secondary text-odara-white rounded-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Salvando..." : "Salvar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default ModalOcorrencias;