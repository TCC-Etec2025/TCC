import type { SubmitHandler } from "react-hook-form";
import { type PerfilUsuario } from "../../../../context/UserContext";
import { useUsuarioForm } from "../usuarioForm";
import type { FormUsuarioValues } from "../types";

type Props = {
    usuario: PerfilUsuario;
    isEditing: boolean;
    onSubmit: SubmitHandler<FormUsuarioValues>;
};

export default function UsuarioForm({ usuario, isEditing, onSubmit }: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useUsuarioForm(usuario);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Campos comuns */}
                <div className="space-y-2">
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input
                        id="nome"
                        type="text"
                        {...register("nome")}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    {errors.nome && (
                        <p className="text-sm text-red-600">{String(errors.nome?.message || '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        id="email"
                        type="email"
                        {...register("email")}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    {errors.email && (
                        <p className="text-sm text-red-600">{String(errors.email?.message || '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                    <input
                        id="cpf"
                        type="text"
                        {...register("cpf")}
                        disabled={!isEditing}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    {errors.cpf && (
                        <p className="text-sm text-red-600">{String(errors.cpf?.message || '')}</p>
                    )}
                </div>

                {/* Campos específicos para funcionário */}
                {usuario.papel.toLowerCase() !== "responsavel" && (
                    <>
                        <div className="space-y-2">
                            <label htmlFor="telefone_principal" className="block text-sm font-medium text-gray-700">Telefone</label>
                            <input
                                id="telefone_principal"
                                type="text"
                                {...register("telefone_principal")}
                                disabled={!isEditing}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                            />
                            {errors.telefone_principal && (
                                <p className="text-sm text-red-600">{String(errors.telefone_principal?.message || '')}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                            <input
                                id="data_nascimento"
                                type="date"
                                {...register("data_nascimento")}
                                disabled={!isEditing}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                            />
                            {errors.data_nascimento && (
                                <p className="text-sm text-red-600">{String(errors.data_nascimento?.message || '')}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="contato_emergencia_nome" className="block text-sm font-medium text-gray-700">Contato de Emergência - Nome</label>
                            <input
                                id="contato_emergencia_nome"
                                type="text"
                                {...register("contato_emergencia_nome")}
                                disabled={!isEditing}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="contato_emergencia_telefone" className="block text-sm font-medium text-gray-700">Contato de Emergência - Telefone</label>
                            <input
                                id="contato_emergencia_telefone"
                                type="text"
                                {...register("contato_emergencia_telefone")}
                                disabled={!isEditing}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                    </>
                )}

                {/* Campos específicos para responsável */}
                {usuario.papel.toLowerCase() === "responsavel" && (
                    <>
                        <div className="space-y-2">
                            <label htmlFor="telefone_principal" className="block text-sm font-medium text-gray-700">Telefone Principal</label>
                            <input
                                id="telefone_principal"
                                type="text"
                                {...register("telefone_principal")}
                                disabled={!isEditing}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                            />
                            {errors.telefone_principal && (
                                <p className="text-sm text-red-600">{String(errors.telefone_principal?.message || '')}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="telefone_secundario" className="block text-sm font-medium text-gray-700">Telefone Secundário</label>
                            <input
                                id="telefone_secundario"
                                type="text"
                                {...register("telefone_secundario")}
                                disabled={!isEditing}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                            />
                        </div>
                    </>
                )}
            </div>
        </form>
    );
}