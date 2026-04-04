import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, Info, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface Props {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'warning',
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useAppContext();

  const getIcon = () => {
    switch (variant) {
      case 'danger': return <AlertCircle className="text-rose-500" size={24} />;
      case 'info': return <Info className="text-stone-500" size={24} />;
      default: return <HelpCircle className="text-stone-500" size={24} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-[2px]"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800"
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                  {getIcon()}
                </div>
                {title && (
                  <h3 className="text-lg font-black text-black dark:text-white tracking-tight uppercase">
                    {title}
                  </h3>
                )}
              </div>

              <p className="text-stone-600 dark:text-stone-400 font-bold leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-3">
                {cancelLabel !== '' && (
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 rounded-xl text-stone-500 dark:text-stone-400 font-black text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-all border border-stone-200 dark:border-stone-800"
                  >
                    {cancelLabel || t.cancel}
                  </button>
                )}
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all active:scale-95 shadow-xl ${
                    variant === 'danger'
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                  }`}
                >
                  {confirmLabel || (variant === 'danger' ? t.delete : t.confirm)}
                </button>
              </div>
            </div>

            {/* Subtle close button in corner */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
