import * as yup from 'yup';

export const funcionarioSchema = yup.object({
  vinculo: yup.string().required('O tipo de vínculo é obrigatório'),
  nome: yup.string().required('O nome completo é obrigatório'),
  cpf: yup.string().required('O CPF é obrigatório'),
  email: yup.string().email('Email inválido').required('O email é obrigatório'),
  data_nascimento: yup.string().nullable().required('A data de nascimento é obrigatória'),
  papel: yup.string().default('Funcionario'),
  cargo: yup.string().required('O cargo é obrigatório'),
  registro_profissional: yup.string().nullable(),
  data_admissao: yup.string().required('A data de admissão é obrigatória'),
  telefone: yup.string().required('O telefone é obrigatório'),
  cep: yup.string().required('O CEP é obrigatório'),
  logradouro: yup.string().required('O logradouro é obrigatório'),
  numero: yup.string().required('O número é obrigatório'),
  complemento: yup.string().nullable(),
  bairro: yup.string().required('O bairro é obrigatório'),
  cidade: yup.string().required('A cidade é obrigatória'),
  estado: yup.string().required('O estado é obrigatório'),
  contato_emergencia_nome: yup.string().nullable(),
  contato_emergencia_telefone: yup.string().nullable(),
}).required();