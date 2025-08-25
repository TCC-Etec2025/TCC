<<<<<<< HEAD
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';

// A correção está aqui: usamos 'import type' para a interface UserProfile
import { fetchUserProfile } from '../services/supabaseService';
import type { UserProfile } from '../services/supabaseService';

// Tipagem para o valor do contexto
type AuthContextType = {
  sessao: Session | null;
  perfil: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
=======
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
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
      const { data: { session } } = await supabase.auth.getSession();
      setSessao(session);

      if (session) {
<<<<<<< HEAD
        const userProfile = await fetchUserProfile();
        setPerfil(userProfile);
=======
        // Se houver sessão, busca o perfil do utilizador
        const { data: userRole } = await supabase.rpc('get_my_role');
        setPerfil({ role: userRole });
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
      }
      setLoading(false);
    };
    
<<<<<<< HEAD
    initializeSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSessao(session);
      if (session) {
        const userProfile = await fetchUserProfile();
        setPerfil(userProfile);
      } else {
        setPerfil(null);
=======
    verificarSessao();

    // Ouve por mudanças na autenticação (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      if (session) {
         // Atualiza o perfil quando o estado muda
         supabase.rpc('get_my_role').then(({ data }) => setPerfil({ role: data }));
      } else {
         setPerfil(null);
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    sessao,
    perfil,
<<<<<<< HEAD
    loading,
    logout: async () => {
      await supabase.auth.signOut();
    },
  };

=======
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    logout: () => supabase.auth.signOut(),
  };

  // O Provedor disponibiliza o 'value' para todos os componentes filhos
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

<<<<<<< HEAD
// Hook personalizado para consumir o contexto
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
=======
// 3. Criar o Hook personalizado para facilitar o uso
export function useAuth() {
  return useContext(AuthContext);
>>>>>>> 682d0eb60ca0ae658f329691dc12e2745ca0990e
}