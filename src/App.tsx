import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { TaskProvider } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './styles/animations.css';
function AppContent() {
  const [activeView, setActiveView] = useState('today');
  const [isDesktop, setIsDesktop] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState({
    inbox: false,
    done: false
  });
  const {
    user,
    loading,
    error,
    signOut
  } = useAuth();
  // Check if screen size is desktop
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    return () => {
      window.removeEventListener('resize', checkIfDesktop);
    };
  }, []);
  // Toggle panel collapse state
  const togglePanel = (panel: 'inbox' | 'done') => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Refresh Page
          </button>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-background text-foreground w-full">
      <Header activeView={activeView} setActiveView={setActiveView} isDesktop={isDesktop} user={user} onSignOut={signOut} />
      {isDesktop ?
    // Desktop Layout - Multiple panels with fluid width
    <div className="flex flex-1 w-full px-4 py-6 gap-4 md:gap-6 lg:px-6 xl:px-8 2xl:px-12">
          {/* Inbox Panel - Left Side */}
          <div className={`transition-all duration-300 ease-in-out border border-border/30 shadow-sm min-w-0 rounded-xl ${collapsedPanels.inbox ? 'w-12 bg-card/20 flex flex-col items-center py-4 px-0' : 'w-1/3 bg-card/30 p-4'}`}>
            {collapsedPanels.inbox ? <>
                <button onClick={() => togglePanel('inbox')} className="p-2 mb-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors" aria-label="Expand inbox panel">
                  <ChevronRight size={18} />
                </button>
                <div className="rotate-90 whitespace-nowrap text-xs font-medium text-muted-foreground mt-4">
                  INBOX
                </div>
              </> : <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium flex items-center">
                    <span className="bg-primary/10 text-primary p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-inbox">
                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                      </svg>
                    </span>
                    Inbox
                  </h2>
                  <button onClick={() => togglePanel('inbox')} className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Collapse inbox panel">
                    <ChevronLeft size={16} />
                  </button>
                </div>
                <TaskInput activeView="inbox" />
                <TaskList view="inbox" />
              </>}
          </div>
          {/* Today Panel - Center (Main Focus) */}
          <div className={`bg-card rounded-xl p-4 border border-border/30 shadow-sm min-w-0 ${collapsedPanels.inbox && collapsedPanels.done ? 'w-[calc(100%-6rem)]' : collapsedPanels.inbox ? 'flex-1' : collapsedPanels.done ? 'flex-1' : 'w-2/5'}`}>
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <span className="bg-primary/10 text-primary p-1.5 rounded-lg mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              Today
            </h2>
            <TaskInput activeView="today" />
            <TaskList view="today" />
          </div>
          {/* Done Panel - Right Side */}
          <div className={`transition-all duration-300 ease-in-out border border-border/30 shadow-sm min-w-0 rounded-xl ${collapsedPanels.done ? 'w-12 bg-card/20 flex flex-col items-center py-4 px-0' : 'w-1/4 bg-card/30 p-4'}`}>
            {collapsedPanels.done ? <>
                <button onClick={() => togglePanel('done')} className="p-2 mb-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors" aria-label="Expand done panel">
                  <ChevronLeft size={18} />
                </button>
                <div className="rotate-90 whitespace-nowrap text-xs font-medium text-muted-foreground mt-4">
                  DONE
                </div>
              </> : <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium flex items-center">
                    <span className="bg-primary/10 text-primary p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-archive">
                        <rect width="20" height="5" x="2" y="3" rx="1" />
                        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                        <path d="M10 12h4" />
                      </svg>
                    </span>
                    Done
                  </h2>
                  <button onClick={() => togglePanel('done')} className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors" aria-label="Collapse done panel">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <TaskList view="done" />
              </>}
          </div>
        </div> :
    // Mobile Layout - Single panel with full width
    <main className="flex-1 w-full px-4 py-6 sm:px-6">
          <TaskInput activeView={activeView} />
          <TaskList view={activeView} />
        </main>}
      {/* Task Detail Sidebar */}
      <TaskDetail />
    </div>;
}
export function App() {
  return <TaskProvider>
      <AppContent />
    </TaskProvider>;
}