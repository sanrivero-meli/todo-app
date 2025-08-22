import React, { useEffect, useState, useRef } from 'react';
import { X, Calendar, Tag, Clock, Trash, Archive, Inbox, CheckCircle, Star, AlertTriangle } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
export function TaskDetail() {
  const {
    selectedTask,
    selectTask,
    updateTask,
    deleteTask,
    completeTask,
    moveTask,
    togglePriority,
    priorityCount,
    priorityLimitReachedId
  } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showPriorityLimitTooltip, setShowPriorityLimitTooltip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  // Update local state when selectedTask changes
  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
      // Focus the title input when the panel opens
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 100);
    }
  }, [selectedTask]);
  // Check if this task triggered the priority limit
  const isPriorityLimitReached = selectedTask && priorityLimitReachedId === selectedTask.id;
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
  // Handle save
  const handleSave = async () => {
    if (!selectedTask) return;
    const updates: any = {};
    if (title !== selectedTask.title) updates.title = title;
    if (description !== (selectedTask.description || '')) updates.description = description;
    if (Object.keys(updates).length > 0) {
      setIsSaving(true);
      await updateTask(selectedTask.id, updates);
      setIsSaving(false);
    }
  };
  // Handle priority toggle
  const handlePriorityToggle = async () => {
    if (!selectedTask) return;
    await togglePriority(selectedTask.id);
  };
  // Handle status change
  const handleStatusChange = async (newStatus: 'inbox' | 'today' | 'done') => {
    if (!selectedTask) return;
    if (newStatus === 'done') {
      await completeTask(selectedTask.id);
    } else {
      await moveTask(selectedTask.id, newStatus);
    }
  };
  // Handle delete
  const handleDelete = async () => {
    if (!selectedTask) return;
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(selectedTask.id);
      selectTask(null);
    }
  };
  if (!selectedTask) return null;
  return <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => selectTask(null)} />
      {/* Sidebar Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border/30 shadow-xl z-50 transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center space-x-2 overflow-hidden">
            <h2 className="text-lg font-semibold truncate">
              {selectedTask.title}
            </h2>
            {/* Priority Star - Moved up to header */}
            <button onClick={handlePriorityToggle} disabled={selectedTask.status === 'done'} className={`relative p-1.5 rounded-full transition-colors ${selectedTask.priority ? 'text-yellow-600 bg-yellow-100' : selectedTask.status === 'today' && priorityCount >= 3 && !selectedTask.priority ? 'text-muted-foreground opacity-60 cursor-not-allowed' : 'text-muted-foreground hover:bg-secondary'} ${isPriorityLimitReached ? 'animate-shake' : ''}`} aria-label={selectedTask.priority ? 'Remove priority' : 'Mark as priority'}>
              <Star size={18} fill={selectedTask.priority ? 'currentColor' : 'none'} />
              {/* Priority limit tooltip */}
              {showPriorityLimitTooltip && selectedTask.status === 'today' && <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1.5 rounded-lg text-sm shadow-md z-20 whitespace-nowrap flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-yellow-700" />
                  <span>Max 3 priority tasks</span>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-100 border-b border-r border-yellow-300 rotate-45"></div>
                </div>}
            </button>
          </div>
          <button onClick={() => selectTask(null)} className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Close task details">
            <X size={20} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <input id="task-title" ref={titleInputRef} type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={() => handleSave()} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Task title..." aria-label="Task title" />
            {isSaving && <p className="text-xs text-primary mt-1">Saving changes...</p>}
          </div>
          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea id="task-description" value={description} onChange={e => setDescription(e.target.value)} onBlur={() => handleSave()} rows={4} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Add a description..." aria-label="Task description" />
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleStatusChange('inbox')} className={`p-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 ${selectedTask.status === 'inbox' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary/50'}`} aria-label="Move to inbox" aria-pressed={selectedTask.status === 'inbox'}>
                <Inbox size={18} />
                <span className="text-xs">Inbox</span>
              </button>
              <button onClick={() => handleStatusChange('today')} className={`p-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 ${selectedTask.status === 'today' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary/50'}`} aria-label="Move to today" aria-pressed={selectedTask.status === 'today'}>
                <CheckCircle size={18} />
                <span className="text-xs">Today</span>
              </button>
              <button onClick={() => handleStatusChange('done')} className={`p-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 ${selectedTask.status === 'done' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary/50'}`} aria-label="Mark as done" aria-pressed={selectedTask.status === 'done'}>
                <Archive size={18} />
                <span className="text-xs">Done</span>
              </button>
            </div>
          </div>
          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock size={16} className="mr-2" />
              Created {new Date(selectedTask.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        {/* Footer Actions */}
        <div className="border-t border-border/30 p-4">
          <div className="flex space-x-2">
            <button onClick={handleDelete} className="p-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors" aria-label="Delete task">
              <Trash size={18} />
            </button>
            <button onClick={() => selectTask(null)} className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </>;
}