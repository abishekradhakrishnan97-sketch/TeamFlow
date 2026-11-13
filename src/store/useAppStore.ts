import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ToastMessage } from '@/types';

interface AppStore {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Active filters (persisted per page)
  filters: Record<string, Record<string, string>>;
  setFilter: (page: string, key: string, value: string) => void;
  clearFilters: (page: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toasts: [],
      addToast: (toast) => {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
        }, 5000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      filters: {},
      setFilter: (page, key, value) =>
        set((s) => ({
          filters: {
            ...s.filters,
            [page]: { ...(s.filters[page] || {}), [key]: value },
          },
        })),
      clearFilters: (page) =>
        set((s) => ({
          filters: { ...s.filters, [page]: {} },
        })),
    }),
    {
      name: 'teamflow-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        filters: state.filters,
      }),
    }
  )
);

export function useToast() {
  const addToast = useAppStore((s) => s.addToast);
  
  return {
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  };
}
