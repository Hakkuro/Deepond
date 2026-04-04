import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info' | 'warning';
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: DialogOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((res) => {
      setResolver(() => res);
    });
  }, []);

  const alert = useCallback((opts: DialogOptions) => {
    setOptions({ ...opts, cancelLabel: '' }); // No cancel for alert
    setIsOpen(true);
    return new Promise<void>((res) => {
      setResolver(() => () => res());
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.(false);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {options && (
        <ConfirmDialog
          isOpen={isOpen}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          {...options}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
}
