import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { fadeIn, modalScaleIn } from '../../lib/animations';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
  noPadding?: boolean;
}

export function Modal({ isOpen, onClose, title, children, className, hideCloseButton = false, noPadding = false }: ModalProps) {
  
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            {...fadeIn}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-[2px]"
          />

          {/* Dialog content */}
          <motion.div
            {...modalScaleIn}
            className={cn(
              "relative w-full max-w-md bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl border border-stone-200 dark:border-stone-800 my-auto overflow-hidden",
              className
            )}
          >
            {/* Header */}
            {title && (
              <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800/50 relative z-10">
                <h3 className="text-xl font-black text-black dark:text-white tracking-tight">{title}</h3>
                {!hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-stone-400 hover:text-black dark:text-stone-500 dark:hover:text-white transition-colors rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            
            {!title && !hideCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 z-10 text-stone-400 hover:text-black dark:text-stone-500 dark:hover:text-white transition-colors rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            )}

            {/* Body */}
            <div className={cn(!noPadding && "p-8", title && !noPadding && "pt-6")}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
