import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toast: ToastMessage | null;
  showToast: (text: string, type: ToastMessage['type']) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toast: null,

  showToast: (text: string, type: ToastMessage['type']) => {
    const id = Date.now().toString();
    set({ toast: { id, text, type } });
    setTimeout(() => {
      const current = get().toast;
      if (current?.id === id) {
        set({ toast: null });
      }
    }, 3000);
  },

  hideToast: () => set({ toast: null }),
}));
