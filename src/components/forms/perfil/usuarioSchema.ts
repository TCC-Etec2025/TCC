import * as yup from 'yup';

export const usuarioSchema = yup.object().shape({
    nome: yup.string()
        .required("Nome é obrigatório"),
    email: yup.string().email("Email deve ser válido")
        .required("Email é obrigatório"),
    cpf: yup.string()
        .required("CPF é obrigatório"),
    data_nascimento: yup.string()
        .required("Data de nascimento é obrigatória"),
    telefone_principal: yup.string()
        .required("Telefone principal é obrigatório"),
    telefone_secundario: yup.string().nullable(),
    contato_emergencia_nome: yup.string().nullable(),
    contato_emergencia_telefone: yup.string().nullable(),
}).required();