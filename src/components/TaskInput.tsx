import React, { useState } from 'react';
import { Plus, CalendarCheck } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Tooltip } from './Tooltip';
interface TaskInputProps {
  activeView: string;
}
export function TaskInput({
  activeView
}: TaskInputProps) {
  const [taskText, setTaskText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [markForToday, setMarkForToday] = useState(false);
  const {
    addTask
  } = useTasks();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskText.trim()) {
      // If we're in the today view or the markForToday is checked, add to today
      const targetStatus = activeView === 'today' || markForToday ? 'today' : 'inbox';
      addTask(taskText.trim(), targetStatus);
      setTaskText('');
      setMarkForToday(false);
    }
  };
  return <form onSubmit={handleSubmit} className="mb-8 mt-2">
      <div className={`flex items-center bg-card rounded-xl border overflow-hidden shadow-sm transition-all duration-200 ${isFocused ? 'border-primary/30 shadow-md' : 'border-border/50'}`}>
        <input type="text" value={taskText} onChange={e => setTaskText(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} placeholder="Add a task..." className="flex-1 px-5 py-3.5 bg-transparent focus:outline-none text-sm" aria-label="Task name" />
        {/* Only show the "for today" option when in the inbox view */}
        {activeView === 'inbox' && <Tooltip content={markForToday ? 'Remove from today' : 'Add to today'}>
            <button type="button" onClick={() => setMarkForToday(!markForToday)} className={`p-3 transition-colors ${markForToday ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`} aria-label={markForToday ? 'Remove from today' : 'Add to today'}>
              <CalendarCheck size={20} fill={markForToday ? 'currentColor' : 'none'} />
            </button>
          </Tooltip>}
        <Tooltip content="Add task">
          <button type="submit" disabled={!taskText.trim()} className={`p-3.5 text-primary transition-colors ${taskText.trim() ? 'opacity-100 hover:bg-secondary' : 'opacity-50 cursor-not-allowed'}`} aria-label="Add task">
            <Plus size={20} />
          </button>
        </Tooltip>
      </div>
    </form>;
}