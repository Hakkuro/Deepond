import { useState } from 'react';
import { KeyRound, Lock, Loader2 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={<span className="flex items-center gap-2"><KeyRound size={18} />{t.changePassword || "修改密码"}</span>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          label={t.oldPassword || "旧密码"}
          icon={<Lock size={16} />}
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          label={t.newPassword || "新密码"}
          icon={<KeyRound size={16} />}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            className="shadow-xl"
          >
             {loading && <Loader2 size={16} className="animate-spin" />}
             {t.confirm || "确认修改"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
