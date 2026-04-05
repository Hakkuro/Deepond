import React from 'react';
import { AlertCircle, HelpCircle, Info } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

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
    <Modal isOpen={isOpen} onClose={onCancel} hideCloseButton>
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
          <Button variant="outline" onClick={onCancel} fullWidth>
            {cancelLabel || t.cancel}
          </Button>
        )}
        <Button 
          variant={variant === 'danger' ? 'danger' : 'primary'} 
          onClick={onConfirm} 
          fullWidth
        >
          {confirmLabel || (variant === 'danger' ? t.delete : t.confirm)}
        </Button>
      </div>
    </Modal>
  );
}
