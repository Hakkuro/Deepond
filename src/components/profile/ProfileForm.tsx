import { useState } from 'react';
import { User, Mail, Image as ImageIcon, Sparkles, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

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
        <div className="space-y-2">
          <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">{t.username}</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={18} />
            <input 
              type="text"
              value={form.username}
              onChange={updateField('username')}
              className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white placeholder:text-stone-300"
              placeholder={t.username}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">{t.email}</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={18} />
            <input 
              type="email"
              value={form.email}
              onChange={updateField('email')}
              className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white placeholder:text-stone-300"
              placeholder={t.emailPlaceholder}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">{t.avatarSeed}</label>
          <div className="relative group">
            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={18} />
            <input 
              type="text"
              value={form.avatarSeed}
              onChange={updateField('avatarSeed')}
              className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white placeholder:text-stone-300"
              placeholder={t.avatarSeed}
            />
            <button 
              type="button"
              onClick={() => setForm(prev => ({ ...prev, avatarSeed: Math.random().toString(36).substring(7) }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black dark:hover:text-white transition-all"
              title="Randomize"
            >
              <Sparkles size={18} />
            </button>
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-sm hover:opacity-80 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
        {t.saveProfile}
      </button>
    </form>
  );
}
