import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // `session` is just a lightweight "who am I" cache for the UI (name, id).
  // It carries no secret - the actual credential is the httpOnly access
  // token cookie, which JS can't read or write directly. On refresh we
  // re-derive `session` by asking the backend who the cookie belongs to.
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await api.getFullProfile(session.id, session.userName);
      setProfile(res.data);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [session]);

  // On first load (or full page refresh), ask the backend whether the
  // access-token cookie is still valid and who it belongs to. This is how
  // the frontend "remembers" a session across reloads without ever holding
  // the token or password itself. If the 1-hour token has expired, this
  // simply comes back unauthenticated and the user is sent to /login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.me();
        if (!cancelled) {
          setSession({ id: res.data.id, userName: res.data.userName });
        }
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Fired by api.js whenever any authenticated request comes back 401 -
  // the access token expired (or was otherwise rejected) mid-session.
  // Log the user out client-side and send them to the homepage, rather
  // than leaving them stuck on a protected page silently failing.
  useEffect(() => {
    function handleExpired() {
      setSession(null);
      setProfile(null);
      navigate("/", { replace: true, state: { sessionExpired: true } });
    }
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [navigate]);

  const login = async (userName, password) => {
    const res = await api.login(userName, password);
    const next = { id: res.data.id, userName: res.data.userName };
    setSession(next);
    return next;
  };

  const register = async (userName, password, storeName) => {
    await api.createUser({ userName, password, storeName });
    const next = await login(userName, password);
    // The account is created without its store attached server-side, so we
    // create the first store explicitly right after signing in.
    if (storeName) {
      await api.createStore(storeName);
    }
    return next;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setSession(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loadingProfile,
        checkingSession,
        login,
        register,
        logout,
        refreshProfile,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
