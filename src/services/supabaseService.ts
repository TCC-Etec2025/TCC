import { supabase } from '../lib/supabaseClient';

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

/**
 * Busca o perfil completo do usuário atualmente logado.
 * @returns {Promise<UserProfile | null>} O perfil do usuário ou nulo se não encontrado.
 */
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  const { data, error } = await supabase.rpc('get_my_profile');

  if (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return null;
  }

  // A RPC pode retornar um array, então pegamos o primeiro elemento.
  return data && data.length > 0 ? data[0] : null;
};

// Tipagem para um responsável na lista
export interface Responsavel {
    id: number;
    nome_completo: string;
    cpf: string;
}

/**
 * Busca a lista de responsáveis já cadastrados.
 * @returns {Promise<Responsavel[]>} Uma lista de responsáveis.
 */
export const fetchResponsaveis = async (): Promise<Responsavel[]> => {
    const { data, error } = await supabase
        .from('responsaveis')
        .select('id, nome_completo, cpf')
        .order('nome_completo');

    if (error) {
        console.error("Erro ao buscar responsáveis:", error);
        return [];
    }
    return data;
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
 * Cadastra um novo idoso e, se necessário, um novo responsável.
 * @param dados - Objeto com os dados do formulário.
 */
export const createIdosoEResponsavel = async (dados: CadastroIdosoData) => {
    const { data, error } = await supabase.rpc('cadastrar_idoso_e_responsavel', {
        p_resp_nome_completo: dados.resp_nome_completo || null,
        p_resp_cpf: dados.resp_cpf || null,
        p_resp_email: dados.resp_email || null,
        p_resp_telefone: dados.resp_telefone || null,
        p_resp_existente_id: dados.resp_existente_id || null,
        p_idoso_nome_completo: dados.idoso_nome_completo,
        p_idoso_cpf: dados.idoso_cpf,
        p_idoso_data_nascimento: dados.idoso_data_nascimento,
        p_idoso_sexo: dados.idoso_sexo,
        p_idoso_data_admissao: dados.idoso_data_admissao,
    });

    if (error) {
        console.error("Erro no cadastro:", error);
        throw new Error(error.message);
    }
    return data;
}


/**
 * Busca a lista de todos os idosos ativos.
 * @returns {Promise<Idoso[]>} Uma lista de idosos.
 */
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
