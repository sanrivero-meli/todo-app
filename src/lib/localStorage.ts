import { v4 as uuidv4 } from 'uuid';
// Types
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}
export interface Session {
  user: User;
  access_token: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'inbox' | 'today' | 'done';
  priority: boolean;
  created_at: string;
  user_id: string;
}
// Storage keys
const STORAGE_KEYS = {
  SESSION: 'focus_app_session',
  TASKS: 'focus_app_tasks',
  PROFILES: 'focus_app_profiles'
};
// Helper functions
export function getStoredSession(): Session | null {
  const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parsing stored session:', e);
    return null;
  }
}
export function setStoredSession(session: Session | null): void {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}
export function getStoredTasks(): Task[] {
  const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!tasksStr) return [];
  try {
    return JSON.parse(tasksStr);
  } catch (e) {
    console.error('Error parsing stored tasks:', e);
    return [];
  }
}
export function setStoredTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}
// Auth functions
export const auth = {
  getSession: async () => {
    return {
      data: {
        session: getStoredSession()
      },
      error: null
    };
  },
  signUp: async ({
    email,
    password,
    options
  }: {
    email: string;
    password: string;
    options?: any;
  }) => {
    // Check if user already exists
    const session = getStoredSession();
    if (session?.user.email === email) {
      return {
        data: {},
        error: {
          message: 'User already registered'
        }
      };
    }
    // Create new user
    const user: User = {
      id: uuidv4(),
      email,
      user_metadata: {
        name: options?.data?.name || email.split('@')[0]
      }
    };
    const newSession: Session = {
      user,
      access_token: uuidv4()
    };
    setStoredSession(newSession);
    return {
      data: {
        user,
        session: newSession
      },
      error: null
    };
  },
  signInWithPassword: async ({
    email,
    password
  }: {
    email: string;
    password: string;
  }) => {
    // Simulate authentication check
    const session = getStoredSession();
    if (session?.user.email === email) {
      return {
        data: {
          session
        },
        error: null
      };
    }
    return {
      data: {},
      error: {
        message: 'Invalid login credentials'
      }
    };
  },
  signOut: async () => {
    setStoredSession(null);
    return {
      error: null
    };
  },
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    // This is a simplified version that doesn't actually listen for changes
    const session = getStoredSession();
    setTimeout(() => callback('SIGNED_IN', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
};
// Database functions for tasks
export const db = {
  from: (table: string) => {
    if (table === 'tasks') {
      return {
        select: (selector = '*') => {
          return {
            eq: (field: string, value: string) => {
              return {
                order: (orderField: string, {
                  ascending = true
                } = {}) => {
                  const tasks = getStoredTasks();
                  const filteredTasks = tasks.filter(task => task.user_id === value);
                  // Sort tasks
                  const sortedTasks = [...filteredTasks].sort((a, b) => {
                    if (orderField === 'created_at') {
                      const dateA = new Date(a.created_at).getTime();
                      const dateB = new Date(b.created_at).getTime();
                      return ascending ? dateA - dateB : dateB - dateA;
                    }
                    return 0;
                  });
                  return Promise.resolve({
                    data: sortedTasks,
                    error: null
                  });
                }
              };
            },
            single: () => {
              // Not implementing this for simplicity
              return Promise.resolve({
                data: null,
                error: null
              });
            }
          };
        },
        insert: (data: Partial<Task>) => {
          const tasks = getStoredTasks();
          const newTask: Task = {
            id: uuidv4(),
            title: data.title || '',
            description: data.description || '',
            status: data.status as 'inbox' | 'today' | 'done' || 'inbox',
            priority: data.priority || false,
            created_at: new Date().toISOString(),
            user_id: data.user_id || ''
          };
          tasks.push(newTask);
          setStoredTasks(tasks);
          return {
            select: () => {
              return {
                single: () => Promise.resolve({
                  data: newTask,
                  error: null
                })
              };
            }
          };
        },
        update: (updates: Partial<Task>) => {
          return {
            eq: (field1: string, value1: string) => {
              return {
                eq: (field2: string, value2: string) => {
                  const tasks = getStoredTasks();
                  const updatedTasks = tasks.map(task => {
                    if (task[field1 as keyof Task] === value1 && task[field2 as keyof Task] === value2) {
                      return {
                        ...task,
                        ...updates
                      };
                    }
                    return task;
                  });
                  setStoredTasks(updatedTasks);
                  return Promise.resolve({
                    data: null,
                    error: null
                  });
                }
              };
            }
          };
        },
        delete: () => {
          return {
            eq: (field1: string, value1: string) => {
              return {
                eq: (field2: string, value2: string) => {
                  const tasks = getStoredTasks();
                  const filteredTasks = tasks.filter(task => !(task[field1 as keyof Task] === value1 && task[field2 as keyof Task] === value2));
                  setStoredTasks(filteredTasks);
                  return Promise.resolve({
                    data: null,
                    error: null
                  });
                }
              };
            }
          };
        }
      };
    }
    if (table === 'profiles') {
      return {
        select: () => {
          return {
            eq: () => {
              return {
                single: () => Promise.resolve({
                  data: null,
                  error: null
                })
              };
            }
          };
        },
        insert: () => Promise.resolve({
          data: null,
          error: null
        })
      };
    }
    return {};
  },
  channel: () => {
    return {
      on: () => {
        return {
          subscribe: () => {
            return {
              unsubscribe: () => {}
            };
          }
        };
      }
    };
  }
};
// Main localStorage client to replace Supabase
export const localStorageClient = {
  auth,
  from: db.from,
  channel: db.channel
};
// Helper function to check if the current session is valid
export async function getValidSession() {
  const session = getStoredSession();
  return session;
}