import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import type { Endereco, Funcionario, Responsavel } from "../Modelos";
import { supabase } from "../lib/supabaseClient";

export type PerfilUsuario = { papel: string; } & (Funcionario | Responsavel) & { endereco: Endereco };

type UserContextType = {
  usuario: PerfilUsuario | null;
  setUsuario: (user: PerfilUsuario | null) => void;
  atualizarUsuario: () => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextType | null>(null);

const USER_STORAGE_KEY = "ilpi_user";

export function UserProvider({ children }: { children: ReactNode }) {
  // 1. Inicializa o estado do usuário com o que está no localStorage
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(() => {
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

  // 3. Função para recarregar dados do usuário do banco
  const atualizarUsuario = async () => {
    if (!usuario?.id_usuario) return;

    try {
      const { data, error } = await supabase.rpc('obter_perfil_usuario', {
        p_id_usuario: usuario.id_usuario
      });

      if (error) {
        console.error("Erro ao recarregar dados do usuário:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const dadosAtualizados = data[0];
        const usuarioAtualizado: PerfilUsuario = {
          ...dadosAtualizados,
          endereco: {
            cep: dadosAtualizados.cep,
            logradouro: dadosAtualizados.logradouro,
            numero: dadosAtualizados.numero,
            complemento: dadosAtualizados.complemento,
            bairro: dadosAtualizados.bairro,
            cidade: dadosAtualizados.cidade,
            estado: dadosAtualizados.estado,
          }
        };
        setUsuario(usuarioAtualizado);
      }
    } catch (err) {
      console.error("Erro inesperado ao recarregar usuário:", err);
    }
  };

  // 4. Adiciona a lógica de logout para o localStorage
  const logout = () => {
    setUsuario(null);
  };

  return (
    <UserContext.Provider value={{ usuario, setUsuario, atualizarUsuario, logout }}>
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