import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Plus, ChevronRight, Loader2, MoreVertical, 
  Trash2, Edit3, BarChart3, Clock, Star, Search, LayoutGrid, List as ListIcon,
  Copy, Link as LinkIcon, Check
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useDialog } from "../contexts/DialogContext";
import { useToast } from "../contexts/ToastContext";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function KanbanHome() {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [activeBoardMenuId, setActiveBoardMenuId] = useState<string | null>(null);
  
  // Advanced Features State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPermission, setFilterPermission] = useState<'all' | 'owner' | 'collaborator'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pinnedBoards, setPinnedBoards] = useState<string[]>([]);
  
  const { t } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dialog = useDialog();
  const toast = useToast();

  useEffect(() => {
    fetchBoards();
    try {
      const saved = localStorage.getItem('deepond_pinned_boards');
      if (saved) setPinnedBoards(JSON.parse(saved));
    } catch {}
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.board-menu-trigger') && !target.closest('.board-menu-content')) {
        setActiveBoardMenuId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const savePinnedBoards = (newPinned: string[]) => {
    setPinnedBoards(newPinned);
    localStorage.setItem('deepond_pinned_boards', JSON.stringify(newPinned));
  };

  const togglePin = (boardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pinnedBoards.includes(boardId)) {
      savePinnedBoards(pinnedBoards.filter(id => id !== boardId));
    } else {
      savePinnedBoards([...pinnedBoards, boardId]);
    }
    setActiveBoardMenuId(null);
  };

  const copyBoardLink = (boardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/board/${boardId}`;
    navigator.clipboard.writeText(url);
    toast.success(t.copied);
    setActiveBoardMenuId(null);
  };

  async function fetchBoards() {
    setLoading(true);
    try {
      const res = await api.get('/boards');
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const res = await api.post('/boards', { name: newBoardName });
      setNewBoardName("");
      setShowCreate(false);
      navigate(`/board/${res.data.id}`);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRenameBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBoard || !editingBoard.name.trim()) return;
    try {
      await api.put(`/boards/${editingBoard.id}`, { name: editingBoard.name });
      setEditingBoard(null);
      fetchBoards();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteBoard(id: string) {
    const ok = await dialog.confirm({
      title: t.deleteBoard,
      message: t.deleteConfirm,
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await api.delete(`/boards/${id}`);
      fetchBoards();
    } catch (err) {
      console.error(err);
    }
  }

  const totalTasks = boards.reduce((acc, board) => acc + (board.taskCount || 0), 0);
  
  const filteredBoards = useMemo(() => {
    return boards.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPerm = filterPermission === 'all' 
        ? true 
        : filterPermission === 'owner' ? b.permission === 'owner' : b.permission !== 'owner';
      return matchesSearch && matchesPerm;
    }).sort((a, b) => {
      const aPinned = pinnedBoards.includes(a.id) ? 1 : 0;
      const bPinned = pinnedBoards.includes(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return a.name.localeCompare(b.name);
    });
  }, [boards, searchQuery, filterPermission, pinnedBoards]);

  return (
    <div className="min-h-full bg-white dark:bg-black font-sans relative overflow-x-hidden">
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6 relative z-10">
        
        {/* Header & Stats Compact */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{t.welcomeBack}, {user?.username}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <h1 className="text-4xl font-black text-black dark:text-white tracking-tight leading-tight">
                  {t.todayGoal || "What's the plan?"}
              </h1>
              <button 
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-black hover:opacity-90 transition-all active:scale-[0.98] shrink-0"
              >
                <Plus size={18} strokeWidth={3} />
                {t.newBoard}
              </button>
            </div>

            {/* Stats - Horizontal & Subtle */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-3 px-4 py-2 border border-stone-100 dark:border-stone-900 rounded-xl bg-stone-50/50 dark:bg-stone-900/30">
                    <BarChart3 size={16} className="text-stone-400" />
                    <span className="text-xs font-bold text-stone-500">{t.totalBoards}: <span className="text-black dark:text-white ml-1">{boards.length}</span></span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 border border-stone-100 dark:border-stone-900 rounded-xl bg-stone-50/50 dark:bg-stone-900/30">
                    <Clock size={16} className="text-stone-400" />
                    <span className="text-xs font-bold text-stone-500">{t.activeTasks}: <span className="text-black dark:text-white ml-1">{totalTasks}</span></span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 border border-stone-100 dark:border-stone-900 rounded-xl bg-stone-50/50 dark:bg-stone-900/30">
                    <Star size={16} className="text-stone-400" />
                    <span className="text-xs font-bold text-stone-500">{t.starred}: <span className="text-black dark:text-white ml-1">{pinnedBoards.length}</span></span>
                </div>
            </div>
          </div>
        </div>

        {/* Search & Toolbar Compact */}
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-y border-stone-100 dark:border-stone-900">
            <div className="relative flex-1 w-full flex items-center gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder={t.searchBoards}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stone-50 dark:bg-stone-900/50 border border-transparent focus:border-stone-200 dark:focus:border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none transition-all text-black dark:text-white"
                    />
                </div>
                <div className="relative">
                  <select 
                      value={filterPermission}
                      onChange={(e) => setFilterPermission(e.target.value as any)}
                      className="bg-stone-50 dark:bg-stone-900/50 border border-transparent hover:border-stone-200 dark:hover:border-stone-800 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold focus:outline-none transition-all text-black dark:text-white cursor-pointer appearance-none outline-none"
                  >
                      <option value="all">{t.allProjects}</option>
                      <option value="owner">{t.owner}</option>
                      <option value="collaborator">{t.collaborator}</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                      <ChevronRight size={12} className="rotate-90" />
                  </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-950 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm' : 'text-stone-400 hover:text-black dark:hover:text-white'}`}
                >
                    <LayoutGrid size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm' : 'text-stone-400 hover:text-black dark:hover:text-white'}`}
                >
                    <ListIcon size={16} />
                </button>
            </div>
        </div>

        {/* Board List / Grid */}
        <div className="mt-4">
            {loading ? (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {[1, 2, 3, 4, 5, 6].map((sk) => (
                        <div key={sk} className="h-40 bg-stone-50 dark:bg-stone-900/50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredBoards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-stone-50/50 dark:bg-stone-900/20 rounded-3xl border-2 border-dashed border-stone-100 dark:border-stone-800">
                    <LayoutDashboard size={40} className="text-stone-300 mb-4" />
                    <h3 className="text-lg font-bold text-black dark:text-white">{searchQuery ? t.noResults : t.emptyStateTitle}</h3>
                    <p className="text-xs text-stone-500 mt-1">{searchQuery ? "Try searching for something else." : t.emptyStateDesc}</p>
                </div>
            ) : (
                <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {filteredBoards.map((board) => {
                        const isPinned = pinnedBoards.includes(board.id);
                        
                        return (
                        <div 
                          key={board.id}
                          className={`
                            group relative bg-white dark:bg-stone-900 border rounded-2xl transition-all duration-200
                            ${isPinned ? 'border-black dark:border-white shadow-sm' : 'border-stone-100 dark:border-stone-800/50'}
                            hover:border-black dark:hover:border-white hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5
                            ${viewMode === 'grid' ? 'p-5 flex flex-col h-44' : 'p-4 flex flex-row items-center'}
                          `}
                        >
                            {/* Options Menu - Top Right */}
                            <div className="absolute top-4 right-4 z-20">
                                <button 
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        setActiveBoardMenuId(activeBoardMenuId === board.id ? null : board.id); 
                                    }}
                                    className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-300 hover:text-black dark:hover:text-white transition-colors board-menu-trigger"
                                >
                                    <MoreVertical size={16} />
                                </button>
                                <AnimatePresence>
                                    {activeBoardMenuId === board.id && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                        className="absolute right-0 top-full mt-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl z-50 py-1.5 w-44 overflow-hidden board-menu-content"
                                    >
                                        <button onClick={(e) => togglePin(board.id, e)} className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-black dark:hover:text-white">
                                            <Star size={14} className={isPinned ? "fill-black text-black dark:fill-white dark:text-white" : ""} /> {isPinned ? t.unpin : t.pin}
                                        </button>
                                        <button onClick={(e) => copyBoardLink(board.id, e)} className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-black dark:hover:text-white">
                                            <LinkIcon size={14} /> {t.copyLink}
                                        </button>
                                        {board.permission === 'owner' && (
                                            <>
                                            <div className="h-px bg-stone-100 dark:bg-stone-900 my-1" />
                                            <button onClick={(e) => { e.preventDefault(); setEditingBoard(board); setActiveBoardMenuId(null); }} className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-black dark:hover:text-white">
                                                <Edit3 size={14} /> {t.rename}
                                            </button>
                                            <button onClick={(e) => { e.preventDefault(); handleDeleteBoard(board.id); setActiveBoardMenuId(null); }} className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-black dark:hover:text-white group/delete">
                                                <Trash2 size={14} className="group-hover/delete:text-black dark:group-hover/delete:text-white" /> {t.deleteBoard}
                                            </button>
                                            </>
                                        )}
                                    </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            <Link to={`/board/${board.id}`} className={`flex-1 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center ml-2'} min-w-0`}>
                                <div className={`${viewMode === 'grid' ? 'flex-1' : 'flex-1 pr-12'} min-w-0`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${board.permission === 'owner' ? 'bg-stone-100 dark:bg-stone-800 text-stone-500' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>
                                            {t[board.permission] || board.permission}
                                        </div>
                                        {isPinned && <Star size={12} className="text-black fill-black dark:text-white dark:fill-white" />}
                                    </div>
                                    <h3 className="text-lg font-bold text-black dark:text-white truncate group-hover:underline underline-offset-4 decoration-2 decoration-stone-200 dark:decoration-stone-700">
                                        {board.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                                        {board.taskCount || 0} {t.tasks}
                                    </p>
                                </div>
                                
                                <div className={`flex items-center gap-4 ${viewMode === 'grid' ? 'justify-between mt-auto' : 'ml-auto'}`}>
                                    <div className="flex -space-x-2">
                                        <div className="w-7 h-7 rounded-lg border border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${board.owner_avatar_seed || board.owner_username || board.owner_id}`} alt="Owner" />
                                        </div>
                                        {board.collaborators?.slice(0, 2).map((c: any) => (
                                            <div key={c.id} className="w-7 h-7 rounded-lg border border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar_seed || c.username}`} alt="Collaborator" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-400 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                        <ChevronRight size={14} strokeWidth={3} />
                                    </div>
                                </div>
                            </Link>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
      </main>

      {/* Modals - Simplified */}
      <AnimatePresence>
        {(showCreate || editingBoard) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white dark:bg-stone-950 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800"
                >
                    <h3 className="text-xl font-black text-black dark:text-white mb-1.5">
                        {showCreate ? t.createSpace : t.renameSpace}
                    </h3>
                    <p className="text-xs text-stone-500 mb-6 font-medium">
                        {showCreate ? t.spaceNameDesc : t.renameSpaceDesc}
                    </p>

                    <form onSubmit={showCreate ? handleCreateBoard : handleRenameBoard} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t.boardName}</label>
                            <input 
                                type="text" autoFocus 
                                value={showCreate ? newBoardName : editingBoard.name} 
                                onChange={(e) => showCreate ? setNewBoardName(e.target.value) : setEditingBoard({...editingBoard, name: e.target.value})}
                                placeholder={t.boardNamePlaceholder}
                                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => showCreate ? setShowCreate(false) : setEditingBoard(null)} 
                                className="flex-1 px-4 py-2.5 text-stone-500 hover:text-black dark:hover:text-white font-bold text-sm"
                            >
                                {t.cancel}
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-black text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                {showCreate ? t.create : t.save}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
