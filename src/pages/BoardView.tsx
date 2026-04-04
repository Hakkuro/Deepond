import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KanbanBoard } from "../components/Board";
import { LayoutDashboard, Search, Bell, Sun, Moon, Languages, ArrowLeft, Users, X, Shield, ShieldCheck, UserMinus, Share2, Plus, Download, Upload } from "lucide-react";
import UserMenu from "../components/UserMenu";
import { useAppContext } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDialog } from "../contexts/DialogContext";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boardName, setBoardName] = useState("");
  const [permission, setPermission] = useState<'owner' | 'editor' | 'viewer'>('viewer');
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme, lang, toggleLang, t } = useAppContext();
  const { user, logout } = useAuth();
  const toast = useToast();
  const dialog = useDialog();
  
  const [showInvite, setShowInvite] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    fetchBoardInfo();
    fetchCollaborators();
  }, [id]);

  async function fetchBoardInfo() {
    try {
      const res = await api.get(`/boards/${id}`);
      setBoardName(res.data.name || t.unnamedBoard);
      setPermission(res.data.permission);
    } catch (err) {
      console.error(err);
      navigate("/");
    }
  }

  async function fetchCollaborators() {
    try {
      const res = await api.get(`/boards/${id}/collaborators`);
      setCollaborators(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/boards/${id}/collaborators`, { email: inviteEmail, permission: 'editor' });
      setInviteEmail("");
      fetchCollaborators();
      toast.success(t.inviteSuccess);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error");
    }
  }

  async function handleRemoveCollaborator(userId: string) {
    const ok = await dialog.confirm({
      title: t.deleteColumn, // Reusing deleteColumn title or similar
      message: t.confirmRemoveCollaborator,
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await api.delete(`/boards/${id}/collaborators/${userId}`);
      fetchCollaborators();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleExport() {
    try {
      const res = await api.get(`/ai/export/board/${id}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boardName}_export.json`;
      a.click();
      toast.success(t.exportSuccess);
    } catch (err) {
      toast.error(t.exportFailed);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = await dialog.confirm({
      title: t.import,
      message: t.confirmImportOverride,
      variant: 'danger'
    });
    if (!ok) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        console.log('Importing JSON data:', data);
        await api.post(`/ai/import/board/${id}`, data);
        toast.success(t.importSuccess);
        // Reload to refresh the whole board state
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        console.error('Import failed:', err);
        toast.error(t.importFailed);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="h-screen w-full bg-white dark:bg-stone-950 flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden transition-colors duration-500">
      <header className="px-6 py-3 flex items-center justify-between border-b border-stone-200/50 dark:border-stone-800/50 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl z-30 shrink-0 transition-all duration-300">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/kanban')} 
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-stone-500"
          >
            <ArrowLeft size={20} />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black tracking-tight text-stone-800 dark:text-stone-100 max-w-[200px] truncate">
                {boardName}
            </h1>
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                permission === 'owner' ? 'bg-black text-white dark:bg-white dark:text-black' :
                permission === 'editor' ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700' :
                'bg-white text-stone-400 dark:bg-transparent dark:text-stone-500 border border-stone-100 dark:border-stone-800'
            }`}>
                {t[permission] || permission}
            </div>
          </div>
          
          {/* Avatar Group in Header */}
          <div className="flex items-center gap-1 ml-4 py-1 px-2 bg-stone-100/50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/30 dark:border-stone-700/30">
            <div className="flex -space-x-2 mr-2">
                {collaborators.slice(0, 3).map((c) => (
                    <div key={c.id} className="w-7 h-7 rounded-lg border-2 border-white dark:border-stone-900 bg-stone-200 overflow-hidden shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar_seed || c.username}`} alt={c.username} className="w-full h-full" />
                    </div>
                ))}
                {collaborators.length > 3 && (
                    <div className="w-7 h-7 rounded-lg border-2 border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-500">
                        +{collaborators.length - 3}
                    </div>
                )}
            </div>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInvite(!showInvite)}
                className="p-1.5 bg-white dark:bg-stone-700 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-lg transition-all text-stone-500 dark:text-stone-400 shadow-sm border border-stone-100 dark:border-stone-600"
            >
                <Share2 size={14} />
            </motion.button>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-8 hidden lg:block">
          <div className="group relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder} 
              className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-2xl py-2 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-500 hover:text-black dark:hover:text-white group cursor-pointer" title={t.import}>
            <Upload size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black hidden xl:block">{t.import}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-500 hover:text-black dark:hover:text-white group"
            title={t.export}
          >
            <Download size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black hidden xl:block">{t.export}</span>
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence>
            {showInvite && (
            <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="absolute top-4 right-6 z-40 glass p-6 rounded-[2rem] shadow-2xl w-80 max-h-[85vh] flex flex-col border border-white/20 dark:border-stone-800/50"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-stone-800 dark:text-stone-100 uppercase tracking-widest">{t.inviteMembers}</h3>
                    <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400">
                        <X size={18} />
                    </button>
                </div>

                {permission === 'owner' && (
                    <form onSubmit={handleInvite} className="mb-6 space-y-3 relative">
                        <input 
                            type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder={t.invitePlaceholder}
                            className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white text-stone-800 dark:text-stone-100 transition-all placeholder:text-stone-300"
                            required
                        />
                        <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl text-xs font-black hover:opacity-80 transition-all shadow-xl active:scale-95">{t.inviteButton}</button>
                    </form>
                )}

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                    {collaborators.map((c) => (
                        <motion.div layout key={c.id} className="flex items-center justify-between group/user bg-white dark:bg-stone-800/30 p-2 rounded-2xl border border-transparent hover:border-black dark:hover:border-white transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-900 overflow-hidden shadow-inner">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar_seed || c.username}`} alt="Avatar" className="w-full h-full" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-stone-800 dark:text-stone-100">{c.username}</span>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">{t[c.permission] || c.permission}</span>
                                </div>
                            </div>
                            {permission === 'owner' && c.id !== user?.id && (
                                <button 
                                    onClick={() => handleRemoveCollaborator(c.id)}
                                    className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover/user:opacity-100 active:scale-90"
                                >
                                    <UserMinus size={16} />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
            )}
        </AnimatePresence>
        
        <KanbanBoard boardId={id!} searchQuery={searchQuery} permission={permission} />
      </main>
    </div>
  );
}
