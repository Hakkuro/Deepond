import { useState } from 'react';
import { User, Mail, Image as ImageIcon, Sparkles, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const { t } = useAppContext();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    avatarSeed: user?.avatarSeed || user?.username || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { username: form.username, email: form.email, avatar_seed: form.avatarSeed });
      updateUser(res.data.user);
      success(t.profileUpdated);
    } catch (err: any) {
      error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-stone-50/50 dark:bg-stone-900/50 p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800">
      <h3 className="text-lg font-black text-black dark:text-white tracking-tight flex items-center gap-2">
        <User size={18} />
        {t.account}
      </h3>
      <div className="grid gap-6">
        <Input 
          label={t.username}
          icon={<User size={18} />}
          value={form.username}
          onChange={updateField('username')}
          placeholder={t.usernamePlaceholder || t.username}
          required
        />

        <Input 
          type="email"
          label={t.email}
          icon={<Mail size={18} />}
          value={form.email}
          onChange={updateField('email')}
          placeholder={t.emailPlaceholder}
          required
        />

        <div className="relative">
          <Input 
            label={t.avatarSeed}
            icon={<ImageIcon size={18} />}
            value={form.avatarSeed}
            onChange={updateField('avatarSeed')}
            placeholder={t.avatarSeed}
          />
          <button 
            type="button"
            onClick={() => setForm(prev => ({ ...prev, avatarSeed: Math.random().toString(36).substring(7) }))}
            className="absolute right-4 bottom-3 text-stone-400 hover:text-black dark:hover:text-white transition-all"
            title="Randomize"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>

      <Button 
        type="submit"
        disabled={loading}
        fullWidth
        className="py-4 rounded-2xl text-base shadow-xl"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
        {t.saveProfile}
      </Button>
    </form>
  );
}
