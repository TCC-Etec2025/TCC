import { type InferType } from 'yup';
import { pertenceSchema } from './schema';

export type FormValues = InferType<typeof pertenceSchema>;