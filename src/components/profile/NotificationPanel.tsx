import { Bell, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../contexts/AppContext';
import { useNotifications } from '../../contexts/NotificationContext';

export function NotificationPanel() {
  const { t } = useAppContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();

  return (
    <div className="bg-stone-50/50 dark:bg-stone-900/50 rounded-[2.5rem] p-8 border border-stone-200 dark:border-stone-800 flex-1 flex flex-col h-full">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-black rounded-xl border border-stone-200 dark:border-stone-800 relative">
                  <Bell size={20} className="text-black dark:text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
                  )}
              </div>
              <h3 className="text-lg font-black text-black dark:text-white tracking-tight">{t.notificationsTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-black dark:hover:text-white transition-colors px-2 py-1"
              >
                {t.markAllAsRead}
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                onClick={deleteAllNotifications}
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-rose-500 transition-colors px-2 py-1"
                title={t.clearAllHistory}
              >
                {t.clearAllHistory}
              </button>
            )}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide min-h-[300px]">
         <AnimatePresence initial={false}>
           {notifications.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="text-center py-12 text-stone-400 text-sm font-bold"
             >
               {t.noNotifications}
             </motion.div>
           ) : (
             notifications.map((notif) => (
               <motion.div
                 key={notif.id}
                 layout
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                 className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group
                   ${notif.read === 0 
                     ? 'bg-white dark:bg-black border-black/10 dark:border-white/10 shadow-sm' 
                     : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-white/50 dark:hover:bg-black/50'}
                 `}
                 onClick={() => notif.read === 0 && markAsRead(notif.id)}
               >
                 {notif.read === 0 && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-black dark:bg-white" />
                 )}
                 <div className="flex justify-between items-start mb-1">
                   <span className="text-[10px] uppercase tracking-widest font-black text-stone-400">
                     {notif.type}
                   </span>
                   <span className="text-[10px] text-stone-400 font-bold">
                     {new Date(notif.created_at).toLocaleDateString()}
                   </span>
                 </div>
                 <h4 className="text-sm font-bold text-black dark:text-white mb-1">
                   {notif.title}
                 </h4>
                 <p className="text-xs text-stone-500 font-medium leading-relaxed">
                   {notif.content}
                 </p>
                 
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                   {notif.read === 0 && (
                     <CheckCircle size={16} className="text-stone-300 hover:text-black dark:hover:text-white" />
                   )}
                   <Trash2 
                     size={16} 
                     className="text-stone-300 hover:text-rose-500" 
                     onClick={(e) => {
                       e.stopPropagation();
                       deleteNotification(notif.id);
                     }}
                   />
                 </div>
               </motion.div>
             ))
           )}
         </AnimatePresence>
       </div>
    </div>
  );
}
