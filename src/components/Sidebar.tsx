import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  LayoutDashboard, 
  StickyNote, 
  Settings, 
  Sun, 
  Moon, 
  Languages, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  User,
  Sparkles,
  Bell
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useDialog } from "../contexts/DialogContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const { theme, toggleTheme, lang, toggleLang, t } = useAppContext();
  const { user, logout } = useAuth();
  const dialog = useDialog();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    const ok = await dialog.confirm({
      title: t.logout,
      message: t.logoutConfirm,
      confirmLabel: t.logout,
      variant: 'warning'
    });
    if (ok) logout();
  };

  const menuItems = [
    { icon: Home, label: t.home, path: "/", active: location.pathname === "/" },
    { icon: LayoutDashboard, label: t.kanban, path: "/kanban", active: location.pathname.startsWith("/kanban") || location.pathname.startsWith("/board") },
    { icon: StickyNote, label: t.notes, path: "/notes", active: location.pathname === "/notes", comingSoon: true },
    { icon: Sparkles, label: t.aiAssistant, path: "/ai", active: location.pathname === "/ai", comingSoon: true },
  ];

  return (
    <aside 
      className={`
        h-full bg-white dark:bg-black border-r border-stone-100 dark:border-stone-900 flex flex-col z-40 relative transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      <div className="h-16 px-6 flex items-center justify-between shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-7 h-7 bg-black dark:bg-white rounded flex items-center justify-center shrink-0">
              <LayoutDashboard className="text-white dark:text-black" size={14} />
            </div>
            <span className="font-black tracking-tight text-lg text-black dark:text-white whitespace-nowrap">
              {t.title}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 bg-black dark:bg-white rounded flex items-center justify-center mx-auto">
            <LayoutDashboard className="text-white dark:text-black" size={14} />
          </div>
        )}
        
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-lg text-stone-300 hover:text-black dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>
      
      {collapsed && (
        <button 
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full flex items-center justify-center shadow-sm text-stone-400 hover:text-black dark:hover:text-white z-50"
        >
          <ChevronRight size={14} />
        </button>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <Link 
            key={item.label}
            to={item.comingSoon ? "#" : item.path}
            title={collapsed ? item.label : ""}
            className={`
              flex items-center h-10 gap-3 px-3 rounded-xl transition-all relative
              ${item.active 
                ? "bg-stone-50 dark:bg-stone-900 text-black dark:text-white font-bold" 
                : "text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-50/50 dark:hover:bg-stone-900/50"}
              ${item.comingSoon ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              ${collapsed ? "justify-center px-0" : ""}
            `}
          >
            <item.icon size={18} strokeWidth={item.active ? 2.5 : 2} />
            {!collapsed && (
              <span className="text-sm truncate">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 mt-auto space-y-4 border-t border-stone-50 dark:border-stone-900">
        <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center justify-between'} gap-2`}>
           <div className={`flex bg-stone-50 dark:bg-stone-900/50 p-1 rounded-lg ${collapsed ? 'flex-col' : ''}`}>
              <button 
                onClick={toggleLang} 
                className="p-1.5 rounded hover:bg-white dark:hover:bg-stone-800 text-[10px] font-black text-stone-400 hover:text-black dark:hover:text-white transition-all uppercase"
              >
                  {lang === 'en' ? '中' : 'EN'}
              </button>
              <button 
                onClick={toggleTheme} 
                className="p-1.5 rounded hover:bg-white dark:hover:bg-stone-800 text-stone-400 hover:text-black dark:hover:text-white transition-all"
              >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
           </div>

           <div className={`flex items-center ${collapsed ? 'flex-col' : 'gap-1'}`}>
             <button 
               onClick={handleLogout}
               className="p-2 text-stone-400 hover:text-rose-500 rounded-lg transition-colors"
               title={t.logout}
             >
               <LogOut size={16} />
             </button>
           </div>
        </div>

        {!collapsed && (
          <Link 
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 transition-all border border-transparent hover:border-stone-100 dark:hover:border-stone-800 group"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 group-hover:scale-105 transition-transform">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatarSeed || user?.username}`} alt="User" />
            </div>
            <div className="flex-1 min-w-0">
               <div className="text-xs font-black text-black dark:text-white truncate">{user?.username}</div>
               <div className="text-[9px] font-bold text-stone-400 truncate uppercase tracking-tighter">{user?.email}</div>
            </div>
          </Link>
        )}
        
        {collapsed && (
          <Link to="/profile" className="mx-auto block w-8 h-8 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatarSeed || user?.username}`} alt="User" />
          </Link>
        )}
      </div>
    </aside>
  );
}
