import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { LoginInput, RegisterInput, User } from "../lib/types";
import { AuthContext } from "./authStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.auth.me());
    } catch {
      // Sin sesión (401) o error de red: el usuario queda "fuera" sin romper la app.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Hidratación inicial: solo la sesión, sin tocar el resto de la app.
    api.auth
      .me()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const reducido = await api.auth.login(input);
    // El contrato devuelve un usuario reducido al iniciar sesión (id, nombre y
    // rol). Hidratamos con /api/auth/me para tener correo y apellidos en la
    // barra lateral; si falla, seguimos con lo que dio el login.
    try {
      const completo = await api.auth.me();
      setUser(completo);
      return completo;
    } catch {
      setUser(reducido);
      return reducido;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const u = await api.auth.register(input);
    // El registro no garantiza sesión según el contrato; verificamos.
    try {
      setUser(await api.auth.me());
    } catch {
      setUser(null);
    }
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

