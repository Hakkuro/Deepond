import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { LayoutDashboard, Mail, Lock, ArrowRight, Languages, User } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { modalScaleIn } from '../lib/animations';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, toggleLang, lang } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4 transition-colors duration-300">
      <Card 
        {...modalScaleIn}
        className="max-w-md w-full p-10 relative !default-transition"
      >
        <button 
          onClick={toggleLang}
          className="absolute top-6 right-6 p-2 rounded-lg text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-all flex items-center gap-2"
          title={t.toggleLanguage}
        >
          <Languages size={18} />
          <span className="text-[10px] font-black">{lang === 'en' ? '中' : 'EN'}</span>
        </button>

        <div className="flex flex-col items-center mb-10">
          <div className="bg-black dark:bg-white p-3 rounded-lg mb-6 shadow-md">
            <LayoutDashboard className="text-white dark:text-black" size={24} />
          </div>
          <h1 className="text-2xl font-black text-black dark:text-white tracking-tight">{t.loginTitle}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm font-medium">{t.loginSubtitle}</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 text-sm font-bold p-4 rounded-xl mb-8 text-center flex items-center justify-center gap-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            type="email" 
            label={t.email}
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            required
          />

          <Input 
            type="password" 
            label={t.passwordLabel}
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            required
          />

          <Button 
            type="submit"
            disabled={loading}
            fullWidth
            className="py-4 mt-2 text-base group"
          >
            {t.loginButton}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-1" />
          </Button>
        </form>

        <div className="mt-10 text-center text-xs font-bold text-stone-400 uppercase tracking-widest">
          {t.dontHaveAccount} 
          <Link to="/register" className="text-black dark:text-white font-black ml-2 hover:underline underline-offset-4">
            {t.registerNow}
          </Link>
        </div>
      </Card>
    </div>
  );
}
