import { type InferType } from 'yup';
import type { usuarioSchema } from './usuarioSchema';
import type { enderecoSchema } from './enderecoSchema';

export type FormUsuarioValues = InferType<typeof usuarioSchema>;
export type FormEnderecoValues = InferType<typeof enderecoSchema>;