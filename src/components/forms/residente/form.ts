import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { residenteSchema } from './schema';
import { type Residente } from '../../../Modelos'
import { formatCPF } from '../../../utils/formatters';

export const useCadastroForm = (residente: Residente) => {
    const form = useForm({
        resolver: yupResolver(residenteSchema),
        defaultValues: {
            id_responsavel: undefined,
            nome: '',
            data_nascimento: '',
            cpf: '',
            sexo: '',
            data_admissao: new Date().toISOString().split('T')[0],
            estado_civil: '',
            naturalidade: '',
            quarto: '',
            dependencia: '',
            plano_saude: '',
            numero_carteirinha: '',
            observacoes: '',
            imagem: null
        },
    });

    const { reset } = form;

    useEffect(() => {
        if (residente) {
            reset({
                id_responsavel: residente.id_responsavel ?? undefined,
                nome: residente.nome || '',
                data_nascimento: residente.data_nascimento || '',
                cpf: formatCPF(residente.cpf) || '',
                sexo: residente.sexo || '',
                data_admissao: residente.data_admissao || '',
                estado_civil: residente.estado_civil || '',
                naturalidade: residente.naturalidade || '',
                quarto: residente.quarto || '',
                dependencia: residente.dependencia || '',
                plano_saude: residente.plano_saude || '',
                numero_carteirinha: residente.numero_carteirinha || '',
                observacoes: residente.observacoes || '',
                imagem: null
            });
        }
    }, [residente, reset]);

    return form;
};