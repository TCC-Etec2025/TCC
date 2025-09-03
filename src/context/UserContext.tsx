import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";

type UserProfile = {
  id: number;
  email: string;
  role: string;
  detalhes: unknown;
};

type UserContextType = {
  usuario: UserProfile | null;
  setUsuario: (user: UserProfile | null) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | null>(null);

const USER_STORAGE_KEY = "ilpi_user";

export function UserProvider({ children }: { children: ReactNode }) {
  // 1. Inicializa o estado do usuário com o que está no localStorage
  const [usuario, setUsuario] = useState<UserProfile | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error("Falha ao analisar o usuário do localStorage:", error);
    }
    return null;
  });

  // 2. Sincroniza o estado do usuário com o localStorage
  useEffect(() => {
    if (usuario) {
      // Salva o objeto do usuário no localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    } else {
      // Remove o usuário do localStorage ao fazer logout
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [usuario]);

  // 3. Adiciona a lógica de logout para o localStorage
  const logout = () => {
    setUsuario(null);
  };

  return (
    <UserContext.Provider value={{ usuario, setUsuario, logout }}>
      {children}
    </UserContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de um UserProvider");
  }
  return context;
}