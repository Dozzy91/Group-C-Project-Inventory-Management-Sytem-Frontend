import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api";

const AuthContext = createContext(null);
const STORAGE_KEY = "stockroom.session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const persist = (next) => {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    setSession(next);
  };

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

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // The API has no dedicated login route, so we authenticate by pulling the
  // user list and matching credentials the same way the backend's own
  // authMiddleware does (userName + password).
  const login = async (userName, password) => {
    const res = await api.getAllUsers();
    const match = (res.data || []).find(
      (u) =>
        u.userName.toLowerCase() === userName.toLowerCase() &&
        u.password === password,
    );
    if (!match) throw new Error("Incorrect shop name or password");
    const next = { id: match.id, userName: match.userName, password };
    persist(next);
    return next;
  };

  const register = async (userName, password, storeName) => {
    await api.createUser({ userName, password, storeName });
    const next = await login(userName, password);
    // The account is created without its store attached server-side, so we
    // create the first store explicitly right after signing in.
    if (storeName) {
      await api.createStore(next.id, password, storeName);
    }
    return next;
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider
      value={{ session, profile, loadingProfile, login, register, logout, refreshProfile }}
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
