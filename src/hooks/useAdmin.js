// FILE: src/hooks/useAdmin.js
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";

/**
 * Default export hook so you can:
 *   import useAdmin from "../hooks/useAdmin";
 */
export default function useAdmin() {
  const ctx = useContext(AdminContext);
  // If provider isn't mounted yet, return safe defaults
  if (!ctx) return { isAdmin: false, loading: false, error: null };
  return ctx;
}
