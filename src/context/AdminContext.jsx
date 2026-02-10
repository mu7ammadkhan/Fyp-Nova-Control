// FILE: src/context/AdminContext.jsx
import { createContext, useEffect, useState } from "react";
import { useAuthContext } from "./AuthContext";
import * as roles from "../utils/roles";

/**
 * AdminContext exposes: { isAdmin, loading, error }
 * - Named export: AdminContext
 * - Default export: AdminProvider
 *
 * How it decides admin:
 * 1) If utils/roles.js exports an async function isAdmin(user) -> uses that.
 * 2) Else if roles.default exists -> uses that.
 * 3) Else if roles.ADMINS is an array -> checks uid/email in that array.
 * 4) Fallback -> non-admin.
 */
export const AdminContext = createContext(null);

export default function AdminProvider({ children }) {
  const { user, loading: authLoading } = useAuthContext();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveAdmin() {
      // Wait for auth to finish
      if (authLoading) return;

      setLoading(true);
      setError(null);

      try {
        if (!user) {
          setIsAdmin(false);
          return;
        }

        let result = false;

        // Try roles.isAdmin(user)
        if (typeof roles?.isAdmin === "function") {
          result = await roles.isAdmin(user);
        }
        // Try default export as a function
        else if (typeof roles?.default === "function") {
          result = await roles.default(user);
        }
        // Try static list roles.ADMINS (uids/emails)
        else if (Array.isArray(roles?.ADMINS)) {
          result =
            roles.ADMINS.includes(user.uid) ||
            (user.email && roles.ADMINS.includes(user.email));
        }

        if (!cancelled) setIsAdmin(!!result);
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolveAdmin();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <AdminContext.Provider
      value={{ isAdmin, loading: authLoading || loading, error }}
    >
      {children}
    </AdminContext.Provider>
  );
}
