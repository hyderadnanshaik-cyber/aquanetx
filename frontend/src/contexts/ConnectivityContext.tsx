import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface ConnectivityContextValue {
  online: boolean;
  pendingSync: number;
  lastSync: Date | null;
  incrementPending: () => void;
  decrementPending: () => void;
  setLastSync: (d: Date) => void;
}

const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingSync, setPending] = useState(0);
  const [lastSync, setLastSyncState] = useState<Date | null>(null);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const incrementPending = useCallback(() => setPending((p) => p + 1), []);
  const decrementPending = useCallback(() => setPending((p) => Math.max(0, p - 1)), []);
  const setLastSync = useCallback((d: Date) => setLastSyncState(d), []);

  return (
    <ConnectivityContext.Provider value={{ online, pendingSync, lastSync, incrementPending, decrementPending, setLastSync }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error('useConnectivity must be used within ConnectivityProvider');
  return ctx;
}
