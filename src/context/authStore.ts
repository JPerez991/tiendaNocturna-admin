import { createContext } from "react";
import type { LoginInput, RegisterInput, User } from "../lib/types";

export interface AuthContextValue {
  user: User | null;
  /** true mientras se verifica la sesión inicial con GET /api/auth/me */
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Estado de sesión del panel; separado del provider para fast-refresh. */
export const AuthContext = createContext<AuthContextValue | null>(null);
