import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { type PerfilUsuario } from "../../../../context/UserContext";
import type { FormUsuarioValues, FormEnderecoValues } from "../types";
import { supabase } from "../../../../lib/supabaseClient";

export const useProfileForm = (usuario: PerfilUsuario) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentTab, setCurrentTab] = useState("personal");

    const handleUsuarioSubmit: SubmitHandler<FormUsuarioValues> = async (data) => {
        setIsSaving(true);
        try {
            const params = {
                nome: data.nome,
                email: data.email,
                cpf: data.cpf,
                telefone_principal: data.telefone_principal,
                telefone_secundario: data.telefone_secundario,
                data_nascimento: data.data_nascimento?.toISOString(),
                contato_emergencia_nome: data.contato_emergencia_nome,
                contato_emergencia_telefone: data.contato_emergencia_telefone,
            };
            
            const { error } = await supabase
                .from("usuarios")
                .update(params)
                .eq("id", usuario.id);
                
            if (error) throw error;
            
            console.log("Dados pessoais atualizados com sucesso");
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao atualizar dados pessoais:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnderecoSubmit: SubmitHandler<FormEnderecoValues> = async (data) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("enderecos")
                .update(data)
                .eq("id", usuario.endereco.id);
                
            if (error) throw error;
            
            console.log("Endereço atualizado com sucesso");
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao atualizar endereço:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const startEditing = () => {
        setIsEditing(true);
    };

    return {
        isEditing,
        isSaving,
        currentTab,
        setCurrentTab,
        handleUsuarioSubmit,
        handleEnderecoSubmit,
        handleCancel,
        startEditing,
    };
};