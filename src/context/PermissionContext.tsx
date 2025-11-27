import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";

type PermissionContextType = {
  permissao: string[] | null;
  setPermissao: (permissao: string[] | null) => void;
};

const PermissionContext = createContext<PermissionContextType | null>(null);

const USER_STORAGE_KEY = "ilpi_user";

export function UserProvider({ children }: { children: ReactNode }) {
  const [permissao, setPermissao] = useState<string[] | null>(() => {
    try {
      const storedPermissions = localStorage.getItem(USER_STORAGE_KEY);
      if (storedPermissions) {
        return JSON.parse(storedPermissions);
      }
    } catch (error) {
      console.error("Falha ao analisar as permissões do localStorage:", error);
    }
    return null;
  });

  useEffect(() => {
    if (permissao) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(permissao));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [permissao]);

  return (
    <PermissionContext.Provider value={{ permissao, setPermissao }}>
      {children}
    </PermissionContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components */
export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission deve ser usado dentro de um PermissionProvider");
  }
  return context;
}