import * as yup from 'yup';

export const pertenceSchema = yup.object().shape({
  id_residente: yup.number(),
  nome: yup.string()
    .required('O nome completo é obrigatório'),
  descricao: yup.string().nullable(),
  estado: yup.string()
    .required('O estado é obrigatório'),
  data_registro: yup.string()
    .required('A data de registro é obrigatória')
    .typeError('Data inválida'),
  observacoes: yup.string().optional(),
}).required();