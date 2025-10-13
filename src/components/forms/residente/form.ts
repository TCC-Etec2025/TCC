import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { residenteSchema } from './schema';
import { type Residente } from '../../../Modelos'

export const useCadastroForm = (residente: Residente) => {
    const form = useForm({
        resolver: yupResolver(residenteSchema),
        defaultValues: {
            nome: '',
            data_nascimento: undefined,
            cpf: '',
            sexo: '',
            data_admissao: undefined,
            estado_civil: '',
            naturalidade: '',
            quarto: '',
            dependencia: '',
            plano_saude: '',
            numero_carteirinha: '',
            observacoes: '',
            foto: '',
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (residente) {
            reset({
                nome: residente.nome || '',
                data_nascimento: residente.data_nascimento || undefined,
                cpf: residente.cpf || '',
                sexo: residente.sexo || '',
                data_admissao: residente.data_admissao || undefined,
                estado_civil: residente.estado_civil || '',
                naturalidade: residente.naturalidade || '',
                quarto: residente.quarto || '',
                dependencia: residente.dependencia || '',
                plano_saude: residente.plano_saude || '',
                numero_carteirinha: residente.numero_carteirinha || '',
                observacoes: residente.observacoes || '',
                foto: residente.foto || '',
            });
        }
    }, [residente, reset]);

    return form;
};