import { useState } from 'react';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { ArrowRight, Check } from 'lucide-react';
import type { InferType } from 'yup';
import { schema } from '../../pages/CadastroPaciente';

type FormValues = InferType<typeof schema>;

interface Props {
  methods: UseFormReturn<FormValues>;
  responsaveis: { id: number; nome_completo: string; cpf: string }[];
  onNext: () => void;
  tipoResponsavelWatch: string;
  handleTipoResponsavelChange: (v: 'novo' | 'existente') => void;
}

export default function DadosResponsavel({
  methods, responsaveis, onNext, tipoResponsavelWatch, handleTipoResponsavelChange,
}: Props) {
  const { register, control, formState: { errors }, watch, setValue } = methods;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const itensPorPagina = 6;

  // Filtro e paginação
  const responsaveisFiltrados = responsaveis.filter(r =>
    r.nome_completo.toLowerCase().includes(termoBusca.toLowerCase()) ||
    r.cpf.includes(termoBusca)
  );

  const totalPaginas = Math.ceil(responsaveisFiltrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const responsaveisPaginados = responsaveisFiltrados.slice(inicio, fim);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">1. Dados do Responsável</h2>
      
      <Controller
        name="tipoResponsavel"
        control={control}
        render={({ field }) => (
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center space-x-2">
              <input 
                type="radio" 
                {...field} 
                value="novo" 
                onChange={() => handleTipoResponsavelChange('novo')} 
                checked={tipoResponsavelWatch === 'novo'} 
                className="text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Cadastrar Novo Responsável</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="radio" 
                {...field} 
                value="existente" 
                onChange={() => handleTipoResponsavelChange('existente')} 
                checked={tipoResponsavelWatch === 'existente'} 
                className="text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Usar Responsável Existente</span>
            </label>
          </div>
        )}
      />
      
      {errors.tipoResponsavel && (
        <p className="text-red-500 text-sm mt-1">{errors.tipoResponsavel.message}</p>
      )}

      {tipoResponsavelWatch === 'novo' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
            <input 
              {...register('resp_nome_completo')} 
              placeholder="Nome completo do responsável" 
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
            />
            {errors.resp_nome_completo && (
              <p className="text-red-500 text-sm mt-1">{errors.resp_nome_completo.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">CPF *</label>
            <input 
              {...register('resp_cpf')} 
              placeholder="000.000.000-00" 
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
            />
            {errors.resp_cpf && (
              <p className="text-red-500 text-sm mt-1">{errors.resp_cpf.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail *</label>
            <input 
              {...register('resp_email')} 
              placeholder="email@exemplo.com" 
              type="email" 
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
            />
            {errors.resp_email && (
              <p className="text-red-500 text-sm mt-1">{errors.resp_email.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone Principal *</label>
            <input 
              {...register('resp_telefone_principal')} 
              placeholder="(11) 99999-9999" 
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
            />
            {errors.resp_telefone_principal && (
              <p className="text-red-500 text-sm mt-1">{errors.resp_telefone_principal.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone Secundário</label>
            <input 
              {...register('resp_telefone_secundario')} 
              placeholder="(11) 88888-8888" 
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
            />
          </div>
          
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">CEP *</label>
              <input 
                {...register('resp_cep')} 
                placeholder="00000-000" 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
              />
              {errors.resp_cep && (
                <p className="text-red-500 text-sm mt-1">{errors.resp_cep.message}</p>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Logradouro *</label>
              <input 
                {...register('resp_logradouro')} 
                placeholder="Rua, Avenida, etc." 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
              />
              {errors.resp_logradouro && (
                <p className="text-red-500 text-sm mt-1">{errors.resp_logradouro.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Número *</label>
              <input 
                {...register('resp_numero')} 
                placeholder="123" 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
              />
              {errors.resp_numero && (
                <p className="text-red-500 text-sm mt-1">{errors.resp_numero.message}</p>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Complemento</label>
              <input 
                {...register('resp_complemento')} 
                placeholder="Apartamento, bloco, etc." 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Bairro *</label>
              <input 
                {...register('resp_bairro')} 
                placeholder="Bairro" 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
              />
              {errors.resp_bairro && (
                <p className="text-red-500 text-sm mt-1">{errors.resp_bairro.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Cidade *</label>
              <input 
                {...register('resp_cidade')} 
                placeholder="Cidade" 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
              />
              {errors.resp_cidade && (
                <p className="text-red-500 text-sm mt-1">{errors.resp_cidade.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado *</label>
              <input 
                {...register('resp_estado')} 
                placeholder="SP" 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
              />
              {errors.resp_estado && (
                <p className="text-red-500 text-sm mt-1">{errors.resp_estado.message}</p>
              )}
            </div>
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea 
              {...register('resp_observacoes')} 
              rows={3} 
              placeholder="Observações adicionais sobre o responsável..." 
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 px-3 py-2 border" 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Campo de busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Responsável
            </label>
            <input
              type="text"
              placeholder="Digite nome ou CPF..."
              value={termoBusca}
              onChange={(e) => {
                setTermoBusca(e.target.value);
                setPaginaAtual(1); // Reset para primeira página ao buscar
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Cards responsivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {responsaveisPaginados.map(r => (
              <div
                key={r.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  watch('resp_existente_id') === r.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => setValue('resp_existente_id', r.id)}
              >
                <div className="font-semibold text-lg mb-2 text-gray-800">{r.nome_completo}</div>
                <div className="text-sm text-gray-600">CPF: {r.cpf}</div>
                
                <div className="flex items-center mt-3">
                  <div className={`w-3 h-3 rounded-full ${
                    watch('resp_existente_id') === r.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span className="ml-2 text-sm text-gray-600">
                    {watch('resp_existente_id') === r.id ? 'Selecionado' : 'Clique para selecionar'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                <button
                  type="button"
                  key={pagina}
                  onClick={() => setPaginaAtual(pagina)}
                  className={`px-3 py-1 border rounded ${
                    pagina === paginaAtual 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pagina}
                </button>
              ))}
              
              <button
                type="button"
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          )}

          {/* Mensagens de estado */}
          {responsaveisFiltrados.length === 0 && responsaveis.length > 0 && (
            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              <p>Nenhum responsável encontrado com "{termoBusca}"</p>
              <p className="text-sm mt-1">Tente buscar com outros termos</p>
            </div>
          )}

          {responsaveis.length === 0 && (
            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              <p>Nenhum responsável cadastrado no sistema</p>
              <p className="text-sm mt-1">Selecione "Cadastrar Novo Responsável" para continuar</p>
            </div>
          )}

          {/* Feedback do responsável selecionado */}
          {watch('resp_existente_id') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <Check size={20} className="text-green-600 mr-2" />
                <div>
                  <div className="font-semibold text-green-800">Responsável selecionado:</div>
                  <div className="text-green-700">
                    {responsaveis.find(r => r.id === watch('resp_existente_id'))?.nome_completo}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botão de próxima etapa */}
      <div className="flex justify-end pt-6 border-t">
        <button 
          type="button" 
          onClick={onNext}
          disabled={tipoResponsavelWatch === 'existente' && !watch('resp_existente_id')}
          className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Próxima Etapa
          <ArrowRight size={18} className="ml-2" />
        </button>
      </div>
    </div>
  );
}