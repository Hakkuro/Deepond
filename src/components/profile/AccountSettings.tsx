import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useDialog } from '../../contexts/DialogContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import api from '../../lib/api';

export function AccountSettings() {
  const { t } = useAppContext();
  const { confirm, alert } = useDialog();
  const { logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const handleDeleteAccount = async () => {
    const isConfirmed = await confirm({
      title: t.deleteAccount || "注销账户",
      message: t.deleteAccountDesc || "确认要永久注销您的账户吗？此操作不可逆，将级联清除您名下的所有看板及相关的业务数据。",
      confirmLabel: t.delete || "确认注销",
      variant: 'danger'
    });

    if (isConfirmed) {
      try {
        await api.delete('/auth/account');
        await alert({
          title: "账户已注销",
          message: "您的账户及相关数据已安全清除。",
          variant: "info",
        });
        logout();
        navigate('/login');
      } catch (err: any) {
        await alert({
          title: "注销失败",
          message: err.response?.data?.message || "由于服务器原因，暂时无法注销账户。",
          variant: "danger",
        });
      }
    }
  };

  return (
    <>
      <section className="bg-stone-50/50 dark:bg-stone-900/50 rounded-[2.5rem] p-8 border border-stone-200 dark:border-stone-800 space-y-6">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-black rounded-xl border border-stone-200 dark:border-stone-800">
                <Shield size={20} className="text-black dark:text-white" />
            </div>
            <h3 className="text-lg font-black text-black dark:text-white tracking-tight">{t.settings}</h3>
         </div>
         
         <div className="divide-y divide-stone-200 dark:divide-stone-800">
             <div className="py-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-black dark:text-white">{t.passwordLabel}</p>
                    <p className="text-xs text-stone-400 font-medium">{t.resetPasswordDesc}</p>
                </div>
                <button 
                  onClick={() => setPasswordModalOpen(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  {t.change}
                </button>
            </div>
            <div className="py-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-black dark:text-white">{t.deleteAccount}</p>
                    <p className="text-xs text-stone-400 font-medium">{t.deleteAccountDesc}</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  className="text-[10px] font-black uppercase tracking-widest text-rose-500/50 hover:text-rose-500 transition-colors"
                >
                  {t.delete}
                </button>
            </div>
         </div>
      </section>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </>
  );
}
