import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type LayoutContextType = {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev)
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
  }

  return (
    <LayoutContext.Provider value={{
      isSidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed
    }}>
      {children}
    </LayoutContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}