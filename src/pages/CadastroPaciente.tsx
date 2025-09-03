import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler, ResolverOptions, ResolverResult } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '../lib/supabaseClient';

import DadosResponsavel from '../components/forms/DadosResponsavel';
import DadosIdoso from '../components/forms/DadosIdoso';
import DadosAdicionais from '../components/forms/DadosAdicionais';
import { User, Users, FileText } from 'lucide-react';
import ModalCadastroPaciente from '../components/modals/ModalCadastroPaciente';

const steps = [
  { id: 1, label: 'Responsável', icon: Users },
  { id: 2, label: 'Paciente', icon: User },
  { id: 3, label: 'Dados Adicionais', icon: FileText },
];

export const schema = yup.object({
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
  resp_telefone_principal: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O telefone principal do responsável é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_telefone_secundario: yup.string().nullable(),
  resp_email: yup.string().email('Email inválido').when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O email do responsável é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_cep: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O CEP é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_logradouro: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O logradouro é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_numero: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O número é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_complemento: yup.string().nullable(),
  resp_bairro: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O bairro é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_cidade: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('A cidade é obrigatória'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_estado: yup.string().when('tipoResponsavel', {
    is: 'novo',
    then: (schema) => schema.required('O estado é obrigatório'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  resp_observacoes: yup.string().nullable(),

  idoso_nome_completo: yup.string().required('O nome completo do paciente é obrigatório'),
  idoso_nome_social: yup.string().nullable(),
  idoso_data_nascimento: yup.string().required('A data de nascimento é obrigatória'),
  idoso_cpf: yup.string().required('O CPF do paciente é obrigatório'),
  idoso_sexo: yup.string(),
  idoso_estado_civil: yup.string().required('O estado civil é obrigatório'),
  idoso_naturalidade: yup.string().nullable(),
  idoso_localizacao_quarto: yup.string(),
  idoso_nivel_dependencia: yup.string(),
  idoso_plano_saude: yup.string().nullable(),
  idoso_numero_carteirinha: yup.string().nullable(),
  idoso_observacoes: yup.string().nullable(),
  idoso_foto_perfil_url: yup.string().nullable().url('A URL da foto de perfil deve ser válida'),
  idoso_responsavel_parentesco: yup.string().required('O parentesco com o responsável é obrigatório'),
}).required();

type FormValues = yup.InferType<typeof schema>;

const typedYupResolver = <T extends object>(schema: yup.AnyObjectSchema) =>
  (values: T, context: unknown, options: ResolverOptions<T>) =>
    yupResolver(schema)(values, context, options) as Promise<ResolverResult<T>>;

export default function CadastroPaciente() {
  const [step, setStep] = useState(1);
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showModalPosCadastro, setShowModalPosCadastro] = useState(false);
  const [idIdosoCadastrado, setIdIdosoCadastrado] = useState<number | null>(null);
  const [nomeIdosoCadastrado, setNomeIdosoCadastrado] = useState<string>('');

  const methods = useForm<FormValues>({
    resolver: typedYupResolver(schema),
    defaultValues: {
      tipoResponsavel: 'novo',
      resp_existente_id: null,
      resp_nome_completo: '',
      resp_cpf: '',
      resp_telefone_principal: '',
      resp_telefone_secundario: '',
      resp_email: '',
      resp_cep: '',
      resp_logradouro: '',
      resp_numero: '',
      resp_complemento: '',
      resp_bairro: '',
      resp_cidade: '',
      resp_estado: '',
      resp_observacoes: '',
      idoso_nome_completo: '',
      idoso_nome_social: '',
      idoso_data_nascimento: '',
      idoso_cpf: '',
      idoso_sexo: '',
      idoso_estado_civil: '',
      idoso_naturalidade: '',
      idoso_localizacao_quarto: '',
      idoso_nivel_dependencia: '',
      idoso_plano_saude: '',
      idoso_numero_carteirinha: '',
      idoso_observacoes: '',
      idoso_foto_perfil_url: '',
      idoso_responsavel_parentesco: '',
    },
  });

  const handleOpcaoPosCadastro = (opcao: 'prontuario' | 'pertences' | 'nada') => {
    setShowModalPosCadastro(false);

    switch (opcao) {
      case 'prontuario':
        window.location.href = `/prontuarios/novo?id_idoso=${idIdosoCadastrado}`;
        break;
      case 'pertences':
        window.location.href = `/pertences/novo?id_idoso=${idIdosoCadastrado}`;
        break;
      case 'nada':
        methods.reset();
        setStep(1);
        break;
    }
  };

  const tipoResponsavelWatch = methods.watch('tipoResponsavel');

  useEffect(() => {
    async function loadResponsaveis() {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('id, nome_completo, cpf');
      if (error) {
        console.error('Erro ao buscar responsáveis:', error)
      } else {
        setResponsaveis(data || [])
      }
    }
    loadResponsaveis();
  }, []);

  const handleNextStep = async (currentStep: number) => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (currentStep === 1) {
      if (tipoResponsavelWatch === 'novo') {
        fieldsToValidate = ['resp_nome_completo', 'resp_cpf', 'resp_telefone_principal', 'resp_email', 'resp_cep', 'resp_logradouro', 'resp_numero', 'resp_bairro', 'resp_cidade', 'resp_estado'];
      } else {
        fieldsToValidate = ['resp_existente_id'];
      }
    } else if (currentStep === 2) {
      fieldsToValidate = ['idoso_nome_completo', 'idoso_data_nascimento', 'idoso_cpf', 'idoso_sexo'];
    }

    const isValid = await methods.trigger(fieldsToValidate as any);
    if (isValid) setStep(currentStep + 1);
  };

  const handlePrevStep = () => setStep(step - 1);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setFormMessage(null);

    try {
      // Preparar os parâmetros para a function
      const params = {
        // Dados obrigatórios do idoso
        p_nome_idoso: data.idoso_nome_completo,
        p_data_nascimento_idoso: data.idoso_data_nascimento,
        p_cpf_idoso: data.idoso_cpf,
        p_sexo_idoso: data.idoso_sexo,
        p_data_admissao_idoso: new Date().toISOString().split('T')[0],

        // Dados opcionais do idoso
        p_nome_social_idoso: data.idoso_nome_social || null,
        p_estado_civil_idoso: data.idoso_estado_civil,
        p_naturalidade_idoso: data.idoso_naturalidade || null,
        p_localizacao_quarto_idoso: data.idoso_localizacao_quarto || null,
        p_nivel_dependencia_idoso: data.idoso_nivel_dependencia || null,
        p_plano_saude_idoso: data.idoso_plano_saude || null,
        p_numero_carteirinha_idoso: data.idoso_numero_carteirinha || null,
        p_observacoes_idoso: data.idoso_observacoes || null,
        p_foto_perfil_url_idoso: data.idoso_foto_perfil_url || null,
        p_responsavel_parentesco: data.idoso_responsavel_parentesco,

        // ID do responsável existente (se for o caso)
        p_id_responsavel_existente: data.tipoResponsavel === 'existente' ? data.resp_existente_id : null,

        // Dados do responsável (apenas se for novo)
        ...(data.tipoResponsavel === 'novo' && {
          p_nome_responsavel: data.resp_nome_completo,
          p_cpf_responsavel: data.resp_cpf,
          p_telefone_principal_responsavel: data.resp_telefone_principal,
          p_telefone_secundario_responsavel: data.resp_telefone_secundario || null,
          p_email_responsavel: data.resp_email,
          p_senha_responsavel: data.resp_cpf, // Senha inicial igual ao CPF
          p_cep_responsavel: data.resp_cep,
          p_logradouro_responsavel: data.resp_logradouro,
          p_numero_responsavel: data.resp_numero,
          p_complemento_responsavel: data.resp_complemento || null,
          p_bairro_responsavel: data.resp_bairro,
          p_cidade_responsavel: data.resp_cidade,
          p_estado_responsavel: data.resp_estado
        })
      };

      // Chamar a function do PostgreSQL via RPC
      const { data: result, error } = await supabase
        .rpc('cadastrar_idoso_completo', params);

      if (error) {
        throw new Error(error.message);
      }

      if (result && result.length > 0) {
        const { id_idoso } = result[0];

        setIdIdosoCadastrado(id_idoso);
        setNomeIdosoCadastrado(data.idoso_nome_completo);
        setShowModalPosCadastro(true);

        setFormMessage({
          type: 'success',
          text: `Cadastro realizado com sucesso!`
        });

      } else {
        throw new Error('Nenhum resultado retornado pela function');
      }

      methods.reset();
      setStep(1);

    } catch (err: any) {
      setFormMessage({
        type: 'error',
        text: `Erro no cadastro: ${err.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <div className="flex justify-center mb-8 space-x-6">
        {steps.map(({ id, label, icon: Icon }) => (
          <div key={id} className="flex flex-col items-center text-center">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step === id ? 'border-blue-500 bg-blue-100 text-blue-600' : 'border-gray-300 bg-white text-gray-400'
                }`}
            >
              <Icon size={20} />
            </div>
            <span className={`mt-2 text-sm ${step === id ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <h1 className="text-3xl font-bold mb-6 text-center">Cadastro de Paciente</h1>
      <p className="text-center mb-8">Preencha as informações do paciente e responsável.</p>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <DadosResponsavel
            methods={methods}
            responsaveis={responsaveis}
            onNext={() => handleNextStep(1)}
            tipoResponsavelWatch={tipoResponsavelWatch}
            handleTipoResponsavelChange={(v) => methods.setValue('tipoResponsavel', v)}
          />
        )}
        {step === 2 && (
          <DadosIdoso
            methods={methods}
            onNext={() => handleNextStep(2)}
            onBack={handlePrevStep}
          />
        )}
        {step === 3 && (
          <DadosAdicionais
            methods={methods}
            onBack={handlePrevStep}
            isLoading={isLoading}
            formMessage={formMessage}
          />
        )}
      </form>
      <ModalCadastroPaciente
        isOpen={showModalPosCadastro}
        onClose={() => setShowModalPosCadastro(false)}
        onSelecionarOpcao={handleOpcaoPosCadastro}
        nomeIdoso={nomeIdosoCadastrado}
      />
    </div>
  );
}
