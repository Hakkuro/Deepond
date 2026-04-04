import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  StickyNote, 
  ArrowRight, 
  Sparkles,
  Zap,
  Shield,
  Search,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Home() {
  const { t } = useAppContext();
  const { user } = useAuth();
  const [stats, setStats] = useState({ boards: 0, tasks: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/boards');
        const boards = res.data;
        const tasks = boards.reduce((acc: number, b: any) => acc + (b.taskCount || 0), 0);
        setStats({ boards: boards.length, tasks });
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
  }, []);

  const apps = [
    {
      id: 'kanban',
      title: t.kanban,
      desc: t.exploreKanban,
      icon: LayoutDashboard,
      path: '/kanban',
      color: 'bg-black dark:bg-white',
      textColor: 'text-white dark:text-black',
      stats: `${stats.boards} ${t.activeSpaces}`,
      active: true
    },
    {
      id: 'notes',
      title: t.notes,
      desc: t.exploreNotes,
      icon: StickyNote,
      path: '#',
      color: 'bg-stone-100 dark:bg-stone-900',
      textColor: 'text-stone-400',
      stats: t.comingSoon,
      active: false
    }
  ];

  return (
    <div className="p-8 lg:p-16 max-w-7xl mx-auto w-full space-y-16">
      <header className="space-y-4">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full"
        >
            <Sparkles size={14} className="text-black dark:text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{t.portalSubtitle}</span>
        </motion.div>
        
        <h1 className="text-6xl lg:text-7xl font-black text-black dark:text-white tracking-tight leading-none">
          {t.welcomeBack}, <br />
          <span className="text-stone-300 dark:text-stone-600">{user?.username}</span>
        </h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {apps.map((app, idx) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link 
              to={app.path}
              className={`
                group block p-10 rounded-[2.5rem] border transition-all relative overflow-hidden
                ${app.active 
                  ? 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-black dark:hover:border-white shadow-sm hover:shadow-2xl' 
                  : 'bg-stone-50/50 dark:bg-stone-900/20 border-stone-100 dark:border-stone-900 cursor-not-allowed opacity-80'}
              `}
            >
              <div className="flex items-start justify-between mb-12">
                <div className={`${app.color} p-5 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  <app.icon className={app.textColor} size={32} />
                </div>
                {app.active && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-full group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{app.stats}</span>
                    <h2 className="text-3xl font-black text-black dark:text-white">{app.title}</h2>
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-lg max-w-xs">{app.desc}</p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-10 transition-opacity">
                <app.icon size={180} strokeWidth={1} />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
            <Zap className="text-black dark:text-white" size={24} />
            <div>
                <h3 className="font-bold text-black dark:text-white">Quick Access</h3>
                <p className="text-sm text-stone-500">Jump back into your recent boards immediately.</p>
            </div>
          </div>
          <div className="p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
            <Shield className="text-black dark:text-white" size={24} />
            <div>
                <h3 className="font-bold text-black dark:text-white">Secure Data</h3>
                <p className="text-sm text-stone-500">Your information is encrypted and private.</p>
            </div>
          </div>
          <div className="p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
            <Users className="text-black dark:text-white" size={24} />
            <div>
                <h3 className="font-bold text-black dark:text-white">Team Sync</h3>
                <p className="text-sm text-stone-500">Collaborate in real-time with your colleagues.</p>
            </div>
          </div>
      </section>
    </div>
  );
}
