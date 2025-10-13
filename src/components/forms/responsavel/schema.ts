import * as yup from 'yup';

export const responsavelSchema = yup.object().shape({
  nome: yup.string()
    .required('O nome é obrigatório'),
  cpf: yup.string()
    .required('O CPF é obrigatório'),
  email: yup.string().email('Email inválido')
    .required('O email é obrigatório'),
  telefone_principal: yup.string()
    .required('O telefone principal é obrigatório'),
  telefone_secundario: yup.string().optional().nullable(),
  data_nascimento: yup.date()
    .required('A data de nascimento é obrigatória'),
  contato_emergencia_nome: yup.string().optional().nullable(),
  contato_emergencia_telefone: yup.string().optional().nullable(),
  cep: yup.string()
    .required('O CEP é obrigatório'),
  logradouro: yup.string()
    .required('O logradouro é obrigatório'),
  numero: yup.string()
    .required('O número é obrigatório'),
  complemento: yup.string().optional().nullable(),
  bairro: yup.string()
    .required('O bairro é obrigatório'),
  cidade: yup.string()
    .required('A cidade é obrigatória'),
  estado: yup.string()
    .required('O estado é obrigatório'),
  observacoes: yup.string().optional().nullable(),
}).required();