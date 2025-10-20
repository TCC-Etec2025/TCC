import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { enderecoSchema } from './enderecoSchema';
import { type PerfilUsuario } from '../../../context/UserContext';
import { formatCEP } from '../../../utils/formatters';

export const useEnderecoForm = (usuario: PerfilUsuario) => {
    const form = useForm({
        resolver: yupResolver(enderecoSchema),
        defaultValues: {
            id: usuario.endereco?.id || undefined,
            cep: formatCEP(usuario.endereco.cep) || '',
            logradouro: usuario.endereco.logradouro || '',
            numero: usuario.endereco.numero || '',
            complemento: usuario.endereco.complemento || '',
            bairro: usuario.endereco.bairro || '',
            cidade: usuario.endereco.cidade || '',
            estado: usuario.endereco.estado || '',
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (usuario?.endereco) {
            reset({
                ...usuario.endereco,
                cep: formatCEP(usuario.endereco.cep) || '',
            });
        }
    }, [usuario, reset]);

    return form;
};
