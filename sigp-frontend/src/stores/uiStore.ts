import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  activeProjectId: string | null
  activeProjectName: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveProject: (id: string | null, name?: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeProjectId: null,
      activeProjectName: null,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveProject: (id, name = null) => set({ activeProjectId: id, activeProjectName: name }),
    }),
    {
      name: 'sigp-ui-store',
      partialize: (state) => ({ activeProjectId: state.activeProjectId, activeProjectName: state.activeProjectName }),
    }
  )
)
