import React from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';
import { Star, X } from 'lucide-react';
interface TaskListProps {
  view: string;
}
export function TaskList({
  view
}: TaskListProps) {
  const {
    tasks,
    priorityCount,
    loading,
    error,
    clearError
  } = useTasks();
  // Show loading state
  if (loading) {
    return <div className="flex flex-col items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      </div>;
  }
  // Show error state
  if (error) {
    return <div className="flex flex-col items-center justify-center py-10 bg-red-50 rounded-xl border border-red-200 text-red-600">
        <div className="flex items-center justify-between w-full px-4">
          <p className="text-sm">{error}</p>
          <button onClick={clearError} className="p-1 hover:bg-red-100 rounded-full" aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
        <button className="mt-2 text-xs underline" onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>;
  }
  // Filter tasks based on the current view
  const filteredTasks = tasks.filter(task => {
    if (view === 'today') return task.status === 'today';
    if (view === 'inbox') return task.status === 'inbox';
    if (view === 'done') return task.status === 'done';
    return false;
  });
  // Sort tasks: priority tasks first, then by creation date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    // Sort by creation date (newest first)
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });
  if (sortedTasks.length === 0) {
    return <EmptyState view={view} />;
  }
  return <div>
      {view === 'today' && <div className="mb-4 flex items-center">
          <Star size={16} className="mr-2 text-yellow-500" />
          <h2 className="text-sm font-medium">
            Priority Tasks{' '}
            <span className="text-muted-foreground">({priorityCount}/3)</span>
          </h2>
        </div>}
      <ul className="space-y-3">
        {sortedTasks.map(task => <TaskItem key={task.id} task={task} />)}
      </ul>
    </div>;
}