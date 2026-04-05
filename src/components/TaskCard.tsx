import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, AlignLeft, Calendar, Flag, MoreHorizontal, Clock } from "lucide-react";
import { Id, Task } from "../types";
import { cn } from "../lib/utils";
import { format, isPast, isToday } from "date-fns";
import React, { memo } from "react";
import { useAppContext } from "../contexts/AppContext";
import { useDialog } from "../contexts/DialogContext";
import { Card } from "./ui/Card";

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
    if (p === 'high') return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-500', label: t.high };
    if (p === 'medium') return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', label: t.medium };
    if (p === 'low') return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', label: t.low };
    return { color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-100 dark:bg-stone-800', border: 'border-stone-400', label: 'Common' };
  };

  const priority = getPriorityInfo(task.priority);

  return (
    <Card
      ref={setNodeRef as any}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      hoverable={!isReadOnly}
      className={cn(
        "p-3 flex flex-col justify-between text-left cursor-grab relative group h-[120px] overflow-hidden",
        isReadOnly && "cursor-pointer hover:border-transparent cursor-default",
        !isDragging && "duration-200",
        "border-l-4",
        priority.border
      )}
    >
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        <div className="flex w-full items-start justify-between gap-2">
            <span className={cn("text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded", priority.bg, priority.color)}>
              {priority.label}
            </span>
            
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
                    className="text-stone-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 p-0.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
        
        <p className="w-full text-black dark:text-white text-sm leading-snug font-bold line-clamp-2">
          {task.content}
        </p>
      </div>

      <div className="mt-2 flex items-end justify-between w-full pt-2 border-t border-stone-100 dark:border-stone-800/50">
          {/* Bottom Left: Assignee */}
          <div className="flex items-center gap-1.5 min-w-0">
            {task.assigneeId ? (
              <>
                <div className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white dark:border-stone-800">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigneeAvatarSeed || task.assigneeId}`} 
                      alt="avatar" 
                      className="w-full h-full object-cover"
                    />
                </div>
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 truncate max-w-[80px]">
                    {task.assigneeName}
                </span>
                {task.description && <AlignLeft size={10} className="text-stone-300 flex-shrink-0" />}
              </>
            ) : (
                <div className="h-5 flex items-center">
                   {task.description && <AlignLeft size={10} className="text-stone-300" />}
                </div>
            )}
          </div>
          
          {/* Bottom Right: Due Date */}
          {task.dueDate && (
             <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded flex-shrink-0",
                isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
                  ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20" 
                  : "text-stone-500 dark:text-stone-400"
              )}>
                <Clock size={10} strokeWidth={3} />
                {format(new Date(task.dueDate), 'yyyy-MM-dd')}
              </div>
          )}
      </div>
    </Card>
  );
});
