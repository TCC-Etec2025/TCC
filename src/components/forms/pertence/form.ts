import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { pertenceSchema } from './schema';
import type { Pertence } from '../../../Modelos';

export const useCadastroForm = (pertence: Pertence) => {
    const form = useForm({
        resolver: yupResolver(pertenceSchema),
        defaultValues: {
            id_residente: 0,
            nome: '',
            descricao: '',
            estado: '',
            data_registro: '',
            status: '',
            data_baixa: '',
            observacoes: '',
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (pertence) {
            reset({
                id_residente: pertence.id_residente || 0,
                nome: pertence.nome || '',
                descricao: pertence.descricao || '',
                estado: pertence.estado || '',
                data_registro: pertence.data_registro || '',
                status: pertence.status || '',
                data_baixa: pertence.data_baixa || '',
                observacoes: pertence.observacoes || '',
            });
        }
    }, [pertence, reset]);
    return form;
};