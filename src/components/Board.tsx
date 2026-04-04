import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column, Id, Task } from "../types";
import { BoardColumn } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { Plus, Loader2, Lock } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import api from "../lib/api";
import { motion } from "framer-motion";

interface Props {
  boardId: string;
  searchQuery: string;
  permission: 'owner' | 'editor' | 'viewer';
}

export function KanbanBoard({ boardId, searchQuery, permission }: Props) {
  const { t } = useAppContext();
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Use refs for values that are needed in callbacks but shouldn't trigger callback recreation
  const columnsRef = useRef(columns);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const isReadOnly = permission === 'viewer';

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/boards/${boardId}`);
      setColumns(res.data.columns);
    } catch (err) {
      console.error('Failed to fetch board:', err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const allTasks = useMemo(() => {
    return columns.flatMap(col => (col as any).tasks || []);
  }, [columns]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return allTasks;
    const lowerQuery = searchQuery.toLowerCase();
    return allTasks.filter((t: Task) => 
      t.content.toLowerCase().includes(lowerQuery) || 
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [allTasks, searchQuery]);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const createTask = useCallback(async (columnId: Id, content: string = t.newTask) => {
    if (isReadOnly) return;
    try {
      await api.post('/boards/tasks', { 
        boardId, 
        columnId, 
        content,
        position: ((columnsRef.current.find(c => c.id === columnId) as any).tasks?.length || 0)
      });
      fetchBoard();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [boardId, isReadOnly, t.newTask, fetchBoard]);

  const deleteTask = useCallback(async (id: Id) => {
    if (isReadOnly) return;
    try {
      await api.delete(`/boards/tasks/${id}?boardId=${boardId}`);
      fetchBoard();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [boardId, isReadOnly, fetchBoard]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (isReadOnly) return;
    try {
      await api.put(`/boards/tasks/${updatedTask.id}`, { ...updatedTask, boardId });
      fetchBoard();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, [boardId, isReadOnly, fetchBoard]);

  const createNewColumn = useCallback(async () => {
    if (isReadOnly) return;
    try {
      await api.post(`/boards/${boardId}/columns`, { 
        title: t.newColumn,
        position: columnsRef.current.length
      });
      fetchBoard();
    } catch (err) {
      console.error('Failed to create column:', err);
    }
  }, [boardId, isReadOnly, t.newColumn, fetchBoard]);

  const deleteColumn = useCallback(async (id: Id) => {
    if (isReadOnly) return;
    try {
      await api.delete(`/boards/columns/${id}?boardId=${boardId}`);
      fetchBoard();
    } catch (err) {
      console.error('Failed to delete column:', err);
    }
  }, [boardId, isReadOnly, fetchBoard]);

  const updateColumn = useCallback(async (id: Id, title: string) => {
    if (isReadOnly) return;
    try {
      await api.put(`/boards/columns/${id}`, { title, boardId });
      fetchBoard();
    } catch (err) {
      console.error('Failed to update column:', err);
    }
  }, [boardId, isReadOnly, fetchBoard]);

  function onDragStart(event: DragStartEvent) {
    if (isReadOnly) return;
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    if (isReadOnly) return;
    
    const { active, over } = event;
    
    // Save state before clearing active items to use them in API calls
    const activeType = active.data.current?.type;
    const overType = over?.data.current?.type;
    const overId = over?.id;

    setActiveColumn(null);
    setActiveTask(null);

    if (!over) return;

    if (activeType === "Column") {
      const activeIndex = columns.findIndex((col) => col.id === active.id);
      let overIndex = columns.findIndex((col) => col.id === over.id);
      
      if (overIndex === -1 && overType === "Task") {
          const overColumnId = (over.data.current as any).task.columnId;
          overIndex = columns.findIndex((col) => col.id === overColumnId);
      }

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
      
      // Optimistic update
      setColumns(cols => arrayMove(cols, activeIndex, overIndex));

      try {
        await api.put(`/boards/columns/${active.id}/position?boardId=${boardId}`, { 
            boardId,
            position: overIndex 
        });
      } catch (err) {
        console.error('Failed to update column position:', err);
        fetchBoard(); // Rollback on error
      }
    }

    if (activeType === "Task") {
        const findColumnByTaskId = (taskId: Id) => {
            return columns.find(col => (col as any).tasks?.some((t: any) => t.id === taskId));
        };

        const overColumnId = overType === "Column" ? overId : (over.data.current?.task.columnId || findColumnByTaskId(over.id)?.id);
        const column = columns.find(c => c.id === overColumnId);
        
        if (!column) return;

        const tasksInCol = (column as any).tasks || [];
        const overIndex = tasksInCol.findIndex((t: any) => t.id === active.id);

        try {
            await api.put(`/boards/tasks/${active.id}?boardId=${boardId}`, { 
                columnId: overColumnId, 
                boardId,
                position: overIndex === -1 ? tasksInCol.length : overIndex
            });
        } catch (err) {
            console.error('Failed to update task position:', err);
            fetchBoard(); // Rollback on error
        }
    }
  }

  function onDragOver(event: DragOverEvent) {
    if (isReadOnly) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isActiveATask) return;

    // Find the current columns for active and over items from state
    const findColumnByTaskId = (taskId: Id) => {
        return columns.find(col => (col as any).tasks?.some((t: any) => t.id === taskId));
    };

    const activeCol = findColumnByTaskId(activeId);
    if (!activeCol) return;

    const overColumnId = isOverAColumn ? overId : (over.data.current?.task.columnId || findColumnByTaskId(overId)?.id);
    if (!overColumnId) return;

    if (activeCol.id !== overColumnId) {
        setColumns(prev => {
            const activeColInPrev = prev.find(c => c.id === activeCol.id);
            const overColInPrev = prev.find(c => c.id === overColumnId);
            if (!activeColInPrev || !overColInPrev) return prev;

            const activeTasks = [...(activeColInPrev as any).tasks];
            const overTasks = [...(overColInPrev as any).tasks];
            
            const activeTaskIndex = activeTasks.findIndex(t => t.id === activeId);
            if (activeTaskIndex === -1) return prev;

            const [movedTask] = activeTasks.splice(activeTaskIndex, 1);
            
            // Update the task's columnId for the next calculation
            const updatedTask = { ...movedTask, columnId: overColumnId };
            
            let newIndex;
            if (isOverAColumn) {
                newIndex = overTasks.length;
            } else {
                const overTaskIndexInOverTasks = overTasks.findIndex(t => t.id === overId);
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > (over.rect.top + over.rect.height);
                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overTaskIndexInOverTasks >= 0 ? overTaskIndexInOverTasks + modifier : overTasks.length;
            }
            
            overTasks.splice(newIndex, 0, updatedTask);

            return prev.map(c => {
                if (c.id === activeCol.id) return { ...c, tasks: activeTasks };
                if (c.id === overColumnId) return { ...c, tasks: overTasks };
                return c;
            }) as any;
        });
    } else {
        // Same column reordering
        setColumns(prev => {
            const column = prev.find(c => c.id === activeCol.id);
            if (!column) return prev;

            const tasks = [...(column as any).tasks];
            const activeIndex = tasks.findIndex(t => t.id === activeId);
            const overIndex = tasks.findIndex(t => t.id === overId);

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                const newTasks = arrayMove(tasks, activeIndex, overIndex);
                return prev.map(c => c.id === activeCol.id ? { ...c, tasks: newTasks } : c) as any;
            }
            return prev;
        });
    }
  }

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-black">
      <Loader2 className="animate-spin text-black dark:text-white" size={32} />
    </div>
  );

  return (
    <div className="flex h-full w-full items-start overflow-x-auto overflow-y-hidden p-10 scrollbar-hide bg-white dark:bg-black">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="flex gap-8 h-full">
          <SortableContext items={columnsId}>
            {columns.map((col) => {
              const columnTasks = searchQuery.trim() 
                ? filteredTasks.filter((task) => task.columnId === col.id)
                : (col as any).tasks || [];
              
              return (
                <BoardColumn
                  key={col.id}
                  column={col}
                  tasks={columnTasks}
                  createTask={createTask}
                  deleteTask={deleteTask}
                  deleteColumn={deleteColumn}
                  updateColumn={updateColumn}
                  onTaskClick={isReadOnly ? () => {} : setEditingTask}
                  isReadOnly={isReadOnly}
                />
              );
            })}
          </SortableContext>
          {!isReadOnly && (
            <button
                onClick={createNewColumn}
                className="h-[60px] w-[320px] min-w-[320px] cursor-pointer rounded-xl bg-stone-50 dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 p-4 hover:border-black dark:hover:border-white transition-all flex gap-3 items-center justify-center text-stone-400 font-bold shrink-0"
            >
                <Plus size={20} strokeWidth={3} />
                {t.addColumn}
            </button>
          )}
          {isReadOnly && (
             <div className="h-[60px] w-[320px] min-w-[320px] rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-4 flex gap-2 items-center justify-center text-stone-300 dark:text-stone-600 font-bold shrink-0 italic">
                <Lock size={16} /> {t.readOnly}
             </div>
          )}
        </div>

        <DragOverlay adjustScale={false}>
          {activeColumn && (
            <div className="opacity-90 shadow-2xl rounded-xl overflow-hidden border border-black dark:border-white ring-4 ring-black/5">
                <BoardColumn
                column={activeColumn}
                tasks={filteredTasks.filter((task) => task.columnId === activeColumn.id)}
                createTask={createTask}
                deleteTask={deleteTask}
                deleteColumn={deleteColumn}
                updateColumn={updateColumn}
                onTaskClick={setEditingTask}
                isReadOnly={isReadOnly}
                />
            </div>
          )}
          {activeTask && (
            <div className="opacity-95 shadow-2xl rounded-xl overflow-hidden border border-black dark:border-white ring-4 ring-black/5">
                <TaskCard
                task={activeTask}
                deleteTask={deleteTask}
                onClick={setEditingTask}
                isReadOnly={isReadOnly}
                />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <TaskModal 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
          onUpdate={updateTask} 
          onDelete={deleteTask}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}
