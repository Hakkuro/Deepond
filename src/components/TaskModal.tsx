import { useState, useEffect } from "react";
import { X, Calendar, Tag, AlignLeft, Flag, Trash2, Check, Lock, Clock, User } from "lucide-react";
import { Task, Priority, Id } from "../types";
import { cn } from "../lib/utils";
import { useAppContext } from "../contexts/AppContext";
import { useDialog } from "../contexts/DialogContext";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import api from "../lib/api";

interface Props {
  task: Task;
  boardId: string;
  onUpdate: (task: Task) => void;
  onDelete?: (id: Id) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function TaskModal({ task, boardId, onUpdate, onDelete, onClose, isReadOnly = false }: Props) {
  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority | undefined>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [tags, setTags] = useState(task.tags?.join(", ") || "");
  const [assigneeId, setAssigneeId] = useState<string | undefined>(task.assigneeId);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  
  const { t } = useAppContext();
  const dialog = useDialog();

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const res = await api.get(`/boards/${boardId}/collaborators`);
        setCollaborators(res.data);
      } catch (err) {
        console.error('Failed to fetch collaborators:', err);
      }
    };
    fetchCollaborators();
  }, [boardId]);

  const handleSave = () => {
    if (isReadOnly) return;
    onUpdate({
      ...task,
      content,
      description,
      priority,
      assigneeId,
      dueDate: dueDate || undefined,
      tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
    });
    onClose();
  };

  const taskIdString = String(task.id);

  return (
    <Modal isOpen={true} onClose={onClose} hideCloseButton noPadding className="max-w-5xl max-h-[90vh]">
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
            {/* Assignee */}
            <div className="space-y-4">
              <label className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={16} strokeWidth={3} />
                {t.assignTo}
              </label>
              <div className="space-y-2">
                {collaborators.map(c => (
                  <button
                    key={c.id}
                    disabled={isReadOnly}
                    onClick={() => setAssigneeId(assigneeId === c.id ? undefined : c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left",
                      assigneeId === c.id 
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md scale-[1.02]" 
                        : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white",
                      isReadOnly && assigneeId !== c.id && "hidden"
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 overflow-hidden flex-shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar_seed || c.id}`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold truncate">{c.username}</span>
                    {assigneeId === c.id && <Check size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

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
                        ? p === 'high' ? 'bg-purple-600 text-white border-purple-800' 
                          : p === 'medium' ? 'bg-blue-600 text-white border-blue-800' 
                          : 'bg-green-600 text-white border-green-800'
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
          <div className="px-8 py-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 flex items-center justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
            <button 
              onClick={async () => { 
                const ok = await dialog.confirm({ title: t.deleteTask, message: t.confirmDeleteTask, variant: 'danger' });
                if(ok) { if(onDelete) onDelete(task.id); onClose(); } 
              }}
              className="flex items-center gap-2 text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-500 font-bold text-sm transition-colors uppercase tracking-widest"
            >
              <Trash2 size={16} />
              {t.deleteTask}
            </button>

            <div className="flex gap-4">
              <Button onClick={onClose} variant="outline" className="px-6 border-stone-300 dark:border-stone-700">
                {t.cancel}
              </Button>
              <Button onClick={handleSave} className="px-8">
                <Check size={18} strokeWidth={3} />
                {t.saveChanges}
              </Button>
            </div>
          </div>
        )}
    </Modal>
  );
}
