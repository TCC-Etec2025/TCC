import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { residenteSchema } from './schema';

export const useCadastroForm = (residente: any) => {
    const form = useForm({
        resolver: yupResolver(residenteSchema),
        defaultValues: {
            nome: '',
            data_nascimento: '',
            cpf: '',
            sexo: '',
            data_admissao: '',
            estado_civil: '',
            naturalidade: '',
            quarto: '',
            dependencia: '',
            plano_saude: '',
            numero_carteirinha: '',
            observacoes: '',
            foto_perfil_url: '',
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (residente) {
            reset({
                nome: residente.nome || '',
                data_nascimento: residente.data_nascimento || '',
                cpf: residente.cpf || '',
                sexo: residente.sexo || '',
                data_admissao: residente.data_admissao || '',
                estado_civil: residente.estado_civil || '',
                naturalidade: residente.naturalidade || '',
                quarto: residente.quarto || '',
                dependencia: residente.dependencia || '',
                plano_saude: residente.plano_saude || '',
                numero_carteirinha: residente.numero_carteirinha || '',
                observacoes: residente.observacoes || '',
                foto_perfil_url: residente.foto_perfil_url || '',
            });
        }
    }, [residente, reset]);

    return form;
};