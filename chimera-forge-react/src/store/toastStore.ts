/* ============================================
   TOAST STORE — Global toast notifications
   ============================================ */

import { create } from 'zustand';

export interface Toast {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type = 'info') => {
        const id = toastId++;
        set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
        }, 3000);
    },
    removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));
