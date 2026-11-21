/* Signed-in state: restores the saved token at launch, signs in/out, and keeps the profile. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, loadToken, saveToken, setUnauthorizedHandler, type User } from './api';

type Session = {
  ready: boolean;
  user: User | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
};
const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const clear = useCallback(async () => { await saveToken(null); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { void clear(); });
    (async () => {
      try {
        if (await loadToken()) {
          const me = await api<User>('/me');
          // The app is for clients; staff use the website's control centre.
          if (me.role === 'client') setUser(me); else await clear();
        }
      } catch (e: any) {
        if (e?.status === 401) await clear();
      } finally {
        setReady(true);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const signIn = useCallback(async (token: string, u: User) => { await saveToken(token); setUser(u); }, []);
  const signOut = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    await clear();
  }, [clear]);

  const value = useMemo(() => ({ ready, user, signIn, signOut, setUser }), [ready, user, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used inside SessionProvider');
  return v;
}
