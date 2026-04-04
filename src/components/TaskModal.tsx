import { useState, useEffect } from "react";
import { X, Calendar, Tag, AlignLeft, Flag, Trash2, Check, Lock, Clock } from "lucide-react";
import { Task, Priority, Id } from "../types";
import { cn } from "../lib/utils";
import { useAppContext } from "../contexts/AppContext";
import { useDialog } from "../contexts/DialogContext";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete?: (id: Id) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function TaskModal({ task, onUpdate, onDelete, onClose, isReadOnly = false }: Props) {
  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority | undefined>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [tags, setTags] = useState(task.tags?.join(", ") || "");
  
  const { t } = useAppContext();
  const dialog = useDialog();

  const handleSave = () => {
    if (isReadOnly) return;
    onUpdate({
      ...task,
      content,
      description,
      priority,
      dueDate: dueDate || undefined,
      tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
    });
    onClose();
  };

  const taskIdString = String(task.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div onClick={onClose} className="absolute inset-0 z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 rounded-xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden relative z-10 border border-stone-300 dark:border-stone-700"
      >
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-white dark:text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                {isReadOnly ? t.taskDetails : t.editTask}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">ID: {taskIdString.substring(0, 8)}</span>
                {isReadOnly && (
                  <span className="flex items-center gap-1 px-2 py-0.5 border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-xs rounded font-black uppercase tracking-widest bg-stone-50 dark:bg-stone-800"><Lock size={12} /> {t.readOnly}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-black dark:hover:text-white transition-all">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        
        {/* Modal Content - Split Layout */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row scrollbar-hide">
          {/* Main Area */}
          <div className="flex-1 p-8 space-y-10 border-r border-stone-200 dark:border-stone-800">
            {/* Title */}
            <div className="space-y-3">
              <label className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest ml-1">{t.taskTitle}</label>
              <textarea 
                rows={1}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                readOnly={isReadOnly}
                className={cn(
                  "w-full text-3xl font-black text-black dark:text-white border-none focus:ring-0 focus:outline-none bg-transparent placeholder:text-stone-200 resize-none",
                  isReadOnly && "cursor-default"
                )}
                placeholder={t.taskTitlePlaceholder}
                autoFocus={!isReadOnly}
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <AlignLeft size={16} strokeWidth={3} />
                {t.description}
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                readOnly={isReadOnly}
                className={cn(
                  "w-full min-h-[300px] border border-stone-200 dark:border-stone-800 focus:border-black dark:focus:border-white bg-stone-50 dark:bg-stone-950/30 rounded-xl p-6 text-black dark:text-white text-base leading-relaxed placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none transition-all font-medium",
                  isReadOnly && "cursor-default resize-none"
                )}
                placeholder={t.descriptionPlaceholder}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 p-8 bg-stone-50/50 dark:bg-black/20 space-y-10">
            {/* Priority */}
            <div className="space-y-4">
              <label className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Flag size={16} strokeWidth={3} />
                {t.priority}
              </label>
              <div className="flex flex-col gap-2">
                {(['low', 'medium', 'high'] as Priority[]).map(p => (
                  <button
                    key={p}
                    disabled={isReadOnly}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-black transition-all border",
                      priority === p 
                        ? p === 'high' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                          : p === 'medium' ? 'bg-stone-200 text-black border-stone-400 dark:bg-stone-700 dark:text-white dark:border-stone-500' 
                          : 'bg-white text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600'
                        : "bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white shadow-sm",
                      isReadOnly && priority !== p && "hidden"
                    )}
                  >
                    <span className="flex items-center gap-3 lowercase italic font-serif">
                      {t[p]}
                    </span>
                    {priority === p && <Check size={14} />}
                  </button>
                ))}
                {!isReadOnly && priority && (
                  <button onClick={() => setPriority(undefined)} className="text-xs font-bold text-stone-400 hover:text-black dark:hover:text-white transition-colors py-1 uppercase tracking-widest">{t.clear}</button>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-4">
              <label className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={16} strokeWidth={3} />
                {t.dueDate}
              </label>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                readOnly={isReadOnly}
                className={cn(
                  "w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:border-black dark:focus:border-white rounded-lg p-3 text-black dark:text-white text-sm font-black transition-all outline-none",
                  isReadOnly && "bg-transparent border-none p-0 ml-1"
                )}
              />
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <label className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Tag size={16} strokeWidth={3} />
                {t.tags}
              </label>
              {!isReadOnly ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 focus:border-black dark:focus:border-white rounded-lg p-3 text-black dark:text-white text-sm font-black transition-all outline-none"
                    placeholder={t.tagsPlaceholder}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 px-1">
                  {task.tags && task.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-200 rounded text-xs font-black uppercase tracking-wider border border-stone-300 dark:border-stone-600">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {!isReadOnly && (
          <div className="px-8 py-6 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between shadow-inner">
            <button 
              onClick={async () => { 
                const ok = await dialog.confirm({ title: t.deleteTask, message: t.confirmDeleteTask, variant: 'danger' });
                if(ok) { if(onDelete) onDelete(task.id); onClose(); } 
              }}
              className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-black dark:hover:text-white font-black text-sm transition-colors"
            >
              <Trash2 size={16} />
              {t.deleteTask}
            </button>

            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-600 dark:text-stone-300 font-black hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-black hover:opacity-80 transition-all active:scale-95 flex items-center gap-2"
              >
                <Check size={18} strokeWidth={3} />
                {t.saveChanges}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
