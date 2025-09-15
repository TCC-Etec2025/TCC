import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Loader2, User, CheckCircle2, XCircle, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Modal from '../components/Modal';

// ============================== Validação do Formulário ==============================

const schema = yup.object({
  nome_completo: yup.string().required('O nome completo do paciente é obrigatório'),
  data_nascimento: yup.string().required('A data de nascimento é obrigatória'),
  cpf: yup.string().required('O CPF do paciente é obrigatório'),
  sexo: yup.string(),
  data_admissao: yup.string().required('A data de admissão é obrigatória'),
  estado_civil: yup.string().nullable(),
  naturalidade: yup.string().nullable(),
  localizacao_quarto: yup.string().nullable(),
  nivel_dependencia: yup.string().nullable(),
  plano_saude: yup.string().nullable(),
  numero_carteirinha: yup.string().nullable(),
  observacoes: yup.string().nullable(),
  foto_perfil_url: yup.string().nullable(),
}).required();

// ============================== Componente Principal ==============================
export default function CadastroResidente() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const residente = location.state?.residente;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description?: string;
    actions: { label: string; onClick: () => void; className?: string }[];
  }>({ title: "", actions: [] });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nome_completo: '',
      data_nascimento: '',
      cpf: '',
      sexo: '',
      data_admissao: '',
      estado_civil: null,
      naturalidade: null,
      localizacao_quarto: null,
      nivel_dependencia: null,
      plano_saude: null,
      numero_carteirinha: null,
      observacoes: null,
      foto_perfil_url: null,
    }
  });

  useEffect(() => {
    if (residente) {
      reset({
        nome_completo: residente.nome_completo || '',
        data_nascimento: residente.data_nascimento || '',
        cpf: residente.cpf || '',
        sexo: residente.sexo || '',
        data_admissao: residente.data_admissao || '',
        estado_civil: residente.estado_civil || null,
        naturalidade: residente.naturalidade || null,
        localizacao_quarto: residente.localizacao_quarto || null,
        nivel_dependencia: residente.nivel_dependencia || null,
        plano_saude: residente.plano_saude || null,
        numero_carteirinha: residente.numero_carteirinha || null,
        observacoes: residente.observacoes || null,
        foto_perfil_url: residente.foto_perfil_url || null,
      });
    }
  }, [residente, reset]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setFormMessage({
        type: 'error',
        text: 'Por favor, selecione um arquivo de imagem válido.'
      });
      return;
    }

    // Verificar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormMessage({
        type: 'error',
        text: 'A imagem deve ter no máximo 5MB.'
      });
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `fotos-perfil/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('idosos-fotos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('idosos-fotos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setFormMessage({
        type: 'error',
        text: 'Erro ao fazer upload da imagem. Tente novamente.'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setFormMessage(null);

    try {
      let fotoUrl = data.foto_perfil_url || undefined;

      // Fazer upload da imagem se uma foi selecionada
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          fotoUrl = uploadedUrl;
        }
      }

      const insertData = {
        nome_completo: data.nome_completo,
        data_nascimento: data.data_nascimento,
        cpf: data.cpf,
        sexo: data.sexo,
        data_admissao: data.data_admissao,
        estado_civil: data.estado_civil || null,
        naturalidade: data.naturalidade || null,
        localizacao_quarto: data.localizacao_quarto || null,
        nivel_dependencia: data.nivel_dependencia || null,
        plano_saude: data.plano_saude || null,
        numero_carteirinha: data.numero_carteirinha || null,
        observacoes: data.observacoes || null,
        foto_perfil_url: fotoUrl,
      };

      if (residente) {
        const { error: updateError } = await supabase
          .from('idosos')
          .update(insertData)
          .eq('id', residente.id);
        if (updateError) {
          throw new Error('Erro ao atualizar o paciente: ' + updateError.message);
        }
        setFormMessage({
          type: 'success',
          text: `Paciente ${data.nome_completo} atualizado com sucesso!`
        });
      } else {

        const { data: idosoData, error: idosoError } = await supabase
          .from('idosos')
          .insert(insertData)
          .select()
          .single();

        if (idosoError || !idosoData) {
          throw new Error('Erro ao cadastrar o paciente: ' + idosoError?.message);
        }

        const { error: prontuarioError } = await supabase
          .from('prontuarios')
          .insert({ id_idoso: idosoData.id });

        if (prontuarioError) {
          throw new Error('Erro ao criar o prontuário do paciente: ' + prontuarioError?.message);
        }
      }


      setModalConfig({
        title: "Sucesso!",
        description: `Responsável ${data.nome_completo} ${residente ? "atualizado" : "cadastrado"} com sucesso!`,
        actions: [
          {
            label: "Voltar à lista",
            className: "bg-blue-500 text-white hover:bg-blue-600",
            onClick: () => navigate("/app/admin/responsaveis"),
          },
          ...(!residente ? [{
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
      reset();
      setPreviewUrl(null);
      setSelectedFile(null);
      navigate('/app/admin/pacientes');

    } catch (err: any) {
      setFormMessage({
        type: 'error',
        text: `Erro no processo: ${err.message}`
      });
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
        <User size={48} className="text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-800">{residente ? `Edição de ${residente.nome_completo}` : 'Cadastro de Paciente'}</h1>
      </div>
      <p className="text-center mb-8 text-gray-600">
        Preencha as informações do paciente
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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
                Data de Nascimento *
              </label>
              <input
                type="date"
                {...register('data_nascimento')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.data_nascimento && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.data_nascimento.message}
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
                Sexo
              </label>
              <select
                {...register('sexo')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Selecione o sexo...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
              {errors.sexo && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.sexo.message}
                </p>
              )}
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Civil
              </label>
              <select
                {...register('estado_civil')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Selecione o estado civil...</option>
                <option value="Solteiro">Solteiro</option>
                <option value="Casado">Casado</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viúvo">Viúvo</option>
              </select>
              {errors.estado_civil && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.estado_civil.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização do Quarto
              </label>
              <input
                {...register('localizacao_quarto')}
                placeholder="Ex: Quarto 12A, Ala B"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.localizacao_quarto && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.localizacao_quarto.message}
                </p>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              {...register('observacoes')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Observações adicionais sobre o paciente..."
            />
            {errors.observacoes && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.observacoes.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de Perfil
            </label>

            <div className="flex items-center space-x-4">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setValue('foto_perfil_url', null);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={24} className="text-gray-500" />
                </div>
              )}

              <div className="flex-1">
                <label className="flex flex-col items-center px-4 py-2 bg-white text-blue-500 rounded-lg border border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors">
                  <Upload size={18} className="mb-1" />
                  <span className="text-sm font-medium">Selecionar imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG até 5MB
                </p>
              </div>
            </div>

            {/* Campo oculto para manter a URL caso já exista uma */}
            <input
              type="hidden"
              {...register('foto_perfil_url')}
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
            disabled={isLoading || isUploading}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {(isLoading || isUploading) ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {isUploading ? 'Enviando imagem...' : 'Carregando...'}
              </>
            ) : (
              residente ? 'Atualizar Paciente' :
                'Cadastrar Paciente'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}