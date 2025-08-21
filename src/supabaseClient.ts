import { createClient } from '@supabase/supabase-js'

// 1. Verifique se os nomes das variáveis de ambiente estão corretos.
//    Para projetos Vite (usado no React), elas DEVEM começar com "VITE_".
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 2. Verifique se as variáveis de ambiente existem e estão sendo carregadas.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL e Anon Key são obrigatórias.");
}

// 3. Exporte o cliente Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)