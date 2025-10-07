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
  nome_completo: yup.string().required('O nome completo é obrigatório'),
  cpf: yup.string().required('O CPF é obrigatório'),
  email: yup.string().email('Email inválido').required('O email é obrigatório'),
  telefone_principal: yup.string().required('O telefone principal é obrigatório'),
  telefone_secundario: yup.string().nullable(),
  cep: yup.string().required('O CEP é obrigatório'),
  logradouro: yup.string().required('O logradouro é obrigatório'),
  numero: yup.string().required('O número é obrigatório'),
  complemento: yup.string().nullable(),
  bairro: yup.string().required('O bairro é obrigatório'),
  cidade: yup.string().required('A cidade é obrigatória'),
  estado: yup.string().required('O estado é obrigatório'),
  observacoes: yup.string().nullable(),
}).required();

type FormValues = yup.InferType<typeof schema>;

export default function CadastroResponsavel() {
  const navigate = useNavigate();
  const location = useLocation();
  const responsavel = location.state?.responsavel;
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
      nome_completo: '',
      cpf: '',
      telefone_principal: '',
      telefone_secundario: null,
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: null,
      bairro: '',
      cidade: '',
      estado: '',
      observacoes: null,
    },
  });

  useEffect(() => {
    if (responsavel) {
      const fetchEndereco = async () => {
        const { data, error } = await supabase
          .from('enderecos')
          .select('*')
          .eq('id', responsavel.id_endereco)
          .single();
        if (error) {
          console.error('Erro ao buscar endereço:', error);
        } else if (data) {
          reset({
            nome_completo: responsavel.nome_completo,
            cpf: responsavel.cpf,
            telefone_principal: responsavel.telefone_principal,
            telefone_secundario: responsavel.telefone_secundario,
            email: responsavel.email,
            cep: data.cep,
            logradouro: data.logradouro,
            numero: data.numero,
            complemento: data.complemento || null,
            bairro: data.bairro,
            cidade: data.cidade,
            estado: data.estado,
            observacoes: responsavel.observacoes,
          });
        }
      };
      fetchEndereco();
    }
  }, [responsavel, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setFormMessage(null);

    try {
      const params = {
        // Usuário do sistema
        p_email_usuario: data.email,
        p_nome_role: "Responsável",

        // Endereço
        p_cep: data.cep,
        p_logradouro: data.logradouro,
        p_numero: data.numero,
        p_complemento: data.complemento || null,
        p_bairro: data.bairro,
        p_cidade: data.cidade,
        p_estado: data.estado,

        // Responsável
        p_nome_completo: data.nome_completo,
        p_cpf: data.cpf,
        p_email_responsavel: data.email,
        p_telefone_principal: data.telefone_principal,
        p_telefone_secundario: data.telefone_secundario || null,
        p_observacoes: data.observacoes || null,
      };

      if (responsavel) {
        // Função de EDIÇÃO
        const { error } = await supabase.rpc('editar_responsavel_com_usuario', {
          p_id_responsavel: responsavel.id,
          ...params
        });

        if (error) {
          throw new Error('Erro ao editar o responsável: ' + error.message);
        }
      } else {
        // Função de CADASTRO
        const { error } = await supabase.rpc('cadastrar_responsavel_com_usuario', params);

        if (error) {
          throw new Error('Erro ao cadastrar o responsável: ' + error.message);
        }
      }

      setModalConfig({
        title: "Sucesso!",
        description: `Responsável ${data.nome_completo} ${responsavel ? "atualizado" : "cadastrado"} com sucesso!`,
        actions: [
          {
            label: "Voltar à lista",
            className: "bg-blue-500 text-white hover:bg-blue-600",
            onClick: () => navigate("/app/admin/responsaveis"),
          },
          ...(!responsavel ? [{
            label: "Cadastrar outro",
            className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
            onClick: () => {
              reset();
              setModalOpen(false);
            },
          }] : []),
          {
            label: "Dashboard",
            className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
            onClick: () => navigate("/app/admin"),
          }
        ],
      });
      setModalOpen(true);

    } catch (err: any) {
      setModalConfig({
        title: "Erro!",
        description: `Erro ao ${responsavel ? "editar" : "cadastrar"} responsável.${err.message}`,
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
    <div className="p-8 bg-slate-50 rounded-2xl shadow-xl max-w-3xl mx-auto my-12">
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        actions={modalConfig.actions}
      />
      <div className="flex items-center justify-center space-x-4 mb-8">
        <UserPlus size={48} className="text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-800">{responsavel ? `Edição de ${responsavel.nome_completo}` : 'Cadastro de Responsável'}</h1>
      </div>
      <p className="text-center mb-8 text-gray-600">
        Preencha os dados do responsável.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              E-mail *
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone Principal *
            </label>
            <input
              {...register('telefone_principal')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="(11) 99999-9999"
            />
            {errors.telefone_principal && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.telefone_principal.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone Secundário
            </label>
            <input
              {...register('telefone_secundario')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="(11) 88888-8888"
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="md:col-span-2">
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
            />
            {errors.estado && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.estado.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              {...register('observacoes')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Observações adicionais sobre o responsável..."
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
                {responsavel ? 'Salvando' : 'Cadastrando'}...
              </>
            ) : (
              responsavel ? 'Salvar Alterações' :
                'Cadastrar Responsável'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}