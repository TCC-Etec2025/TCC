import { type InferType } from 'yup';
import { residenteSchema } from './schema';

export type FormValues = InferType<typeof residenteSchema>;
