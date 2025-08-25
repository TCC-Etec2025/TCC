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
      const { data: { session } } = await supabase.auth.getSession();
      setSessao(session);

      if (session) {
        const userProfile = await fetchUserProfile();
        setPerfil(userProfile);
      }
      setLoading(false);
    };
    
    initializeSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSessao(session);
      if (session) {
        const userProfile = await fetchUserProfile();
        setPerfil(userProfile);
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
    loading,
    logout: async () => {
      await supabase.auth.signOut();
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para consumir o contexto
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}