import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown, Shield, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { useDialog } from '../contexts/DialogContext';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useAppContext();
  const dialog = useDialog();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const ok = await dialog.confirm({
      title: t.logout,
      message: t.logoutConfirm,
      variant: 'warning'
    });
    if (ok) {
      logout();
      setIsOpen(false);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-black dark:hover:border-white transition-all group"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-black border border-stone-200 dark:border-stone-800">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed || user.username}`} 
            alt="Avatar" 
            className="w-full h-full object-cover transition-all"
          />
        </div>
        <div className="flex flex-col items-start hidden sm:flex">
          <span className="text-[10px] font-black text-black dark:text-white leading-none uppercase tracking-tighter">
            {user.username}
          </span>
        </div>
        <ChevronDown size={14} className={`text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl py-2 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 mb-1">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{t.account}</p>
              <p className="text-sm font-bold text-black dark:text-white truncate">{user.email}</p>
            </div>

            <button
              onClick={handleProfile}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-black dark:hover:text-white transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 group-hover:bg-white dark:group-hover:bg-black border border-transparent group-hover:border-stone-200 dark:group-hover:border-stone-700 transition-all">
                <User size={16} />
              </div>
              <span className="font-bold">{t.profile}</span>
            </button>

            <button
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-black dark:hover:text-white transition-all group opacity-50 cursor-not-allowed"
            >
              <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 group-hover:bg-white dark:group-hover:bg-black border border-transparent transition-all">
                <Settings size={16} />
              </div>
              <span className="font-bold">{t.settings}</span>
            </button>

            <div className="h-px bg-stone-100 dark:border-stone-800 my-1 mx-2" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/10 transition-all">
                <LogOut size={16} />
              </div>
              <span className="font-black">{t.logout}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
