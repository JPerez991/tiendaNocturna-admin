import { useContext } from "react";
import { AuthContext } from "./authStore";

/** Acceso a la sesión del panel. Separado del provider para fast-refresh. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
