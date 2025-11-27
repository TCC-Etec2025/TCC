import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
    Shield,
    Save,
    ArrowLeft,
    CheckCircle2,
    Circle,
    AlertCircle
} from "lucide-react";

const GRUPOS_PERMISSOES = [
    {
        categoria: "Residentes",
        permissoes: [
            { id: "residente-visualizar-todos", label: "Pode visualizar os dados de todos os residentes" },
            { id: "residente-cadastrar", label: "Pode cadastrar novos residentes" },
            { id: "residente-editar-todos", label: "Pode editar residentes" },
            { id: "residente-editar-meus", label: "Pode editar residentes atribuidos a ele" },
            { id: "residente-editar-status-meus", label: "Pode editar residentes atribuidos a ele" },
            { id: "residente-editar-status-todos", label: "Pode editar status de residentes" },
        ]
    },
    {
        categoria: "Registros",
        permissoes: [
            { id: "registros-visualizar", label: "Pode visualizar os registros de todos os residentes" },
            { id: "registros-criar-todos", label: "Pode criar novos registros para todos os residentes" },
            { id: "registros-criar-meus", label: "Pode criar novos registros para residentes atribuidos a ele" },
            { id: "registros-editar-todos", label: "Pode editar registros de todos os residentes" },
            { id: "registros-editar-meus", label: "Pode editar registros de residentes atribuidos a ele" },
        ]
    },
    {
        categoria: "Checklists",
        permissoes: [
            { id: "checklists-visualizar", label: "Pode visualizar os checklists de todos os residentes" },
            { id: "checklists-criar-todos", label: "Pode criar novos checklists para todos os residentes" },
            { id: "checklists-criar-meus", label: "Pode criar novos checklists para residentes atribuidos a ele" },
            { id: "checklists-editar-todos", label: "Pode editar checklists de todos os residentes" },
            { id: "checklists-editar-meus", label: "Pode editar checklists de residentes atribuidos a ele" },
        ]
    },
];

export default function PermissoesFuncionario() {
    const navigate = useNavigate();
    const location = useLocation();

    const { idFuncionario, nomeFuncionario } = location.state || {};

    const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!idFuncionario) {
            navigate("/app/admin/funcionarios");
            return;
        }
        buscarPermissoesAtuais();
    }, [idFuncionario, navigate]);

    const buscarPermissoesAtuais = async () => {
        setCarregando(true);
        try {
            const { data, error } = await supabase
                .from("permissoes")
                .select("chave")
                .eq("id_usuario", idFuncionario);

            if (error) throw error;

            if (data) {
                setPermissoesSelecionadas(data.map((item: { chave: string }) => item.chave));
            }
        } catch (error) {
            console.error("Erro ao buscar permissões:", error);
        } finally {
            setCarregando(false);
        }
    };

    const togglePermissao = (id: string) => {
        setPermissoesSelecionadas(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    const toggleCategoria = (permissoesCategoria: { id: string }[]) => {
        const idsCategoria = permissoesCategoria.map(p => p.id);
        const todasSelecionadas = idsCategoria.every(id => permissoesSelecionadas.includes(id));

        if (todasSelecionadas) {
            setPermissoesSelecionadas(prev => prev.filter(id => !idsCategoria.includes(id)));
        } else {
            setPermissoesSelecionadas(prev => {
                const novos = idsCategoria.filter(id => !prev.includes(id));
                return [...prev, ...novos];
            });
        }
    };

    const salvarAlteracoes = async () => {
        setSalvando(true);
        try {
            const { error: deleteError } = await supabase
                .from("permissao")
                .update({ chave: permissoesSelecionadas.join("/") })
                .eq("id_usuario", idFuncionario);

            if (deleteError) throw deleteError;

            navigate("/app/admin/usuarios");

        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar permissões. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    if (!idFuncionario) return null;

    return (
        <div className="max-w-5xl mx-auto my-12 px-4">
            {/* Header */}
            <div className="bg-odara-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full text-odara-secondary transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-odara-accent flex items-center gap-2">
                                <Shield className="text-odara-primary" />
                                Controle de Acessos
                            </h1>
                            <p className="text-odara-dark/70 mt-1">
                                Configurando permissões para: <span className="font-bold text-odara-primary">{nomeFuncionario || "Usuário não identificado"}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm border border-blue-100">
                        <AlertCircle size={16} />
                        <span>As alterações entram em vigor no próximo login.</span>
                    </div>
                </div>
            </div>

            {carregando ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odara-primary"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Grid de Permissões */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {GRUPOS_PERMISSOES.map((grupo) => {
                            const idsDesteGrupo = grupo.permissoes.map(p => p.id);
                            const todasSelecionadas = idsDesteGrupo.every(id => permissoesSelecionadas.includes(id));

                            return (
                                <div key={grupo.categoria} className="bg-odara-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                                    {/* Cabeçalho do Card */}
                                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-odara-primary text-lg">{grupo.categoria}</h3>
                                        <button
                                            onClick={() => toggleCategoria(grupo.permissoes)}
                                            className="text-xs font-medium text-odara-secondary hover:text-odara-accent underline decoration-dotted"
                                        >
                                            {todasSelecionadas ? "Desmarcar todos" : "Marcar todos"}
                                        </button>
                                    </div>

                                    {/* Lista de Itens */}
                                    <div className="p-4 space-y-3 flex-1">
                                        {grupo.permissoes.map((perm) => {
                                            const selecionado = permissoesSelecionadas.includes(perm.id);
                                            return (
                                                <div
                                                    key={perm.id}
                                                    onClick={() => togglePermissao(perm.id)}
                                                    className={`
                            flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all duration-200
                            ${selecionado
                                                            ? "bg-odara-secondary/5 border-odara-secondary shadow-sm"
                                                            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"}
                          `}
                                                >
                                                    <span className={`text-sm font-medium ${selecionado ? "text-odara-dark" : "text-gray-500"}`}>
                                                        {perm.label}
                                                    </span>

                                                    {selecionado ? (
                                                        <CheckCircle2 className="text-odara-secondary" size={20} />
                                                    ) : (
                                                        <Circle className="text-gray-300" size={20} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Fixo ou Botão de Salvar */}
                    <div className="flex justify-end pt-6 pb-12">
                        <button
                            onClick={salvarAlteracoes}
                            disabled={salvando}
                            className="flex items-center gap-2 px-8 py-4 bg-odara-accent hover:bg-odara-secondary text-white rounded-xl font-bold text-lg shadow-xl shadow-odara-accent/20 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Save size={24} />
                            {salvando ? "Salvando Alterações..." : "Salvar Permissões"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}