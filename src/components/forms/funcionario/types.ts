import { type InferType } from 'yup';
import { funcionarioSchema } from './schema';

export type FormValues = InferType<typeof funcionarioSchema>;