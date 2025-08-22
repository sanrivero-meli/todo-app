import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, AlertCircle, Eye, EyeOff, ArrowRight, Wifi, WifiOff } from 'lucide-react';
export function SignUpForm({
  onSuccess
}: {
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'email_confirmation' | 'error'>('idle');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [touchedFields, setTouchedFields] = useState<{
    email: boolean;
    password: boolean;
  }>({
    email: false,
    password: false
  });
  const {
    signIn,
    signUp,
    supabaseStatus
  } = useAuth();
  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    // Contains number
    if (/\d/.test(password)) strength += 1;
    // Contains special char
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check Supabase connection first
    if (supabaseStatus === 'error') {
      setError('Unable to connect to the database. Please try again later.');
      return;
    }
    // Mark fields as touched for validation
    setTouchedFields({
      email: true,
      password: true
    });
    // Form validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    // Prevent multiple submissions
    if (loading) return;
    setLoading(true);
    setError(null);
    setFormState('submitting');
    try {
      if (mode === 'signup') {
        console.log(`Attempting to sign up user: ${email}`);
        // Sign up with email and password
        const {
          error,
          data
        } = await signUp(email, password, {
          name: email.split('@')[0] // Use part of email as name
        });
        if (error) {
          console.error('Signup error:', error);
          throw error;
        }
        console.log('Signup response:', data);
        // Check if email confirmation is required
        if (data?.user && !data.user.email_confirmed_at && !data.session) {
          console.log('Email confirmation required');
          setFormState('email_confirmation');
        } else if (data?.session) {
          console.log('Signup successful with session, no email confirmation required');
          setFormState('success');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          console.log('Signup successful but no session available');
          setFormState('success');
          // Show success but don't redirect - user may need to sign in
        }
      } else {
        // Sign in with email and password
        console.log(`Attempting to sign in user: ${email}`);
        const {
          error
        } = await signIn(email, password);
        if (error) {
          console.error('Login error:', error);
          throw error;
        }
        console.log('Login successful');
        setFormState('success');
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setFormState('error');
      // More user-friendly error messages
      if (err.message?.includes('Invalid login')) {
        setError('Invalid email or password');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email to confirm your account before logging in');
      } else if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (err.message?.includes('duplicate key')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('database')) {
        setError("There was an issue connecting to the database. This doesn't affect your account creation - you can try signing in.");
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleFieldBlur = (field: 'email' | 'password') => {
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));
  };
  const toggleMode = () => {
    setMode(mode === 'signup' ? 'login' : 'signup');
    setError(null);
    setFormState('idle');
  };
  // Email validation error
  const emailError = touchedFields.email && !email.includes('@') ? 'Please enter a valid email address' : null;
  // Password validation error
  const passwordError = touchedFields.password && password.length < 6 && mode === 'signup' ? 'Password must be at least 6 characters' : null;
  // Show connection status
  const connectionStatus = () => {
    if (supabaseStatus === 'checking') {
      return <div className="flex items-center justify-center text-xs text-muted-foreground mb-4">
          <Wifi className="h-3 w-3 mr-1 animate-pulse" />
          Connecting to database...
        </div>;
    } else if (supabaseStatus === 'error') {
      return <div className="flex items-center justify-center text-xs text-red-600 mb-4">
          <WifiOff className="h-3 w-3 mr-1" />
          Database connection error
        </div>;
    }
    return null;
  };
  // If we're in success state after signup and waiting for email verification
  if (formState === 'email_confirmation') {
    return <div className="w-full max-w-md p-6 mx-auto bg-card rounded-xl shadow-sm border border-border/30">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-blue-700" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Check your email</h2>
          <p className="text-muted-foreground mb-6">
            We've sent a confirmation email to <strong>{email}</strong>. Please
            check your inbox and click the confirmation link to activate your
            account.
          </p>
          <button onClick={toggleMode} className="w-full py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Back to Sign In
          </button>
        </div>
      </div>;
  }
  // If we're in success state after signup and waiting for email verification
  if (formState === 'success' && mode === 'signup' && !loading) {
    return <div className="w-full max-w-md p-6 mx-auto bg-card rounded-xl shadow-sm border border-border/30">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-700" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Account created!</h2>
          <p className="text-muted-foreground mb-6">
            Your account has been created successfully.
          </p>
          <button onClick={toggleMode} className="w-full py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Go to Sign In
          </button>
        </div>
      </div>;
  }
  return <div className="w-full max-w-md p-6 mx-auto bg-card rounded-xl shadow-sm border border-border/30">
      <h2 className="text-2xl font-semibold mb-2 text-center">
        {mode === 'signup' ? 'Create an account' : 'Welcome back'}
      </h2>
      <p className="text-muted-foreground text-center mb-6">
        {mode === 'signup' ? 'Sign up to start managing your tasks' : 'Sign in to continue with your tasks'}
      </p>
      {connectionStatus()}
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => handleFieldBlur('email')} required className={`w-full px-3 py-2 border ${emailError ? 'border-red-400 bg-red-50' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30`} placeholder="you@example.com" disabled={loading || supabaseStatus === 'error'} />
          {emailError && <p className="mt-1 text-sm text-red-700">{emailError}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onBlur={() => handleFieldBlur('password')} required className={`w-full px-3 py-2 border ${passwordError ? 'border-red-400 bg-red-50' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10`} placeholder="••••••••" minLength={6} disabled={loading || supabaseStatus === 'error'} />
            <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError && <p className="mt-1 text-sm text-red-700">{passwordError}</p>}
          {mode === 'signup' && password && <div className="mt-2">
              <div className="flex items-center space-x-1 mb-1">
                <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 4 ? 'bg-green-700' : 'bg-gray-300'}`}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {passwordStrength === 0 && 'Very weak password'}
                {passwordStrength === 1 && 'Weak password'}
                {passwordStrength === 2 && 'Fair password'}
                {passwordStrength === 3 && 'Good password'}
                {passwordStrength === 4 && 'Strong password'}
              </p>
            </div>}
        </div>
        <button type="submit" disabled={loading || supabaseStatus === 'error'} className="w-full py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center">
          {loading ? <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {formState === 'success' ? 'Success!' : 'Processing...'}
            </span> : <>
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button onClick={toggleMode} className="text-sm text-primary hover:underline inline-flex items-center" disabled={loading}>
          {mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>;
}