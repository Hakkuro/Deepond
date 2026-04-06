import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useMemo, useState, useRef, useEffect, memo } from "react";
import { Plus, Trash2, Lock, MoreHorizontal, Check, X, GripVertical } from "lucide-react";
import { Column, Id, Task } from "../types";
import { TaskCard } from "./TaskCard";
import { useAppContext } from "../contexts/AppContext";
import { useDialog } from "../contexts/DialogContext";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  column: Column;
  tasks: Task[];
  createTask: (columnId: Id, content?: string) => void;
  deleteTask: (id: Id) => void;
  deleteColumn: (id: Id) => void;
  updateColumn: (id: Id, title: string) => void;
  onTaskClick: (task: Task) => void;
  isReadOnly?: boolean;
}

export const BoardColumn = memo(function BoardColumn({
  column,
  tasks,
  createTask,
  deleteTask,
  deleteColumn,
  updateColumn,
  onTaskClick,
  isReadOnly = false,
}: Props) {
  const { t } = useAppContext();
  const dialog = useDialog();
  const [editMode, setEditMode] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [titleInput, setTitleInput] = useState(column.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const taskIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
    disabled: isReadOnly || editMode || isAddingTask,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  useEffect(() => {
    setTitleInput(column.title);
  }, [column.title]);

  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  const handleTitleUpdate = () => {
    if (titleInput.trim() && titleInput !== column.title) {
      updateColumn(column.id, titleInput);
    }
    setEditMode(false);
  };

  const handleAddTask = () => {
    if (newTaskContent.trim()) {
      createTask(column.id, newTaskContent);
      setNewTaskContent("");
      setIsAddingTask(false);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-stone-50/50 dark:bg-stone-900/50 border border-stone-300 dark:border-stone-700 w-[320px] h-[750px] max-h-[750px] rounded-xl flex flex-col shrink-0"
      ></div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-stone-900 w-[320px] h-full max-h-[750px] rounded-xl flex flex-col border border-stone-300 dark:border-stone-700 shrink-0 group/col relative shadow-sm"
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        className={`h-[60px] shrink-0 ${isReadOnly ? 'cursor-default' : 'cursor-grab'} px-4 font-black text-black dark:text-white flex items-center justify-between border-b border-stone-200 dark:border-stone-800`}
      >
        <div className="flex gap-3 items-center w-full min-w-0">
            <div className="flex justify-center items-center bg-black dark:bg-white px-2 py-0.5 text-xs rounded font-black text-white dark:text-black border border-black dark:border-white">
                {tasks.length}
            </div>
          
            {editMode ? (
                <input
                className="bg-stone-50 dark:bg-stone-950 border border-black dark:border-white rounded px-2 py-1 text-sm w-full outline-none"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                autoFocus
                onBlur={handleTitleUpdate}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleUpdate();
                    if (e.key === "Escape") {
                        setTitleInput(column.title);
                        setEditMode(false);
                    }
                }}
                />
            ) : (
                <span onClick={() => !isReadOnly && setEditMode(true)} className="hover:underline underline-offset-4 cursor-pointer truncate text-base font-black tracking-tight">
                    {column.title}
                </span>
            )}
        </div>

        {!isReadOnly && !editMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
            <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const ok = await dialog.confirm({
                    title: t.deleteColumn,
                    message: t.deleteConfirm,
                    variant: 'danger'
                  });
                  if (ok) deleteColumn(column.id);
                }}
                className="text-stone-500 hover:text-black dark:hover:text-white transition-all p-1.5 rounded"
            >
                <Trash2 size={16} />
            </button>
            <div className="text-stone-400 dark:text-stone-500">
                <GripVertical size={16} />
            </div>
          </div>
        )}
        {isReadOnly && <Lock size={12} className="text-stone-300 dark:text-stone-600" />}
      </div>

      {/* Task List */}
      <div className="flex flex-grow flex-col gap-3 px-3 py-4 overflow-x-hidden overflow-y-auto scrollbar-hide">
        <SortableContext items={taskIds}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              deleteTask={deleteTask}
              onClick={onTaskClick}
              isReadOnly={isReadOnly}
            />
          ))}
        </SortableContext>
        
        {/* Inline Adding Draft */}
        <AnimatePresence>
            {isAddingTask && (
                <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-black dark:border-white shadow-xl"
                >
                    <textarea 
                        ref={inputRef}
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        placeholder={t.whatToDo}
                        rows={3}
                        className="w-full bg-transparent border-none outline-none text-base font-medium text-black dark:text-white resize-none placeholder:text-stone-400"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddTask();
                            }
                            if (e.key === 'Escape') setIsAddingTask(false);
                        }}
                    />
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <button 
                            onClick={() => setIsAddingTask(false)}
                            className="text-sm font-bold text-stone-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={handleAddTask}
                            className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded text-xs font-black hover:opacity-80 transition-all active:scale-95"
                        >
                            {t.add}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      {/* Column Footer */}
      {!isReadOnly && !isAddingTask && (
        <div className="p-3">
             <button
                className="w-full h-11 flex gap-2 items-center justify-center bg-stone-50 dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg text-stone-500 text-sm font-black hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all shadow-sm active:scale-[0.98]"
                onClick={() => setIsAddingTask(true)}
            >
                <Plus size={16} strokeWidth={4} />
                {t.addTask}
            </button>
        </div>
      )}
    </div>
  );
});
