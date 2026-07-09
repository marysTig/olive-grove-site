import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getApiBaseUrl } from "@/lib/api";

interface SessionLike {
  user: {
    id: string;
    email?: string | null;
  } | null;
}

interface AuthValue {
  session: SessionLike | null;
  user: { id: string; email?: string | null } | null;
  role: "admin" | "client" | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionLike | null>(null);
  const [role, setRole] = useState<"admin" | "client" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/me`, { credentials: "include" });
        if (!response.ok) {
          setSession(null);
          setIsAdmin(false);
          setRole(null);
          setLoading(false);
          return;
        }

        const json = await response.json();
        const user = json?.data?.user;
        if (user) {
          setSession({ user: { id: user.id, email: user.email } });
          setIsAdmin(user.role === "admin");
          setRole(user.role === "admin" ? "admin" : "client");
        } else {
          setSession(null);
          setIsAdmin(false);
          setRole(null);
        }
      } catch {
        setSession(null);
        setIsAdmin(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const signOut = async () => {
    await fetch(`${getApiBaseUrl()}/auth/logout`, { method: "POST", credentials: "include" });
    setSession(null);
    setIsAdmin(false);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, role, isAdmin, loading, signOut }}
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
