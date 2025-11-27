import type { SubmitHandler } from "react-hook-form";
import { type PerfilUsuario, useUser } from "../../../../context/UserContext";
import { useEnderecoForm } from "../enderecoForm";
import type { FormEnderecoValues } from "../types";
import { removeFormatting } from "../../../../utils";
import { supabase } from "../../../../lib/supabaseClient";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatCEP } from "../../../../utils";

type Props = {
    usuario: PerfilUsuario;
    isEditing: boolean;
};

export default function EnderecoForm({ usuario, isEditing }: Props) {
    const { atualizarUsuario } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [cepAutoFill, setCepAutoFill] = useState(false);
    const [cepValor, setCepValor] = useState<string>(usuario?.endereco?.cep ?? "");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useEnderecoForm(usuario);

    const cepWatch = watch("cep", cepValor);

    useEffect(() => {
        const controller = new AbortController();

        const buscarCEP = async () => {
            const cepLimpo = String(cepWatch || "").replace(/\D/g, "");
            if (!isEditing) return; // só busca em modo edição
            if (cepLimpo.length !== 8) {
                setCepAutoFill(false);
                return;
            }

            try {
                const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, { signal: controller.signal });
                if (!resp.ok) {
                    setCepAutoFill(false);
                    return;
                }
                const dados = await resp.json();
                if (dados && !dados.erro) {
                    setValue("logradouro", dados.logradouro || "");
                    setValue("bairro", dados.bairro || "");
                    setValue("cidade", dados.localidade || "");
                    setValue("estado", dados.uf || "");
                    setCepAutoFill(true);
                    setMessage(null);
                } else {
                    setCepAutoFill(false);
                    setMessage({ type: "error", text: "CEP não encontrado." });
                }
            } catch (err) {
                const e = err as { name?: string };
                if (e?.name === "AbortError") return;
                console.error("Erro ao buscar CEP:", err);
                setCepAutoFill(false);
                setMessage({ type: "error", text: "Erro ao consultar CEP." });
            }
        };

        buscarCEP();
        return () => controller.abort();
    }, [cepWatch, isEditing, setValue]);

    const onSubmit: SubmitHandler<FormEnderecoValues> = async (formData) => {
        setIsLoading(true);
        setMessage(null);

        const cepLimpo = removeFormatting(formData.cep);
        if (cepLimpo && cepLimpo.length !== 8) {
            setIsLoading(false);
            setMessage({ type: "error", text: "CEP inválido. Informe 8 dígitos." });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('endereco')
                .update({
                    cep: cepLimpo,
                    logradouro: formData.logradouro,
                    numero: formData.numero,
                    complemento: formData.complemento,
                    bairro: formData.bairro,
                    cidade: formData.cidade,
                    estado: formData.estado,
                })
                .eq('id', Number(formData.id));

            if (error) {
                setMessage({ type: 'error', text: 'Erro ao atualizar endereço' });
                console.error("Erro ao atualizar endereço:", error.message);
            } else {
                setMessage({ type: 'success', text: 'Endereço atualizado com sucesso!' });
                console.log("Endereço atualizado com sucesso:", data);
                await atualizarUsuario();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro inesperado ao atualizar endereço' });
            console.error("Erro inesperado ao atualizar endereço:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">

                <div className="space-y-2">
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
                    <input type="hidden" {...register("id")} />
                    <div className="flex gap-2">
                        <input
                            id="cep"
                            type="text"
                            {...register("cep")}
                            disabled={!isEditing}
                            onChange={(e) => {
                                const v = formatCEP(e.target.value);
                                e.target.value = v;
                                setValue("cep", v);
                                setCepValor(v);
                                setMessage(null);
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                    </div>
                    {errors.cep && (
                        <p className="text-sm text-red-600">{String(errors.cep?.message || '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700">Logradouro</label>
                    <input
                        id="logradouro"
                        type="text"
                        {...register("logradouro")}
                        disabled={!isEditing}
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${cepAutoFill ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.logradouro && (
                        <p className="text-sm text-red-600">{String(errors.logradouro?.message || '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
                    <input
                        id="numero"
                        type="text"
                        {...register("numero")}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    {errors.numero && (
                        <p className="text-sm text-red-600">{String(errors.numero?.message || '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">Complemento</label>
                    <input
                        id="complemento"
                        type="text"
                        {...register("complemento")}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
                    <input
                        id="bairro"
                        type="text"
                        {...register("bairro")}
                        disabled={!isEditing}
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${cepAutoFill ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.bairro && (
                        <p className="text-sm text-red-600">{String(errors.bairro?.message || '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input
                        id="cidade"
                        type="text"
                        {...register("cidade")}
                        disabled={!isEditing}
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${cepAutoFill ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.cidade && (
                        <p className="text-sm text-red-600">{String(errors.cidade?.message || '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                        id="estado"
                        {...register("estado")}
                        disabled={!isEditing}
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${cepAutoFill ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                        <option value="">Selecione...</option>
                        <option value="AC">Acre</option>
                        <option value="AL">Alagoas</option>
                        <option value="AP">Amapá</option>
                        <option value="AM">Amazonas</option>
                        <option value="BA">Bahia</option>
                        <option value="CE">Ceará</option>
                        <option value="DF">Distrito Federal</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="GO">Goiás</option>
                        <option value="MA">Maranhão</option>
                        <option value="MT">Mato Grosso</option>
                        <option value="MS">Mato Grosso do Sul</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="PA">Pará</option>
                        <option value="PB">Paraíba</option>
                        <option value="PR">Paraná</option>
                        <option value="PE">Pernambuco</option>
                        <option value="PI">Piauí</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="RN">Rio Grande do Norte</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="RO">Rondônia</option>
                        <option value="RR">Roraima</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="SP">São Paulo</option>
                        <option value="SE">Sergipe</option>
                        <option value="TO">Tocantins</option>
                    </select>
                    {errors.estado && (
                        <p className="text-sm text-red-600">{String(errors.estado?.message || '')}</p>
                    )}
                </div>
            </div>

            {/* Mensagem de feedback */}
            {message && (
                <div className={`flex items-center gap-2 p-3 rounded-md ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {isEditing && (
                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        'Salvar Endereço'
                    )}
                </button>
            )}
        </form>
    );
}