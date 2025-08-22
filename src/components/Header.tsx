import React from 'react';
import { CheckCircle, Inbox, Archive, LogOut, User } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { User as SupabaseUser } from '@supabase/supabase-js';
interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isDesktop?: boolean;
  user?: SupabaseUser | null;
  onSignOut?: () => Promise<void>;
}
export function Header({
  activeView,
  setActiveView,
  isDesktop = false,
  user,
  onSignOut
}: HeaderProps) {
  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
  };
  return <header className="bg-background sticky top-0 z-10 border-b border-border/40 shadow-sm">
      <div className={`w-full px-4 py-2.5 sm:px-6 lg:px-6 xl:px-8 2xl:px-12`}>
        <div className="flex justify-between items-center">
          <div className="w-10"></div> {/* Spacer for alignment */}
          <h1 className="text-2xl font-semibold my-2.5 tracking-tight text-center">
            My tasks
          </h1>
          {user && <div className="flex items-center">
              <Tooltip content={user.email || 'User'}>
                <div className="flex items-center text-sm text-muted-foreground">
                  <User size={16} className="mr-1" />
                  <span className="hidden md:inline">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
              </Tooltip>
              <Tooltip content="Sign out">
                <button onClick={handleSignOut} className="ml-4 p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Sign out">
                  <LogOut size={16} />
                </button>
              </Tooltip>
            </div>}
          {!user && <div className="w-10"></div>} {/* Spacer when no user */}
        </div>
        {/* Only show navigation tabs on mobile */}
        {!isDesktop && <nav className="flex justify-between items-center bg-card rounded-xl p-1 shadow-sm border border-border/30">
            <Tooltip content="Today's tasks">
              <button onClick={() => setActiveView('today')} className={`flex flex-col items-center justify-center rounded-lg px-4 py-2.5 transition-all duration-200 ${activeView === 'today' ? 'text-primary bg-secondary font-medium' : 'text-muted-foreground hover:bg-secondary/50'}`}>
                <CheckCircle size={18} className="mb-1" />
                <span className="text-xs">Today</span>
              </button>
            </Tooltip>
            <Tooltip content="Inbox tasks">
              <button onClick={() => setActiveView('inbox')} className={`flex flex-col items-center justify-center rounded-lg px-4 py-2.5 transition-all duration-200 ${activeView === 'inbox' ? 'text-primary bg-secondary font-medium' : 'text-muted-foreground hover:bg-secondary/50'}`}>
                <Inbox size={18} className="mb-1" />
                <span className="text-xs">Inbox</span>
              </button>
            </Tooltip>
            <Tooltip content="Completed tasks">
              <button onClick={() => setActiveView('done')} className={`flex flex-col items-center justify-center rounded-lg px-4 py-2.5 transition-all duration-200 ${activeView === 'done' ? 'text-primary bg-secondary font-medium' : 'text-muted-foreground hover:bg-secondary/50'}`}>
                <Archive size={18} className="mb-1" />
                <span className="text-xs">Done</span>
              </button>
            </Tooltip>
          </nav>}
      </div>
    </header>;
}