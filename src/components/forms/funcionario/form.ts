import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { funcionarioSchema } from './schema';

export const useCadastroForm = (funcionario: any) => {
    const form = useForm({
        resolver: yupResolver(funcionarioSchema),
        defaultValues: {
            vinculo: '',
            nome: '',
            cpf: '',
            email: '',
            data_nascimento: '',
            papel: '',
            cargo: '',
            registro_profissional: '',
            data_admissao: '',
            telefone_principal: '',
            telefone_secundario: '',
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            contato_emergencia_nome: '',
            contato_emergencia_telefone: '',
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (funcionario) {
            const fetchEndereco = async () => {
                const { data, error } = await supabase
                    .from('endereco')
                    .select('*')
                    .eq('id', funcionario.id_endereco)
                    .single();
                if (error) {
                    console.error('Erro ao buscar endereço:', error);
                } else if (data) {
                    reset({
                        vinculo: funcionario.tipo_vinculo,
                        nome: funcionario.nome_completo,
                        cpf: funcionario.cpf,
                        email: funcionario.email,
                        data_nascimento: funcionario.data_nascimento || '',
                        papel: funcionario.papel,
                        cargo: funcionario.cargo,
                        registro_profissional: funcionario.registro_profissional,
                        data_admissao: funcionario.data_admissao || '',
                        telefone_principal: funcionario.telefone_principal,
                        telefone_secundario: funcionario.telefone_secundario,
                        cep: data.cep,
                        logradouro: data.logradouro,
                        numero: data.numero,
                        complemento: data.complemento || '',
                        bairro: data.bairro,
                        cidade: data.cidade,
                        estado: data.estado,
                        contato_emergencia_nome: funcionario.contato_emergencia_nome || '',
                        contato_emergencia_telefone: funcionario.contato_emergencia_telefone || '',
                    });
                }
            };
            fetchEndereco();
        }
    }, [funcionario, reset]);
    return form;
};