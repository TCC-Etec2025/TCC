//import { supabase } from '../lib/supabaseClient';

// Tipagem para o perfil completo do usuário que será retornado pela função RPC
export interface UserProfile {
  id: number;
  nome_completo: string;
  role: string;
  tipo_pessoa: 'Colaborador' | 'Responsavel';
  auth_uuid: string;
  // Adicione outros campos que a função get_my_profile possa retornar
}

// Tipagem para a lista de idosos
export interface Idoso {
  id: number;
  nome_completo: string;
  data_nascimento: string; // Vem como string
  localizacao_quarto: string;
}

// Tipagem para um responsável na lista
export interface Responsavel {
    id: number;
    nome_completo: string;
    cpf: string;
    telefone_principal: string;
    telefone_secundario: string | null;
    email: string | null;
}

// Tipagem para os dados do formulário de cadastro de idoso
export interface CadastroIdosoData {
    // Dados do responsável
    resp_nome_completo?: string;
    resp_cpf?: string;
    resp_email?: string;
    resp_telefone?: string;
    resp_existente_id?: number;
    // Dados do idoso
    idoso_nome_completo: string;
    idoso_cpf: string;
    idoso_data_nascimento: string;
    idoso_sexo: 'Masculino' | 'Feminino' | 'Outro';
    idoso_data_admissao: string;
}

/**
 * Busca a lista de todos os idosos ativos.
 * @'returns {Promise<Idoso[]>} Uma lista de idosos.
export const fetchActiveIdosos = async (): Promise<Idoso[]> => {
    const { data, error } = await supabase.rpc('get_active_idosos');

    if (error) {
        console.error('Erro ao buscar idosos:', error);
        return [];
    }

    return data || [];
}

// Você adicionará outras funções aqui conforme a necessidade
// Ex: export const fetchOcorrencias = async (idosoId) => { ... }
*/