import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Loader2, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Modal from '../components/Modal';

const schema = yup.object({
  tipo_vinculo: yup.string().required('O tipo de vínculo é obrigatório'),
  nome_completo: yup.string().required('O nome completo é obrigatório'),
  cpf: yup.string().required('O CPF é obrigatório'),
  email: yup.string().email('Email inválido').required('O email é obrigatório'),
  data_nascimento: yup.string().nullable(),
  cargo: yup.string().required('O cargo é obrigatório'),
  registro_profissional: yup.string().nullable(),
  data_admissao: yup.string().required('A data de admissão é obrigatória'),
  telefone: yup.string().required('O telefone é obrigatório'),
  cep: yup.string().required('O CEP é obrigatório'),
  logradouro: yup.string().required('O logradouro é obrigatório'),
  numero: yup.string().required('O número é obrigatório'),
  complemento: yup.string().nullable(),
  bairro: yup.string().required('O bairro é obrigatório'),
  cidade: yup.string().required('A cidade é obrigatória'),
  estado: yup.string().required('O estado é obrigatório'),
  contato_emergencia_nome: yup.string().nullable(),
  contato_emergencia_telefone: yup.string().nullable(),
}).required();

type FormValues = yup.InferType<typeof schema>;

export default function CadastroFuncionario() {
  const navigate = useNavigate();
  const location = useLocation();
  const funcionario = location.state?.funcionario || null;
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description?: string;
    actions: { label: string; onClick: () => void; className?: string }[];
  }>({ title: "", actions: [] });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tipo_vinculo: '',
      nome_completo: '',
      cpf: '',
      email: '',
      data_nascimento: null,
      cargo: '',
      registro_profissional: null,
      data_admissao: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: null,
      bairro: '',
      cidade: '',
      estado: '',
      contato_emergencia_nome: null,
      contato_emergencia_telefone: null
    },
  });

  useEffect(() => {
    if (funcionario) {
      reset({
        tipo_vinculo: funcionario.tipo_vinculo,
        nome_completo: funcionario.nome_completo,
        cpf: funcionario.cpf,
        email: funcionario.email,
        data_nascimento: funcionario.data_nascimento,
        cargo: funcionario.cargo,
        registro_profissional: funcionario.registro_profissional,
        data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : '',
        telefone: funcionario.telefone,
        cep: funcionario.endereco?.cep || '',
        logradouro: funcionario.endereco?.logradouro || '',
        numero: funcionario.endereco?.numero || '',
        complemento: funcionario.endereco?.complemento || null,
        bairro: funcionario.endereco?.bairro || '',
        cidade: funcionario.endereco?.cidade || '',
        estado: funcionario.endereco?.estado || '',
        contato_emergencia_nome: funcionario.contato_emergencia_nome || null,
        contato_emergencia_telefone: funcionario.contato_emergencia_telefone || null,
      });
    }
  }, [funcionario, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setFormMessage(null);

    try {
      const params = {
        // Dados do usuário
        p_email_usuario: data.email, // ou outro email gerado
        p_nome_role: 'Funcionario', // ou outro nome da role

        // Endereço
        p_cep: data.cep,
        p_logradouro: data.logradouro,
        p_numero: data.numero,
        p_complemento: data.complemento || null,
        p_bairro: data.bairro,
        p_cidade: data.cidade,
        p_estado: data.estado,

        // Dados do colaborador
        p_tipo_vinculo: data.tipo_vinculo,
        p_nome_completo: data.nome_completo,
        p_cpf: data.cpf,
        p_data_nascimento: data.data_nascimento || null,
        p_cargo: data.cargo,
        p_registro_profissional: data.registro_profissional || null,
        p_data_admissao: data.data_admissao,
        p_telefone: data.telefone,
        p_contato_emergencia_nome: data.contato_emergencia_nome || null,
        p_contato_emergencia_telefone: data.contato_emergencia_telefone || null,
      };

      let rpcResult;

      if (funcionario) {
        rpcResult = await supabase.rpc('editar_colaborador_com_usuario', {
          p_id_colaborador: funcionario.id,
          ...params
        });
      } else {
        rpcResult = await supabase.rpc('cadastrar_colaborador_com_usuario', params);
      }

      if (rpcResult.error) {
        throw rpcResult.error;
      }

      setModalConfig({
        title: "Sucesso!",
        description: `Colaborador ${data.nome_completo} ${funcionario ? "atualizado" : "cadastrado"} com sucesso!`,
        actions: [
          {
            label: "Voltar à lista",
            className: "bg-blue-500 text-white hover:bg-blue-600",
            onClick: () => navigate("/app/admin/funcionarios"),
          },
          {
            label: "Cadastrar outro",
            className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
            onClick: () => {
              reset();
              setModalOpen(false);
            },
          },
        ],
      });
      setModalOpen(true);

      if (!funcionario) reset();

    } catch (err: any) {
      setModalConfig({
        title: "Erro!",
        description: `Erro ao ${funcionario ? "editar" : "cadastrar"} colaborador.${err.message}`,
        actions: [
          {
            label: "Fechar",
            className: "bg-red-500 text-white hover:bg-red-600",
            onClick: () => setModalOpen(false),
          },
        ],
      });
      setModalOpen(true);

    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="p-8 bg-slate-50 rounded-2xl shadow-xl max-w-4xl mx-auto my-12">
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        actions={modalConfig.actions}
      />

      <div className="flex items-center justify-center space-x-4 mb-8">
        <UserPlus size={48} className="text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-800">{funcionario ? `Edição de ${funcionario.nome_completo}` : 'Cadastro de Responsável'}</h1>
      </div>
      <p className="text-center mb-8 text-gray-600">
        Preencha os dados do funcionário/colaborador.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Dados Pessoais</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Vínculo *
            </label>
            <select
              {...register('tipo_vinculo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              <option value="">Selecione o tipo de vínculo</option>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Estagiário">Estagiário</option>
              <option value="Voluntário">Voluntário</option>
              <option value="Outro">Outro</option>
            </select>
            {errors.tipo_vinculo && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.tipo_vinculo.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              {...register('nome_completo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite o nome completo"
            />
            {errors.nome_completo && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.nome_completo.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              {...register('email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite o nome completo"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF *
            </label>
            <input
              {...register('cpf')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="000.000.000-00"
            />
            {errors.cpf && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.cpf.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              {...register('data_nascimento')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              {...register('telefone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="(11) 99999-9999"
            />
            {errors.telefone && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.telefone.message}
              </p>
            )}
          </div>

          {/* Dados Profissionais */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-6">Dados Profissionais</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo *
            </label>
            <input
              {...register('cargo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Cargo/função"
            />
            {errors.cargo && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.cargo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registro Profissional
            </label>
            <input
              {...register('registro_profissional')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="CRM, COREN, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Admissão *
            </label>
            <input
              type="date"
              {...register('data_admissao')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {errors.data_admissao && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.data_admissao.message}
              </p>
            )}
          </div>

          {/* Endereço */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-6">Endereço</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP *
            </label>
            <input
              {...register('cep')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="00000-000"
            />
            {errors.cep && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.cep.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logradouro *
            </label>
            <input
              {...register('logradouro')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Rua, Avenida, etc."
            />
            {errors.logradouro && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.logradouro.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número *
            </label>
            <input
              {...register('numero')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="123"
            />
            {errors.numero && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.numero.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complemento
            </label>
            <input
              {...register('complemento')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Apartamento, bloco, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bairro *
            </label>
            <input
              {...register('bairro')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Bairro"
            />
            {errors.bairro && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.bairro.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade *
            </label>
            <input
              {...register('cidade')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Cidade"
            />
            {errors.cidade && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.cidade.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <input
              {...register('estado')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="SP"
              maxLength={2}
            />
            {errors.estado && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.estado.message}
              </p>
            )}
          </div>

          {/* Contato de Emergência */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-6">Contato de Emergência</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Contato
            </label>
            <input
              {...register('contato_emergencia_nome')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Nome do contato de emergência"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone do Contato
            </label>
            <input
              {...register('contato_emergencia_telefone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        {formMessage && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${formMessage.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            {formMessage.type === 'success' ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <XCircle size={20} className="text-red-600" />
            )}
            <span className="font-medium">{formMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {funcionario ? 'Salvando' : 'Cadastrando'}...
              </>
            ) : (
              'Cadastrar Funcionário'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}