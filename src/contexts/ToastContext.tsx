import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const icons = {
    success: <CheckCircle2 className="text-stone-900 dark:text-stone-100" size={18} />,
    error: <AlertCircle className="text-stone-900 dark:text-stone-100" size={18} />,
    info: <Info className="text-stone-900 dark:text-stone-100" size={18} />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-6 py-4 rounded-2xl shadow-xl min-w-[300px] max-w-md group"
    >
      <div className="shrink-0 p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
        {icons[toast.type]}
      </div>
      <p className="flex-1 text-sm font-bold text-black dark:text-white leading-tight">
        {toast.message}
      </p>
      <button 
        onClick={onRemove}
        className="shrink-0 p-1 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-md text-stone-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
}
