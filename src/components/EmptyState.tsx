import React from 'react';
import { CheckCircle, Inbox, Archive } from 'lucide-react';
interface EmptyStateProps {
  view: string;
}
export function EmptyState({
  view
}: EmptyStateProps) {
  let icon;
  let message;
  let description;
  switch (view) {
    case 'today':
      icon = <CheckCircle size={48} className="text-primary/40" />;
      message = 'All clear for today';
      description = "You've completed all your tasks for today. Nice work!";
      break;
    case 'inbox':
      icon = <Inbox size={48} className="text-primary/40" />;
      message = 'Your inbox is empty';
      description = 'Add tasks to get started with your planning';
      break;
    case 'done':
      icon = <Archive size={48} className="text-primary/40" />;
      message = 'No completed tasks yet';
      description = 'Tasks you complete will appear here';
      break;
    default:
      icon = <CheckCircle size={48} className="text-primary/40" />;
      message = 'No tasks found';
      description = 'Add some tasks to get started';
  }
  return <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card/50 rounded-xl border border-border/30 mt-4">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>;
}