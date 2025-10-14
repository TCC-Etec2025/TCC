import * as yup from 'yup';

export const residenteSchema = yup.object().shape({
  nome: yup.string()
    .required('O nome completo do paciente é obrigatório'),
  data_nascimento: yup.string()
    .required('A data de nascimento é obrigatória'),
  cpf: yup.string()
    .required('O CPF do paciente é obrigatório'),
  sexo: yup.string(),
  data_admissao: yup.string()
    .required('A data de admissão é obrigatória'),
  estado_civil: yup.string().nullable(),
  naturalidade: yup.string().nullable(),
  quarto: yup.string().nullable(),
  dependencia: yup.string().nullable(),
  plano_saude: yup.string().nullable(),
  numero_carteirinha: yup.string().nullable(),
  observacoes: yup.string().nullable(),
  foto: yup.string().nullable(),
}).required();