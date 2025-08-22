import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUpForm } from '../components/SignUpForm';
import { useAuth } from '../context/AuthContext';
export function Login() {
  const navigate = useNavigate();
  const {
    isAuthenticated
  } = useAuth();
  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  const handleLoginSuccess = () => {
    navigate('/');
  };
  return <div className="min-h-screen flex flex-col justify-center bg-background">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Focus</h1>
        <p className="text-muted-foreground">Your task management app</p>
      </div>
      <SignUpForm onSuccess={handleLoginSuccess} />
    </div>;
}