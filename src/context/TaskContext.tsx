import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
// Define Task type based on the Database type
type Task = Database['public']['Tables']['tasks']['Row'];
interface TaskContextType {
  tasks: Task[];
  selectedTask: Task | null;
  addTask: (title: string, status?: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  togglePriority: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: string) => Promise<void>;
  restoreTask: (id: string, targetStatus?: string) => Promise<void>;
  selectTask: (task: Task | null) => void;
  priorityCount: number;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  priorityLimitReachedId: string | null;
}
const TaskContext = createContext<TaskContextType | undefined>(undefined);
export function TaskProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityLimitReachedId, setPriorityLimitReachedId] = useState<string | null>(null);
  const {
    user,
    loading: authLoading
  } = useAuth();
  // Use a ref to track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  // Clear error message
  const clearError = () => setError(null);
  // Calculate priority count for today's tasks
  const priorityCount = tasks.filter(task => task.status === 'today' && task.priority).length;
  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;
    // Subscribe to changes
    const channel = supabase.channel('tasks-channel').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      console.log('Change received!', payload);
      // Refresh tasks when there's a change
      fetchTasks();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  // Fetch tasks when user is authenticated
  useEffect(() => {
    // Skip if auth is still loading or we don't have a user
    if (authLoading) return;
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    // Initial fetch
    fetchTasks();
  }, [user, authLoading]);
  // Function to fetch tasks
  const fetchTasks = async () => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('tasks').select('*').eq('user_id', user?.id || '').order('created_at', {
        ascending: false
      });
      if (error) {
        throw error;
      }
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };
  // Add a new task
  const addTask = async (title: string, status: string = 'inbox') => {
    if (!user || loading) return;
    clearError();
    try {
      const newTask = {
        title,
        status,
        priority: false,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const {
        data,
        error
      } = await supabase.from('tasks').insert(newTask).select().single();
      if (error) {
        throw error;
      }
      // Add the new task to state immediately for better UX
      if (data) {
        setTasks(prev => [data, ...prev]);
      }
    } catch (err: any) {
      console.error('Error adding task:', err);
      setError('Failed to add task: ' + (err.message || 'Unknown error'));
    }
  };
  // Select a task for detailed view
  const selectTask = (task: Task | null) => {
    setSelectedTask(task);
  };
  // Update task with partial data
  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user || loading) return;
    clearError();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // Add updated_at to the updates
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      ...updatesWithTimestamp
    } : t));
    // Update selectedTask if it's the one being updated
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? {
        ...prev,
        ...updatesWithTimestamp
      } : null);
    }
    try {
      const {
        error
      } = await supabase.from('tasks').update(updatesWithTimestamp).eq('id', id).eq('user_id', user.id);
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError('Failed to update task: ' + (err.message || 'Unknown error'));
      // Revert optimistic update
      setTasks(prev => prev.map(t => t.id === id ? task : t));
      if (selectedTask?.id === id) {
        setSelectedTask(task);
      }
    }
  };
  // Toggle priority status (limit to 3 for today's tasks)
  const togglePriority = async (id: string) => {
    if (!user || loading) return;
    clearError();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // If task is already priority or if we haven't reached the limit yet
    const newPriority = !task.priority;
    // Check if we can set priority
    if (newPriority && priorityCount >= 3 && task.status === 'today') {
      // Set the task ID that triggered the limit for animation
      setPriorityLimitReachedId(id);
      // Clear the animation trigger after a short delay
      setTimeout(() => {
        setPriorityLimitReachedId(null);
      }, 1000);
      return;
    }
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      priority: newPriority,
      updated_at: new Date().toISOString()
    } : t));
    // Update selectedTask if it's the one being updated
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? {
        ...prev,
        priority: newPriority,
        updated_at: new Date().toISOString()
      } : null);
    }
    try {
      const {
        error
      } = await supabase.from('tasks').update({
        priority: newPriority,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('user_id', user.id);
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error updating task priority:', err);
      setError('Failed to update task priority: ' + (err.message || 'Unknown error'));
      // Revert optimistic update
      setTasks(prev => prev.map(t => t.id === id ? {
        ...t,
        priority: task.priority
      } : t));
      // Revert selectedTask update if needed
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? {
          ...prev,
          priority: task.priority
        } : null);
      }
    }
  };
  // Move task between inbox and today
  const moveTask = async (id: string, status: string) => {
    if (!user || loading) return;
    clearError();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      status,
      updated_at: new Date().toISOString()
    } : t));
    // Update selectedTask if it's the one being updated
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? {
        ...prev,
        status,
        updated_at: new Date().toISOString()
      } : null);
    }
    try {
      const {
        error
      } = await supabase.from('tasks').update({
        status,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('user_id', user.id);
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error moving task:', err);
      setError('Failed to move task: ' + (err.message || 'Unknown error'));
      // Revert optimistic update
      setTasks(prev => prev.map(t => t.id === id ? {
        ...t,
        status: task.status
      } : t));
      // Revert selectedTask update if needed
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? {
          ...prev,
          status: task.status
        } : null);
      }
    }
  };
  // Restore task from done to inbox or today
  const restoreTask = async (id: string, targetStatus: string = 'inbox') => {
    if (!user || loading) return;
    clearError();
    const task = tasks.find(t => t.id === id);
    if (!task || task.status !== 'done') return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      status: targetStatus,
      updated_at: new Date().toISOString()
    } : t));
    // Update selectedTask if it's the one being updated
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? {
        ...prev,
        status: targetStatus,
        updated_at: new Date().toISOString()
      } : null);
    }
    try {
      const {
        error
      } = await supabase.from('tasks').update({
        status: targetStatus,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('user_id', user.id);
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error restoring task:', err);
      setError('Failed to restore task: ' + (err.message || 'Unknown error'));
      // Revert optimistic update
      setTasks(prev => prev.map(t => t.id === id ? {
        ...t,
        status: 'done'
      } : t));
      // Revert selectedTask update if needed
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? {
          ...prev,
          status: 'done'
        } : null);
      }
    }
  };
  // Mark task as complete (move to done)
  const completeTask = async (id: string) => {
    if (!user || loading) return;
    clearError();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      status: 'done',
      priority: false,
      updated_at: new Date().toISOString()
    } : t));
    // Update selectedTask if it's the one being updated
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? {
        ...prev,
        status: 'done',
        priority: false,
        updated_at: new Date().toISOString()
      } : null);
    }
    try {
      const {
        error
      } = await supabase.from('tasks').update({
        status: 'done',
        priority: false,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('user_id', user.id);
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error completing task:', err);
      setError('Failed to complete task: ' + (err.message || 'Unknown error'));
      // Revert optimistic update
      setTasks(prev => prev.map(t => t.id === id ? {
        ...t,
        status: task.status,
        priority: task.priority
      } : t));
      // Revert selectedTask update if needed
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? {
          ...prev,
          status: task.status,
          priority: task.priority
        } : null);
      }
    }
  };
  // Delete task
  const deleteTask = async (id: string) => {
    if (!user || loading) return;
    clearError();
    // Optimistic update
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      const {
        error
      } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task: ' + (err.message || 'Unknown error'));
      // Revert optimistic update if we have the task
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
      }
    }
  };
  return <TaskContext.Provider value={{
    tasks,
    selectedTask,
    addTask,
    updateTask,
    selectTask,
    togglePriority,
    completeTask,
    deleteTask,
    moveTask,
    restoreTask,
    priorityCount,
    loading,
    error,
    clearError,
    priorityLimitReachedId
  }}>
      {children}
    </TaskContext.Provider>;
}
export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}