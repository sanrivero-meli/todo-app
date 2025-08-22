import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App';
import { Login } from './pages/Login';
import { useAuth } from './context/AuthContext';
// Protected route component
function ProtectedRoute({
  children
}: {
  children: React.ReactNode;
}) {
  const {
    isAuthenticated,
    loading
  } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
export function AppRouter() {
  return <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute>
              <App />
            </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>;
}