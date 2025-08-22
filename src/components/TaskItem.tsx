import React, { useEffect, useState } from 'react';
import { Star, Trash, Check, MoveRight, MoveLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Tooltip } from './Tooltip';
interface TaskItemProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: boolean;
  };
}
export function TaskItem({
  task
}: TaskItemProps) {
  const {
    togglePriority,
    completeTask,
    deleteTask,
    moveTask,
    restoreTask,
    selectTask,
    priorityLimitReachedId,
    priorityCount
  } = useTasks();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [showPriorityLimitTooltip, setShowPriorityLimitTooltip] = useState(false);
  // Check if this task triggered the priority limit
  const isPriorityLimitReached = priorityLimitReachedId === task.id;
  // Show tooltip when priority limit is reached for this task
  useEffect(() => {
    if (isPriorityLimitReached) {
      setShowPriorityLimitTooltip(true);
      const timer = setTimeout(() => {
        setShowPriorityLimitTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPriorityLimitReached]);
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (Math.abs(diff) < 100) {
      setSwipeOffset(diff);
    }
  };
  const handleTouchEnd = () => {
    if (swipeOffset > 50) {
      // Swipe right - complete task or restore if already done
      if (task.status === 'done') {
        restoreTask(task.id, 'inbox');
      } else {
        completeTask(task.id);
      }
    } else if (swipeOffset < -50) {
      // Swipe left - delete task
      deleteTask(task.id);
    }
    setSwipeOffset(0);
  };
  // Calculate background opacity based on swipe distance
  const rightOpacity = Math.min(swipeOffset / 50, 1);
  const leftOpacity = Math.min(Math.abs(swipeOffset) / 50, 1);
  return <li className={`relative bg-card rounded-xl shadow-sm overflow-hidden group w-full ${isPriorityLimitReached ? 'animate-shake' : ''}`} style={{
    transform: `translateX(${swipeOffset}px)`,
    transition: swipeOffset === 0 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
  }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Action indicators */}
      <div className="absolute inset-y-0 left-0 flex items-center justify-center bg-green-600 text-white w-16 opacity-0 transition-opacity" style={{
      opacity: rightOpacity
    }}>
        {task.status === 'done' ? <RefreshCw size={20} /> : <Check size={20} />}
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600 text-white w-16 opacity-0 transition-opacity" style={{
      opacity: leftOpacity
    }}>
        <Trash size={20} />
      </div>
      {/* Priority limit tooltip */}
      {showPriorityLimitTooltip && task.status === 'today' && <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1.5 rounded-lg text-sm shadow-md z-20 whitespace-nowrap flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1.5 text-yellow-700" />
          <span>Max 3 priority tasks</span>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-100 border-b border-r border-yellow-300 rotate-45"></div>
        </div>}
      {/* Task content */}
      <div className="flex items-center p-4 bg-card relative z-10 w-full">
        <div className="flex-1 min-w-0">
          <p className={`${task.status === 'done' ? 'line-through text-muted-foreground' : ''} ${task.priority ? 'font-medium' : ''} truncate cursor-pointer hover:text-primary transition-colors`} onClick={() => selectTask(task)}>
            {task.title}
          </p>
          {task.description && <p className="text-sm text-muted-foreground truncate mt-1">
              {task.description}
            </p>}
        </div>
        <div className="flex items-center shrink-0 ml-2">
          {task.status === 'done' ? <>
              <Tooltip content="Restore to inbox">
                <button onClick={() => restoreTask(task.id, 'inbox')} className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Restore to inbox">
                  <RefreshCw size={18} />
                </button>
              </Tooltip>
              <Tooltip content="Delete task">
                <button onClick={() => deleteTask(task.id)} className="ml-2 p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Delete task">
                  <Trash size={18} />
                </button>
              </Tooltip>
            </> : <>
              {task.status === 'inbox' ? <Tooltip content="Move to today">
                  <button onClick={() => moveTask(task.id, 'today')} className="mr-2 p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Move to today">
                    <MoveRight size={18} />
                  </button>
                </Tooltip> : <Tooltip content="Move to inbox">
                  <button onClick={() => moveTask(task.id, 'inbox')} className="mr-2 p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Move to inbox">
                    <MoveLeft size={18} />
                  </button>
                </Tooltip>}
              <Tooltip content={task.priority ? 'Remove priority' : task.status === 'today' && priorityCount >= 3 ? 'Priority limit reached (3/3)' : 'Mark as priority'}>
                <button onClick={() => togglePriority(task.id)} className={`p-1.5 rounded-full transition-colors ${task.priority ? 'text-yellow-600 bg-yellow-100' : task.status === 'today' && priorityCount >= 3 ? 'text-muted-foreground opacity-60 cursor-not-allowed' : 'text-muted-foreground hover:bg-secondary'}`} aria-label={task.priority ? 'Remove priority' : 'Mark as priority'}>
                  <Star size={18} fill={task.priority ? 'currentColor' : 'none'} />
                </button>
              </Tooltip>
              <Tooltip content="Mark as done">
                <button onClick={() => completeTask(task.id)} className="ml-2 p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Mark as done">
                  <Check size={18} />
                </button>
              </Tooltip>
            </>}
        </div>
      </div>
    </li>;
}