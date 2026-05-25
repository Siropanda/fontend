import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { UserRole } from "@/types";

interface RoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

/**
 * Fallback store used when a component renders outside RoleProvider (e.g. HMR edge cases).
 * This prevents a blank screen while still keeping role changes working.
 */
let fallbackRole: UserRole = "admin";
const fallbackListeners = new Set<() => void>();
const setFallbackRole = (next: UserRole) => {
  fallbackRole = next;
  fallbackListeners.forEach((l) => l());
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>("admin");

  const value = useMemo(() => ({ userRole, setUserRole }), [userRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context) return context;

  // Fallback (no provider): keep app usable instead of throwing runtime error.
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const onChange = () => forceUpdate((x) => x + 1);
    fallbackListeners.add(onChange);
    return () => {
      fallbackListeners.delete(onChange);
    };
  }, []);

  return {
    userRole: fallbackRole,
    setUserRole: setFallbackRole,
  };
};
