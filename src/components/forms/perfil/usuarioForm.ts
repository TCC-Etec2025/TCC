import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { usuarioSchema } from './usuarioSchema';
import { type PerfilUsuario } from '../../../context/UserContext';
import { formatCPF, formatTelefone } from '../../../utils/formatters';

export const useUsuarioForm = (usuario: PerfilUsuario) => {
    const form = useForm({
        resolver: yupResolver(usuarioSchema),
        defaultValues: {
            nome: usuario.nome,
            cpf: formatCPF(usuario.cpf) || '',
            telefone_principal: formatTelefone(usuario.telefone_principal) || '',
            telefone_secundario: formatTelefone(usuario.telefone_secundario) || '',
            email: usuario.email || '',
            data_nascimento: usuario.data_nascimento || '',
            contato_emergencia_nome: usuario.contato_emergencia_nome || '',
            contato_emergencia_telefone: formatTelefone(usuario.contato_emergencia_telefone) || '',
        },
    });
    const { reset } = form;

    useEffect(() => {
        if (usuario) {
            reset({
                ...usuario,
                cpf: formatCPF(usuario.cpf) || '',
                telefone_principal: formatTelefone(usuario.telefone_principal) || '',
                telefone_secundario: formatTelefone(usuario.telefone_secundario) || '',
                contato_emergencia_telefone: formatTelefone(usuario.contato_emergencia_telefone) || '',
            });
        }
    }, [usuario, reset]);

    return form;
};
