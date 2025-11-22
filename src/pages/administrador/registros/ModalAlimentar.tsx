import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { supabase } from "../../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { useUser } from "../../../context/UserContext";

type RegistroAlimentar = {
    id: number;
    data: string;
    horario: string;
    refeicao: string;
    alimento: string;
    id_residente: number;
    id_funcionario: number;
    concluido?: boolean;
};

type Residente = { id: number; nome: string };

const refeicoes = {
  "cafe-da-manha": "Café da manhã",
  "lanche-manha": "Lanche manhã",
  "almoco": "Almoço",
  "lanche-tarde": "Lanche tarde",
  "jantar": "Jantar",
  "ceia": "Ceia"
};

const schema = yup
    .object({
        id: yup.number().nullable(),
        data: yup.string().required("Data é obrigatória"),
        horario: yup.string().required("Horário é obrigatório"),
        refeicao: yup.string().required("Refeição é obrigatória"),
        alimento: yup.string().required("Alimento é obrigatório"),
        id_residente: yup
            .number()
            .required("Residente é obrigatório")
            .min(1, "Selecione um residente"),
        id_funcionario: yup
            .number()
            .required("Funcionário é obrigatório")
            .min(1, "Selecione um funcionário"),
        concluido: yup.boolean().default(false),
    })
    .required();

type FormValues = yup.InferType<typeof schema>;

type ModalAlimentarProps = {
    alimentar: RegistroAlimentar | null;
    isOpen: boolean;
    onClose: () => void;
};

const ModalAlimentar: React.FC<ModalAlimentarProps> = ({
    alimentar,
    isOpen,
    onClose,
}) => {
    const [residentes, setResidentes] = useState<Residente[]>([]);
    const [loading, setLoading] = useState(false);
    const { usuario } = useUser();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: null,
            data: new Date().toISOString().split("T")[0],
            horario: "",
            refeicao: "",
            alimento: "",
            id_residente: 0,
            concluido: false,
        },
    });

    useEffect(() => {
        if (!isOpen) return;
        const carregar = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from("residente")
                    .select("id, nome")
                    .order("nome", { ascending: true });
                if (!error) setResidentes(data);
            } finally {
                setLoading(false);
            }
        };
        carregar();
    }, [isOpen]);

    useEffect(() => {
        if (alimentar && isOpen) {
            reset({
                id: alimentar.id,
                data: alimentar.data,
                horario: alimentar.horario,
                refeicao: alimentar.refeicao,
                alimento: alimentar.alimento,
                id_residente: alimentar.id_residente,
                id_funcionario: usuario?.id,
                concluido: alimentar.concluido ?? false,
            });
        } else if (isOpen) {
            reset({
                id: null,
                data: new Date().toISOString().split("T")[0],
                horario: "",
                refeicao: "",
                alimento: "",
                id_residente: 0,
                id_funcionario: 0,
                concluido: false,
            });
        }
    }, [alimentar, isOpen, reset, usuario]);

    const onSubmit = async (values: FormValues) => {
        try {
            const payload = {
                data: values.data,
                horario: values.horario,
                refeicao: values.refeicao,
                alimento: values.alimento,
                id_residente: values.id_residente,
                id_funcionario: values.id_funcionario,
                concluido: values.concluido,
            };

            if (values.id) {
                const { error } = await supabase
                    .from("registro_alimentar")
                    .update(payload)
                    .eq("id", values.id);
                if (error) throw error;
                toast.success("Registro alimentar atualizado.");
            } else {
                const { error } = await supabase
                    .from("registro_alimentar")
                    .insert(payload);
                if (error) throw error;
                toast.success("Registro alimentar criado.");
            }
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Falha ao salvar registro.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header do Modal */}
                <div className="bg-odara-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {alimentar ? "Editar Alimentação" : "Novo Registro Alimentar"}
                        </h2>

                        <button
                            onClick={onClose}
                            className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <p className="text-odara-offwhite/80 mt-1 text-sm">
                        {alimentar
                            ? "Atualize os dados do registro"
                            : "Preencha os campos para registrar alimentação"}
                    </p>
                </div>

                {/* Corpo do Modal */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <input type="hidden" {...register("id")} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-1">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    {...register("data")}
                                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                                />
                                {errors.data && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.data.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-1">
                                    Horário
                                </label>
                                <input
                                    type="time"
                                    {...register("horario")}
                                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                                />
                                {errors.horario && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.horario.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-1">
                                Refeição
                            </label>
                            <select
                                {...register("refeicao")}
                                className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                            >
                                <option value="">Selecione</option>
                                {Object.entries(refeicoes).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                            {errors.refeicao && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.refeicao.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-odara-dark mb-1">
                                Alimento
                            </label>
                            <input
                                type="text"
                                {...register("alimento")}
                                placeholder="Descreva os alimentos"
                                className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                            />
                            {errors.alimento && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.alimento.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-odara-dark mb-1">
                                    Residente
                                </label>
                                <select
                                    {...register("id_residente")}
                                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none"
                                >
                                    <option value={0}>Selecione</option>
                                    {residentes.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.nome}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_residente && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.id_residente.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border-2 border-odara-primary text-odara-primary rounded-lg hover:bg-odara-primary hover:text-white transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-odara-accent text-white rounded-lg hover:bg-odara-secondary transition disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? "Salvando..."
                                    : alimentar
                                        ? "Atualizar"
                                        : "Salvar"}
                            </button>
                        </div>
                    </form>

                    {loading && (
                        <div className="mt-4 text-xs text-gray-500">Carregando listas...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalAlimentar;