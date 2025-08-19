import { createClient } from '@supabase/supabase-js'

// 1. As chaves agora são lidas do ambiente de execução (ficheiro .env)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// 2. Verificação para garantir que as chaves foram carregadas corretamente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As credenciais do Supabase (URL e Anon Key) precisam ser definidas no ficheiro .env");
}

// 3. Cria e exporta o cliente Supabase, pronto para ser usado em todo o projeto
export const supabase = createClient(supabaseUrl, supabaseAnonKey)