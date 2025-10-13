import * as yup from 'yup';

export const enderecoSchema = yup.object().shape({
    cep: yup.string()
        .required("CEP é obrigatório"),
    logradouro: yup.string()
        .required("Logradouro é obrigatório"),
    numero: yup.string()
        .required("Número é obrigatório"),
    complemento: yup.string().nullable(),
    bairro: yup.string()
        .required("Bairro é obrigatório"),
    cidade: yup.string()
        .required("Cidade é obrigatória"),
    estado: yup.string()
        .required("Estado é obrigatório"),
}).required();