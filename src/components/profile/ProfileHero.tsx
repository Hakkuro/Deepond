import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import api from '../../lib/api';

export function ProfileHero() {
  const { user } = useAuth();
  const { t } = useAppContext();
  const [stats, setStats] = useState({ totalBoards: 0, collaborations: 0 });

  useEffect(() => {
    api.get('/auth/profile/stats')
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  if (!user) return null;

  return (
    <section className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8">
      <div className="relative group shrink-0">
        <div className="w-32 h-32 rounded-[2.5rem] bg-stone-50 dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 p-2 overflow-hidden shadow-2xl group-hover:border-black dark:group-hover:border-white transition-all duration-500">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed || user.username}`} 
            alt="Avatar" 
            className="w-full h-full object-cover transition-all duration-500"
          />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-2xl shadow-xl">
           <Sparkles size={16} />
        </div>
      </div>
      <div className="space-y-4 flex-1">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">{user.username}</h2>
          <p className="text-stone-400 font-mono text-xs uppercase tracking-widest">{user.id}</p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          <div className="bg-stone-50 dark:bg-stone-900 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800">
            <p className="text-[10px] font-black tracking-widest uppercase text-stone-400">{t.totalBoards}</p>
            <p className="text-xl font-bold text-black dark:text-white">{stats.totalBoards}</p>
          </div>
          <div className="bg-stone-50 dark:bg-stone-900 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800">
            <p className="text-[10px] font-black tracking-widest uppercase text-stone-400">{t.collaborations}</p>
            <p className="text-xl font-bold text-black dark:text-white">{stats.collaborations}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
