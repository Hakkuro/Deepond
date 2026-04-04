import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, AlignLeft, Calendar, Flag, Lock, MoreHorizontal } from "lucide-react";
import { Id, Task } from "../types";
import { cn } from "../lib/utils";
import { format, isPast, isToday } from "date-fns";
import React, { memo } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../contexts/AppContext";
import { useDialog } from "../contexts/DialogContext";

interface Props {
  task: Task;
  deleteTask: (id: Id) => void;
  onClick: (task: Task) => void;
  isReadOnly?: boolean;
}

export const TaskCard = memo(function TaskCard({ task, deleteTask, onClick, isReadOnly = false }: Props) {
  const { t } = useAppContext();
  const dialog = useDialog();
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: isReadOnly,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-20 bg-stone-100 dark:bg-stone-900 p-4 min-h-[100px] rounded-xl border-2 border-dashed border-black dark:border-white cursor-grabbing shadow-none"
      />
    );
  }

  const getPriorityInfo = (p?: string) => {
    if (p === 'high') return { color: 'text-white dark:text-black', bg: 'bg-black dark:bg-white', label: t.high };
    if (p === 'medium') return { color: 'text-black dark:text-white', bg: 'bg-stone-100 dark:bg-stone-700 border border-stone-300 dark:border-stone-600', label: t.medium };
    if (p === 'low') return { color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800', label: t.low };
    return null;
  };

  const priority = getPriorityInfo(task.priority);

  const renderDueDate = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded",
        isOverdue ? "text-white bg-black dark:bg-white dark:text-black" : "text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
      )}>
        <Calendar size={12} strokeWidth={4} />
        {format(date, 'MMM d')}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        "bg-white dark:bg-stone-800 p-4 items-start flex flex-col text-left rounded-xl border border-stone-300 dark:border-stone-700 shadow-sm hover:border-black dark:hover:border-white cursor-grab relative group hover:shadow-md",
        !isDragging && "duration-200",
        isReadOnly && "cursor-pointer"
      )}
    >
      <div className="flex w-full items-start justify-between gap-2 mb-3">
        <div className="flex gap-2 items-center flex-wrap">
          {priority && (
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest", priority.bg, priority.color)}>
              <Flag size={11} strokeWidth={3} />
              {priority.label}
            </div>
          )}
          {task.tags && task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded border border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 text-xs font-black uppercase tracking-widest bg-stone-50 dark:bg-stone-900"
            >
              {tag}
            </span>
          ))}
        </div>
        
        {!isReadOnly && (
            <button
                onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await dialog.confirm({
                      title: t.deleteTask,
                      message: t.confirmDeleteTask,
                      variant: 'danger'
                    });
                    if (ok) deleteTask(task.id);
                }}
                className="text-stone-400 hover:text-black dark:hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
                <Trash2 size={14} />
            </button>
        )}
      </div>
      
      <p className="w-full whitespace-pre-wrap text-black dark:text-white text-base leading-relaxed font-black tracking-tight">
        {task.content}
      </p>

      {(task.description || task.dueDate) && (
        <div className="mt-4 flex items-center justify-between w-full border-t border-stone-200 dark:border-stone-700 pt-3">
          <div className="flex items-center gap-3">
            {task.description && (
                <div className="flex items-center text-stone-300 dark:text-stone-600">
                    <AlignLeft size={14} />
                </div>
            )}
            {renderDueDate()}
          </div>
          
          <div className="text-stone-400 dark:text-stone-500">
             <MoreHorizontal size={14} strokeWidth={3} />
          </div>
        </div>
      )}
    </div>
  );
});
