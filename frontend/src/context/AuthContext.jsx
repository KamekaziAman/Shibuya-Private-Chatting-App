import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../api/chatApi";
import { tokenStorage } from "../services/tokenStorage";
import AuthContext from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const tokens = await loginUser(credentials);
    tokenStorage.setTokens(tokens);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      tokenStorage.clearTokens();
      throw error;
    }
  }, []);

  const register = useCallback(
    async (credentials) => {
      await registerUser(credentials);
      return login(credentials);
    },
    [login],
  );

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!tokenStorage.getAccessToken() && !tokenStorage.getRefreshToken()) {
        if (active) setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (active) setUser(currentUser);
      } catch {
        tokenStorage.clearTokens();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    window.addEventListener("auth:logout", logout);
    return () => {
      active = false;
      window.removeEventListener("auth:logout", logout);
    };
  }, [logout]);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
