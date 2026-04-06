import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, AlignLeft, Clock, Hash } from "lucide-react";
import { Id, Task } from "../types";
import { cn } from "../lib/utils";
import { format, isPast, isToday } from "date-fns";
import React, { memo } from "react";
import { useAppContext } from "../contexts/AppContext";
import { useDialog } from "../contexts/DialogContext";

interface Props {
  task: Task;
  deleteTask: (id: Id) => void;
  onClick: (task: Task) => void;
  isReadOnly?: boolean;
}

const PRIORITY_STYLES = {
  high:   { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  medium: { dot: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  low:    { dot: 'bg-green-500',  text: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20' },
  none:   { dot: 'bg-stone-400',  text: 'text-stone-500 dark:text-stone-400',   bg: 'bg-stone-100 dark:bg-stone-800' },
} as const;

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
    data: { type: "Task", task },
    disabled: isReadOnly,
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-20 bg-stone-100 dark:bg-stone-900 p-4 h-[140px] rounded-xl border-2 border-dashed border-black dark:border-white cursor-grabbing shrink-0"
      />
    );
  }

  const priorityKey = (task.priority ?? 'none') as keyof typeof PRIORITY_STYLES;
  const ps = PRIORITY_STYLES[priorityKey] ?? PRIORITY_STYLES.none;
  const priorityLabel = task.priority === 'high' ? t.high : task.priority === 'medium' ? t.medium : task.priority === 'low' ? t.low : '';

  const hasTags = task.tags?.length;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        "relative group rounded-xl p-4 h-[140px] shrink-0 flex flex-col cursor-grab select-none",
        "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:border-black dark:hover:border-white hover:shadow-lg hover:-translate-y-px",
        isReadOnly && "cursor-default hover:border-stone-200 dark:hover:border-stone-800 hover:shadow-sm hover:translate-y-0",
      )}
    >
      {/* Row 1: Priority + Tags + Delete */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold shrink-0", ps.bg, ps.text)}>
            <span className={cn("w-2 h-2 rounded-full shrink-0", ps.dot)} />
            {priorityLabel || 'Normal'}
          </div>
          {hasTags ? (
            <div className="flex items-center gap-1 overflow-hidden">
              {task.tags!.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[11px] font-bold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded truncate max-w-[60px]">
                  #{tag}
                </span>
              ))}
              {task.tags!.length > 2 && (
                <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500">+{task.tags!.length - 2}</span>
              )}
            </div>
          ) : null}
        </div>

        {!isReadOnly && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const ok = await dialog.confirm({ title: t.deleteTask, message: t.confirmDeleteTask, variant: 'danger' });
              if (ok) deleteTask(task.id);
            }}
            className="p-1 rounded text-stone-300 hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Row 2: Content */}
      <p className="text-sm font-bold text-black dark:text-white leading-snug line-clamp-2 flex-1">
        {task.content}
      </p>

      {/* Row 3: Meta footer */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-stone-100 dark:border-stone-800/50">
        {/* Left: avatar + description icon */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          {task.assigneeId && (
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigneeAvatarSeed || task.assigneeId}`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {task.description && <AlignLeft size={12} className="text-stone-300 dark:text-stone-600 flex-shrink-0" />}
        </div>

        {/* Right: due date */}
        {task.dueDate && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded flex-shrink-0",
            isOverdue
              ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
              : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50"
          )}>
            <Clock size={12} strokeWidth={2.5} />
            {format(new Date(task.dueDate), 'MM/dd')}
          </div>
        )}
      </div>
    </div>
  );
});
