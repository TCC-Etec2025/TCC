import { type InferType } from 'yup';
import { responsavelSchema } from './schema';

export type FormValues = InferType<typeof responsavelSchema>;
