import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { AppRouter } from './AppRouter';
import { AuthProvider } from './context/AuthContext';
render(<AuthProvider>
    <AppRouter />
  </AuthProvider>, document.getElementById('root'));