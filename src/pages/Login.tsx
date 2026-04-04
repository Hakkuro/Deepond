import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { LayoutDashboard, Mail, Lock, ArrowRight, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t, toggleLang, lang } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t.loginFailed);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-stone-900 rounded-xl p-10 border border-stone-200 dark:border-stone-800 shadow-2xl relative"
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
          <div className="bg-black dark:bg-white p-3 rounded-lg mb-6">
            <LayoutDashboard className="text-white dark:text-black" size={24} />
          </div>
          <h1 className="text-2xl font-black text-black dark:text-white tracking-tight">{t.loginTitle}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm font-medium">{t.loginSubtitle}</p>
        </div>

        {error && (
          <div className="bg-stone-50 dark:bg-stone-950 border border-black dark:border-white text-black dark:text-white text-xs font-bold p-4 rounded-lg mb-8 uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">{t.passwordLabel}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white font-medium"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-lg transition-all flex items-center justify-center gap-2 group hover:opacity-80 active:scale-[0.98] mt-4"
          >
            {t.loginButton}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10 text-center text-xs font-bold text-stone-400 uppercase tracking-widest">
          {t.dontHaveAccount} 
          <Link to="/register" className="text-black dark:text-white font-black ml-2 hover:underline underline-offset-4">
            {t.registerNow}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
