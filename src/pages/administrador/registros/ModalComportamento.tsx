// src/pages/RegistroComportamento.tsx
import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { supabase } from "../../../lib/supabaseClient";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useUser } from "../../../context/UserContext";

type Residente = {
    id: number;
    nome: string;
};

type Comportamento = {
    id: number;
    titulo: string;
    descricao?: string | null;
    data: Date;
    horario: string;
    id_residente: number | null;
    residente: Residente;
    id_funcionario: number | null;
    funcionario: Residente;
    categoria: string;
    status: boolean;
    criado_em?: string | null;
};

// ===== VALIDAÇÃO YUP =====
const schema = yup
    .object({
        id: yup.number().nullable(),
        titulo: yup.string().required("Título é obrigatório"),
        data: yup.string().required("Data é obrigatória"),
        horario: yup.string().required("Horário é obrigatório"),
        descricao: yup.string().nullable(),
        id_residente: yup.number().required("Residente é obrigatório"),
        categoria: yup.string().required("Categoria é obrigatória"),
    })
    .required();
type FormValues = yup.InferType<typeof schema>;

type ModalComportamentoProps = {
    comportamento: Comportamento | null;
    isOpen: boolean;
    onClose: () => void;
};

// ===== COMPONENTE =====
const ModalComportamento: React.FC<ModalComportamentoProps> = ({
    comportamento,
    isOpen,
    onClose,
}) => {
    const [residentes, setResidentes] = useState<Residente[]>([]);
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
            titulo: "",
            descricao: "",
            data: new Date().toISOString().split("T")[0],
            horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            id_residente: 0,
            categoria: ""
        },
    });

    useEffect(() => {

    const fetchResidentes = async () => {
        try {
            const { data, error } = await supabase
                .from("residente")
                .select("id, nome")
                .order("nome");
            if (error) throw error;
            if (data) setResidentes(data);
        } catch (err) {
            console.error("Erro ao buscar residentes:", err);
        }
    };
        fetchResidentes();
        reset({
            id: comportamento?.id || null,
            titulo: comportamento?.titulo || "",
            descricao: comportamento?.descricao || "",
            data: comportamento
                ? comportamento.data.toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            horario: comportamento?.horario || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            id_residente: comportamento?.id_residente || 0,
            categoria: comportamento?.categoria || ""
        })
    }, [comportamento, reset, isOpen]);

    const onSubmit = async (formData: FormValues) => {
        try {
            const id = formData.id;
            const data = {
                titulo: formData.titulo,
                descricao: formData.descricao,
                data: formData.data,
                horario: formData.horario,
                categoria: formData.categoria,
                id_residente: formData.id_residente,
                id_funcionario: usuario?.id,
            };

            if (id) {
                // atualizar
                const { error } = await supabase
                    .from("comportamento")
                    .update(data)
                    .eq("id", id);
                if (error) throw error;
            } else {
                // inserir
                const { error } = await supabase
                    .from("comportamento")
                    .insert(data);
                if (error) throw error;
            }
            onClose();
        } catch (err) {
            console.error("Erro ao salvar comportamento:", err);
            alert("Erro ao salvar comportamento. Veja o console.");
        }
    };
    if (!isOpen) return null;

    // Render
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col relative">

                {/* Header do Modal */}
                <div className="bg-odara-primary text-white p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {comportamento ? "Editar Registro de Comportamento" : "Novo Registro de Comportamento"}
                        </h2>

                        {/* Botão fechar */}
                        <button
                            onClick={() => { onClose(); }}
                            className="text-white hover:text-odara-offwhite transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <p className="text-odara-offwhite/80 mt-1 text-sm">
                        {comportamento
                            ? "Atualize as informações do comportamento"
                            : "Preencha os dados para registrar o comportamento"}
                    </p>
                </div>

                {/* Corpo */}
                <div className="flex-1 overflow-y-auto p-6 bg-odara-offwhite/30">

                    {/* Form principal */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Título */}
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-odara-dark">Título</label>
                            <input
                                {...register("titulo")}
                                className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                placeholder="Ex: Comportamento cooperativo"
                            />
                            {errors.titulo && (
                                <p className="text-red-500 text-xs mt-1">
                                    {String(errors.titulo.message)}
                                </p>
                            )}
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-odara-dark">Descrição</label>
                            <textarea
                                {...register("descricao")}
                                rows={3}
                                className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                placeholder="Descreva o comportamento observado..."
                            />
                        </div>

                        {/* Data + Horário */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-odara-dark">Data</label>
                                <input
                                    type="date"
                                    {...register("data")}
                                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-odara-dark">Horário</label>
                                <input
                                    type="time"
                                    {...register("horario")}
                                    className="w-full border border-odara-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-odara-primary focus:outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Residente */}
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-odara-dark">Residente *</label>
                            <select
                                {...register("id_residente")}
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg bg-white text-odara-secondary focus:ring-2 focus:ring-odara-primary"
                                required
                            >
                                <option value="">Selecione um residente</option>
                                {residentes.map((r) => (
                                    <option key={r.id} value={r.id}>{r.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-odara-dark">Categoria *</label>
                            <select
                                {...register("categoria")}
                                required
                                className="w-full px-4 py-2 border border-odara-primary rounded-lg bg-white text-odara-secondary focus:ring-2 focus:ring-odara-primary"
                            >
                                <option value="">Selecionar categoria</option>
                                <option value="Positivo">Positivo</option>
                                <option value="Negativo">Negativo</option>
                                <option value="Neutro">Neutro</option>
                            </select>
                        </div>

                        {/* Botões */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-odara-primary/30">
                            <button
                                type="button"
                                onClick={() => { onClose(); }}
                                className="px-4 py-2 rounded-lg border border-odara-primary bg-odara-white hover:bg-odara-primary text-odara-primary hover:text-odara-white font-medium transition"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-lg bg-odara-accent hover:bg-odara-secondary text-white text-sm font-medium transition"
                            >
                                {comportamento ? "Salvar Alterações" : "Registrar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    );
};

export default ModalComportamento;
