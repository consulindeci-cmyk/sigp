import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  activeProjectId: string | null
  activeProjectName: string | null
  activeProjectTab: string
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveProject: (id: string | null, name?: string | null) => void
  setActiveProjectTab: (tab: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeProjectId: null,
      activeProjectName: null,
      activeProjectTab: 'overview',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) =>
        set((state) => (state.sidebarOpen === open ? state : { sidebarOpen: open })),
      setActiveProject: (id, name = null) =>
        set((state) =>
          state.activeProjectId === id && state.activeProjectName === name
            ? state
            : { activeProjectId: id, activeProjectName: name }
        ),
      setActiveProjectTab: (tab) =>
        set((state) => (state.activeProjectTab === tab ? state : { activeProjectTab: tab })),
    }),
    {
      name: 'sigp-ui-store',
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeProjectName: state.activeProjectName,
        activeProjectTab: state.activeProjectTab,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
