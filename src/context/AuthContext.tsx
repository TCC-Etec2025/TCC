import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

// 1. Criar o Contexto
const AuthContext = createContext(null);

// 2. Criar o "Provedor" que irá conter toda a lógica
export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica a sessão inicial quando a aplicação carrega
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessao(session);

      if (session) {
        // Se houver sessão, busca o perfil do utilizador
        const { data: userRole } = await supabase.rpc('get_my_role');
        setPerfil({ role: userRole });
      }
      setLoading(false);
    };
    
    verificarSessao();

    // Ouve por mudanças na autenticação (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      if (session) {
         // Atualiza o perfil quando o estado muda
         supabase.rpc('get_my_role').then(({ data }) => setPerfil({ role: data }));
      } else {
         setPerfil(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    sessao,
    perfil,
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    logout: () => supabase.auth.signOut(),
  };

  // O Provedor disponibiliza o 'value' para todos os componentes filhos
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 3. Criar o Hook personalizado para facilitar o uso
export function useAuth() {
  return useContext(AuthContext);
}