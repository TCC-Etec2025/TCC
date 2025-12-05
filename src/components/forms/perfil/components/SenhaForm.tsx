import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import CryptoJS from 'crypto-js';
import { supabase } from "../../../../lib/supabaseClient";
import type { PerfilUsuario } from "../../../../context/UserContext";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type Props = {
    usuario: PerfilUsuario;
};

// --- ALTERAÇÃO AQUI NO SCHEMA ---
const schema = Yup.object().shape({
    senhaAtual: Yup.string()
        .required("A senha atual é obrigatória"),
    novaSenha: Yup.string()
        .required("A nova senha é obrigatória")
        // Validação adicionada:
        .notOneOf([Yup.ref('senhaAtual')], "A nova senha não pode ser igual à senha atual"),
    confirmarSenha: Yup.string()
        .oneOf([Yup.ref("novaSenha")], "As senhas não conferem")
        .required("A confirmação de senha é obrigatória"),
});

type FormSenhaValues = Yup.InferType<typeof schema>;

export default function SenhaForm({ usuario }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormSenhaValues>({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: FormSenhaValues) => {
        setIsLoading(true);
        setMessage(null);

        try {
            const hashSenhaAtual = CryptoJS.SHA256(data.senhaAtual).toString(CryptoJS.enc.Hex);
            const hashNovaSenha = CryptoJS.SHA256(data.novaSenha).toString(CryptoJS.enc.Hex);

            const { data: userCheck, error: checkError } = await supabase
                .from('usuario')
                .select('id')
                .eq('id', usuario.id_usuario) 
                .eq('senha', hashSenhaAtual)
                .maybeSingle();

            if (checkError || !userCheck) {
                setMessage({ type: 'error', text: 'A senha atual está incorreta.' });
                setIsLoading(false);
                return;
            }

            const { error: updateError } = await supabase
                .from('usuario')
                .update({ senha: hashNovaSenha })
                .eq('id', usuario.id_usuario);

            if (updateError) {
                throw updateError;
            }

            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            reset();

        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            setMessage({ type: 'error', text: 'Erro inesperado ao atualizar a senha.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Gerencie sua senha e configurações de segurança
                </p>

                <div className="mt-6 space-y-4">
                    
                    <div className="space-y-2">
                        <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700">
                            Senha Atual
                        </label>
                        <div className="relative">
                            <input
                                id="senhaAtual"
                                type={showCurrent ? "text" : "password"}
                                {...register("senhaAtual")}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 mt-1"
                            >
                                {showCurrent ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                        </div>
                        {errors.senhaAtual && (
                            <p className="text-sm text-red-600">{errors.senhaAtual.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                id="novaSenha"
                                type={showNew ? "text" : "password"}
                                {...register("novaSenha")}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 mt-1"
                            >
                                {showNew ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                        </div>
                        {errors.novaSenha && (
                            <p className="text-sm text-red-600">{errors.novaSenha.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
                            Confirmar Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                id="confirmarSenha"
                                type={showConfirm ? "text" : "password"}
                                {...register("confirmarSenha")}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 mt-1"
                            >
                                {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                        </div>
                        {errors.confirmarSenha && (
                            <p className="text-sm text-red-600">{errors.confirmarSenha.message}</p>
                        )}
                    </div>

                    {message && (
                        <div className={`flex items-center gap-2 p-3 rounded-md ${
                            message.type === 'success'
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

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-odara-primary border border-transparent rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Atualizando...
                            </>
                        ) : (
                            'Alterar Senha'
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}