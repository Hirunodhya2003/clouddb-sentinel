import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const ADMIN_PERMISSIONS = [
  "user:read", "user:create", "user:update", "user:delete",
  "role:read", "role:update", "dashboard:read",
];

export function AuthProvider({ children }) {
  const [permissions, setPermissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("permissions") || "null") || ADMIN_PERMISSIONS;
    } catch {
      return ADMIN_PERMISSIONS;
    }
  });

  const value = useMemo(() => ({
    permissions,
    setPermissions,
    can: (permission) => permissions.includes(permission),
  }), [permissions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
