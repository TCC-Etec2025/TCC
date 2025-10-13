import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { usuarioSchema } from './usuarioSchema';
import { type PerfilUsuario } from '../../../context/UserContext';

export const useUsuarioForm = (usuario: PerfilUsuario) => {
    const form = useForm({
        resolver: yupResolver(usuarioSchema),
        defaultValues: {
            nome: usuario.nome,
            cpf: usuario.cpf,
            telefone_principal: usuario.telefone_principal,
            telefone_secundario: usuario.telefone_secundario,
            email: usuario.email,
            data_nascimento: usuario.data_nascimento,
            contato_emergencia_nome: usuario.contato_emergencia_nome,
            contato_emergencia_telefone: usuario.contato_emergencia_telefone,
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (usuario) {
            reset(usuario);
        }
    }, [usuario, reset]);

    return form;
};
