import * as yup from "yup";

type FileValue = FileList | File[];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const residenteSchema = yup
  .object()
  .shape({
    id_responsavel: yup
      .number()
      .nullable()
      .required("O responsável é obrigatório"),
    nome: yup.string().required("O nome completo do paciente é obrigatório"),
    data_nascimento: yup
      .string()
      .required("A data de nascimento é obrigatória"),
    cpf: yup.string().required("O CPF do paciente é obrigatório")
      .matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido")
      .transform((value) => value?.replace(/\D/g, '')),
    sexo: yup.string(),
    data_admissao: yup.string().required("A data de admissão é obrigatória"),
    estado_civil: yup.string().nullable(),
    naturalidade: yup.string().nullable(),
    quarto: yup.string().nullable(),
    dependencia: yup.string().nullable(),
    plano_saude: yup.string().nullable(),
    numero_carteirinha: yup.string().nullable(),
    observacoes: yup.string().nullable(),
    imagem: yup
      .mixed<FileValue>()
      .nullable()
      .test(
        'singleFile',
        'Selecione apenas um arquivo.',
        (value) => {
          if (!value) return true;
          return value.length === 1;
        }
      )
      .test(
        'fileType',
        'Formato de arquivo inválido. Use .jpg, .png. ou .jpeg.',
        (value) => {
          if (!value || value.length === 0) return true;
          const file = value[0] as File;
          return ['image/png', 'image/jpg', 'image/jpeg'].includes(file.type);
        }
      )
      .test(
        'fileSize',
        `O arquivo é muito grande. O limite é de ${MAX_SIZE_BYTES / (1024 * 1024)}MB.`,
        (value) => {
          if (!value || value.length === 0) return true;
          const file = value[0] as File;
          return file.size <= MAX_SIZE_BYTES;
        }
      ),
  })
  .required();