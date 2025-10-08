import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { responsavelSchema } from './schema';

export const useCadastroForm = (responsavel: any) => {
    const form = useForm({
        resolver: yupResolver(responsavelSchema),
        defaultValues: {
            nome: '',
            cpf: '',
            telefone_principal: '',
            telefone_secundario: '',
            email: '',
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            observacoes: '',
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (responsavel) {
            const fetchEndereco = async () => {
                const { data, error } = await supabase
                    .from('endereco')
                    .select('*')
                    .eq('id', responsavel.id_endereco)
                    .single();

                if (!error && data) {
                    reset({
                        nome: responsavel.nome || '',
                        cpf: responsavel.cpf || '',
                        telefone_principal: responsavel.telefone_principal || '',
                        telefone_secundario: responsavel.telefone_secundario || '',
                        email: responsavel.email || '',
                        cep: data.cep || '',
                        logradouro: data.logradouro || '',
                        numero: data.numero || '',
                        complemento: data.complemento || '',
                        bairro: data.bairro || '',
                        cidade: data.cidade || '',
                        estado: data.estado || '',
                        observacoes: responsavel.observacoes || '',
                    });
                }
            };

            fetchEndereco();
        }
    }, [responsavel, reset]);

    return form;
};