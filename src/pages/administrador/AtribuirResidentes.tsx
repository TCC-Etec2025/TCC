import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Search,
    Save,
    User,
    CheckSquare,
    BedDouble,
    Users
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Residente {
    id: number;
    nome: string;
    quarto: string | null;
    foto: string | null;
    funcionarios: Funcionario[];
}

interface Funcionario {
    id: number;
    nome: string;
}

interface ResidenteDB {
    id: number;
    nome: string;
    quarto: string | null;
    foto: string | null;
}

interface ConexaoDB {
    id_residente: number;
    id_funcionario: number;
    funcionario: {
        id: number;
        nome: string;
    } | null;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    funcionarioId: number | null;
    funcionarioNome: string | null;
    onSucesso?: () => void;
}

export const ModalAtribuicaoResidentes: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    funcionarioId,
    funcionarioNome,
    onSucesso
}) => {
    const [busca, setBusca] = useState('');
    const [residentes, setResidentes] = useState<Residente[]>([]);
    const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        carregarDados();
    }, [isOpen, funcionarioId]);

    const carregarDados = async () => {
        if (!funcionarioId) return;

        setLoading(true);

        try {
            const [resResidentes, resConexoes] = await Promise.all([
                supabase
                    .from('residente')
                    .select('id, nome, quarto, foto')
                    .order('nome')
                    .returns<ResidenteDB[]>(),

                supabase
                    .from('funcionario_residente')
                    .select(`
                    id_residente,
                    id_funcionario,
                    funcionario (
                        id,
                        nome
                    )
                `)
                    .returns<ConexaoDB[]>()
            ]);

            if (resResidentes.error) throw resResidentes.error;
            if (resConexoes.error) throw resConexoes.error;

            const todosResidentes = resResidentes.data || [];
            const todasConexoes = resConexoes.data || [];

            const meusVinculos = todasConexoes
                .filter(c => c.id_funcionario === funcionarioId)
                .map(c => c.id_residente);

            setSelecionados(new Set(meusVinculos));

            const listaFormatada: Residente[] = todosResidentes.map(res => {
                const conexoesDesteResidente = todasConexoes.filter(c => c.id_residente === res.id);

                return {
                    ...res,
                    funcionarios: conexoesDesteResidente
                        .filter(c => c.funcionario !== null)
                        .map(c => ({
                            id: c.funcionario!.id,
                            nome: c.funcionario!.nome
                        }))
                };
            });

            setResidentes(listaFormatada);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarClick = async () => {
        if (!funcionarioId) return;
        setSalvando(true);

        try {
            const idsParaSalvar = Array.from(selecionados);

            const { error: deleteError } = await supabase
                .from('funcionario_residente')
                .delete()
                .eq('id_funcionario', funcionarioId);

            if (deleteError) throw deleteError;

            if (idsParaSalvar.length > 0) {
                const novosVinculos = idsParaSalvar.map(idResidente => ({
                    id_funcionario: funcionarioId,
                    id_residente: idResidente
                }));

                const { error: insertError } = await supabase
                    .from('funcionario_residente')
                    .insert(novosVinculos);

                if (insertError) throw insertError;
            }

            if (onSucesso) onSucesso();
            onClose();

        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert(`Erro ao salvar.`);
        } finally {
            setSalvando(false);
        }
    };

    const handleToggle = (id: number) => {
        const novoSet = new Set(selecionados);
        if (novoSet.has(id)) novoSet.delete(id);
        else novoSet.add(id);
        setSelecionados(novoSet);
    };

    const residentesFiltrados = useMemo(() => {
        return residentes.filter(r =>
            r.nome.toLowerCase().includes(busca.toLowerCase()) ||
            r.quarto?.toLowerCase().includes(busca.toLowerCase())
        );
    }, [residentes, busca]);

    const handleSelectAll = () => {
        const todosVisiveisSelecionados = residentesFiltrados.every(r => selecionados.has(r.id));
        const novoSet = new Set(selecionados);
        residentesFiltrados.forEach(r => {
            if (todosVisiveisSelecionados) novoSet.delete(r.id);
            else novoSet.add(r.id);
        });
        setSelecionados(novoSet);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Atribuir Residentes</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Funcionário: <span className="font-semibold text-odara-primary">{funcionarioNome}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Busca */}
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou quarto..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-odara-primary/20 focus:border-odara-primary text-sm"
                        />
                    </div>
                    <button onClick={handleSelectAll} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap">
                        {residentesFiltrados.length > 0 && residentesFiltrados.every(r => selecionados.has(r.id)) ? 'Desmarcar Todos' : 'Marcar Todos'}
                    </button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
                    ) : residentesFiltrados.length > 0 ? (
                        residentesFiltrados.map(residente => {
                            const isSelected = selecionados.has(residente.id);

                            const outrosVinculos = residente.funcionarios?.filter(
                                func => func.id !== funcionarioId
                            ) || [];

                            return (
                                <div
                                    key={residente.id}
                                    onClick={() => handleToggle(residente.id)}
                                    className={`
                group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none
                ${isSelected
                                            ? 'bg-odara-primary/5 border-odara-primary/30 shadow-sm'
                                            : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
            `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden w-full">
                                        {/* Checkbox */}
                                        <div className={`
                    w-5 h-5 rounded shrink-0 flex items-center justify-center border transition-all duration-200
                    ${isSelected ? 'bg-odara-primary border-odara-primary' : 'bg-white border-gray-300 group-hover:border-gray-400'}
                `}>
                                            {isSelected && <CheckSquare size={14} className="text-white" />}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                            {residente.foto ? (
                                                <img src={residente.foto} alt={residente.nome} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} className="text-gray-400" />
                                            )}
                                        </div>

                                        {/* Textos: Nome, Quarto e Funcionários Vinculados */}
                                        <div className="min-w-0 flex flex-col">
                                            <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-odara-dark' : 'text-gray-700'}`}>
                                                {residente.nome}
                                            </h4>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                {/* Informação do Quarto */}
                                                {residente.quarto && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <BedDouble size={12} />
                                                        <span>Quarto {residente.quarto}</span>
                                                    </div>
                                                )}

                                                {/* Informação dos Outros Funcionários (um por linha, nome completo) */}
                                                {outrosVinculos.length > 0 && (
                                                    <div className="flex items-start gap-1 text-xs text-gray-600 font-medium">
                                                        <Users size={12} className="mt-0.5 shrink-0" />
                                                        <div className="flex flex-col truncate">
                                                            {outrosVinculos.map(f => (
                                                                <span key={f.id} className="truncate" title={f.nome}>
                                                                    {f.nome}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                            <User size={48} className="mb-2 opacity-20" />
                            <p>Nenhum residente encontrado</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center">
                    <div className="text-sm text-gray-500 font-medium">
                        {selecionados.size} selecionado(s)
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                        <button onClick={handleSalvarClick} disabled={salvando} className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg flex items-center gap-2 shadow-sm transition-all ${salvando ? 'bg-odara-primary/70 cursor-not-allowed' : 'bg-odara-primary hover:bg-odara-primary/90'}`}>
                            {salvando ? 'Salvando...' : <><Save size={18} /> Salvar</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAtribuicaoResidentes;