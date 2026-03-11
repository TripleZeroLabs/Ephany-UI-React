import { createContext, useContext, useState, type ReactNode } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface AuthUser {
  token: string;
  userId: number;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("authUserId");
  const email = localStorage.getItem("authEmail");
  if (token && userId && email) {
    return { token, userId: Number(userId), email };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  async function login(username: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error("Invalid username or password.");
    }

    const data = (await res.json()) as { token: string; user_id: number; email: string };
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUserId", String(data.user_id));
    localStorage.setItem("authEmail", data.email);
    setUser({ token: data.token, userId: data.user_id, email: data.email });
  }

  function logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUserId");
    localStorage.removeItem("authEmail");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
