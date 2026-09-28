import { createContext, useContext, useState, useCallback } from 'react';
import { WHO_KEY } from '../api';
import { PEOPLE } from '../people';

const WhoContext = createContext(null);

export function WhoProvider({ children }) {
  const [who, setWhoState] = useState(() => {
    const stored = localStorage.getItem(WHO_KEY);
    return PEOPLE.includes(stored) ? stored : null;
  });

  const setWho = useCallback((name) => {
    if (name) {
      localStorage.setItem(WHO_KEY, name);
    } else {
      localStorage.removeItem(WHO_KEY);
    }
    setWhoState(name);
  }, []);

  return <WhoContext.Provider value={{ who, setWho }}>{children}</WhoContext.Provider>;
}

export function useWho() {
  const ctx = useContext(WhoContext);
  if (!ctx) throw new Error('useWho must be used within WhoProvider');
  return ctx;
}
