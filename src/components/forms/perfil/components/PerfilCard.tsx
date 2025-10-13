import { type PerfilUsuario } from "../../../../context/UserContext";
import { Calendar, Mail, MapPin, Phone } from "lucide-react";
import type { Funcionario, Responsavel } from "../../../../Modelos";

type Props = {
    usuario: PerfilUsuario;
};

const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR");
};

export default function PerfilCard({ usuario }: Props) {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-col items-center text-center">
                <div className="mt-4 space-y-2">
                    <h2 className="text-xl font-semibold">{usuario.nome}</h2>
                    {usuario.papel.toLowerCase() !== "responsavel" && (
                        <p className="text-sm text-gray-500">{(usuario as Funcionario).cargo}</p>
                    )}
                </div>
            </div>

            <div className="my-6 h-px bg-gray-200" />

            <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="break-all">{usuario.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>
                        {usuario.papel.toLowerCase() !== "responsavel" 
                            ? (usuario as Funcionario).telefone_principal
                            : (usuario as Responsavel).telefone_principal
                        }
                        {usuario.papel.toLowerCase() === "responsavel" && (usuario as Responsavel).telefone_secundario && (
                            <span className="text-gray-400"> • {(usuario as Responsavel).telefone_secundario}</span>
                        )}
                    </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="break-words">
                        {usuario.endereco.logradouro}, {usuario.endereco.numero} - {usuario.endereco.bairro}, {usuario.endereco.cidade} - {usuario.endereco.estado}
                    </span>
                </div>
                {usuario.papel.toLowerCase() !== "responsavel" && (usuario as Funcionario).data_admissao && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>Desde {formatDate((usuario as Funcionario).data_admissao.toString())}</span>
                    </div>
                )}
            </div>
        </div>
    );
}