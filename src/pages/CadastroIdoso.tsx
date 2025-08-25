import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { SubmitHandler, FieldValues, ResolverOptions, ResolverResult } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { fetchResponsaveis, createIdosoEResponsavel } from '../services/supabaseService'
import type { Responsavel, CadastroIdosoData } from '../services/supabaseService'
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react'

// Schema de validação (com a data de admissão removida)
const schema = yup.object({
  tipoResponsavel: yup.string().oneOf(['novo', 'existente']).required(),
  resp_existente_id: yup
    .number()
    .nullable()
    .transform((_, originalValue) => (originalValue === '' ? null : Number(originalValue)))
    .when('tipoResponsavel', {
      is: 'existente',
      then: (schema) =>
        schema.required('É obrigatório selecionar um responsável').typeError('Selecione um responsável válido'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
  resp_nome_completo: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O nome do responsável é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_cpf: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O CPF do responsável é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_email: yup.string().email('Email inválido').when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O email do responsável é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_telefone: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O telefone do responsável é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  idoso_nome_completo: yup.string().required('O nome do paciente é obrigatório'),
  idoso_cpf: yup.string().required('O CPF do paciente é obrigatório'),
  idoso_data_nascimento: yup.string().required('A data de nascimento é obrigatória'),
  idoso_sexo: yup.string().oneOf(['Masculino', 'Feminino', 'Outro']).required('O sexo é obrigatório'),
  // idoso_data_admissao foi removido daqui
}).required()

type FormValues = yup.InferType<typeof schema>

// Helper de tipo para o resolver (sem alterações)
const typedYupResolver = <T extends FieldValues>(schema: yup.AnyObjectSchema) =>
  (values: T, context: unknown, options: ResolverOptions<T>): Promise<ResolverResult<T>> =>
    yupResolver(schema)(values, context, options) as Promise<ResolverResult<T>>

export default function CadastroIdoso() {
  const [step, setStep] = useState(1)
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { register, handleSubmit, formState: { errors }, control, reset, watch, setValue } = useForm<FormValues>({
    resolver: typedYupResolver(schema),
    defaultValues: {
      tipoResponsavel: 'novo',
      resp_existente_id: null,
      resp_nome_completo: '',
      resp_cpf: '',
      resp_email: '',
      resp_telefone: '',
      idoso_nome_completo: '',
      idoso_cpf: '',
      idoso_data_nascimento: '',
      idoso_sexo: undefined,
    },
  })

  const tipoResponsavelWatch = watch('tipoResponsavel')

  useEffect(() => {
    fetchResponsaveis().then(setResponsaveis)
  }, [])

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true)
    setFormMessage(null)
    try {
      // A data de admissão é gerada aqui automaticamente
      const dataToSend: CadastroIdosoData = {
        idoso_nome_completo: data.idoso_nome_completo,
        idoso_cpf: data.idoso_cpf,
        idoso_data_nascimento: data.idoso_data_nascimento,
        idoso_sexo: data.idoso_sexo,
        // Pega a data atual e formata para 'YYYY-MM-DD'
        idoso_data_admissao: new Date().toISOString().split('T')[0],
      }

      if (data.tipoResponsavel === 'existente') {
        dataToSend.resp_existente_id = data.resp_existente_id || undefined
      } else {
        dataToSend.resp_nome_completo = data.resp_nome_completo || ''
        dataToSend.resp_cpf = data.resp_cpf || ''
        dataToSend.resp_email = data.resp_email || ''
        dataToSend.resp_telefone = data.resp_telefone || ''
      }

      await createIdosoEResponsavel(dataToSend)
      setFormMessage({ type: 'success', text: 'Paciente e responsável cadastrados com sucesso!' })
      reset()
      setStep(1)
    } catch (error) {
      const err = error as Error
      setFormMessage({ type: 'error', text: `Erro no cadastro: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTipoResponsavelChange = (value: 'novo' | 'existente') => {
    setValue('tipoResponsavel', value)
    if (value === 'novo') setValue('resp_existente_id', null)
    else {
      setValue('resp_nome_completo', '')
      setValue('resp_cpf', '')
      setValue('resp_email', '')
      setValue('resp_telefone', '')
    }
  }

  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Cadastro de Paciente</h1>

      {/* Etapas */}
      <div className="flex justify-center mb-8">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold ${step === n ? 'bg-blue-600' : 'bg-gray-300'}`}>
              {n}
            </div>
            {n === 1 && <ArrowRight className="mx-3 text-gray-400" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Responsável</h2>
            <Controller
              name="tipoResponsavel"
              control={control}
              render={({ field }) => (
                <select {...field}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2"
                  onChange={(e) => handleTipoResponsavelChange(e.target.value as 'novo' | 'existente')}>
                  <option value="novo">Cadastrar Novo Responsável</option>
                  <option value="existente">Selecionar Existente</option>
                </select>
              )}
            />
            {tipoResponsavelWatch === 'novo' ? (
              <>
                <input {...register('resp_nome_completo')} placeholder="Nome completo" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2" />
                <p className="text-red-500 text-sm">{errors.resp_nome_completo?.message}</p>
                <input {...register('resp_cpf')} placeholder="CPF" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2" />
                <p className="text-red-500 text-sm">{errors.resp_cpf?.message}</p>
                <input {...register('resp_email')} placeholder="Email" type="email" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2" />
                <p className="text-red-500 text-sm">{errors.resp_email?.message}</p>
                <input {...register('resp_telefone')} placeholder="Telefone" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2" />
                <p className="text-red-500 text-sm">{errors.resp_telefone?.message}</p>
              </>
            ) : (
              <Controller
                name="resp_existente_id"
                control={control}
                render={({ field }) => (
                  <select {...field}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2"
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}>
                    <option value="">Selecione...</option>
                    {responsaveis.map((r) => (
                      <option key={r.id} value={r.id}>{r.nome_completo} ({r.cpf})</option>
                    ))}
                  </select>
                )}
              />
            )}
            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center gap-2">
                Avançar <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Paciente</h2>
            <input {...register('idoso_nome_completo')} placeholder="Nome completo" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.idoso_nome_completo?.message}</p>
            <input {...register('idoso_cpf')} placeholder="CPF" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.idoso_cpf?.message}</p>
            <input type="date" {...register('idoso_data_nascimento')} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.idoso_data_nascimento?.message}</p>
            {/* O campo de data de admissão foi removido daqui */}
            <select {...register('idoso_sexo')} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2">
              <option value="">Selecione o sexo...</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
            <p className="text-red-500 text-sm">{errors.idoso_sexo?.message}</p>

            {formMessage && (
              <div className={`p-3 rounded-md flex items-center gap-2 ${formMessage.type === 'success'
                  ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {formMessage.type === 'success' ? <CheckCircle2 /> : <XCircle />}
                {formMessage.text}
              </div>
            )}

            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2">
                <ArrowLeft size={18} /> Voltar
              </button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Finalizar Cadastro'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
