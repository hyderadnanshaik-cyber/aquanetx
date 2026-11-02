import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ConnectivityProvider } from './contexts/ConnectivityContext';
import './index.css';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.warn('[SW] Registration failed:', e);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConnectivityProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConnectivityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
