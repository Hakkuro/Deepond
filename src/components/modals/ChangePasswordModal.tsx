import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, KeyRound, Loader2 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { t } = useAppContext();
  const { success, error } = useToast();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setLoading(true);
    try {
      await api.put('/auth/password', { oldPassword, newPassword });
      success(t.passwordUpdated || "密码修改成功");
      setOldPassword('');
      setNewPassword('');
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || "密码修改失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/80 backdrop-blur-sm z-50 transition-colors"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-stone-900 rounded-[2rem] p-6 shadow-2xl z-50 border border-stone-200 dark:border-stone-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                <KeyRound size={18} />
                {t.changePassword || "修改密码"}
              </h3>
              <button 
                onClick={onClose} 
                className="p-2 text-stone-400 hover:text-black dark:hover:text-white rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t.oldPassword || "旧密码"}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={16} />
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t.newPassword || "新密码"}</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={16} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-black text-sm hover:opacity-80 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
                >
                   {loading && <Loader2 size={16} className="animate-spin" />}
                   {t.confirm || "确认修改"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
